import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  equipmentRequestSchema,
  requesterRoleLabels,
} from "@/lib/schemas/equipment-request";
import { buildEquipmentRequestWebhookPayload } from "@/server/equipment-requests/payload";

const WEBHOOK_TIMEOUT_MS = 15_000;
const WEBHOOK_SOURCE = "form-it-equipment-request";

function toJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

function truncateText(value: string, maxLength = 2_000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { message: "Sua sessão expirou. Entre novamente para continuar." },
      { status: 401 },
    );
  }

  const activeOrganizationId = session.session.activeOrganizationId;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Não foi possível interpretar os dados enviados." },
      { status: 400 },
    );
  }

  const parsed = equipmentRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Há campos inválidos no formulário.",
        errors: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const organization = activeOrganizationId
    ? await db.organization.findUnique({
        where: {
          id: activeOrganizationId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    : null;

  const requestRecord = await db.equipmentRequest.create({
    data: {
      organizationId: organization?.id,
      submittedByUserId: session.user.id,
      requesterName: parsed.data.requesterName,
      requesterEmail: parsed.data.requesterEmail,
      requesterRole: parsed.data.requesterRole,
      requesterDepartment: parsed.data.requesterDepartment,
      futureUserName: parsed.data.futureUserName,
      futureUserEmail: parsed.data.futureUserEmail,
      futureUserCpf: parsed.data.futureUserCpf,
      futureUserEmployeeId: parsed.data.futureUserEmployeeId,
      futureUserDepartment: parsed.data.futureUserDepartment,
      futureUserJobTitle: parsed.data.futureUserJobTitle,
      futureUserLocation: parsed.data.futureUserLocation,
      justification: parsed.data.justification,
      items: toJson(parsed.data.items),
      normalizedPayload: {},
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const normalizedPayload = toJson(
    buildEquipmentRequestWebhookPayload({
      requestId: requestRecord.id,
      submittedAt: requestRecord.createdAt,
      input: parsed.data,
      organization,
      submittedBy: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    }),
  );

  await db.equipmentRequest.update({
    where: {
      id: requestRecord.id,
    },
    data: {
      normalizedPayload,
    },
  });

  const webhookUrl = process.env.N8N_EQUIPMENT_REQUEST_WEBHOOK_URL;

  if (!webhookUrl) {
    await db.equipmentRequest.update({
      where: {
        id: requestRecord.id,
      },
      data: {
        webhookStatus: "failed",
        webhookAttemptedAt: new Date(),
        webhookResponseBody:
          "Webhook n8n não configurado. Defina N8N_EQUIPMENT_REQUEST_WEBHOOK_URL.",
      },
    });

    return NextResponse.json(
      {
        message:
          "A solicitação foi salva, mas o webhook do n8n não está configurado.",
        requestId: requestRecord.id,
      },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-form-it-source": WEBHOOK_SOURCE,
      },
      body: JSON.stringify(normalizedPayload),
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = truncateText(await webhookResponse.text());
    const attemptedAt = new Date();

    if (!webhookResponse.ok) {
      await db.equipmentRequest.update({
        where: {
          id: requestRecord.id,
        },
        data: {
          webhookStatus: "failed",
          webhookHttpStatus: webhookResponse.status,
          webhookResponseBody: responseText,
          webhookAttemptedAt: attemptedAt,
        },
      });

      return NextResponse.json(
        {
          message:
            "A solicitação foi salva, mas o webhook do n8n respondeu com erro.",
          requestId: requestRecord.id,
        },
        { status: 502 },
      );
    }

    await db.equipmentRequest.update({
      where: {
        id: requestRecord.id,
      },
      data: {
        webhookStatus: "delivered",
        webhookHttpStatus: webhookResponse.status,
        webhookResponseBody: responseText,
        webhookAttemptedAt: attemptedAt,
        webhookDeliveredAt: attemptedAt,
      },
    });

    return NextResponse.json({
          message: `Solicitação enviada por ${requesterRoleLabels[parsed.data.requesterRole].toLowerCase()}.`,
      requestId: requestRecord.id,
      createdAt: requestRecord.createdAt.toISOString(),
    });
  } catch (error) {
    clearTimeout(timeoutId);

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Tempo limite excedido ao chamar o webhook do n8n."
          : truncateText(error.message)
        : "Falha desconhecida ao chamar o webhook do n8n.";

    await db.equipmentRequest.update({
      where: {
        id: requestRecord.id,
      },
      data: {
        webhookStatus: "failed",
        webhookResponseBody: message,
        webhookAttemptedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message:
          "A solicitação foi salva, mas não foi possível concluir o envio ao n8n.",
        requestId: requestRecord.id,
      },
      { status: 502 },
    );
  }
}

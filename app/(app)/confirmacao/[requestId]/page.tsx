import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import {
  equipmentRequestItemSchema,
  equipmentTypeHasProfileChoices,
  equipmentTypeLabels,
  getEquipmentProfileDefinition,
  previousEquipmentDispositionLabels,
  requesterRoleLabels,
} from "@/lib/schemas/equipment-request";
import { getCurrentUser } from "@/server/actions/session";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ConfirmationPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 11) {
    return value;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function WebhookStatusBadge({
  status,
}: {
  status: "pending" | "delivered" | "failed";
}) {
  if (status === "delivered") {
    return <Badge>Webhook entregue</Badge>;
  }

  if (status === "failed") {
    return <Badge variant="destructive">Webhook com falha</Badge>;
  }

  return <Badge variant="outline">Webhook pendente</Badge>;
}

export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { requestId } = await params;
  const session = await getCurrentUser();

  const request = await db.equipmentRequest.findFirst({
    where: {
      id: requestId,
      submittedByUserId: session.user.id,
    },
    select: {
      id: true,
      requesterName: true,
      requesterEmail: true,
      requesterRole: true,
      requesterDepartment: true,
      futureUserName: true,
      futureUserEmail: true,
      futureUserCpf: true,
      futureUserEmployeeId: true,
      futureUserDepartment: true,
      futureUserJobTitle: true,
      futureUserLocation: true,
      justification: true,
      items: true,
      webhookStatus: true,
      webhookResponseBody: true,
      createdAt: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const parsedItems = equipmentRequestItemSchema.array().safeParse(request.items);

  if (!parsedItems.success) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Pedido confirmado</Badge>
            <WebhookStatusBadge status={request.webhookStatus} />
            {request.organization?.name ? (
              <Badge variant="outline">{request.organization.name}</Badge>
            ) : null}
          </div>
          <CardTitle className="text-3xl">
            Solicitação registrada com sucesso
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            Seu pedido foi salvo com o identificador{" "}
            <span className="font-medium">#{request.id.slice(-8)}</span> em{" "}
            {formatDateTime(request.createdAt)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Fazer novo pedido</Link>
          </Button>
        </CardContent>
      </Card>

      {request.webhookStatus === "failed" ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Webhook não concluído</CardTitle>
            <CardDescription>
              O pedido foi salvo, mas a entrega para o n8n falhou nesta
              tentativa.
            </CardDescription>
          </CardHeader>
          {request.webhookResponseBody ? (
            <CardContent>
              <p className="text-sm">{request.webhookResponseBody}</p>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Nome:</span> {request.requesterName}
            </p>
            <p>
              <span className="font-medium">E-mail:</span>{" "}
              {request.requesterEmail}
            </p>
            <p>
              <span className="font-medium">Cargo:</span>{" "}
              {
                requesterRoleLabels[
                  request.requesterRole as keyof typeof requesterRoleLabels
                ]
              }
            </p>
            <p>
              <span className="font-medium">Área:</span>{" "}
              {request.requesterDepartment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Futuro usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Nome:</span> {request.futureUserName}
            </p>
            <p>
              <span className="font-medium">E-mail:</span>{" "}
              {request.futureUserEmail}
            </p>
            <p>
              <span className="font-medium">CPF:</span>{" "}
              {formatCpf(request.futureUserCpf)}
            </p>
            <p>
              <span className="font-medium">Matrícula:</span>{" "}
              {request.futureUserEmployeeId}
            </p>
            <p>
              <span className="font-medium">Área:</span>{" "}
              {request.futureUserDepartment}
            </p>
            {request.futureUserJobTitle ? (
              <p>
                <span className="font-medium">Cargo:</span>{" "}
                {request.futureUserJobTitle}
              </p>
            ) : null}
            {request.futureUserLocation ? (
              <p>
                <span className="font-medium">Localidade:</span>{" "}
                {request.futureUserLocation}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens solicitados</CardTitle>
          <CardDescription>
            Resumo dos equipamentos incluídos neste pedido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {parsedItems.data.map((item, index) => {
            const profile = getEquipmentProfileDefinition(
              item.equipmentType,
              item.equipmentProfile,
            );

            return (
              <div key={`${request.id}-${index}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {item.quantity}x {equipmentTypeLabels[item.equipmentType]}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {equipmentTypeHasProfileChoices(item.equipmentType) ? (
                      <Badge variant="secondary">{profile.label}</Badge>
                    ) : (
                      <Badge variant="secondary">Perfil padrão</Badge>
                    )}
                    {item.isReplacement ? (
                      <Badge variant="outline">Substituição</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-muted-foreground">{profile.description}</p>
                  {item.replacementReason ? (
                    <p>
                      <span className="font-medium">Motivo:</span>{" "}
                      {item.replacementReason}
                    </p>
                  ) : null}
                  {item.previousEquipmentDisposition ? (
                    <p>
                      <span className="font-medium">Destino do item anterior:</span>{" "}
                      {
                        previousEquipmentDispositionLabels[
                          item.previousEquipmentDisposition
                        ]
                      }
                    </p>
                  ) : null}
                  {item.previousEquipmentModel ? (
                    <p>
                      <span className="font-medium">Modelo anterior:</span>{" "}
                      {item.previousEquipmentModel}
                    </p>
                  ) : null}
                  {item.previousEquipmentAssetTag ? (
                    <p>
                      <span className="font-medium">Patrimônio:</span>{" "}
                      {item.previousEquipmentAssetTag}
                    </p>
                  ) : null}
                  {item.previousEquipmentSerialNumber ? (
                    <p>
                      <span className="font-medium">Serial:</span>{" "}
                      {item.previousEquipmentSerialNumber}
                    </p>
                  ) : null}
                  {item.previousEquipmentPhoneNumber ? (
                    <p>
                      <span className="font-medium">Linha anterior:</span>{" "}
                      {item.previousEquipmentPhoneNumber}
                    </p>
                  ) : null}
                  {item.previousEquipmentNotes ? (
                    <p>
                      <span className="font-medium">Observações:</span>{" "}
                      {item.previousEquipmentNotes}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Justificativa</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{request.justification}</p>
        </CardContent>
      </Card>
    </div>
  );
}

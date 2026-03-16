import type { EquipmentRequestInput } from "@/lib/schemas/equipment-request";
import {
  equipmentTypeHasProfileChoices,
  equipmentTypeLabels,
  getEquipmentProfileDefinition,
  requesterRoleLabels,
} from "@/lib/schemas/equipment-request";

type BuildPayloadParams = {
  requestId: string;
  submittedAt: Date;
  input: EquipmentRequestInput;
  organization:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | null;
  submittedBy: {
    userId: string;
    name: string;
    email: string;
  };
};

export function buildEquipmentRequestWebhookPayload({
  requestId,
  submittedAt,
  input,
  organization,
  submittedBy,
}: BuildPayloadParams) {
  const normalizedItems = input.items.map((item) => {
    const profile = getEquipmentProfileDefinition(
      item.equipmentType,
      item.equipmentProfile,
    );

    return {
      equipmentType: item.equipmentType,
      equipmentLabel: equipmentTypeLabels[item.equipmentType],
      equipmentProfile: item.equipmentProfile,
      equipmentProfileLabel: profile.label,
      equipmentProfileDescription: profile.description,
      quantity: item.quantity,
      isReplacement: item.isReplacement,
      replacementReason: item.replacementReason,
      previousEquipment: item.isReplacement
        ? {
            model: item.previousEquipmentModel,
            assetTag: item.previousEquipmentAssetTag,
            serialNumber: item.previousEquipmentSerialNumber,
            phoneNumber: item.previousEquipmentPhoneNumber,
            notes: item.previousEquipmentNotes,
          }
        : null,
    };
  });

  const totalUnits = normalizedItems.reduce(
    (accumulator, item) => accumulator + item.quantity,
    0,
  );

  return {
    requestId,
    submittedAt: submittedAt.toISOString(),
    organization,
    submittedBy,
    requester: {
      name: input.requesterName,
      email: input.requesterEmail,
      role: input.requesterRole,
      roleLabel: requesterRoleLabels[input.requesterRole],
      department: input.requesterDepartment,
      phone: input.requesterPhone,
    },
    futureUser: {
      name: input.futureUserName,
      email: input.futureUserEmail,
      cpf: input.futureUserCpf,
      employeeId: input.futureUserEmployeeId,
      department: input.futureUserDepartment,
      jobTitle: input.futureUserJobTitle,
      location: input.futureUserLocation,
    },
    justification: input.justification,
    items: normalizedItems,
    totals: {
      itemCount: normalizedItems.length,
      totalUnits,
    },
    summary: normalizedItems
      .map((item) =>
        equipmentTypeHasProfileChoices(item.equipmentType)
          ? `${item.quantity}x ${item.equipmentLabel} (${item.equipmentProfileLabel})`
          : `${item.quantity}x ${item.equipmentLabel}`,
      )
      .join(", "),
  };
}

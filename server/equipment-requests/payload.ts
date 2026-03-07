import type { EquipmentRequestInput } from "@/lib/schemas/equipment-request";
import {
  equipmentTypeLabels,
  previousEquipmentDispositionLabels,
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
  const normalizedItems = input.items.map((item) => ({
    equipmentType: item.equipmentType,
    equipmentLabel: equipmentTypeLabels[item.equipmentType],
    quantity: item.quantity,
    isReplacement: item.isReplacement,
    technicalRequirements: item.technicalRequirements,
    replacementReason: item.replacementReason,
    previousEquipmentDisposition: item.previousEquipmentDisposition
      ? {
          value: item.previousEquipmentDisposition,
          label:
            previousEquipmentDispositionLabels[item.previousEquipmentDisposition],
        }
      : null,
    previousEquipment: item.isReplacement
      ? {
          model: item.previousEquipmentModel,
          assetTag: item.previousEquipmentAssetTag,
          serialNumber: item.previousEquipmentSerialNumber,
          phoneNumber: item.previousEquipmentPhoneNumber,
          notes: item.previousEquipmentNotes,
        }
      : null,
  }));

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
      department: input.futureUserDepartment,
      jobTitle: input.futureUserJobTitle,
      location: input.futureUserLocation,
    },
    justification: input.justification,
    notes: input.notes,
    items: normalizedItems,
    totals: {
      itemCount: normalizedItems.length,
      totalUnits,
    },
    summary: normalizedItems
      .map((item) => `${item.quantity}x ${item.equipmentLabel}`)
      .join(", "),
  };
}

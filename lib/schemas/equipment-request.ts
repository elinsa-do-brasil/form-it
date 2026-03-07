import { z } from "zod";

export const requesterRoleOptions = ["manager", "coordinator"] as const;
export const equipmentTypeOptions = [
  "cellphone",
  "notebook",
  "desktop",
  "tablet",
  "starlink",
] as const;
export const previousEquipmentDispositionOptions = [
  "return_to_it",
  "reallocate",
  "donate",
  "discard",
  "store",
  "other",
] as const;

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || undefined : value),
  z.string().optional(),
);

const requiredTrimmedString = (
  label: string,
  { min = 1, email = false }: { min?: number; email?: boolean } = {},
) => {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    email
      ? z
          .string({ error: `${label} é obrigatório.` })
          .min(min, `${label} deve ter pelo menos ${min} caracteres.`)
          .email(`${label} precisa ser um e-mail válido.`)
      : z
          .string({ error: `${label} é obrigatório.` })
          .min(min, `${label} deve ter pelo menos ${min} caracteres.`),
  );
};

export const equipmentRequestItemSchema = z
  .object({
    equipmentType: z.enum(equipmentTypeOptions, {
      error: "Selecione um tipo de equipamento.",
    }),
    quantity: z.coerce
      .number({ error: "Informe uma quantidade válida." })
      .int("A quantidade precisa ser um número inteiro.")
      .min(1, "A quantidade mínima é 1.")
      .max(100, "A quantidade máxima por item é 100."),
    isReplacement: z.boolean(),
    replacementReason: optionalTrimmedString,
    previousEquipmentDisposition: z.enum(previousEquipmentDispositionOptions).optional(),
    previousEquipmentModel: optionalTrimmedString,
    previousEquipmentAssetTag: optionalTrimmedString,
    previousEquipmentSerialNumber: optionalTrimmedString,
    previousEquipmentPhoneNumber: optionalTrimmedString,
    previousEquipmentNotes: optionalTrimmedString,
    technicalRequirements: optionalTrimmedString,
  })
  .superRefine((item, ctx) => {
    if (!item.isReplacement) {
      return;
    }

    if (!item.previousEquipmentDisposition) {
      ctx.addIssue({
        code: "custom",
        path: ["previousEquipmentDisposition"],
        message: "Informe o destino do equipamento anterior.",
      });
    }

    if (!item.replacementReason) {
      ctx.addIssue({
        code: "custom",
        path: ["replacementReason"],
        message: "Explique por que esta solicitação é uma substituição.",
      });
    }

    const hasPreviousEquipmentData = [
      item.previousEquipmentModel,
      item.previousEquipmentAssetTag,
      item.previousEquipmentSerialNumber,
      item.previousEquipmentPhoneNumber,
      item.previousEquipmentNotes,
    ].some(Boolean);

    if (!hasPreviousEquipmentData) {
      ctx.addIssue({
        code: "custom",
        path: ["previousEquipmentNotes"],
        message: "Informe ao menos um dado do equipamento anterior.",
      });
    }
  });

export const equipmentRequestSchema = z
  .object({
    requesterName: requiredTrimmedString("O nome do solicitante", { min: 3 }),
    requesterEmail: requiredTrimmedString("O e-mail do solicitante", {
      email: true,
    }),
    requesterRole: z.enum(requesterRoleOptions, {
      error: "Selecione se o solicitante é gerente ou coordenador.",
    }),
    requesterDepartment: requiredTrimmedString("A área do solicitante", {
      min: 2,
    }),
    requesterPhone: optionalTrimmedString,

    futureUserName: requiredTrimmedString("O nome do futuro usuário", { min: 3 }),
    futureUserEmail: requiredTrimmedString("O e-mail do futuro usuário", {
      email: true,
    }),
    futureUserDepartment: requiredTrimmedString("A área do futuro usuário", {
      min: 2,
    }),
    futureUserJobTitle: optionalTrimmedString,
    futureUserLocation: optionalTrimmedString,

    justification: requiredTrimmedString("A justificativa", { min: 20 }),
    notes: optionalTrimmedString,
    items: z
      .array(equipmentRequestItemSchema)
      .min(1, "Adicione pelo menos um equipamento.")
      .superRefine((items, ctx) => {
        const duplicates = new Set<string>();

        items.forEach((item, index) => {
          if (duplicates.has(item.equipmentType)) {
            ctx.addIssue({
              code: "custom",
              path: [index, "equipmentType"],
              message: "Cada tipo de equipamento deve aparecer apenas uma vez.",
            });
          }

          duplicates.add(item.equipmentType);
        });
      }),
  })
  .strict();

export type EquipmentRequestInput = z.output<typeof equipmentRequestSchema>;
export type EquipmentRequestItemInput = z.output<
  typeof equipmentRequestItemSchema
>;

export type EquipmentRequestItemFormValues = {
  equipmentType: (typeof equipmentTypeOptions)[number];
  quantity: number;
  isReplacement: boolean;
  replacementReason: string;
  previousEquipmentDisposition?:
    | (typeof previousEquipmentDispositionOptions)[number]
    | undefined;
  previousEquipmentModel: string;
  previousEquipmentAssetTag: string;
  previousEquipmentSerialNumber: string;
  previousEquipmentPhoneNumber: string;
  previousEquipmentNotes: string;
  technicalRequirements: string;
};

export type EquipmentRequestFormValues = {
  requesterName: string;
  requesterEmail: string;
  requesterRole: (typeof requesterRoleOptions)[number];
  requesterDepartment: string;
  requesterPhone: string;
  futureUserName: string;
  futureUserEmail: string;
  futureUserDepartment: string;
  futureUserJobTitle: string;
  futureUserLocation: string;
  justification: string;
  notes: string;
  items: EquipmentRequestItemFormValues[];
};

export const requesterRoleLabels: Record<
  (typeof requesterRoleOptions)[number],
  string
> = {
  manager: "Gerente",
  coordinator: "Coordenador",
};

export const equipmentTypeLabels: Record<
  (typeof equipmentTypeOptions)[number],
  string
> = {
  cellphone: "Celular",
  notebook: "Notebook",
  desktop: "Desktop",
  tablet: "Tablet",
  starlink: "Starlink",
};

export const previousEquipmentDispositionLabels: Record<
  (typeof previousEquipmentDispositionOptions)[number],
  string
> = {
  return_to_it: "Devolver ao TI",
  reallocate: "Realocar internamente",
  donate: "Doação",
  discard: "Descarte",
  store: "Armazenar",
  other: "Outro destino",
};

export const emptyEquipmentRequestItem = (): EquipmentRequestItemFormValues => ({
  equipmentType: "notebook",
  quantity: 1,
  isReplacement: false,
  replacementReason: "",
  previousEquipmentDisposition: undefined,
  previousEquipmentModel: "",
  previousEquipmentAssetTag: "",
  previousEquipmentSerialNumber: "",
  previousEquipmentPhoneNumber: "",
  previousEquipmentNotes: "",
  technicalRequirements: "",
});

export const emptyEquipmentRequestValues = (): EquipmentRequestFormValues => ({
  requesterName: "",
  requesterEmail: "",
  requesterRole: "manager",
  requesterDepartment: "",
  requesterPhone: "",
  futureUserName: "",
  futureUserEmail: "",
  futureUserDepartment: "",
  futureUserJobTitle: "",
  futureUserLocation: "",
  justification: "",
  notes: "",
  items: [emptyEquipmentRequestItem()],
});

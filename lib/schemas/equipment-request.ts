import { z } from "zod";

export const requesterRoleOptions = ["manager", "coordinator"] as const;
export const equipmentTypeOptions = [
  "cellphone",
  "notebook",
  "desktop",
  "tablet",
  "starlink",
  "extra_monitor",
] as const;
export const equipmentProfileOptions = [
  "standard",
  "cellphone_standard",
  "cellphone_executive",
  "notebook_standard",
  "notebook_intermediate",
  "notebook_advanced",
] as const;
export const previousEquipmentDispositionOptions = [
  "return_to_it",
  "reallocate",
  "donate",
  "discard",
  "store",
  "other",
] as const;

export type RequesterRole = (typeof requesterRoleOptions)[number];
export type EquipmentType = (typeof equipmentTypeOptions)[number];
export type EquipmentProfile = (typeof equipmentProfileOptions)[number];
export type PreviousEquipmentDisposition =
  (typeof previousEquipmentDispositionOptions)[number];

type EquipmentProfileDefinition = {
  value: EquipmentProfile;
  label: string;
  description: string;
};

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || undefined : value),
  z.string().optional(),
);

const cpfString = z.preprocess(
  (value) =>
    typeof value === "string" ? value.replace(/\D/g, "").trim() : value,
  z
    .string({ error: "O CPF do futuro usuário é obrigatório." })
    .length(11, "O CPF deve conter 11 dígitos."),
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

export const requesterRoleLabels: Record<RequesterRole, string> = {
  manager: "Gerente",
  coordinator: "Coordenador",
};

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  cellphone: "Celular",
  notebook: "Notebook",
  desktop: "Desktop",
  tablet: "Tablet",
  starlink: "Starlink",
  extra_monitor: "Monitor extra",
};

export const previousEquipmentDispositionLabels: Record<
  PreviousEquipmentDisposition,
  string
> = {
  return_to_it: "Devolver ao TI",
  reallocate: "Realocar internamente",
  donate: "Doação",
  discard: "Descarte",
  store: "Armazenar",
  other: "Outro destino",
};

export const equipmentProfilesByType: Record<
  EquipmentType,
  readonly EquipmentProfileDefinition[]
> = {
  cellphone: [
    {
      value: "cellphone_standard",
      label: "Celular corporativo padrão - linha A1X",
      description:
        "Indicado para a maioria das pessoas, com foco em e-mail, apps corporativos, autenticadores e comunicação diária.",
    },
    {
      value: "cellphone_executive",
      label: "Z Fold X",
      description:
        "Indicado para gerentes e cargos superiores, com mais tela para multitarefa, aprovações e produtividade móvel.",
    },
  ],
  notebook: [
    {
      value: "notebook_standard",
      label: "Padrão",
      description:
        "Indicado para planilhas básicas, área de trabalho remota, sistemas online e rotinas administrativas.",
    },
    {
      value: "notebook_intermediate",
      label: "Intermediário",
      description:
        "Indicado para uso com AutoCAD, Power BI, análise de dados com Python, programação e multitarefa pesada.",  
    },
    {
      value: "notebook_advanced",
      label: "Avançado",
      description:
        "Reservado para coordenadores e gerentes, que precisam de alta mobilidade.",
    },
  ],
  desktop: [
    {
      value: "standard",
      label: "Padrão",
      description:
        "Estação fixa padrão para sistemas online, planilhas e rotinas administrativas.",
    },
  ],
  tablet: [
    {
      value: "standard",
      label: "Padrão",
      description:
        "Tablet padrão para mobilidade operacional, checklists, coleta de dados e uso em campo.",
    },
  ],
  starlink: [
    {
      value: "standard",
      label: "Padrão",
      description:
        "Kit Starlink padrão para conectividade em bases remotas, obras e frentes de campo.",
    },
  ],
  extra_monitor: [
    {
      value: "standard",
      label: "Padrão",
      description:
        "Monitor adicional padrão para ampliar a área de trabalho e melhorar a multitarefa.",
    },
  ],
};

export function getEquipmentProfileOptions(type: EquipmentType) {
  return equipmentProfilesByType[type];
}

export function getDefaultEquipmentProfile(type: EquipmentType): EquipmentProfile {
  return equipmentProfilesByType[type][0].value;
}

export function getEquipmentProfileDefinition(
  type: EquipmentType,
  profile: EquipmentProfile | undefined,
) {
  const normalizedProfile = profile ?? getDefaultEquipmentProfile(type);

  return (
    equipmentProfilesByType[type].find(
      (option) => option.value === normalizedProfile,
    ) ?? equipmentProfilesByType[type][0]
  );
}

export function equipmentTypeHasProfileChoices(type: EquipmentType) {
  return equipmentProfilesByType[type].length > 1;
}

export const equipmentRequestItemSchema = z
  .object({
    equipmentType: z.enum(equipmentTypeOptions, {
      error: "Selecione um tipo de equipamento.",
    }),
    equipmentProfile: z.enum(equipmentProfileOptions).optional(),
    quantity: z.coerce
      .number({ error: "Informe uma quantidade válida." })
      .int("A quantidade precisa ser um número inteiro.")
      .min(1, "A quantidade mínima é 1.")
      .max(100, "A quantidade máxima por item é 100."),
    isReplacement: z.boolean(),
    replacementReason: optionalTrimmedString,
    previousEquipmentDisposition: z
      .enum(previousEquipmentDispositionOptions)
      .optional(),
    previousEquipmentModel: optionalTrimmedString,
    previousEquipmentAssetTag: optionalTrimmedString,
    previousEquipmentSerialNumber: optionalTrimmedString,
    previousEquipmentPhoneNumber: optionalTrimmedString,
    previousEquipmentNotes: optionalTrimmedString,
  })
  .superRefine((item, ctx) => {
    const allowedProfiles = getEquipmentProfileOptions(item.equipmentType).map(
      (option) => option.value,
    );
    const profile =
      item.equipmentProfile ?? getDefaultEquipmentProfile(item.equipmentType);

    if (!allowedProfiles.includes(profile)) {
      ctx.addIssue({
        code: "custom",
        path: ["equipmentProfile"],
        message: "Selecione um perfil compatível com o equipamento.",
      });
    }

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
  })
  .transform((item) => ({
    ...item,
    equipmentProfile:
      item.equipmentProfile ?? getDefaultEquipmentProfile(item.equipmentType),
  }));

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

    futureUserName: requiredTrimmedString("O nome do futuro usuário", { min: 3 }),
    futureUserEmail: requiredTrimmedString("O e-mail do futuro usuário", {
      email: true,
    }),
    futureUserCpf: cpfString,
    futureUserEmployeeId: requiredTrimmedString(
      "A matrícula do funcionário",
      {
        min: 1,
      },
    ),
    futureUserDepartment: requiredTrimmedString("A área do futuro usuário", {
      min: 2,
    }),
    futureUserJobTitle: optionalTrimmedString,
    futureUserLocation: optionalTrimmedString,

    justification: requiredTrimmedString("A justificativa", { min: 20 }),
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
  equipmentType: EquipmentType;
  equipmentProfile: EquipmentProfile;
  quantity: number;
  isReplacement: boolean;
  replacementReason: string;
  previousEquipmentDisposition?: PreviousEquipmentDisposition | undefined;
  previousEquipmentModel: string;
  previousEquipmentAssetTag: string;
  previousEquipmentSerialNumber: string;
  previousEquipmentPhoneNumber: string;
  previousEquipmentNotes: string;
};

export type EquipmentRequestFormValues = {
  requesterName: string;
  requesterEmail: string;
  requesterRole: RequesterRole;
  requesterDepartment: string;
  futureUserName: string;
  futureUserEmail: string;
  futureUserCpf: string;
  futureUserEmployeeId: string;
  futureUserDepartment: string;
  futureUserJobTitle: string;
  futureUserLocation: string;
  justification: string;
  items: EquipmentRequestItemFormValues[];
};

export const emptyEquipmentRequestItem = (): EquipmentRequestItemFormValues => ({
  equipmentType: "notebook",
  equipmentProfile: "notebook_standard",
  quantity: 1,
  isReplacement: false,
  replacementReason: "",
  previousEquipmentDisposition: undefined,
  previousEquipmentModel: "",
  previousEquipmentAssetTag: "",
  previousEquipmentSerialNumber: "",
  previousEquipmentPhoneNumber: "",
  previousEquipmentNotes: "",
});

export const emptyEquipmentRequestValues = (): EquipmentRequestFormValues => ({
  requesterName: "",
  requesterEmail: "",
  requesterRole: "manager",
  requesterDepartment: "",
  futureUserName: "",
  futureUserEmail: "",
  futureUserCpf: "",
  futureUserEmployeeId: "",
  futureUserDepartment: "",
  futureUserJobTitle: "",
  futureUserLocation: "",
  justification: "",
  items: [emptyEquipmentRequestItem()],
});

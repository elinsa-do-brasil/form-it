"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlaskConical, Loader2, Plus, SendHorizontal, Trash2 } from "lucide-react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  emptyEquipmentRequestItem,
  emptyEquipmentRequestValues,
  equipmentRequestSchema,
  equipmentTypeHasProfileChoices,
  equipmentTypeLabels,
  equipmentTypeOptions,
  getDefaultEquipmentProfile,
  getEquipmentProfileDefinition,
  getEquipmentProfileOptions,
  maxEquipmentRequestItems,
  requesterRoleLabels,
  requesterRoleOptions,
  type EquipmentRequestFormValues,
  type EquipmentType,
} from "@/lib/schemas/equipment-request";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EquipmentRequestFormProps = {
  defaultRequesterName?: string;
  defaultRequesterEmail?: string;
};

const showTestFillButton = process.env.NODE_ENV !== "production";

function getInitialValues({
  defaultRequesterEmail,
  defaultRequesterName,
}: Pick<
  EquipmentRequestFormProps,
  "defaultRequesterEmail" | "defaultRequesterName"
>): EquipmentRequestFormValues {
  return {
    ...emptyEquipmentRequestValues(),
    requesterName: defaultRequesterName ?? "",
    requesterEmail: defaultRequesterEmail ?? "",
  };
}

function getTestValues({
  defaultRequesterEmail,
  defaultRequesterName,
}: Pick<
  EquipmentRequestFormProps,
  "defaultRequesterEmail" | "defaultRequesterName"
>): EquipmentRequestFormValues {
  return {
    requesterName: defaultRequesterName ?? "Marina Souza",
    requesterEmail: defaultRequesterEmail ?? "marina.souza@empresa.com",
    requesterRole: "manager",
    requesterDepartment: "Operações",
    requesterPhone: "91991234567",
    futureUserName: "Carlos Henrique Lima",
    futureUserEmail: "carlos.lima@grupoamperelinsa.com",
    futureUserCpf: "12345678909",
    futureUserEmployeeId: "1042",
    futureUserDepartment: "Engenharia",
    futureUserJobTitle: "Analista de Projetos",
    futureUserLocation: "Paragominas",
    justification:
      "Novo colaborador iniciando atividades em campo e escritório, com necessidade de comunicação móvel e estação de trabalho para rotinas operacionais e relatórios.",
    requesterResponsibilityConfirmed: true,
    items: [
      {
        equipmentType: "notebook",
        equipmentProfile: "notebook_intermediate",
        quantity: 1,
        isReplacement: false,
        replacementReason: "",
        previousEquipmentModel: "",
        previousEquipmentAssetTag: "",
        previousEquipmentSerialNumber: "",
        previousEquipmentPhoneNumber: "",
        previousEquipmentNotes: "",
      },
      {
        equipmentType: "cellphone",
        equipmentProfile: "cellphone_standard",
        quantity: 1,
        isReplacement: false,
        replacementReason: "",
        previousEquipmentModel: "",
        previousEquipmentAssetTag: "",
        previousEquipmentSerialNumber: "",
        previousEquipmentPhoneNumber: "",
        previousEquipmentNotes: "",
      },
      {
        equipmentType: "extra_monitor",
        equipmentProfile: "standard",
        quantity: 1,
        isReplacement: true,
        replacementReason:
          "Monitor anterior com falha intermitente e perda de imagem.",
        previousEquipmentModel: "Dell P2219H",
        previousEquipmentAssetTag: "MON-004281",
        previousEquipmentSerialNumber: "CN0ABC123456",
        previousEquipmentPhoneNumber: "",
        previousEquipmentNotes: "Piscando durante o uso em estação fixa.",
      },
    ],
  };
}

export function EquipmentRequestForm({
  defaultRequesterName,
  defaultRequesterEmail,
}: EquipmentRequestFormProps) {
  const router = useRouter();

  const form = useForm<EquipmentRequestFormValues>({
    resolver: zodResolver(
      equipmentRequestSchema,
    ) as Resolver<EquipmentRequestFormValues>,
    defaultValues: getInitialValues({
      defaultRequesterName,
      defaultRequesterEmail,
    }),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });
  const responsibilityConfirmed = useWatch({
    control: form.control,
    name: "requesterResponsibilityConfirmed",
  });
  const itemsErrorMessage =
    typeof form.formState.errors.items?.message === "string"
      ? form.formState.errors.items.message
      : undefined;

  async function onSubmit(values: EquipmentRequestFormValues) {
    const response = await fetch("/api/equipment-requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; requestId?: string }
      | null;

    if (response.ok && payload?.requestId) {
      toast.success(payload.message ?? "Solicitação enviada com sucesso.");
      router.push(`/confirmacao/${payload.requestId}`);
      return;
    }

    toast.error(
      payload?.message ?? "Não foi possível enviar a solicitação de equipamentos.",
    );
  }

  const isBusy = form.formState.isSubmitting;
  const canAddMoreItems = fields.length < maxEquipmentRequestItems;

  function fillWithTestData() {
    form.reset(
      getTestValues({
        defaultRequesterName,
        defaultRequesterEmail,
      }),
    );
    toast.success("Dados de teste preenchidos.");
  }

  return (
    <Card className="border-border/70 shadow-sm lg:h-full lg:min-h-0">
      <CardHeader className="border-border/70 gap-3 border-b lg:shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-2xl">Solicitação de equipamentos</CardTitle>
            <CardDescription className="max-w-2xl">
              Preencha os dados do solicitante, do futuro usuário e selecione os
              itens desejados. Depois do envio, o pedido segue para análise.
            </CardDescription>
          </div>

          {showTestFillButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillWithTestData}
              disabled={isBusy}
            >
              <FlaskConical />
              Preencher teste
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-1">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">1. Dados do solicitante</h2>
                <p className="text-muted-foreground text-sm">
                  Quem está aprovando e pedindo o equipamento para a equipe.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="requesterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do gerente ou coordenador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail corporativo</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="gestor@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo do solicitante</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isBusy}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requesterRoleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {requesterRoleLabels[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="GEOM, SESMT etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterPhone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Número de contato</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="tel"
                          placeholder="WhatsApp ou Telegram com DDD"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Usaremos esse número para as atualizações do pedido.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">2. Dados do futuro usuário</h2>
                <p className="text-muted-foreground text-sm">
                  Quem vai receber e utilizar o equipamento solicitado.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="futureUserName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Colaborador que usará o item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail corporativo</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@grupoamperelinsa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula do funcionário</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: 0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="GEOM, SESMT etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserJobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Analista, técnico, coordenador..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="futureUserLocation"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Localidade / base</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Abaetetuba, Paragominas, uso em campo etc."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    3. Equipamentos solicitados
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Cada tipo pode aparecer uma unica vez por solicitacao, com
                    limite de ate {maxEquipmentRequestItems} itens por pedido.
                    Os perfis padronizados orientam o provisionamento do item.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((itemField, index) => {
                  const itemValues = watchedItems?.[index];
                  const selectedTypes = watchedItems
                    ?.map((item) => item?.equipmentType)
                    .filter(Boolean);
                  const equipmentType =
                    itemValues?.equipmentType ?? itemField.equipmentType;
                  const profileOptions = getEquipmentProfileOptions(equipmentType);
                  const profileDefinition = getEquipmentProfileDefinition(
                    equipmentType,
                    itemValues?.equipmentProfile ?? itemField.equipmentProfile,
                  );
                  const isReplacement = Boolean(itemValues?.isReplacement);

                  return (
                    <div
                      key={itemField.id}
                      className="bg-muted/20 rounded-xl border p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">Item {index + 1}</p>
                            <Badge variant="outline">
                              {equipmentTypeLabels[equipmentType]}
                            </Badge>
                            <Badge variant="secondary">
                              {profileDefinition.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Quantidade, perfil e contexto operacional do pedido.
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1 || isBusy}
                        >
                          <Trash2 />
                          Remover
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.equipmentType` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de equipamento</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  const nextType = value as EquipmentType;

                                  field.onChange(nextType);
                                  form.setValue(
                                    `items.${index}.equipmentProfile`,
                                    getDefaultEquipmentProfile(nextType),
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );
                                }}
                                disabled={isBusy}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o equipamento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {equipmentTypeOptions.map((type) => {
                                    const disabled =
                                      selectedTypes?.includes(type) &&
                                      field.value !== type;

                                    return (
                                      <SelectItem
                                        key={type}
                                        value={type}
                                        disabled={disabled}
                                      >
                                        {equipmentTypeLabels[type]}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  {...field}
                                  value={field.value}
                                  onChange={(event) => {
                                    field.onChange(Number(event.target.value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.equipmentProfile` as const}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Perfil do equipamento</FormLabel>
                              {equipmentTypeHasProfileChoices(equipmentType) ? (
                                <>
                                  <FormControl>
                                    <RadioGroup
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      className="grid gap-3"
                                    >
                                      {profileOptions.map((option) => {
                                        const optionId = `item-${index}-${option.value}`;
                                        const isSelected =
                                          field.value === option.value;

                                        return (
                                          <div key={option.value} className="relative">
                                            <RadioGroupItem
                                              value={option.value}
                                              id={optionId}
                                              className="sr-only"
                                              disabled={isBusy}
                                            />
                                            <label
                                              htmlFor={optionId}
                                              className={cn(
                                                "flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors",
                                                isSelected
                                                  ? "border-primary bg-primary/5"
                                                  : "hover:bg-muted/40",
                                              )}
                                            >
                                              <span className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-medium">
                                                  {option.label}
                                                </span>
                                                {isSelected ? (
                                                  <Badge variant="secondary">
                                                    Selecionado
                                                  </Badge>
                                                ) : null}
                                              </span>
                                              <span className="text-muted-foreground text-sm">
                                                {option.description}
                                              </span>
                                            </label>
                                          </div>
                                        );
                                      })}
                                    </RadioGroup>
                                  </FormControl>
                                </>
                              ) : (
                                <div className="rounded-lg border border-dashed p-4">
                                  <p className="font-medium">
                                    Perfil aplicado: {profileDefinition.label}
                                  </p>
                                  <p className="text-muted-foreground mt-1 text-sm">
                                    {profileDefinition.description}
                                  </p>
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 rounded-lg border border-dashed p-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.isReplacement` as const}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between gap-4">
                              <div className="space-y-1">
                                <FormLabel>É substituição?</FormLabel>
                                <FormDescription>
                                  Ative se este item substituir um equipamento
                                  já existente.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isBusy}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {isReplacement ? (
                          <div className="mt-4 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.replacementReason` as const}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Motivo da substituição</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Ex.: equipamento com falhas recorrentes, obsolescência ou mudança de função."
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.previousEquipmentModel` as const}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>Modelo anterior</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Dell Vostro, iPhone..."
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.previousEquipmentAssetTag` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Patrimônio / etiqueta</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="PAT-000123"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.previousEquipmentSerialNumber` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Número de série</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Serial do item substituído"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.previousEquipmentPhoneNumber` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Linha / número anterior</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Somente para celular ou tablet com chip"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.previousEquipmentNotes` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dados adicionais do equipamento anterior</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Estado atual, defeitos, usuário atual ou detalhes logísticos."
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => append(emptyEquipmentRequestItem())}
                disabled={!canAddMoreItems || isBusy}
                >
                <Plus />
                Adicionar item
              </Button>

              {itemsErrorMessage ? (
                <p className="text-destructive text-sm">{itemsErrorMessage}</p>
              ) : !canAddMoreItems ? (
                <p className="text-muted-foreground text-sm">
                  Este formulario aceita no maximo {maxEquipmentRequestItems} itens
                  por solicitacao.
                </p>
              ) : null}
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">4. Justificativa</h2>
                <p className="text-muted-foreground text-sm">
                  Explique a necessidade do pedido para ajudar na análise e no
                  atendimento da solicitação.
                </p>
              </div>

              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa do pedido</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo da solicitação, impacto operacional e contexto de uso."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="flex flex-col justify-between gap-3 rounded-lg border px-4 py-3">
              <FormField
                control={form.control}
                name="requesterResponsibilityConfirmed"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(Boolean(checked));
                          }}
                          disabled={isBusy}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="leading-5">
                          Confirmo que sou responsável por este envio e que os
                          dados informados estão corretos.
                        </FormLabel>
                        <FormDescription>
                          As atualizações do pedido serão encaminhadas para o
                          número de contato informado acima.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isBusy || !responsibilityConfirmed}
                className="relative min-w-44"
              >
                <span
                  className={cn(
                    "flex items-center gap-2",
                    isBusy ? "invisible" : "visible",
                  )}
                >
                  <SendHorizontal />
                  Enviar solicitação
                </span>
                {isBusy ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                  </span>
                ) : null}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, SendHorizontal, Trash2 } from "lucide-react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  emptyEquipmentRequestItem,
  emptyEquipmentRequestValues,
  equipmentRequestSchema,
  equipmentTypeLabels,
  equipmentTypeOptions,
  previousEquipmentDispositionLabels,
  previousEquipmentDispositionOptions,
  requesterRoleLabels,
  requesterRoleOptions,
  type EquipmentRequestFormValues,
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
import { Input } from "@/components/ui/input";
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
  organizationName?: string | null;
  defaultRequesterName?: string;
  defaultRequesterEmail?: string;
};

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

export function EquipmentRequestForm({
  organizationName,
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

    if (payload?.requestId) {
      if (response.ok) {
        toast.success(payload.message ?? "Solicitação enviada com sucesso.");
      } else if (payload.message) {
        toast.error(payload.message);
      }

      router.push(`/confirmacao/${payload.requestId}`);
      return;
    }

    toast.error(
      payload?.message ?? "Não foi possível enviar a solicitação de equipamentos.",
    );
  }

  const isBusy = form.formState.isSubmitting;
  const canAddMoreItems = fields.length < equipmentTypeOptions.length;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {organizationName ? (
            <Badge variant="outline">{organizationName}</Badge>
          ) : null}
          <Badge variant="secondary">Webhook n8n</Badge>
        </div>
        <CardTitle className="text-2xl">Solicitação de equipamentos</CardTitle>
        <CardDescription className="max-w-2xl">
          Preencha os dados do solicitante, do futuro usuário e dos itens
          desejados. O envio é registrado no banco e encaminhado ao fluxo do
          n8n ao final.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <FormLabel>Área / departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Operações, Comercial, TI..." {...field} />
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
                      <FormLabel>Telefone / ramal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+55 11 99999-9999"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional, mas útil para retorno rápido do time de TI.
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
                          placeholder="usuario@empresa.com"
                          {...field}
                        />
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
                      <FormLabel>Área / departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Atendimento, Vendas, Campo..." {...field} />
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
                          placeholder="Matriz SP, operação Nordeste, atuação em campo..."
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
                    Adicione um ou mais itens. Cada tipo pode aparecer uma única
                    vez por solicitação.
                  </p>
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
              </div>

              <div className="space-y-4">
                {fields.map((itemField, index) => {
                  const itemValues = watchedItems?.[index];
                  const selectedTypes = watchedItems
                    ?.map((item) => item?.equipmentType)
                    .filter(Boolean);
                  const isReplacement = Boolean(itemValues?.isReplacement);

                  return (
                    <div
                      key={itemField.id}
                      className="bg-muted/20 rounded-xl border p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Item {index + 1}</p>
                          <p className="text-muted-foreground text-sm">
                            Quantidade, tipo e contexto operacional do pedido.
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
                                onValueChange={field.onChange}
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
                      </div>

                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.technicalRequirements` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especificações e observações</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex.: notebook com 16GB RAM, chip corporativo, uso externo, mochila, monitor adicional..."
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Descreva configuração desejada, acessórios ou
                                requisitos técnicos.
                              </FormDescription>
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
                                        placeholder="Ex.: equipamento com falhas recorrentes, obsolescência, mudança de função..."
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
                                name={`items.${index}.previousEquipmentDisposition` as const}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>
                                      O que será feito com o equipamento anterior?
                                    </FormLabel>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      disabled={isBusy}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Selecione o destino do item anterior" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {previousEquipmentDispositionOptions.map(
                                          (disposition) => (
                                            <SelectItem
                                              key={disposition}
                                              value={disposition}
                                            >
                                              {
                                                previousEquipmentDispositionLabels[
                                                  disposition
                                                ]
                                              }
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.previousEquipmentModel` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Modelo anterior</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Dell Latitude, iPhone 13..."
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
                                      placeholder="Estado atual, defeitos, usuário atual, detalhes logísticos..."
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
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  4. Justificativa e contexto
                </h2>
                <p className="text-muted-foreground text-sm">
                  Explique a necessidade do pedido para facilitar a triagem do
                  time de TI e o processamento no n8n.
                </p>
              </div>

              <div className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações adicionais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações extras para logística, aprovação ou preparação do item."
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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-sm">
                Ao enviar, a solicitação fica registrada e segue para o webhook
                configurado no n8n.
              </p>

              <Button type="submit" disabled={isBusy}>
                {isBusy ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <SendHorizontal />
                    Enviar solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

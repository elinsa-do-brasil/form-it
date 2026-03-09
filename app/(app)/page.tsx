import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/actions/session";

import { EquipmentRequestForm } from "@/components/equipment-requests/equipment-request-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const session = await getCurrentUser();

  const organization = session.session.activeOrganizationId
    ? await db.organization.findUnique({
        where: {
          id: session.session.activeOrganizationId,
        },
        select: {
          name: true,
        },
      })
    : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 py-6 lg:grid-cols-[minmax(0,1.8fr)_360px]">
      <EquipmentRequestForm
        organizationName={organization?.name ?? null}
        defaultRequesterName={session.user.name}
        defaultRequesterEmail={session.user.email}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Fluxo do pedido</Badge>
              {organization?.name ? (
                <Badge variant="outline">{organization.name}</Badge>
              ) : null}
            </div>
            <CardTitle className="text-2xl">
              Como funciona o pedido de equipamento
            </CardTitle>
            <CardDescription>
              Acompanhe cada etapa do processo, desde a solicitação até a entrega
              do equipamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">1. Solicitação</p>
              <p className="text-muted-foreground mt-1">
                O solicitante preenche e envia o pedido por este formulário. A
                solicitação é encaminhada ao coordenador do setor de TI.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">2. Análise do coordenador</p>
              <p className="text-muted-foreground mt-1">
                O coordenador de TI avalia o pedido e decide pela aprovação ou
                reprovação.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">3. Notificação</p>
              <p className="text-muted-foreground mt-1">
                O solicitante é notificado sobre o resultado da análise do
                coordenador.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">4. Compras ou alocações</p>
              <p className="text-muted-foreground mt-1">
                Após a aprovação, as compras ou alocações necessárias são
                preparadas.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">5. Termo de responsabilidade</p>
              <p className="text-muted-foreground mt-1">
                Um termo de responsabilidade de uso é emitido para o
                futuro usuário.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">6. Entrega</p>
              <p className="text-muted-foreground mt-1">
                O equipamento é entregue ao futuro usuário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

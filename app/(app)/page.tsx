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
              <Badge variant="secondary">Fluxo principal</Badge>
              {organization?.name ? (
                <Badge variant="outline">{organization.name}</Badge>
              ) : null}
            </div>
            <CardTitle className="text-2xl">
              Login, formulário e confirmação
            </CardTitle>
            <CardDescription>
              O sistema foi simplificado para um fluxo direto: entrar, preencher
              o pedido e receber a confirmação com o status do processamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">1. Autenticação</p>
              <p className="text-muted-foreground mt-1">
                O usuário entra no sistema e cai direto na tela de pedido.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">2. Registro do pedido</p>
              <p className="text-muted-foreground mt-1">
                O formulário valida todos os campos antes de persistir no banco.
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium">3. Confirmação</p>
              <p className="text-muted-foreground mt-1">
                Após salvar, o usuário vê uma confirmação com o identificador e
                o status do webhook do n8n.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

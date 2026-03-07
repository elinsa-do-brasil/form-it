"use client"

// componentes:
import { Card } from "@/components/ui/card";
import { MembersDataTable } from "@/components/organization/tables/members/data-table";
import { type MemberWithUser, getMembersColumns } from "./members-columns";

// tipos:
import { useMemo } from "react";
import { authClient } from "@/lib/auth-client";

export function AllMembers({ members }: { members: MemberWithUser[] }) {
  const { data: organization } = authClient.useActiveOrganization();

  const columns = useMemo(() => {
    return getMembersColumns(organization?.id || "");
  }, [organization?.id]);

  // O componente AllUsers agora é responsável apenas por 
  // fornecer os dados e as colunas para o DataTable genérico.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Membros</h3>
        <p className="text-muted-foreground text-sm">Usuários que fazem parte desta organização</p>
      </div>
      <Card className="p-4">
        {/* Renderiza a tabela de dados usando as colunas definidas e lista de usuários */}
        <MembersDataTable columns={columns} data={members} />
      </Card>
    </div>
  );
}
"use client"

import { useMemo } from "react";
import { type User } from "@/prisma/client/client";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/organization/tables/users/data-table";
import { getUsersColumns } from "./users-columns";
import { authClient } from "@/lib/auth-client";

export function AllUsers({ users }: { users: User[] }) {
  const { data: organization } = authClient.useActiveOrganization();

  const columns = useMemo(() => {
    return getUsersColumns(organization?.id || "");
  }, [organization?.id]);

  // O componente AllUsers agora é responsável apenas por 
  // fornecer os dados e as colunas para o DataTable genérico.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Outros usuários</h3>
        <p className="text-muted-foreground text-sm">Adicione usuários que não fazem parte desta organização</p>
      </div>
      <Card className="p-4">
        {/* Renderiza a tabela de dados usando as colunas definidas e lista de usuários */}
        <DataTable columns={columns} data={users} />
      </Card>
    </div>
  );
}
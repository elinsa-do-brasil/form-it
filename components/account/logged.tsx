"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Organization } from "@/prisma/client/client";
import { authClient } from "@/lib/auth-client";
import { OrganizationSwitcher } from "@/components/account/organization-switcher";
import { AccessLevelIcon } from "@/components/account/access-level-icon";
import { AdminPanel } from "./buttons/admin-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUser, LogOut, Settings } from "lucide-react";

interface LoggedAccountProps {
  session?: {
    user?: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
      image?: string | null;
    } | null;
  } | null;
  organizations: Organization[];
  preferredActiveOrganizationId?: string | null;
}

export function LoggedAccount({
  session,
  organizations,
  preferredActiveOrganizationId,
}: LoggedAccountProps) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage
            src={session?.user?.image || undefined}
            alt="Foto de perfil do usuário"
          />
          <AvatarFallback aria-label="Avatar padrão">
            <CircleUser size={20} />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col">
          {session?.user?.name}
          <span className="text-xs font-normal text-muted-foreground">
            {session?.user?.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {organizations.length > 0 && (
            <OrganizationSwitcher
              organizations={organizations}
              preferredActiveOrganizationId={preferredActiveOrganizationId}
            />
          )}

          <DropdownMenuItem asChild>
            <Link href="/configuracoes/conta">
              <Settings className="size-4" />
              Configurações
            </Link>
          </DropdownMenuItem>

          {session?.user?.role && <AccessLevelIcon level={session.user.role} />}

          <AdminPanel />

          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/entrar");
                  },
                },
              });
            }}
          >
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </>
  );
}

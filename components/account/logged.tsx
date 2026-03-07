"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUser, FilePlus2, LogOut } from "lucide-react";

interface LoggedAccountProps {
  session?: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  } | null;
}

export function LoggedAccount({ session }: LoggedAccountProps) {
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
          <DropdownMenuItem asChild>
            <Link href="/">
              <FilePlus2 className="size-4" />
              Novo pedido
            </Link>
          </DropdownMenuItem>

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

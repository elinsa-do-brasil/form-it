import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { LogIn, SquareUser, UserPlus } from "lucide-react";
import { Button } from "../ui/button";

export function UnloggedAccount() {
  return (
    <>
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <SquareUser />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Conteúdo do menu suspenso para usuário não autenticado */}
        <DropdownMenuLabel>Olá, usuário!</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/entrar">
              <LogIn />
              Entrar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/criar-conta">
              <UserPlus />
              Criar conta
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </>
  );
}

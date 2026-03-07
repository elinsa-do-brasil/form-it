"use client";

// componentes:
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ícones:
import { Shield, SquareUser } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AccessLevelIcon({ level }: { level: string | null | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuItem>
          { level === "admin" ? (
            <>
              <Shield />
              Administrador
            </>
          ) : level === "internal" ? (
            <>
              <SquareUser />
              Interno
            </>
          ) : level === "external" ? (
            <>
              <SquareUser />
              Externo
            </>
          ) : null }
        </DropdownMenuItem>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Seu nível de acesso ao sistema</p>
      </TooltipContent>
    </Tooltip>
  );
}
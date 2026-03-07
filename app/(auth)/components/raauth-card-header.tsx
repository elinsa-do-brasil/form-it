// componentes:
// componentes:
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

//ícones:
import { Lock } from "lucide-react";

interface RaauthCardHeaderProps {
  login?:  boolean;
}

export function RaauthCardHeader({ login = false }: RaauthCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <Link href="/" className="font-averia text-3xl">
          form.it
        </Link>
        <Lock size={14} />
      </CardTitle>
      <CardDescription>
        { login 
          ? "Entre para abrir um novo pedido de equipamento." 
          : "Esta tela não faz mais parte do fluxo principal." }
      </CardDescription>
    </CardHeader>
  )
}

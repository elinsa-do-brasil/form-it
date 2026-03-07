import { Button } from "@/components/ui/button";
import { CardFooter as CardFooterComponent } from "@/components/ui/card";
import Link from "next/link";

interface CardFooterProps {
  login?: boolean
}

export function CardFooter({ login = false }: CardFooterProps) {
  return (
    <CardFooterComponent className="flex justify-center">
      {login ? (
        <Button variant={"link"} asChild>
          <Link href="/criar-conta">Não tem uma conta? Crie uma</Link>
        </Button>
      ) : (
        <Button variant={"link"} asChild>
          <Link href="/entrar">Já tem uma conta? Entre</Link>
        </Button>
      )}
    </CardFooterComponent>
  )
} 
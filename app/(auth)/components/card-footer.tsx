import { Button } from "@/components/ui/button";
import { CardFooter as CardFooterComponent } from "@/components/ui/card";
import Link from "next/link";

interface CardFooterProps {
  login?: boolean
}

export function CardFooter({ login = false }: CardFooterProps) {
  if (login) {
    return null;
  }

  return (
    <CardFooterComponent className="flex justify-center">
      <Button variant={"link"} asChild>
        <Link href="/entrar">Já tem uma conta? Entre</Link>
      </Button>
    </CardFooterComponent>
  )
} 

import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheckBig } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/actions/session";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ConfirmationPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { requestId } = await params;
  const session = await getCurrentUser();

  const request = await db.equipmentRequest.findFirst({
    where: {
      id: requestId,
      submittedByUserId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center py-6">
        <Card className="w-full border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 px-8 py-12 text-center">
          <div className="bg-primary/12 text-primary flex size-20 items-center justify-center rounded-full">
            <CircleCheckBig className="size-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Pedido enviado
            </h1>
            <p className="text-muted-foreground text-base">
              Aguarde atualizações no seu número de contato.
            </p>
          </div>

          <Button asChild>
            <Link href="/">Fazer novo pedido</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

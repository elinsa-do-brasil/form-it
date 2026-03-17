// componentes:
// componentes:
import {
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

//ícones:
import { Lock } from "lucide-react";
import Image from "next/image";

export function RaauthCardHeader() {
  return (
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <Link href="/" className="font-averia text-3xl">
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </Link>
        <Lock size={14} />
      </CardTitle>
    </CardHeader>
  )
}

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { IdCardLanyard } from "lucide-react";
import Link from "next/link";

export function AdminPanel(){
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return(
    // TODO: implementar checagem de roles
    <DropdownMenuItem asChild>
      <Link href={`/org/${activeOrganization?.slug}`}>
        <IdCardLanyard />
        Gerenciar Organização
      </Link>
    </DropdownMenuItem>
  )
}

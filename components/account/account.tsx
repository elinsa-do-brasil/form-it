// funções e libs:
import { auth } from "@/lib/auth";

// componentes:
import { DropdownMenu } from "@/components/ui/dropdown-menu";

// ícones:
import { UnloggedAccount } from "@/components/account/unlogged";
import { LoggedAccount } from "@/components/account/logged";
import { headers } from "next/headers";
import { getOrganizations } from "@/server/actions/organizations";

export async function Account() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { organizations, preferredActiveOrganizationId } =
    await getOrganizations();

  return (
    <DropdownMenu>
      {!session ? (
        <UnloggedAccount />
      ) : (
        <LoggedAccount
          session={session}
          organizations={organizations}
          preferredActiveOrganizationId={preferredActiveOrganizationId}
        />
      )}
    </DropdownMenu>
  );
}

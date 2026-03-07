"use client";

import { useCallback, useEffect, useRef } from "react";

import { persistActiveOrganization } from "@/server/actions/organizations";
import { authClient } from "@/lib/auth-client";
import { type Organization } from "@/prisma/client/client";
import { useRouter } from "next/navigation";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { ArrowDownUp, BriefcaseBusiness, PlusCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface OrganizationSwitcherProps {
  organizations: Organization[];
  preferredActiveOrganizationId?: string | null;
}

function SkeletonOrganization() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="w-20 h-4" />
    </div>
  );
}

export function OrganizationSwitcher({
  organizations,
  preferredActiveOrganizationId,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { data: activeOrganization, isPending } =
    authClient.useActiveOrganization();
  const isSwitchingRef = useRef(false);
  const autoSelectionAttemptedForId = useRef<string | null>(null);

  const setActiveOrganization = useCallback(
    async (
      organizationId: string,
      { silent = false }: { silent?: boolean } = {},
    ) => {
      if (!organizationId || isSwitchingRef.current) return;

      isSwitchingRef.current = true;

      const changePromise = (async () => {
        await authClient.organization.setActive({ organizationId });
        const persisted = await persistActiveOrganization(organizationId);
        if (!persisted.ok) {
          throw new Error(
            persisted.reason ?? "FAILED_TO_PERSIST_ACTIVE_ORGANIZATION",
          );
        }
        router.refresh();
      })();

      try {
        if (silent) {
          await changePromise;
        } else {
          await toast.promise(changePromise, {
            loading: "Alterando organizacao",
            success: "Organizacao alterada",
            error: "Houve um erro inesperado ao alterar organizacao",
          });
        }
      } catch {
        if (silent) {
          toast.error("Nao foi possivel definir a organizacao ativa");
        }
      } finally {
        isSwitchingRef.current = false;
      }
    },
    [router],
  );

  useEffect(() => {
    if (isPending || organizations.length === 0 || isSwitchingRef.current)
      return;

    const hasValidActiveOrganization = activeOrganization
      ? organizations.some(
          (organization) => organization.id === activeOrganization.id,
        )
      : false;

    if (hasValidActiveOrganization) return;

    const preferredOrganization =
      organizations.length === 1
        ? organizations[0]
        : organizations.find(
            (organization) => organization.id === preferredActiveOrganizationId,
          );

    if (!preferredOrganization) return;

    if (autoSelectionAttemptedForId.current === preferredOrganization.id)
      return;
    autoSelectionAttemptedForId.current = preferredOrganization.id;

    void setActiveOrganization(preferredOrganization.id, { silent: true });
  }, [
    activeOrganization,
    isPending,
    organizations,
    preferredActiveOrganizationId,
    setActiveOrganization,
  ]);

  if (organizations.length <= 1) {
    return (
      <DropdownMenuItem disabled>
        {isPending ? (
          <SkeletonOrganization />
        ) : (
          <>
            <BriefcaseBusiness />
            {activeOrganization?.name ?? organizations[0]?.name}
          </>
        )}
      </DropdownMenuItem>
    );
  }

  if (isPending) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <SkeletonOrganization />
        </DropdownMenuSubTrigger>
      </DropdownMenuSub>
    );
  }

  const handleChangeOrganization = (organizationId: string) => {
    void setActiveOrganization(organizationId);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {activeOrganization?.name ? (
          <>
            <BriefcaseBusiness />
            {activeOrganization.name}
          </>
        ) : (
          <SkeletonOrganization />
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
            <ArrowDownUp className="size-4" />
            Selecione uma organizacao
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={activeOrganization?.id}
            onValueChange={handleChangeOrganization}
          >
            {organizations.map((organization) => (
              <DropdownMenuRadioItem
                key={organization.id}
                value={organization.id}
              >
                {organization.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/criar-organizacao")}>
            <PlusCircle className="size-4" />
            Criar nova organizacao
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

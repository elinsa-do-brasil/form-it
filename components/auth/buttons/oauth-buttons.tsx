"use client";

import { OAuthButtonBase } from "@/components/auth/buttons/oauth-button-base";

// ícones:
import { CgMicrosoft } from "react-icons/cg";

interface ProviderButtonProps {
  className?: string;
}

export function MicrosoftOauthButton(props: ProviderButtonProps) {
  return (
    <OAuthButtonBase
      provider="microsoft"
      icon={CgMicrosoft}
      label="Entrar com Microsoft"
      {...props}
    />
  );
}

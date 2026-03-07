"use client";

import { OAuthButtonBase } from "@/components/auth/buttons/oauth-button-base";

// ícones:
import { CgMicrosoft } from "react-icons/cg";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface ProviderButtonProps {
  className?: string;
}

// cada botão desses só vai pro bundle se você importar ele em alguma página
export function GithubOauthButton(props: ProviderButtonProps) {
  return (
    <OAuthButtonBase
      provider="github"
      icon={FaGithub}
      label="GitHub"
      {...props}
    />
  );
}

export function GoogleOauthButton(props: ProviderButtonProps) {
  return (
    <OAuthButtonBase
      provider="google"
      icon={FcGoogle}
      label="Google"
      {...props}
    />
  );
}

export function MicrosoftOauthButton(props: ProviderButtonProps) {
  return (
    <OAuthButtonBase
      provider="microsoft"
      icon={CgMicrosoft}
      label="Microsoft"
      {...props}
    />
  );
}

"use client";

// dependências:
import { useState } from "react";
import type { IconType } from "react-icons";

// componentes:
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// funções:
import { authClient } from "@/lib/auth-client";

type OAuthProvider = "github" | "google" | "microsoft"; // vai só expandindo aqui

interface OAuthButtonBaseProps {
  provider: OAuthProvider;
  icon: IconType;
  label: string;
  className?: string;
}

export function OAuthButtonBase({
  provider,
  icon: Icon,
  label,
  className,
}: OAuthButtonBaseProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social({ provider });
    } catch {
      // se der erro, reabilita o botão
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Spinner />
      ) : (
        <Icon />
      )}
      {label}
    </Button>
  );
}

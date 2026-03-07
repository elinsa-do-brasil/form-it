import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Tailwind,
  pixelBasedPreset,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  userFirstname?: string;
  resetPasswordUrl?: string;
}

export const ResetPasswordEmail = ({
  userFirstname,
  resetPasswordUrl,
}: ResetPasswordEmailProps) => {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefina sua senha da conta</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-black text-2xl font-normal text-center p-0 my-8 mx-0">
              Redefinir sua senha
            </Heading>
            <Text className="text-black text-[14px] leading-6">
              Olá {userFirstname},
            </Text>
            <Text className="text-black text-[14px] leading-6">
              Alguém solicitou recentemente uma alteração de senha para sua
              conta. Se foi você, você pode definir uma nova senha clicando no
              botão abaixo:
            </Text>
            <Container className="text-center mt-8 mb-8 w-full">
              <Button
                className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                href={resetPasswordUrl}
              >
                Redefinir senha
              </Button>
            </Container>
            <Text className="text-black text-sm leading-6">
              Se você não deseja alterar sua senha ou não solicitou essa
              alteração, apenas ignore e exclua este e-mail.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ResetPasswordEmail.PreviewProps = {
  userFirstname: "Vitor",
  resetPasswordUrl: "https://localhost:3000/redefinir-senha?token=mock_12345",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;

// ============================================================
// 📧 LÓGICA DE E-MAIL: MEMBERSHIP (Entrada/Saída de Membros)
// ============================================================
// Este arquivo contém as funções de envio de e-mail para
// quando um membro é adicionado ou removido de uma organização.
//
// 📌 PROVEDOR DE E-MAIL:
// Usamos o Resend (https://resend.com) — um serviço moderno
// de envio de e-mails transacionais. A API key é configurada
// na variável de ambiente RESEND_API_KEY.
//
// 🐤 Analogia: quando alguém entra ou sai de uma empresa,
// o RH envia um e-mail automático. Este arquivo é o "RH"
// digital do sistema.
//
// 💡 PONTO DE EXTENSÃO:
// - Troque o "from" pelo seu domínio configurado no Resend
// - Use templates React Email para e-mails mais bonitos
//   (o projeto já tem @react-email/components instalado)
// - Adicione mais funções para outros tipos de e-mail
//   (ex: convite, reset de senha, verificação, etc.)
// ============================================================

import { type Organization, type User } from "@/prisma/client/client";
import { Resend } from "resend";

// ── Tipos ─────────────────────────────────────────────────

// Dados necessários para enviar e-mails de membership.
// Precisa do usuário (para saber o e-mail e nome) e
// da organização (para personalizar a mensagem).
interface MembershipEmailParams {
  user: User;
  org: Organization;
}

// ── Instância do Resend ───────────────────────────────────

// Cria a instância do client Resend com a API key.
// ⚠️ Certifique-se de que RESEND_API_KEY está no .env
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// 🎉 sendWelcomeEmail
// ============================================================
// Envia e-mail de boas-vindas quando um membro é adicionado.
//
// 💡 Para melhorar: use React Email para criar um template
// bonito em vez de texto puro. Exemplo:
//   import { WelcomeEmail } from "@/emails/welcome";
//   react: <WelcomeEmail userName={user.name} orgName={org.name} />
// ============================================================
export async function sendWelcomeEmail({ user, org }: MembershipEmailParams) {
  const { data, error } = await resend.emails.send({
    // ⚠️ ALTERAR: troque pelo seu domínio configurado no Resend
    from: "Raauth <membership@mail.raave.dev>",
    to: [user.email],
    subject: "Bem-vindo à organização",
    text: `Oi, ${user.name}. Você foi adicionado à ${org.name}`,
  });

  if (error) {
    return {
      success: false,
      message: "Houve um erro ao enviar o e-mail de boas-vindas.",
    };
  }

  return {
    success: true,
    message: "Foi enviado um e-mail de boas-vindas",
    data: data?.id,
  };
}

// ============================================================
// 👋 sendRemovalEmail
// ============================================================
// Envia e-mail de notificação quando um membro é removido.
//
// Este e-mail é uma cortesia — avisa o usuário que ele não
// tem mais acesso à organização. É importante para que ele
// não fique tentando acessar algo e vendo erros.
// ============================================================
export async function sendRemovalEmail({ user, org }: MembershipEmailParams) {
  const { data, error } = await resend.emails.send({
    // ⚠️ ALTERAR: troque pelo seu domínio configurado no Resend
    from: "Raauth <membership@mail.raave.dev>",
    to: [user.email],
    subject: "Remoção da organização",
    text: `Oi, ${user.name}. Você foi removido da ${org.name}`,
  });

  if (error) {
    return {
      success: false,
      message: "Houve um erro ao enviar o e-mail de notificação.",
    };
  }

  return {
    success: true,
    message: "Foi enviado um e-mail de notificação de remoção",
    data: data?.id,
  };
}
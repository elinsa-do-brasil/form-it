import { Resend } from "resend";

interface ResetPasswordEmailParams {
  user: { name: string; email: string };
  url: string;
}

interface EmailVerificationParams {
  user: { name: string; email: string };
  url: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

import { ResetPasswordEmail } from "../../emails/reset-password";

// ============================================================
// 🔐 sendResetPasswordEmail
// ============================================================
// Envia e-mail contendo o link de recuperação de senha.
// ============================================================
export async function sendResetPasswordEmail({ user, url }: ResetPasswordEmailParams) {
  const { data, error } = await resend.emails.send({
    from: "Raauth <auth@mail.raave.dev>",
    to: [user.email],
    subject: "Redefinir sua senha",
    react: ResetPasswordEmail({ userFirstname: user.name, resetPasswordUrl: url }),
  });

  if (error) {
    console.error("Erro ao enviar e-mail de recuperação de senha:", error);
    return {
      success: false,
      message: "Houve um erro ao enviar o e-mail de recuperação de senha.",
    };
  }

  return {
    success: true,
    message: "Foi enviado um e-mail de recuperação de senha",
    data: data?.id,
  };
}

export async function sendEmailVerificationLink({
  user,
  url,
}: EmailVerificationParams) {
  const { data, error } = await resend.emails.send({
    from: "Raauth <auth@mail.raave.dev>",
    to: [user.email],
    subject: "Confirme seu novo e-mail",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h2>Confirmar alteração de e-mail</h2>
        <p>Olá, ${user.name || "usuário"}.</p>
        <p>Recebemos um pedido para alterar o e-mail da sua conta.</p>
        <p>
          <a href="${url}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
            Confirmar novo e-mail
          </a>
        </p>
        <p>Se você não solicitou essa alteração, ignore esta mensagem.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Erro ao enviar e-mail de verificação:", error);
    return {
      success: false,
      message: "Houve um erro ao enviar o e-mail de verificação.",
    };
  }

  return {
    success: true,
    message: "E-mail de verificação enviado.",
    data: data?.id,
  };
}

import nodemailer from "nodemailer";
import { env } from "../env.js";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

interface SendArgsWithCode extends SendArgs {
  /** Optional plaintext code/banner to print prominently in dev when no API key. */
  devCode?: string;
}

/**
 * Parses an EMAIL_FROM string like `"Luminary <noreply@example.com>"` or just
 * `"noreply@example.com"` into a valid Nodemailer from string.
 */
function parseFrom(raw: string): string {
  const m = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) {
    const name = m[1].replace(/^"|"$/g, "").trim();
    return name ? `${name} <${m[2].trim()}>` : m[2].trim();
  }
  return raw.trim();
}

async function send({ to, subject, html, devCode }: SendArgsWithCode): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    // Dev fallback: print prominently so you can grab the code without SMTP creds.
    if (env.NODE_ENV !== "production") {
      const banner =
        `\n\n========== [email:dev-stub] (no Gmail SMTP creds) ==========\n` +
        `  to:      ${to}\n` +
        `  subject: ${subject}\n` +
        (devCode ? `  CODE:    ${devCode}\n` : "") +
        `==========================================================\n`;
      // eslint-disable-next-line no-console
      console.log(banner);
      return;
    }
    throw new Error(
      "GMAIL_USER or GMAIL_APP_PASSWORD is missing in production, so emails cannot be delivered.",
    );
  }

  const from = parseFrom(env.EMAIL_FROM);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[email] sent OK -> ${to}  (id: ${info.messageId ?? "?"}, subject: "${subject}")`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[email] send threw -> ${to}\n  subject: ${subject}\n  error:`,
      err,
    );
    throw err instanceof Error ? err : new Error("Unknown email provider error");
  }
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border:1px solid #ececef;border-radius:14px;padding:32px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#7C6FF7;display:inline-block;"></div>
        <span style="font-size:16px;font-weight:600;color:#0a0a0b;">Luminary</span>
      </div>
      <h1 style="font-size:22px;margin:0 0 16px;color:#0a0a0b;line-height:1.3;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#9b9ba2;font-size:11px;margin-top:18px;">
      Sent by Luminary · A private journaling app
    </p>
  </div>
</body></html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:24px 0;padding:12px 22px;background:#7C6FF7;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${label}</a>`;
}

export async function sendVerificationEmail(
  to: string,
  displayName: string,
  code: string,
): Promise<void> {
  const html = shell(
    `Welcome to Luminary, ${escapeHtml(displayName)}`,
    `<p style="color:#5b5b66;line-height:1.65;font-size:14px;">
      Use the verification code below to confirm your email address.
      This code expires in 15 minutes.
    </p>
    <div style="margin:24px 0;padding:20px 16px;background:#f6f5fe;border:1px solid #e6e3fb;border-radius:12px;text-align:center;">
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;letter-spacing:10px;color:#0a0a0b;font-weight:700;">
        ${escapeHtml(code)}
      </div>
    </div>
    <p style="color:#9b9ba2;font-size:12px;margin-top:24px;">
      If you didn't create a Luminary account, you can safely ignore this email.
    </p>`,
  );
  await send({
    to,
    subject: `Your Luminary code: ${code}`,
    html,
    devCode: code,
  });
}

export async function sendPasswordChangedEmail(
  to: string,
  displayName: string,
): Promise<void> {
  const html = shell(
    "Your password was changed",
    `<p style="color:#5b5b66;line-height:1.65;font-size:14px;">
      Hi ${escapeHtml(displayName)}, your Luminary password was just changed.
    </p>
    <p style="color:#5b5b66;line-height:1.65;font-size:14px;">
      If this wasn't you, please reset your password immediately and contact support.
    </p>`,
  );
  await send({ to, subject: "Your Luminary password was changed", html });
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  token: string,
): Promise<void> {
  const resetUrl = `${env.APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const html = shell(
    "Reset your password",
    `<p style="color:#5b5b66;line-height:1.65;font-size:14px;">
      Hi ${escapeHtml(displayName)}, click below to reset your Luminary password.
      This link expires in 1 hour.
    </p>
    ${btn(resetUrl, "Reset password")}
    <p style="color:#9b9ba2;font-size:12px;margin-top:24px;line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>`,
  );
  await send({ to, subject: "Reset your Luminary password", html });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

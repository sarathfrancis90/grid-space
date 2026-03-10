import { Resend } from "resend";
import { env } from "../config/env";
import logger from "../utils/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM = env.EMAIL_FROM;

interface SendResult {
  success: boolean;
  id?: string;
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!resend) {
    logger.warn(
      { to, subject },
      "Email skipped — RESEND_API_KEY not configured",
    );
    return { success: false };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ to, subject, error }, "Failed to send email");
      return { success: false };
    }

    logger.info({ to, subject, id: data?.id }, "Email sent");
    return { success: true, id: data?.id };
  } catch (err) {
    logger.error({ to, subject, err }, "Email send threw");
    return { success: false };
  }
}

export async function sendShareInvite(
  to: string,
  inviterName: string,
  spreadsheetTitle: string,
  role: string,
  spreadsheetUrl: string,
): Promise<SendResult> {
  const subject = `${inviterName} shared "${spreadsheetTitle}" with you`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 8px; line-height: 48px; font-size: 24px; font-weight: bold;">G</div>
        </div>
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px; text-align: center;">
          ${inviterName} shared a spreadsheet with you
        </h2>
        <p style="color: #64748b; text-align: center; margin: 0 0 24px; font-size: 15px;">
          You've been given <strong>${role}</strong> access to <strong>"${spreadsheetTitle}"</strong>
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${spreadsheetUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Open Spreadsheet
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
          If you don't have a GridSpace account yet, you'll need to
          <a href="${spreadsheetUrl.split("/spreadsheet")[0]}/register" style="color: #2563eb; text-decoration: none;">sign up</a>
          first. Access will be granted automatically.
        </p>
      </div>
      <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 16px;">
        GridSpace — Collaborative Spreadsheets
      </p>
    </div>
  `;

  return send(to, subject, html);
}

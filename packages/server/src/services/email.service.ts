import nodemailer from "nodemailer";
import { env } from "../config/env";
import logger from "../utils/logger";

const transporter =
  env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null;

const FROM = env.EMAIL_FROM || env.SMTP_USER;

interface SendResult {
  success: boolean;
  messageId?: string;
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!transporter || !FROM) {
    logger.warn({ to, subject }, "Email skipped — SMTP not configured");
    return { success: false };
  }

  try {
    const info = await transporter.sendMail({
      from: `GridSpace <${FROM}>`,
      to,
      subject,
      html,
    });

    logger.info({ to, subject, messageId: info.messageId }, "Email sent");
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error({ to, subject, err }, "Failed to send email");
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

import nodemailer from 'nodemailer';
import { appConfig } from '../config/app';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const from = `"GlowUp" <${process.env.SMTP_FROM || 'noreply@glowup.app'}>`;

export const sendVerificationEmail = async (to: string, token: string) => {
  const url = `${appConfig.clientUrl}/verify-email?token=${token}`;
  console.log(`[DEV] Verification email to ${to}: ${url}`);
  if (process.env.SMTP_USER) {
    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email',
      html: `<p>Click <a href="${url}">here</a> to verify your email. Token: ${token}</p>`
    });
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const url = `${appConfig.clientUrl}/reset-password?token=${token}`;
  console.log(`[DEV] Password reset email to ${to}: ${url}`);
  if (process.env.SMTP_USER) {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your password',
      html: `<p>Click <a href="${url}">here</a> to reset your password. Token: ${token}</p>`
    });
  }
};

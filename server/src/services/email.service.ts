import nodemailer from 'nodemailer';
import { appConfig } from '../config/app';
import logger from '../utils/logger';

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
  logger.info(`[DEV EMAIL] To: ${to} | Subject: Verify your email`);
  if (process.env.SMTP_USER) {
    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email',
      html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
    });
  } else {
    logger.warn('SMTP not configured — verification email only logged to console. Set SMTP_USER/SMTP_PASS in production.');
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const url = `${appConfig.clientUrl}/reset-password?token=${token}`;
  logger.info(`[DEV EMAIL] To: ${to} | Subject: Reset your password`);
  if (process.env.SMTP_USER) {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your password',
      html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`
    });
  } else {
    logger.warn('SMTP not configured — password reset email only logged to console. Set SMTP_USER/SMTP_PASS in production.');
  }
};

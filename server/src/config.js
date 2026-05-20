import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, '../.env') });
dotenv.config();

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT) || 5001,
  databaseUrl: process.env.DATABASE_URL?.trim(),
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  clientOrigins: splitCsv(process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173'),
  barberStaffId: process.env.BARBER_STAFF_ID || 'STYLECUT001',
  barberAccessCode: process.env.BARBER_ACCESS_CODE || '123456',
  notificationMode: process.env.NOTIFICATION_MODE || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  metaBusinessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE || 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'notifications@stylecut.com'
};

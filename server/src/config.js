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
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  barberStaffId: process.env.BARBER_STAFF_ID || 'STYLECUT001',
  barberAccessCode: process.env.BARBER_ACCESS_CODE || '123456',
  notificationMode: process.env.NOTIFICATION_MODE || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  metaBusinessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaTemplateLanguage: process.env.META_TEMPLATE_LANGUAGE || 'en_US',
  metaBookingConfirmationTemplate: process.env.META_BOOKING_CONFIRMATION_TEMPLATE || 'booking_confirmation',
  metaBookingAcceptedTemplate: process.env.META_BOOKING_ACCEPTED_TEMPLATE || 'booking_accepted',
  metaBookingCompletedTemplate: process.env.META_BOOKING_COMPLETED_TEMPLATE || 'booking_completed',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE || 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'notifications@stylecut.com'
};

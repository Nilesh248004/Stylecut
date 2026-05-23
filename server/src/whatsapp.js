import { config } from './config.js';

const notificationMode = config.notificationMode || 'mock'; // 'mock' | 'email' | 'twilio' | 'meta'

function normalizeWhatsappPhone(phone) {
  const rawPhone = String(phone || '').trim();
  if (rawPhone.startsWith('whatsapp:')) {
    return rawPhone;
  }

  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const normalizedDigits = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
  const cleaned = rawPhone.startsWith('+') ? `+${digits}` : `+${normalizedDigits}`;
  return `whatsapp:${cleaned}`;
}

function normalizeMetaWhatsappPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
}

function getNotificationText(notification) {
  if (typeof notification === 'string') {
    return notification;
  }

  return notification?.text || notification?.fallbackText || '';
}

function buildMetaTemplatePayload(notification) {
  const template = notification?.metaTemplate;
  if (!template?.name) {
    return null;
  }

  const parameters = (template.bodyParameters || [])
    .filter((value) => value !== undefined && value !== null)
    .map((value) => ({
      type: 'text',
      text: String(value)
    }));

  return {
    type: 'template',
    template: {
      name: template.name,
      language: {
        code: template.languageCode || config.metaTemplateLanguage
      },
      ...(parameters.length
        ? {
            components: [
              {
                type: 'body',
                parameters
              }
            ]
          }
        : {})
    }
  };
}

// Mock notification (FREE - development/testing)
async function sendMockNotification(toPhone, notification) {
  const message = getNotificationText(notification);
  console.log(`\n🔔 WhatsApp Mock Notification to ${toPhone}:\n${message}\n`);
  return { success: true, mode: 'mock', phone: toPhone };
}

// Email notification (FREE if you have SMTP)
async function sendEmailNotification(toEmail, notification) {
  const message = getNotificationText(notification);
  if (!toEmail) {
    console.warn('Email address not provided for notification');
    return null;
  }

  if (!config.smtpHost || !config.smtpPort) {
    console.info('SMTP not configured; email notification skipped');
    return null;
  }

  const nodemailer = await import('nodemailer').catch(() => null);
  if (!nodemailer) {
    console.warn('nodemailer not installed for email notifications');
    return null;
  }

  try {
    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure !== 'false',
      auth: config.smtpUser
        ? {
            user: config.smtpUser,
            pass: config.smtpPassword
          }
        : undefined
    });

    const info = await transporter.sendMail({
      from: config.smtpFrom || 'notifications@stylecut.com',
      to: toEmail,
      subject: 'StyleCut Salon Notification',
      text: message
    });

    console.log(`✉️  Email sent: ${info.messageId}`);
    return { success: true, mode: 'email', messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw new Error('Email notification failed.');
  }
}

// Twilio WhatsApp (PAID - production)
async function sendTwilioNotification(toPhone, notification) {
  const message = getNotificationText(notification);
  const formattedPhone = normalizeWhatsappPhone(toPhone);
  if (!formattedPhone) {
    throw new Error('Invalid phone number for WhatsApp notification.');
  }

  const payload = new URLSearchParams({
    To: formattedPhone,
    From: config.twilioWhatsappFrom,
    Body: message
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    }
  );

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Twilio WhatsApp send failed', result || await response.text());
    throw new Error('WhatsApp notification failed.');
  }

  return result;
}

// Meta WhatsApp Cloud API (FREE TIER - 1000 msgs/month)
async function sendMetaNotification(toPhone, notification) {
  if (!config.metaPhoneNumberId || !config.metaBusinessAccountId || !config.metaAccessToken) {
    console.info('Meta WhatsApp Cloud API not configured.');
    return null;
  }

  const phone = normalizeMetaWhatsappPhone(toPhone);
  if (!phone) {
    throw new Error('Invalid phone number for WhatsApp notification.');
  }

  const templatePayload = buildMetaTemplatePayload(notification);
  const messagePayload = templatePayload || {
    type: 'text',
    text: { body: getNotificationText(notification) }
  };

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.metaPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.metaAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        ...messagePayload
      })
    }
  );

  const result = await response.json();
  if (!response.ok) {
    console.error('Meta WhatsApp send failed', result);
    throw new Error('WhatsApp notification failed.');
  }

  return result;
}

export async function sendWhatsAppNotification(toPhone, toEmail, message) {
  if (!toPhone && !toEmail) {
    console.warn('No phone or email provided for notification');
    return null;
  }

  try {
    switch (notificationMode) {
      case 'mock':
        return await sendMockNotification(toPhone, message);

      case 'email':
        return toEmail ? await sendEmailNotification(toEmail, message) : null;

      case 'twilio':
        return toPhone ? await sendTwilioNotification(toPhone, message) : null;

      case 'meta':
        return toPhone ? await sendMetaNotification(toPhone, message) : null;

      default:
        return await sendMockNotification(toPhone, message);
    }
  } catch (error) {
    console.error(`Notification failed (${notificationMode}):`, error.message);
    return null;
  }
}

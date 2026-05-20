import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import { config } from './config.js';
import { query } from './db.js';
import { sendWhatsAppNotification } from './whatsapp.js';

const app = express();
const allowedStatuses = new Set(['pending', 'accepted', 'completed', 'cancelled']);

async function notifyCustomerWhatsApp(phone, email, message) {
  if ((!phone && !email) || !message) {
    return;
  }

  try {
    await sendWhatsAppNotification(phone, email, message);
  } catch (error) {
    console.error('Notification failed:', error.message || error);
  }
}

function buildWhatsAppMessage(type, payload) {
  switch (type) {
    case 'service_booked':
      return `Hi ${payload.customerName}, your booking for ${payload.serviceName} on ${payload.appointmentDate} at ${payload.appointmentTime} is confirmed. We look forward to welcoming you soon.`;
    case 'service_status_changed':
      if (payload.status === 'cancelled') {
        return `Hi ${payload.customerName}, your booking for ${payload.serviceName} on ${payload.appointmentDate} at ${payload.appointmentTime} has been cancelled. Please contact us if you want to reschedule.`;
      }
      if (payload.status === 'accepted') {
        return `Hi ${payload.customerName}, your booking for ${payload.serviceName} on ${payload.appointmentDate} at ${payload.appointmentTime} has been accepted. See you soon!`;
      }
      if (payload.status === 'completed') {
        return `Hi ${payload.customerName}, your booking for ${payload.serviceName} on ${payload.appointmentDate} at ${payload.appointmentTime} is completed. Thank you for choosing StyleCut!`;
      }
      return '';
    case 'product_ordered':
      return `Hi ${payload.customerName}, your order for ${payload.itemCount} item(s) totaling ₹${payload.totalAmount} is confirmed. Delivery address: ${payload.deliveryAddress}. We'll notify you when it is accepted.`;
    case 'product_order_accepted':
      return `Great news! Your order #${payload.orderId} has been accepted. Estimated delivery is ${payload.estimatedDeliveryDate}.`;
    case 'product_order_completed':
      return `Your order #${payload.orderId} is delivered. Thank you for shopping with StyleCut!`;
    case 'product_order_cancelled':
      return `Your order #${payload.orderId} has been cancelled. Please contact us if you need assistance or want to reorder.`;
    default:
      return '';
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'stylecut-api' });
});

app.get('/api/health/db', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/client/register', async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !phone || !password) {
    return res.status(400).json({ message: 'Name, email, phone, and password are required.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await query('SELECT id FROM client_users WHERE email = $1', [normalizedEmail]);
    if (existing.rows[0]) {
      return res.status(409).json({ message: 'Client account already exists. Please login.' });
    }

    const { passwordHash, salt } = hashPassword(password);
    const created = await query(
      `
        INSERT INTO client_users (name, email, phone, password_hash, password_salt)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone
      `,
      [name, normalizedEmail, phone, passwordHash, salt]
    );
    const session = await createSession('client', created.rows[0].id);

    res.status(201).json({ token: session.token, expiresAt: session.expiresAt, profile: clientProfile(created.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/client/login', async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await query('SELECT * FROM client_users WHERE email = $1', [normalizedEmail]);
    const client = result.rows[0];

    if (!client || !verifyPassword(password, client.password_salt, client.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const session = await createSession('client', client.id);
    res.json({ token: session.token, expiresAt: session.expiresAt, profile: clientProfile(client) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/barber/login', async (req, res, next) => {
  const { staffId, accessCode } = req.body;
  const normalizedStaffId = String(staffId || '').trim();

  if (!normalizedStaffId || !accessCode) {
    return res.status(400).json({ message: 'Staff ID and access code are required.' });
  }

  try {
    await ensureDefaultBarber(normalizedStaffId, accessCode);
    const result = await query('SELECT * FROM barber_users WHERE staff_id = $1', [normalizedStaffId]);
    const barber = result.rows[0];

    if (!barber || !verifyPassword(accessCode, barber.password_salt, barber.password_hash)) {
      return res.status(401).json({ message: 'Invalid staff ID or access code.' });
    }

    const session = await createSession('barber', barber.id);
    res.json({ token: session.token, expiresAt: session.expiresAt, profile: barberProfile(barber) });
  } catch (error) {
    next(error);
  }
});

function isValidStatus(status) {
  return allowedStatuses.has(status);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha512').toString('hex');
  return { passwordHash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { passwordHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(passwordHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

async function createSession(userType, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashValue(token);
  const result = await query(
    `
      INSERT INTO auth_sessions (user_type, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      RETURNING expires_at
    `,
    [userType, userId, tokenHash]
  );

  return { token, expiresAt: result.rows[0].expires_at };
}

function clientProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone
  };
}

function barberProfile(row) {
  return {
    id: row.id,
    staffId: row.staff_id
  };
}

async function ensureDefaultBarber(staffId, accessCode) {
  if (staffId !== config.barberStaffId || accessCode !== config.barberAccessCode) {
    return null;
  }

  const existing = await query('SELECT * FROM barber_users WHERE staff_id = $1', [staffId]);
  if (existing.rows[0]) {
    const barber = existing.rows[0];
    if (verifyPassword(accessCode, barber.password_salt, barber.password_hash)) {
      return barber;
    }

    const { passwordHash, salt } = hashPassword(accessCode);
    const updated = await query(
      `
        UPDATE barber_users
        SET password_hash = $1, password_salt = $2
        WHERE id = $3
        RETURNING *
      `,
      [passwordHash, salt, barber.id]
    );

    return updated.rows[0];
  }

  const { passwordHash, salt } = hashPassword(accessCode);
  const created = await query(
    `
      INSERT INTO barber_users (staff_id, password_hash, password_salt)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [staffId, passwordHash, salt]
  );

  return created.rows[0];
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toIsoDate(date) {
  return date.toISOString().split('T')[0];
}

function estimateProductDelivery(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((total, item) => total + Number(item.quantity || 1), 0);
  const address = String(order.delivery_address || '').toLowerCase();
  const totalAmount = Number(order.total_amount || 0);
  let days = 2;
  const reasons = ['standard local delivery window'];

  if (itemCount > 2) {
    days += 1;
    reasons.push('multiple product packing');
  }

  if (totalAmount > 1500) {
    days += 1;
    reasons.push('higher-value order verification');
  }

  if (!address.includes('bengaluru') && !address.includes('bangalore')) {
    days += 1;
    reasons.push('delivery address may be outside the nearby service area');
  }

  let estimatedDate = addDays(new Date(), days);
  if (estimatedDate.getDay() === 0) {
    estimatedDate = addDays(estimatedDate, 1);
    reasons.push('Sunday delivery adjustment');
  }

  return {
    date: toIsoDate(estimatedDate),
    reason: `AI estimate based on ${reasons.join(', ')}.`
  };
}

app.get('/api/services', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, name, category, description, min_price, max_price, duration_minutes
      FROM services
      ORDER BY category, min_price
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT id, name, category, description, price, image_url, stock_quantity
      FROM products
      ORDER BY category, name
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/appointments', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT
        appointments.id,
        appointments.customer_name,
        appointments.customer_email,
        appointments.customer_phone,
        appointments.appointment_date,
        appointments.appointment_time,
        appointments.notes,
        appointments.status,
        services.name AS service_name
      FROM appointments
      JOIN services ON services.id = appointments.service_id
      ORDER BY appointments.appointment_date DESC, appointments.appointment_time DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/appointments/:id/status', async (req, res, next) => {
  const { status } = req.body;

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const appointmentResult = await query(
      `
        SELECT appointments.*, services.name AS service_name
        FROM appointments
        JOIN services ON services.id = appointments.service_id
        WHERE appointments.id = $1
      `,
      [req.params.id]
    );

    const appointment = appointmentResult.rows[0];
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const result = await query(
      `
        UPDATE appointments
        SET status = $1
        WHERE id = $2
        RETURNING *
      `,
      [status, req.params.id]
    );

    const notificationMessage = buildWhatsAppMessage('service_status_changed', {
      customerName: appointment.customer_name,
      serviceName: appointment.service_name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      status
    });

    if (notificationMessage) {
      notifyCustomerWhatsApp(appointment.customer_phone, appointment.customer_email, notificationMessage);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/appointments', async (req, res, next) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceId,
    appointmentDate,
    appointmentTime,
    notes
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !serviceId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      message: 'Name, email, phone, service, date, and time are required.'
    });
  }

  try {
    const result = await query(
      `
        INSERT INTO appointments (
          customer_name,
          customer_email,
          customer_phone,
          service_id,
          appointment_date,
          appointment_time,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        appointmentDate,
        appointmentTime,
        notes || null
      ]
    );

    const created = result.rows[0];
    const serviceResult = await query(
      `SELECT name FROM services WHERE id = $1`,
      [serviceId]
    );
    const serviceName = serviceResult.rows[0]?.name || 'selected service';
    const notificationMessage = buildWhatsAppMessage('service_booked', {
      customerName: created.customer_name,
      serviceName,
      appointmentDate: created.appointment_date,
      appointmentTime: created.appointment_time
    });

    notifyCustomerWhatsApp(created.customer_phone, created.customer_email, notificationMessage);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.get('/api/product-orders', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT
        id,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        order_notes,
        items,
        total_amount,
        estimated_delivery_date,
        delivery_estimate_reason,
        accepted_at,
        delivered_at,
        status,
        created_at
      FROM product_orders
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/product-orders', async (req, res, next) => {
  const { customerName, customerEmail, customerPhone, deliveryAddress, orderNotes, items, totalAmount } = req.body;

  if (!customerName || !customerPhone || !deliveryAddress || !items?.length || !totalAmount) {
    return res.status(400).json({ message: 'Customer name, phone, address, items, and total are required.' });
  }

  try {
    const result = await query(
      `
        INSERT INTO product_orders (customer_name, customer_email, customer_phone, delivery_address, order_notes, items, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        customerName,
        customerEmail || null,
        customerPhone,
        deliveryAddress,
        orderNotes || null,
        JSON.stringify(items),
        totalAmount
      ]
    );

    const created = result.rows[0];
    const itemCount = Array.isArray(items) ? items.reduce((total, item) => total + Number(item.quantity || 1), 0) : 0;
    const notificationMessage = buildWhatsAppMessage('product_ordered', {
      customerName: created.customer_name,
      itemCount,
      totalAmount: created.total_amount,
      deliveryAddress: created.delivery_address
    });

    notifyCustomerWhatsApp(created.customer_phone, created.customer_email, notificationMessage);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/product-orders/:id/status', async (req, res, next) => {
  const { status } = req.body;

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const orderResult = await query(
      `
        SELECT *
        FROM product_orders
        WHERE id = $1
      `,
      [req.params.id]
    );

    const existingOrder = orderResult.rows[0];
    if (!existingOrder) {
      return res.status(404).json({ message: 'Product order not found.' });
    }

    if (status === 'accepted') {
      const estimate = estimateProductDelivery(existingOrder);
      const result = await query(
        `
          UPDATE product_orders
          SET
            status = $1,
            estimated_delivery_date = $2,
            delivery_estimate_reason = $3,
            accepted_at = COALESCE(accepted_at, CURRENT_TIMESTAMP)
          WHERE id = $4
          RETURNING *
        `,
        [status, estimate.date, estimate.reason, req.params.id]
      );

      const notificationMessage = buildWhatsAppMessage('product_order_accepted', {
        orderId: result.rows[0].id,
        estimatedDeliveryDate: result.rows[0].estimated_delivery_date
      });
      notifyCustomerWhatsApp(existingOrder.customer_phone, existingOrder.customer_email, notificationMessage);
      return res.json(result.rows[0]);
    }

    if (status === 'completed' || status === 'cancelled') {
      const updateFields = status === 'completed'
        ? 'status = $1, delivered_at = CURRENT_TIMESTAMP'
        : 'status = $1';

      const result = await query(
        `
          UPDATE product_orders
          SET ${updateFields}
          WHERE id = $2
          RETURNING *
        `,
        [status, req.params.id]
      );

      const notificationMessage = buildWhatsAppMessage(
        status === 'completed' ? 'product_order_completed' : 'product_order_cancelled',
        {
          orderId: existingOrder.id
        }
      );

      notifyCustomerWhatsApp(existingOrder.customer_phone, existingOrder.customer_email, notificationMessage);
      return res.json(result.rows[0]);
    }

    const result = await query(
      `
        UPDATE product_orders
        SET status = $1
        WHERE id = $2
        RETURNING *
      `,
      [status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/bridal-requests', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT *
      FROM bridal_requests
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/bridal-requests', async (req, res, next) => {
  const {
    customerName,
    customerPhone,
    eventDate,
    location,
    packageName,
    addOns,
    includeBridalKit,
    homeService,
    homeServiceDays,
    totalAmount
  } = req.body;

  if (!customerName || !customerPhone || !packageName || !totalAmount) {
    return res.status(400).json({ message: 'Customer name, phone, package, and total are required.' });
  }

  try {
    const result = await query(
      `
        INSERT INTO bridal_requests (
          customer_name,
          customer_phone,
          event_date,
          location,
          package_name,
          add_ons,
          include_bridal_kit,
          home_service,
          home_service_days,
          total_amount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        customerName,
        customerPhone,
        eventDate || null,
        location || null,
        packageName,
        JSON.stringify(addOns || []),
        includeBridalKit,
        homeService,
        homeServiceDays || 0,
        totalAmount
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/bridal-requests/:id/status', async (req, res, next) => {
  const { status } = req.body;

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const result = await query(
      `
        UPDATE bridal_requests
        SET status = $1
        WHERE id = $2
        RETURNING *
      `,
      [status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(config.port, () => {
  console.log(`StyleCut API running on http://localhost:${config.port}`);
});

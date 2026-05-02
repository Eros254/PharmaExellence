// ============================================================
//  BARIZI PHARMA — server.js
//  Node.js + Express backend with Paystack integration
//  Run: node server.js
// ============================================================

const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const crypto   = require('crypto');
const path     = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  MIDDLEWARE
// ============================================================

// Parse JSON — but keep raw body available for webhook signature check
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook/paystack') {
    // Webhook needs the raw body to verify HMAC signature
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      req.rawBody = rawBody;
      try { req.body = JSON.parse(rawBody); } catch (e) { req.body = {}; }
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// CORS — allow your frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve the frontend static files from the parent folder
// (Assumes server.js sits in barizi-server/, frontend files are one level up)
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
//  PAYSTACK HELPERS
// ============================================================

const PAYSTACK_BASE = 'https://api.paystack.co';

// Axios instance pre-configured with Paystack secret key
const paystack = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Generate a unique transaction reference
function generateRef(prefix = 'BARIZI') {
  const timestamp = Date.now();
  const random    = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

// Verify Paystack webhook signature
function verifyWebhookSignature(rawBody, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

// ============================================================
//  ROUTES
// ============================================================

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status : 'ok',
    app    : process.env.APP_NAME || 'Barizi Pharma Server',
    env    : process.env.NODE_ENV || 'development',
    time   : new Date().toISOString()
  });
});

// --- Get Paystack public key (safe to expose) ---
app.get('/api/config', (req, res) => {
  res.json({
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    currency : 'KES'
  });
});

// ------------------------------------------------------------
//  INITIALIZE PAYMENT
//  POST /api/payment/initialize
//  Body: { email, amount, name, course, type }
//  type: "course" | "consulting"
// ------------------------------------------------------------
app.post('/api/payment/initialize', async (req, res) => {
  const { email, amount, name, course, type = 'course' } = req.body;

  // Basic validation
  if (!email || !amount || !name) {
    return res.status(400).json({
      success: false,
      message: 'email, amount, and name are required.'
    });
  }

  const amountInKobo = Math.round(Number(amount) * 100); // Paystack uses smallest currency unit

  if (isNaN(amountInKobo) || amountInKobo <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount.' });
  }

  const reference = generateRef(type === 'consulting' ? 'CONSULT' : 'COURSE');

  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount    : amountInKobo,
      currency  : 'KES',
      reference,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success.html`,
      metadata  : {
        custom_fields: [
          { display_name: 'Full Name',     variable_name: 'name',   value: name },
          { display_name: 'Service Type',  variable_name: 'type',   value: type },
          { display_name: 'Course/Service',variable_name: 'course', value: course || 'General' }
        ]
      },
      channels: ['card', 'bank', 'mobile_money', 'ussd']
    });

    const { authorization_url, access_code, reference: ref } = response.data.data;

    console.log(`[PAYMENT INIT] ref=${ref} | email=${email} | amount=KES ${amount} | type=${type}`);

    res.json({
      success         : true,
      reference       : ref,
      authorization_url,
      access_code
    });

  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('[PAYMENT INIT ERROR]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ------------------------------------------------------------
//  VERIFY PAYMENT
//  GET /api/payment/verify/:reference
// ------------------------------------------------------------
app.get('/api/payment/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required.' });
  }

  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    const data     = response.data.data;

    const isSuccess = data.status === 'success';

    console.log(`[PAYMENT VERIFY] ref=${reference} | status=${data.status} | amount=KES ${data.amount / 100}`);

    res.json({
      success : isSuccess,
      status  : data.status,
      reference,
      amount  : data.amount / 100,  // convert back from kobo
      currency: data.currency,
      email   : data.customer?.email,
      name    : data.metadata?.custom_fields?.find(f => f.variable_name === 'name')?.value,
      course  : data.metadata?.custom_fields?.find(f => f.variable_name === 'course')?.value,
      paid_at : data.paid_at,
      channel : data.channel
    });

  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('[PAYMENT VERIFY ERROR]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ------------------------------------------------------------
//  PAYSTACK WEBHOOK
//  POST /webhook/paystack
//  Paystack calls this automatically after every transaction
//  Set this URL in your Paystack dashboard → Settings → Webhooks
// ------------------------------------------------------------
app.post('/webhook/paystack', (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  // Always respond 200 immediately to acknowledge receipt
  res.sendStatus(200);

  // Validate the signature
  if (!verifyWebhookSignature(req.rawBody, signature)) {
    console.warn('[WEBHOOK] Invalid signature — request ignored.');
    return;
  }

  const event = req.body;
  console.log(`[WEBHOOK] Event received: ${event.event}`);

  switch (event.event) {

    case 'charge.success': {
      const data = event.data;
      console.log(`[WEBHOOK] ✅ Payment SUCCESS`);
      console.log(`  Reference : ${data.reference}`);
      console.log(`  Email     : ${data.customer.email}`);
      console.log(`  Amount    : KES ${data.amount / 100}`);
      console.log(`  Channel   : ${data.channel}`);
      console.log(`  Course    : ${data.metadata?.custom_fields?.find(f => f.variable_name === 'course')?.value}`);

      // TODO: Save to your database here
      // TODO: Send enrollment confirmation email
      // TODO: Provision course access
      break;
    }

    case 'charge.failed': {
      const data = event.data;
      console.log(`[WEBHOOK] ❌ Payment FAILED`);
      console.log(`  Reference : ${data.reference}`);
      console.log(`  Email     : ${data.customer.email}`);
      break;
    }

    case 'refund.processed': {
      console.log(`[WEBHOOK] 💸 Refund processed for ref: ${event.data.transaction_reference}`);
      break;
    }

    default:
      console.log(`[WEBHOOK] Unhandled event: ${event.event}`);
  }
});

// ------------------------------------------------------------
//  LIST TRANSACTIONS (for admin/dashboard use)
//  GET /api/transactions?page=1&perPage=10
// ------------------------------------------------------------
app.get('/api/transactions', async (req, res) => {
  const { page = 1, perPage = 10, status } = req.query;

  try {
    const params = { page, perPage };
    if (status) params.status = status; // filter: success | failed | abandoned

    const response = await paystack.get('/transaction', { params });

    res.json({
      success : true,
      meta    : response.data.meta,
      data    : response.data.data.map(t => ({
        reference : t.reference,
        amount    : t.amount / 100,
        currency  : t.currency,
        status    : t.status,
        email     : t.customer?.email,
        channel   : t.channel,
        paid_at   : t.paid_at,
        course    : t.metadata?.custom_fields?.find(f => f.variable_name === 'course')?.value
      }))
    });

  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error('[TRANSACTIONS ERROR]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log(`  ║   ${process.env.APP_NAME || 'Barizi Pharma'} Server           ║`);
  console.log(`  ║   Running on http://localhost:${PORT}    ║`);
  console.log(`  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Endpoints:');
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/config`);
  console.log(`  POST /api/payment/initialize`);
  console.log(`  GET  /api/payment/verify/:reference`);
  console.log(`  POST /webhook/paystack`);
  console.log(`  GET  /api/transactions`);
  console.log('');
});
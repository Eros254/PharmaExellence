// ============================================================
//  PHARMA EXCELLENCE ACADEMY — server.js
//  Node.js + Express backend with Paystack integration
//  Run: node server.js
// ============================================================

const express   = require('express');
const cors      = require('cors');
const Paystack  = require('paystack');
const crypto    = require('crypto');
const path      = require('path');
require('dotenv').config();

const app       = express();
const PORT      = process.env.PORT || 3000;
const paystack  = Paystack(process.env.PAYSTACK_SECRET_KEY);

// ============================================================
//  MIDDLEWARE
// ============================================================

// Raw body capture for webhook HMAC verification
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook/paystack') {
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
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve frontend static files (academy.html, academy.css, academy.js)
app.use(express.static(path.join(__dirname, '..', 'academy.html')));

// ============================================================
//  HELPERS
// ============================================================

function generateRef(prefix = 'PHARMA') {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${Date.now()}_${random}`;
}

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
    app    : process.env.APP_NAME || 'Pharma Excellence Academy Server',
    env    : process.env.NODE_ENV || 'development',
    time   : new Date().toISOString()
  });
});

// --- Return public key safely to the frontend ---
app.get('/api/config', (req, res) => {
  res.json({
    publicKey : process.env.PAYSTACK_PUBLIC_KEY,
    currency  : 'KES'
  });
});

// ------------------------------------------------------------
//  INITIALIZE PAYMENT
//  POST /api/payment/initialize
//  Body: { email, amount, name, course, type, org }
//  type: "course" | "consulting"
// ------------------------------------------------------------
app.post('/api/payment/initialize', async (req, res) => {
  const { email, amount, name, course, type = 'course', org = '' } = req.body;

  if (!email || !amount || !name) {
    return res.status(400).json({
      success : false,
      message : 'email, amount, and name are required.'
    });
  }

  const amountInKobo = Math.round(Number(amount) * 100);

  if (isNaN(amountInKobo) || amountInKobo <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount.' });
  }

  const reference   = generateRef(type === 'consulting' ? 'CONSULT' : 'COURSE');
  const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success.html`;

  try {
    const response = await paystack.transaction.initialize({
      email,
      amount       : amountInKobo,
      currency     : 'KES',
      reference,
      callback_url : callbackUrl,
      channels     : ['card', 'bank', 'mobile_money', 'ussd'],
      metadata     : {
        custom_fields: [
          { display_name: 'Full Name',       variable_name: 'name',   value: name },
          { display_name: 'Service Type',    variable_name: 'type',   value: type },
          { display_name: 'Program/Service', variable_name: 'course', value: course || 'General' },
          { display_name: 'Organization',    variable_name: 'org',    value: org }
        ]
      }
    });

    const { authorization_url, access_code, reference: ref } = response.data;

    console.log(`[INIT] ref=${ref} | ${email} | KES ${amount} | ${course}`);

    res.json({ success: true, reference: ref, authorization_url, access_code });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[INIT ERROR]', msg);
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
    const response = await paystack.transaction.verify(reference);
    const data     = response.data;
    const ok       = data.status === 'success';

    console.log(`[VERIFY] ref=${reference} | status=${data.status} | KES ${data.amount / 100}`);

    const getField = name =>
      data.metadata?.custom_fields?.find(f => f.variable_name === name)?.value;

    res.json({
      success   : ok,
      status    : data.status,
      reference,
      amount    : data.amount / 100,
      currency  : data.currency,
      email     : data.customer?.email,
      name      : getField('name'),
      course    : getField('course'),
      org       : getField('org'),
      paid_at   : data.paid_at,
      channel   : data.channel
    });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[VERIFY ERROR]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ------------------------------------------------------------
//  WEBHOOK
//  POST /webhook/paystack
//  Set this URL in: Paystack Dashboard → Settings → Webhooks
// ------------------------------------------------------------
app.post('/webhook/paystack', (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  res.sendStatus(200); // always acknowledge immediately

  if (!verifyWebhookSignature(req.rawBody, signature)) {
    console.warn('[WEBHOOK] ⚠️  Invalid signature — ignored.');
    return;
  }

  const { event, data } = req.body;
  console.log(`[WEBHOOK] Event: ${event}`);

  switch (event) {
    case 'charge.success':
      console.log('✅ Payment SUCCESS');
      console.log(`   Ref     : ${data.reference}`);
      console.log(`   Email   : ${data.customer.email}`);
      console.log(`   Amount  : KES ${data.amount / 100}`);
      console.log(`   Channel : ${data.channel}`);
      console.log(`   Program : ${data.metadata?.custom_fields?.find(f => f.variable_name === 'course')?.value}`);
      // TODO: Save to database
      // TODO: Send enrollment confirmation email
      // TODO: Provision course/program access
      break;

    case 'charge.failed':
      console.log('❌ Payment FAILED');
      console.log(`   Ref   : ${data.reference}`);
      console.log(`   Email : ${data.customer.email}`);
      break;

    case 'refund.processed':
      console.log(`💸 Refund processed — ref: ${data.transaction_reference}`);
      break;

    default:
      console.log(`[WEBHOOK] Unhandled event: ${event}`);
  }
});

// ------------------------------------------------------------
//  LIST TRANSACTIONS
//  GET /api/transactions?page=1&perPage=10&status=success
// ------------------------------------------------------------
app.get('/api/transactions', async (req, res) => {
  const { page = 1, perPage = 10, status } = req.query;

  try {
    const params = { page, perPage };
    if (status) params.status = status; // success | failed | abandoned

    const response = await paystack.transaction.list(params);

    res.json({
      success : true,
      meta    : response.meta,
      data    : response.data.map(t => ({
        reference : t.reference,
        amount    : t.amount / 100,
        currency  : t.currency,
        status    : t.status,
        email     : t.customer?.email,
        channel   : t.channel,
        paid_at   : t.paid_at,
        program   : t.metadata?.custom_fields?.find(f => f.variable_name === 'course')?.value
      }))
    });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[TRANSACTIONS ERROR]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log(`  ║   Pharma Excellence Academy Server       ║`);
  console.log(`  ║   http://localhost:${PORT}                   ║`);
  console.log(`  ║   Mode: ${(process.env.NODE_ENV || 'development').padEnd(32)}║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  GET  /api/health');
  console.log('  GET  /api/config');
  console.log('  POST /api/payment/initialize');
  console.log('  GET  /api/payment/verify/:reference');
  console.log('  POST /webhook/paystack');
  console.log('  GET  /api/transactions');
  console.log('');
});

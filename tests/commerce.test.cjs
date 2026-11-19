const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { Writable } = require('node:stream');

const cents = { payroll: 19700, handbook: 24700, california: 29700, bundle: 49700 };
const edition = 'test-edition';
let sessions, prices, archives, reads, originalEnv;

// A valid empty ZIP with the SKU in its comment. Each mock purchase has distinct bytes.
function archiveFor(sku) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(sku.length, 20);
  return Buffer.concat([end, Buffer.from(sku)]);
}

const storage = {
  async head(path) {
    const bytes = archives.get(path);
    if (!bytes) throw Error('Missing test archive');
    return { pathname: path, url: 'https://test.private.blob.vercel-storage.com/' + path,
      contentType: 'application/zip', size: bytes.length };
  },
  async get(path, options) {
    assert.equal(options.access, 'private');
    reads.push(path);
    const bytes = archives.get(path);
    if (!bytes) return null;
    return { statusCode: 200, blob: { pathname: path, size: bytes.length }, stream: new Response(bytes).body };
  }
};

// Substitute storage only while importing the production handlers.
const load = Module._load;
const importer = mock.method(Module, '_load', function (id, ...args) {
  return id === '@vercel/blob' ? storage : load.call(this, id, ...args);
});
const checkout = require('../api/checkout');
const download = require('../api/kit-download');
importer.mock.restore();

async function stripe(url, { method, body }) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://api.stripe.com');
  const id = parsed.pathname.split('/').pop();
  if (parsed.pathname.startsWith('/v1/prices/')) return Response.json(prices.get(id));
  if (method === 'GET') {
    assert.equal(parsed.searchParams.get('expand[]'), 'line_items');
    return sessions.has(id) ? Response.json(sessions.get(id)) : new Response(null, { status: 404 });
  }
  assert.equal(parsed.pathname, '/v1/checkout/sessions');
  assert.equal(body.get('line_items[0][quantity]'), '1');
  const price = prices.get(body.get('line_items[0][price]'));
  const kit = body.get('metadata[kit]');
  const sessionId = 'cs_test_' + kit;
  assert.equal(body.get('success_url'), 'https://fieldwork-test.vercel.app/checkout/complete?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(body.get('cancel_url'), 'https://fieldwork-test.vercel.app/checkout/preview?kit=' + kit);
  const session = { id: sessionId, object: 'checkout.session', livemode: false, mode: body.get('mode'),
    status: 'open', payment_status: 'unpaid', currency: price.currency, amount_total: price.unit_amount,
    metadata: { kit, project: body.get('metadata[project]'), edition: body.get('metadata[edition]') },
    line_items: { has_more: false, data: [{ price, quantity: 1, amount_total: price.unit_amount, currency: price.currency }] },
    url: 'https://checkout.stripe.com/c/pay/' + sessionId };
  sessions.set(sessionId, session);
  return Response.json(session);
}

beforeEach(() => {
  originalEnv = process.env;
  process.env = { ...originalEnv, VERCEL_ENV: 'preview', VERCEL_URL: 'fieldwork-test.vercel.app',
    HR_FIELDWORK_EDITION: edition, STRIPE_SECRET_KEY: 'sk_test_fixture', BLOB_READ_WRITE_TOKEN: 'fixture' };
  sessions = new Map();
  prices = new Map();
  archives = new Map();
  reads = [];
  for (const [sku, amount] of Object.entries(cents)) {
    const id = 'price_' + sku;
    process.env['STRIPE_PRICE_' + sku.toUpperCase()] = id;
    prices.set(id, { id, active: true, livemode: false, type: 'one_time', currency: 'usd', unit_amount: amount });
    archives.set('commerce-preview/' + edition + '/' + sku + '.zip', archiveFor(sku));
  }
  mock.method(globalThis, 'fetch', stripe);
});
afterEach(() => { process.env = originalEnv; mock.restoreAll(); });

async function submit(handler, body, method = 'POST') {
  const chunks = [];
  const res = new Writable({ write(chunk, _, done) { chunks.push(Buffer.from(chunk)); done(); } });
  const headers = {};
  res.setHeader = (name, value) => { headers[name.toLowerCase()] = value; };
  await handler({ method, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }, res);
  return { status: res.statusCode, headers, bytes: Buffer.concat(chunks) };
}

for (const sku of Object.keys(cents)) {
  test(sku + ' unlocks its own edition and ZIP after a confirmed payment', async () => {
    const created = await submit(checkout, 'sku=' + sku);
    assert.equal(created.status, 303);
    const id = new URL(created.headers.location).pathname.split('/').pop();
    const session = sessions.get(id);
    assert.equal(session.amount_total, cents[sku]);
    assert.deepEqual(session.metadata, { project: 'hr-fieldwork', kit: sku, edition });
    Object.assign(session, { status: 'complete', payment_status: 'paid' });
    // Changing the current release must preserve existing receipts.
    process.env.HR_FIELDWORK_EDITION = 'next-edition';
    const file = await submit(download, 'session_id=' + id);
    assert.equal(file.status, 200);
    assert.equal(file.headers['content-type'], 'application/zip');
    assert.equal(file.headers['cache-control'], 'no-store');
    assert.deepEqual(file.bytes, archiveFor(sku));
    assert.deepEqual(reads, ['commerce-preview/' + edition + '/' + sku + '.zip']);
  });
}

test('missing, unpaid and mismatched receipts cannot read any archive', async () => {
  const missing = await submit(download, 'session_id=cs_test_missing');
  assert.equal(missing.status, 403);
  await submit(checkout, 'sku=payroll');
  const session = sessions.get('cs_test_payroll');
  const request = 'session_id=' + session.id;
  assert.equal((await submit(download, request)).status, 403);
  Object.assign(session, { status: 'complete', payment_status: 'paid' });
  session.metadata.kit = 'bundle';
  assert.equal((await submit(download, request)).status, 403);
  assert.deepEqual(reads, []);
});

test('missing archives and incorrect catalog prices stop checkout', async () => {
  archives.delete('commerce-preview/' + edition + '/payroll.zip');
  assert.equal((await submit(checkout, 'sku=payroll')).status, 503);
  prices.get('price_handbook').unit_amount = 1;
  assert.equal((await submit(checkout, 'sku=handbook')).status, 503);
  assert.equal(sessions.size, 0);
});

test('provider errors never become successful downloads', async () => {
  await submit(checkout, 'sku=california');
  const session = sessions.get('cs_test_california');
  Object.assign(session, { status: 'complete', payment_status: 'paid' });
  archives.clear();
  assert.equal((await submit(download, 'session_id=' + session.id)).status, 503);
});

test('production targets and live credentials cannot create or fulfill test sessions', async () => {
  process.env.HR_FIELDWORK_LOCAL_CHECKOUT = 'true';
  for (const [target, key] of [['production', 'sk_test_fixture'], ['preview', 'sk_live_fixture']]) {
    Object.assign(process.env, { VERCEL_ENV: target, STRIPE_SECRET_KEY: key });
    const status = await submit(checkout, '', 'GET');
    assert.deepEqual(JSON.parse(status.bytes), { available: false, kits: [] });
    assert.equal((await submit(checkout, 'sku=bundle')).status, 503);
    assert.equal((await submit(download, 'session_id=cs_test_bundle')).status, 503);
  }
  assert.equal(globalThis.fetch.mock.callCount(), 0);
  assert.deepEqual(reads, []);
});

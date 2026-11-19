const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { get } = require('@vercel/blob');
const {
  getConfig, getKit, getPriceId, getArchivePath, stripeRequest, noStore, sendError
} = require('../lib/commerce');

function formSessionId(body) {
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (body.length > 1024) return null;
    const ids = new URLSearchParams(body).getAll('session_id');
    return ids.length === 1 ? ids[0] : null;
  }
  return body?.session_id;
}

function purchasedKit(session, id) {
  const kit = getKit(session?.metadata?.kit);
  if (!kit || session.id !== id || session.object !== 'checkout.session' ||
      session.metadata.project !== 'hr-fieldwork' || session.livemode !== false ||
      session.mode !== 'payment' || session.status !== 'complete' ||
      session.payment_status !== 'paid' || session.currency !== 'usd' ||
      session.amount_total !== kit.cents) return null;

  const lines = session.line_items;
  if (lines?.has_more !== false || !Array.isArray(lines.data) || lines.data.length !== 1) return null;
  const line = lines.data[0];
  const price = line?.price;
  if (line?.quantity !== 1 || line.amount_total !== kit.cents || line.currency !== 'usd' ||
      price?.id !== getPriceId(kit) || price.livemode !== false || price.currency !== 'usd' ||
      price.type !== 'one_time' || price.unit_amount !== kit.cents) return null;
  return kit;
}

module.exports = async function kitDownload(req, res) {
  noStore(res);
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Open the download from your test checkout confirmation.');
  }

  let config;
  try {
    config = getConfig();
  } catch {
    return sendError(res, 503, 'Test downloads are unavailable here.');
  }
  const mediaType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/x-www-form-urlencoded') {
    return sendError(res, 415, 'Use the download button on your test checkout confirmation.');
  }
  if (Number(req.headers['content-length']) > 1024) {
    return sendError(res, 413, 'Use the download button on your test checkout confirmation.');
  }
  const id = formSessionId(req.body);
  if (typeof id !== 'string' || !/^cs_test_[A-Za-z0-9]{1,200}$/.test(id)) {
    return sendError(res, 400, 'Open the confirmation for your completed test order.');
  }

  let session;
  try {
    session = await stripeRequest(config, `/v1/checkout/sessions/${id}?expand%5B%5D=line_items`);
  } catch (err) {
    if (err.status === 404) return sendError(res, 403, 'This test order cannot unlock a kit.');
    return sendError(res, 503, 'We could not verify the test order. Try the download again.');
  }

  let kit;
  let archive;
  try {
    kit = purchasedKit(session, id);
    if (!kit) return sendError(res, 403, 'This test order cannot unlock a kit.');
    const path = getArchivePath(kit, session.metadata.edition);
    archive = await get(path, { access: 'private', useCache: false });
    if (archive?.statusCode !== 200 || !archive.stream || archive.blob.pathname !== path ||
        !Number.isSafeInteger(archive.blob.size) || archive.blob.size < 1) {
      await archive?.stream?.cancel();
      return sendError(res, 503, 'The test ZIP is unavailable. Try the download again.');
    }
  } catch {
    return sendError(res, 503, 'The test ZIP is unavailable. Try the download again.');
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="HR-Fieldwork-${kit.sku}-preview.zip"`);
  res.setHeader('Content-Length', String(archive.blob.size));
  try {
    await pipeline(Readable.fromWeb(archive.stream), res);
  } catch {
    // A partial ZIP is unusable. The same confirmed order can retry the download.
    if (!res.destroyed) res.destroy();
  }
};

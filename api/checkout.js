const { getConfig, getKit, getPriceId, getConfiguredKits, getArchiveInfo, stripeRequest, noStore, sendError } = require('../lib/commerce');

module.exports = async function checkout(req, res) {
  noStore(res);
  if (req.method === 'GET') {
    let kits = [];
    try {
      getConfig();
      kits = getConfiguredKits();
    } catch {
      // Production and unconfigured previews expose no purchase action.
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ available: kits.length > 0, kits }));
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Use the checkout preview form to select a kit.');
  }
  const mediaType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/x-www-form-urlencoded') {
    return sendError(res, 415, 'Submit your selection using the checkout preview form.');
  }
  if (Number(req.headers['content-length']) > 1024) {
    return sendError(res, 413, 'The checkout form was too large.');
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    return sendError(res, 403, 'Start your checkout from HR Fieldwork.');
  }
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  const sku = typeof body === 'string' ? new URLSearchParams(body).get('sku') : body?.sku;
  const kit = getKit(sku);
  if (!kit) return sendError(res, 400, 'Select an HR Fieldwork kit and try again.');

  try {
    const config = getConfig();
    const priceId = getPriceId(kit);
    const [price] = await Promise.all([
      stripeRequest(config, '/v1/prices/' + priceId),
      getArchiveInfo(kit, config.edition)
    ]);
    if (price.id !== priceId || price.active !== true || price.livemode !== false ||
        price.type !== 'one_time' || price.currency !== 'usd' || price.unit_amount !== kit.cents) {
      return sendError(res, 503, 'The test price for this kit is unavailable. Please try again later.');
    }

    const params = new URLSearchParams({
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[project]': 'hr-fieldwork',
      'metadata[kit]': kit.sku,
      'metadata[edition]': config.edition,
      success_url: config.origin + '/checkout/complete?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: config.origin + '/checkout/preview?kit=' + kit.sku
    });
    const session = await stripeRequest(config, '/v1/checkout/sessions', params);
    const url = new URL(session.url);
    if (session.livemode !== false || !/^cs_test_[a-zA-Z0-9]+$/.test(session.id) ||
        url.origin !== 'https://checkout.stripe.com' || url.username || url.password ||
        !['/c/pay/' + session.id, '/pay/' + session.id].includes(url.pathname)) {
      throw new Error('Invalid test session');
    }
    res.setHeader('Location', url.href);
    res.statusCode = 303;
    return res.end();
  } catch {
    return sendError(res, 503, 'We could not open test checkout. Please return to the preview and try again later.');
  }
};

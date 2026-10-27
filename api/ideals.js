// 브라우저 ID(uid)별 이상형 리스트 저장 — Upstash Redis REST 사용
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const UID = /^[0-9a-f-]{36}$/i;
const MAX_ITEMS = 200;
const MAX_LEN = 60;

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'storage not configured' });
  const uid = req.method === 'GET' ? req.query.uid : (req.body || {}).uid;
  if (typeof uid !== 'string' || !UID.test(uid)) return res.status(400).json({ error: 'bad uid' });
  const key = 'ideals:' + uid;
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', key]);
      return res.status(200).json({ items: v ? JSON.parse(v) : null });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const items = (req.body || {}).items;
      if (!Array.isArray(items) || items.length > MAX_ITEMS) return res.status(400).json({ error: 'bad items' });
      const clean = items.filter(t => typeof t === 'string').map(t => t.trim().slice(0, MAX_LEN)).filter(Boolean);
      await redis(['SET', key, JSON.stringify(clean)]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end();
  } catch (e) {
    return res.status(502).json({ error: 'storage error' });
  }
};

/* ---------- 비슷한 문장 감지 (브라우저 안에서 도는 무료 모델) ---------- */
const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0';
const SIM = 0.85;

let modelP = null, modelReady = false, modelFailed = false, loadPct = 0;
const pctListeners = new Set();
const vecCache = new Map();

const norm = s => s.replace(/[\s.,!?~·'"‘’“”()]/g, '').toLowerCase();

function loadModel() {
  if (modelP) return modelP;
  modelP = (async () => {
    const { pipeline } = await import(LIB);
    const files = {};
    const ex = await pipeline('feature-extraction', MODEL, {
      dtype: 'q8',
      progress_callback: p => {
        if (p.status !== 'progress' || !p.total) return;
        files[p.file] = { l: p.loaded, t: p.total };
        let l = 0, t = 0;
        for (const k in files) { l += files[k].l; t += files[k].t; }
        loadPct = Math.min(99, Math.floor(l / t * 100));
        pctListeners.forEach(f => f(loadPct));
      }
    });
    modelReady = true;
    loadPct = 100;
    pctListeners.forEach(f => f(loadPct));
    return ex;
  })().catch(() => { modelFailed = true; return null; });
  return modelP;
}

async function whenReady() {
  if (modelReady || modelFailed) return;
  const pop = showPopup({ title: '로딩 중...', bar: true });
  const on = p => { pop.setTitle('로딩 중... ' + p + '%'); pop.setProgress(p); };
  pctListeners.add(on);
  on(loadPct);
  await loadModel();
  pctListeners.delete(on);
  closePopup();
}

async function embed(texts) {
  const ex = await loadModel();
  const need = texts.filter(t => !vecCache.has(t));
  if (need.length) {
    const e = await ex(need, { pooling: 'mean', normalize: true });
    const D = e.dims[1];
    need.forEach((t, i) => vecCache.set(t, e.data.slice(i * D, (i + 1) * D)));
  }
  return texts.map(t => vecCache.get(t));
}

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

// items 각각이 pool 안의 문장과 같거나 비슷하면 { text, exact }, 아니면 null
async function findSimilar(items, pool) {
  const out = items.map(t => {
    const n = norm(t);
    const hit = pool.find(p => norm(p) === n);
    return hit ? { text: hit, exact: true } : null;
  });
  const todo = items.map((t, i) => i).filter(i => !out[i]);
  if (!todo.length || !pool.length) return out;
  await whenReady();
  if (modelFailed) return out;
  const vecs = await embed([...todo.map(i => items[i]), ...pool]);
  todo.forEach((i, k) => {
    let best = -1, bi = -1;
    pool.forEach((p, j) => {
      const s = dot(vecs[k], vecs[todo.length + j]);
      if (s > best) { best = s; bi = j; }
    });
    if (best >= SIM) out[i] = { text: pool[bi], exact: false };
  });
  return out;
}

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 676;
const POLYS = [
  [[0,0],[198,0],[272,181],[181,272],[0,197]],
  [[198,0],[478,0],[404,181],[272,181]],
  [[478,0],[676,0],[676,197],[495,272],[404,181]],
  [[0,197],[181,272],[181,404],[0,479]],
  [[272,181],[404,181],[495,272],[495,404],[404,495],[272,495],[181,404],[181,272]],
  [[676,197],[676,479],[495,404],[495,272]],
  [[0,479],[181,404],[272,495],[198,676],[0,676]],
  [[272,495],[404,495],[478,676],[198,676]],
  [[495,404],[676,479],[676,676],[478,676],[404,495]]
];

const svg = document.getElementById('board');
const fileInput = document.getElementById('file');
const statusEl = document.getElementById('status');
const urls = Array(9).fill(null);
const st = Array(9).fill(null);
let sel = 0;
let drag = null;
let wasSel = false;

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

const toPoints = pts => pts.map(p => p.join(',')).join(' ');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const cells = POLYS.map(pts => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  let a = 0, cx = 0, cy = 0;
  for (let k = 0; k < pts.length; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length];
    const c = x0 * y1 - x1 * y0;
    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  a /= 2; cx /= 6 * a; cy /= 6 * a;
  return { pts, x, y, w, h, cx, cy };
});

const defs = el('defs', {}, svg);
const parts = [];

cells.forEach((c, i) => {
  const cp = el('clipPath', { id: 'clip' + i }, defs);
  el('polygon', { points: toPoints(c.pts) }, cp);

  const g = el('g', { class: 'cell' }, svg);
  el('polygon', { class: 'bg', points: toPoints(c.pts) }, g);

  const img = el('image', {
    x: c.x, y: c.y, width: c.w, height: c.h,
    preserveAspectRatio: 'none',
    'clip-path': 'url(#clip' + i + ')'
  }, g);
  img.style.display = 'none';

  const badge = el('g', { transform: 'translate(' + c.cx + ',' + c.cy + ')' }, g);
  el('circle', { r: 16, fill: '#fff', stroke: '#111', 'stroke-width': 1 }, badge);
  const t = el('text', {
    'text-anchor': 'middle', dy: '0.35em', 'font-size': 17,
    'font-weight': 700, fill: '#111', 'font-family': 'Noto Sans KR, sans-serif'
  }, badge);
  t.textContent = i + 1;
  if (i === 4) {
    const lb = el('text', {
      'text-anchor': 'middle', y: 60, 'font-size': 20,
      'font-weight': 700, fill: '#999', 'font-family': 'Noto Sans KR, sans-serif'
    }, badge);
    lb.textContent = '최애';
  }
  g.dataset.i = i;

  g.addEventListener('pointerdown', e => {
    wasSel = sel === i;
    select(i);
    if (!urls[i] || !st[i]) return;
    g.setPointerCapture(e.pointerId);
    drag = { i, x: e.clientX, y: e.clientY, ox: st[i].ox, oy: st[i].oy, k: svg.getScreenCTM().a, moved: false, lifting: false, target: i };
    drag.timer = setTimeout(() => {
      if (!drag || drag.moved) return;
      drag.lifting = true;
      g.style.opacity = '.5';
      g.style.cursor = 'grabbing';
    }, 450);
  });
  g.addEventListener('pointermove', e => {
    if (!drag || drag.i !== i) return;
    if (drag.lifting) {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const tg = t && t.closest ? t.closest('.cell') : null;
      if (tg) {
        drag.target = +tg.dataset.i;
        select(drag.target);
      }
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      clearTimeout(drag.timer);
    }
    if (!drag.moved) return;
    st[i].ox = drag.ox + dx / drag.k;
    st[i].oy = drag.oy + dy / drag.k;
    apply(i);
  });
  const endDrag = e => {
    if (drag && drag.i === i) {
      clearTimeout(drag.timer);
      if (drag.lifting && e.type === 'pointerup' && drag.target !== i) swapCells(i, drag.target);
      else if (drag.lifting) select(i);
    }
    drag = null;
    g.style.opacity = '';
    g.style.cursor = urls[i] ? 'grab' : 'pointer';
  };
  g.addEventListener('pointerup', endDrag);
  g.addEventListener('pointercancel', endDrag);
  g.addEventListener('click', () => {
    if (!urls[i] && wasSel) fileInput.click();
  });
  g.addEventListener('dragover', e => e.preventDefault());
  g.addEventListener('drop', e => {
    e.preventDefault();
    select(i);
    addFiles([...e.dataTransfer.files], i);
  });
  g.addEventListener('wheel', e => {
    if (!urls[i] || !st[i]) return;
    e.preventDefault();
    select(i);
    st[i].zoom = clamp(st[i].zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4);
    apply(i);
  }, { passive: false });

  parts.push({ g, img, badge });
  g.style.cursor = 'pointer';
});

cells.forEach(c => {
  el('polygon', {
    points: toPoints(c.pts), fill: 'none', stroke: '#111', 'stroke-width': 1,
    'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none'
  }, svg);
});

el('rect', {
  x: 0, y: 0, width: SIZE, height: SIZE, fill: 'none', stroke: '#111',
  'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none'
}, svg);

const selPoly = el('polygon', {
  fill: 'none', stroke: '#111', 'stroke-width': 3, 'stroke-linejoin': 'round',
  'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none'
}, svg);

function updateStatus() {
  const n = urls.filter(Boolean).length;
  statusEl.textContent = (sel + 1) + '번 칸 선택됨 · ' + n + ' / 9 채움';
}

function select(i) {
  sel = i;
  selPoly.setAttribute('points', toPoints(cells[i].pts));
  updateStatus();
}

function apply(i) {
  const c = cells[i], s = st[i], img = parts[i].img;
  const base = Math.max(c.w / s.nw, c.h / s.nh) * s.zoom;
  const w = s.nw * base, h = s.nh * base;
  const mx = (w - c.w) / 2, my = (h - c.h) / 2;
  s.ox = clamp(s.ox, -mx, mx);
  s.oy = clamp(s.oy, -my, my);
  img.setAttribute('x', c.x + c.w / 2 + s.ox - w / 2);
  img.setAttribute('y', c.y + c.h / 2 + s.oy - h / 2);
  img.setAttribute('width', w);
  img.setAttribute('height', h);
}

function render(i) {
  const p = parts[i];
  const has = !!(urls[i] && st[i]);
  if (has) {
    p.img.setAttribute('href', urls[i]);
    p.img.style.display = '';
    apply(i);
  } else {
    p.img.style.display = 'none';
  }
  p.badge.style.display = urls[i] ? 'none' : '';
  p.g.style.cursor = urls[i] ? 'grab' : 'pointer';
}

function swapCells(a, b) {
  [urls[a], urls[b]] = [urls[b], urls[a]];
  [st[a], st[b]] = [st[b], st[a]];
  render(a);
  render(b);
  select(b);
}

function removeImage(i) {
  if (!urls[i]) return;
  URL.revokeObjectURL(urls[i]);
  urls[i] = null;
  st[i] = null;
  render(i);
  select(i);
}

function setImage(i, url) {
  if (urls[i]) URL.revokeObjectURL(urls[i]);
  urls[i] = url;
  st[i] = null;
  render(i);
  const im = new Image();
  im.onload = () => {
    if (urls[i] !== url) return;
    st[i] = { nw: im.naturalWidth, nh: im.naturalHeight, zoom: 1, ox: 0, oy: 0 };
    render(i);
  };
  im.src = url;
  updateStatus();
}

function nextEmpty(from) {
  for (let k = 1; k <= 9; k++) {
    const j = (from + k) % 9;
    if (!urls[j]) return j;
  }
  return -1;
}

function addFiles(files, start) {
  const imgs = files.filter(f => f && f.type.startsWith('image/'));
  if (!imgs.length) return;
  let cur = start;
  imgs.forEach((f, k) => {
    if (k > 0) {
      const n = nextEmpty(cur);
      if (n < 0) return;
      cur = n;
    }
    setImage(cur, URL.createObjectURL(f));
  });
  const n = nextEmpty(cur);
  select(n >= 0 ? n : cur);
}

fileInput.addEventListener('change', () => {
  addFiles([...fileInput.files], sel);
  fileInput.value = '';
});

document.addEventListener('paste', e => {
  if (!document.getElementById('pane-make').classList.contains('active')) return;
  const items = [...(e.clipboardData ? e.clipboardData.items : [])];
  const files = items.filter(it => it.type.startsWith('image/')).map(it => it.getAsFile());
  if (!files.length) return;
  e.preventDefault();
  addFiles(files, sel);
});

window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

document.addEventListener('keydown', e => {
  if (!document.getElementById('pane-make').classList.contains('active')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    removeImage(sel);
  }
});

document.getElementById('save').addEventListener('click', async () => {
  const R = 2, cv = document.createElement('canvas');
  cv.width = cv.height = SIZE * R;
  const ctx = cv.getContext('2d');
  ctx.scale(R, R);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const path = pts => {
    ctx.beginPath();
    pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
  };
  const loaded = await Promise.all(urls.map(u => u ? new Promise(r => { const e = new Image(); e.onload = () => r(e); e.onerror = () => r(null); e.src = u; }) : null));
  cells.forEach((c, i) => {
    if (!loaded[i] || !st[i]) return;
    const im = parts[i].img;
    ctx.save();
    path(c.pts);
    ctx.clip();
    ctx.drawImage(loaded[i],
      +im.getAttribute('x'), +im.getAttribute('y'), +im.getAttribute('width'), +im.getAttribute('height'));
    ctx.restore();
  });
  ctx.strokeStyle = '#111';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1;
  cells.forEach(c => { path(c.pts); ctx.stroke(); });
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, SIZE - 1.5, SIZE - 1.5);
  cv.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = '이상형-구절판.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
});

document.getElementById('pick').addEventListener('click', () => fileInput.click());

select(0);

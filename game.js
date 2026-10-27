/* ---------- 밸런스게임 ---------- */
const stageEl = document.getElementById('stage');
const countEl = document.getElementById('qCount');
let G = null;

function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function shuffled(arr) {
  return arr.map(q => [Math.random(), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

function gameReset() {
  G = null;
  stageEl.innerHTML = '';
}

function gameStart() {
  const n = Math.min(+countEl.value, QS.length);
  G = { qs: shuffled(QS).slice(0, n), ans: [], k: 0, busy: false };
  stageEl.innerHTML = '';
  const prog = h('div', 'gprog');
  const view = h('div', 'gview');
  const nav = h('div', 'gnav');
  const prev = h('button', '', '\u2190');
  const next = h('button', '', '\u2192');
  prev.onclick = () => G.k > 0 && !G.busy && go(G.k - 1, 'prev');
  next.onclick = () => G.k < G.qs.length && G.ans[G.k] != null && !G.busy && go(G.k + 1, 'next');
  nav.append(prev, next);
  stageEl.append(prog, view, nav);
  Object.assign(G, { prog, view, prev, next, cur: null });
  go(0, 'none');
}

function go(k, dir) {
  G.k = k;
  const n = G.qs.length;
  const slide = h('div', 'slide');
  if (k < n) {
    const q = G.qs[k];
    const pair = h('div', 'pair');
    const boxes = [0, 1].map(side => {
      const b = h('button', 'gbox' + (G.ans[k] === side ? ' chosen' : ''), q[side]);
      b.onclick = () => choose(k, side, boxes);
      return b;
    });
    pair.append(boxes[0], h('span', 'gvs', 'VS'), boxes[1]);
    slide.appendChild(pair);
    G.prog.textContent = (k + 1) + ' / ' + n;
  } else {
    slide.append(h('p', 'gend', '끝! ' + n + '문항 중 ' + G.ans.filter(a => a != null).length + '개를 골랐어요'));
    const acts = h('div', 'gacts');
    const again = h('button', '', '다시 하기');
    again.onclick = gameReset;
    const send = h('button', '', '이상형리스트로 넘기기');
    send.onclick = sendToList;
    acts.append(again, h('i', '', '|'), send);
    slide.appendChild(acts);
    G.prog.textContent = '완료';
  }
  const old = G.cur;
  if (old) {
    old.className = 'slide ' + (dir === 'prev' ? 'outR' : 'outL');
    setTimeout(() => old.remove(), 300);
  }
  if (dir !== 'none') slide.classList.add(dir === 'prev' ? 'inL' : 'inR');
  G.view.appendChild(slide);
  G.cur = slide;
  G.prev.disabled = k === 0;
  G.next.disabled = k >= n || G.ans[k] == null;
}

function choose(k, side, boxes) {
  if (G.busy) return;
  G.busy = true;
  G.ans[k] = side;
  boxes.forEach((b, i) => b.classList.toggle('chosen', i === side));
  G.next.disabled = false;
  setTimeout(() => { G.busy = false; go(k + 1, 'next'); }, 280);
}

function sendToList() {
  const picks = G.qs.map((q, i) => G.ans[i] != null ? q[G.ans[i]] : null).filter(Boolean);
  document.querySelector('.tab[data-pane="pane-list"]').click();
  addIdealsStaggered(picks);
  gameReset();
}

document.getElementById('gStart').addEventListener('click', gameStart);

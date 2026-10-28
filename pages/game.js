/* ---------- 밸런스게임 ---------- */
const stageEl = document.getElementById('stage');
const countEl = document.getElementById('qCount');
let G = null;

// 문항 수 선택지: 10 단위로 최대 130문항까지 (gamelist가 더 적으면 그 수까지)
const MAX_Q = 130;
countEl.innerHTML = '';
for (let n = 10; n <= Math.min(MAX_Q, QS.length); n += 10) countEl.add(new Option(n, n));

function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function shuffled(arr) {
  return arr.map(q => [Math.random(), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

// 같은 주제가 연달아 나오지 않도록 주제별로 분류
const TOPICS = [
  ['ex', /전 ?애인|전여친|이별|환승|잠수/],
  ['cheat', /바람|양다리/],
  ['friend', /친구|여사친|남사친|이성친구/],
  ['contact', /연락|안부|문자|카톡/],
  ['money', /돈|부자|빚|억|재벌|자린고비/],
  ['look', /외모|얼굴|눈|코|키|옷|패션|머리|탈모|여드름|타투|피어싱|스타일|상$|향수|노출|근육/],
  ['date', /데이트|여행|선물|이벤트|코스|드라이브/]
];
const topicOf = q => {
  const s = q.join(' ');
  const t = TOPICS.find(x => x[1].test(s));
  return t ? t[0] : null;
};

function pickQuestions(n) {
  const pool = shuffled(QS);
  const out = [];
  while (out.length < n && pool.length) {
    const recent = out.slice(-2).map(topicOf).filter(Boolean);
    let i = pool.findIndex(q => !recent.includes(topicOf(q)));
    if (i < 0) i = 0;
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function gameReset() {
  G = null;
  stageEl.innerHTML = '';
}

function gameStart() {
  const n = Math.min(+countEl.value, MAX_Q, QS.length);
  G = { qs: pickQuestions(n), ans: [], k: 0, busy: false };
  stageEl.innerHTML = '';
  const prog = h('div', 'gprog');
  const view = h('div', 'gview');
  const nav = h('div', 'gnav');
  const prev = h('button', '', '\u2190');
  const next = h('button', '', '\u2192');
  prev.onclick = () => G.k > 0 && G.k < G.qs.length && !G.busy && go(G.k - 1, 'prev');
  next.onclick = () => G.k < G.qs.length && G.ans[G.k] != null && !G.busy && go(G.k + 1, 'next');
  nav.append(prev, next);
  stageEl.append(prog, view, nav);
  Object.assign(G, { prog, view, prev, next, cur: null });
  go(0, 'none');
}

function go(k, dir) {
  const n = G.qs.length;
  let notice = false;
  if (k >= n) {
    // 아직 고르지 않은 문항이 있으면 그 문항으로 돌아가고, 모두 골라야 종료할 수 있음
    const miss = G.qs.findIndex((q, i) => G.ans[i] == null);
    if (miss >= 0) { k = miss; dir = 'prev'; notice = true; }
  }
  G.k = k;
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
    G.prog.textContent = (k + 1) + ' / ' + n + (notice ? ' · 아직 고르지 않은 문항이에요' : '');
  } else {
    const acts = h('div', 'gacts');
    const again = h('button', '', '다시 하기');
    again.onclick = gameReset;
    const send = h('button', '', '이상형 리스트로 넘기기');
    send.onclick = sendToList;
    acts.append(again, send);
    const done = h('img', 'gdone');
    done.src = 'icon/complete_ccc.png';
    done.alt = '완료';
    slide.classList.add('end');
    slide.append(done, acts);
    G.prog.textContent = '';
    loadModel();
  }
  const old = G.cur;
  if (old) {
    old.className = 'slide ' + (dir === 'prev' ? 'outR' : 'outL');
    setTimeout(() => old.remove(), 300);
  }
  if (dir !== 'none') slide.classList.add(dir === 'prev' ? 'inL' : 'inR');
  G.view.appendChild(slide);
  G.cur = slide;
  G.prev.disabled = k === 0 || k >= n;
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

async function sendToList() {
  if (G.sending) return;
  G.sending = true;
  const picks = G.qs.map((q, i) => G.ans[i] != null ? q[G.ans[i]] : null).filter(Boolean);
  const kept = [], skipped = [], pool = [...ideals];
  for (const t of picks) {
    const [m] = await findSimilar([t], pool);
    if (m) skipped.push(t + ' → ' + m.text);
    else { kept.push(t); pool.push(t); }
  }
  G.sending = false;
  const finish = () => {
    document.querySelector('.tab[data-pane="pane-list"]').click();
    addIdealsStaggered(kept);
    gameReset();
  };
  const note = '화살표 오른쪽이 이미 있는 이상형이에요';
  if (!skipped.length) finish();
  else if (!kept.length) showPopup({ title: '모두 이미 있는 이상형이에요', lines: skipped, note, buttons: [{ label: '확인' }] });
  else showPopup({ title: '비슷한 이상형 ' + skipped.length + '개는 제외했어요', lines: skipped, note, buttons: [{ label: '확인', onClick: finish }] });
}

document.getElementById('gStart').addEventListener('click', gameStart);

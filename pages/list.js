/* ---------- 이상형 리스트 ---------- */
const LKEY = 'idealList';
let ideals = [];
try { ideals = JSON.parse(localStorage.getItem(LKEY)) || []; } catch (e) {}
const listEl = document.getElementById('list');
const listEmpty = document.getElementById('listEmpty');
let editing = -1;
let flashIdx = -1;

let uid = null;
try {
  uid = localStorage.getItem('idealUid');
  if (!uid) { uid = crypto.randomUUID(); localStorage.setItem('idealUid', uid); }
} catch (e) {}

function saveIdeals() {
  try { localStorage.setItem(LKEY, JSON.stringify(ideals)); } catch (e) {}
  if (!uid) return;
  fetch('/api/ideals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, items: ideals })
  }).catch(() => {});
}

// 서버에 저장된 리스트를 불러옴 (서버에 없으면 이 브라우저의 기존 리스트를 올림)
function loadIdeals() {
  if (!uid) return;
  fetch('/api/ideals?uid=' + uid)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      if (Array.isArray(d.items)) {
        ideals = d.items;
        try { localStorage.setItem(LKEY, JSON.stringify(ideals)); } catch (e) {}
        renderList();
      } else if (ideals.length) {
        saveIdeals();
      }
    })
    .catch(() => {});
}

function renderList() {
  listEl.innerHTML = '';
  listEmpty.style.display = ideals.length ? 'none' : '';
  ideals.forEach((t, k) => {
    const li = mk('li', k === flashIdx ? 'irow new' : 'irow');
    li.appendChild(mk('span', 'chk'));
    if (k === editing) {
      const inp = mk('input');
      inp.value = t;
      inp.maxLength = 60;
      let done = false;
      const finish = ok => {
        if (done) return;
        done = true;
        const v = inp.value.trim();
        if (ok && v) { ideals[k] = v; saveIdeals(); }
        editing = -1;
        renderList();
      };
      inp.addEventListener('keydown', e => {
        if (e.isComposing) return;
        if (e.key === 'Enter') finish(true);
        else if (e.key === 'Escape') finish(false);
      });
      inp.addEventListener('blur', () => finish(true));
      li.appendChild(inp);
      listEl.appendChild(li);
      inp.focus();
      return;
    }
    li.appendChild(mk('span', 'txt', t));
    const acts = mk('span', 'acts');
    const ed = mk('button', '', '수정');
    ed.onclick = () => { editing = k; renderList(); };
    const del = mk('button', '', '삭제');
    del.onclick = () => askDelete(k);
    acts.append(ed, mk('span', '', '|'), del);
    li.appendChild(acts);
    listEl.appendChild(li);
  });
}

function askDelete(k) {
  showPopup({
    title: '삭제하시겠습니까?',
    note: '복구가 되지 않습니다.',
    buttons: [
      { label: '취소' },
      { label: '삭제', danger: true, onClick: () => { ideals.splice(k, 1); saveIdeals(); renderList(); } }
    ]
  });
}

function addIdeals(arr) {
  arr.forEach(t => { if (t && !ideals.includes(t)) ideals.push(t); });
  saveIdeals(); renderList();
}
function addIdealsStaggered(arr) {
  const todo = arr.filter((t, i) => t && arr.indexOf(t) === i);
  todo.forEach((t, i) => setTimeout(() => {
    if (ideals.includes(t)) return;
    ideals.push(t);
    saveIdeals();
    flashIdx = ideals.length - 1;
    renderList();
    flashIdx = -1;
    const box = listEl.parentElement;
    box.scrollTop = box.scrollHeight;
  }, 400 + i * 350));
}
const newItem = document.getElementById('newItem');
let adding = false;
async function addNew() {
  const v = newItem.value.trim();
  if (!v || adding) return;
  adding = true;
  try {
    const [m] = await findSimilar([v], ideals);
    if (!m) { addIdeals([v]); newItem.value = ''; return; }
    const buttons = [{ label: '확인' }];
    if (!m.exact) buttons.push({ label: '그래도 등록', onClick: () => { ideals.push(v); saveIdeals(); renderList(); newItem.value = ''; } });
    showPopup({ title: '비슷한 이상형이 이미 있어요', lines: [m.text], buttons });
  } finally {
    adding = false;
  }
}
document.getElementById('addItem').addEventListener('click', addNew);
newItem.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) addNew(); });
renderList();
loadIdeals();

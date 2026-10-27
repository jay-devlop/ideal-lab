/* ---------- 공통 팝업 ---------- */
const popupEl = document.getElementById('popup');

function mk(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function closePopup() { popupEl.hidden = true; }

// o: { title, note, lines[], bar, buttons: [{ label, danger, onClick }] }
function showPopup(o) {
  const d = popupEl.firstElementChild;
  d.innerHTML = '';
  d.className = 'dialog' + (o.buttons ? '' : ' nobtn');
  const title = mk('p', 'dq', o.title);
  d.appendChild(title);
  if (o.lines && o.lines.length) {
    const ul = mk('ul', 'dlines');
    o.lines.forEach(t => ul.appendChild(mk('li', '', t)));
    d.appendChild(ul);
  }
  if (o.note) d.appendChild(mk('p', 'dnote', o.note));
  let fill = null;
  if (o.bar) {
    const bar = mk('div', 'dbar');
    fill = mk('i');
    bar.appendChild(fill);
    d.appendChild(bar);
  }
  if (o.buttons) {
    const bt = mk('div', 'dbtns');
    o.buttons.forEach(b => {
      const btn = mk('button', b.danger ? 'danger' : '', b.label);
      btn.onclick = () => { closePopup(); if (b.onClick) b.onClick(); };
      bt.appendChild(btn);
    });
    d.appendChild(bt);
  }
  popupEl.hidden = false;
  return {
    setTitle: t => { title.textContent = t; },
    setProgress: p => { if (fill) fill.style.width = p + '%'; }
  };
}

popupEl.addEventListener('click', e => {
  if (e.target === popupEl && popupEl.querySelector('.dbtns')) closePopup();
});

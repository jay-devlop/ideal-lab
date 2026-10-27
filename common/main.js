document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  if (t.dataset.pane === 'pane-list') loadModel();
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === t.dataset.pane));
}));

// 오른쪽 아래 이미지: 평소엔 숨겨 두고, 그 위치로 마우스를 움직이면(클릭 없이) 나타남
const cupid = document.querySelector('.cupid');
function overCupid(e) {
  const r = cupid.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}
window.addEventListener('pointermove', e => cupid.classList.toggle('show', overCupid(e)));
document.addEventListener('mouseleave', () => cupid.classList.remove('show'));

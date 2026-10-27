document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === t.dataset.pane));
}));

/* ---------- 로코코 화면 ---------- */
const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4af37';
const rococoEl = document.getElementById('rococo');
function openRococo() { rococoEl.hidden = false; }
function closeRococo() { rococoEl.hidden = true; }

cupid.addEventListener('click', openRococo);
document.getElementById('rococoBack').addEventListener('click', closeRococo);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRococo(); });

// 로코코 화면의 구절판 (금색)
createBoard({
  svg: document.getElementById('board2'),
  fileInput: document.getElementById('file2'),
  statusEl: document.getElementById('status2'),
  pickBtn: document.getElementById('pick2'),
  saveBtn: document.getElementById('save2'),
  ink: GOLD,
  sub: GOLD_LIGHT,
  prefix: 'r-',
  fileName: '이상형-구절판-로코코.png',
  // frame_open.png(frame_wh에서 안쪽 흰색을 투명으로 뺀 1407×1118) 안쪽 구멍을 덮는 직사각형: 왼쪽 위(x, y)와 가로·세로(bw, bh)
  // 칸의 가로 배율(kx)은 이 직사각형의 가로세로 비율에 맞춤
  kx: 1172 / 865,
  badgeIn: .15,
  frame: { src:'vintage/frame_open.png', hole:'vintage/frame_hole.png', w:1407, h:1118, x:116, y:125, bw:1172, bh:865 },
  active: () => !rococoEl.hidden
});

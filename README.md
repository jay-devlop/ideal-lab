# 이상형 / Ideal Type

---

이상형을 구절판(9칸)으로 만들어 보고, 밸런스게임으로 취향을 골라 이상형 리스트에 모아 두는 웹 페이지입니다. 별도 빌드 없이 HTML·CSS·JavaScript만으로 동작합니다.

### 기능

세 개의 탭으로 구성되어 있습니다.

- **구절판 만들기**: 9칸에 사진을 넣어 나만의 구절판을 만들고 PNG로 저장합니다.
  - 번호를 클릭해 선택하고, 한 번 더 클릭하면 사진을 고릅니다. 붙여넣기(⌘+V)와 파일 끌어놓기도 됩니다.
  - 사진은 드래그로 위치, 휠로 크기를 조절합니다. 꾹 누른 뒤 끌면 다른 번호로 이동하고, Delete로 삭제합니다.
- **이상형 리스트**: 이상형을 한 문장씩 등록하고 수정·삭제합니다. 리스트는 브라우저별 ID로 서버에 저장됩니다.
- **밸런스게임**: 문항 수(10 단위, 최대 전체)를 고르고 두 선택지 중 하나를 고릅니다. 이전/다음 화살표로 돌아가 답을 바꿀 수 있고, 모두 고르면 선택한 문장을 이상형 리스트로 넘길 수 있습니다.
  - 같은 주제(전 애인, 바람, 연락 등)가 연달아 나오지 않게 섞습니다.

### 비슷한 문장 감지

이상형 리스트에 직접 등록하거나 밸런스게임에서 넘길 때, 이미 있는 문장과 뜻이 비슷하면 알려 주거나 제외합니다.

- 브라우저 안에서 도는 무료 모델([Transformers.js](https://github.com/huggingface/transformers.js)의 `Xenova/paraphrase-multilingual-MiniLM-L12-v2`)을 사용합니다. 서버나 API 비용이 들지 않습니다.
- 모델(약 100~120MB)은 처음 한 번만 내려받고 브라우저에 저장됩니다. 받는 동안에는 로딩 팝업이 뜹니다.
- 유사도 0.85 이상이면 비슷하다고 판단합니다. 판단이 틀릴 수 있어서 직접 등록할 때는 "그래도 등록"을 누를 수 있습니다.
- 모델을 불러오지 못하면(오프라인 등) 글자가 완전히 같은 문장만 걸러냅니다.

### 데이터 저장 방식

- 브라우저마다 랜덤 ID를 만들어 localStorage에 저장하고, 이 ID로 서버(Upstash Redis)에 이상형 리스트를 저장합니다. 서로 다른 사람의 리스트가 섞이지 않습니다.
- 브라우저 데이터를 지우거나 시크릿 창을 쓰면 ID가 새로 만들어져 이전 리스트가 보이지 않습니다. 다른 기기에서도 보이지 않습니다.
- 서버 저장이 실패해도 localStorage에는 계속 저장되므로 화면은 동작합니다.
- 구절판 사진은 저장되지 않습니다.

---


A web page for building your ideal type as a nine-cell board (a *gujeolpan*), picking preferences in a balance game, and collecting them into a list. It runs on plain HTML, CSS and JavaScript with no build step.

### Features

Three tabs:

- **Make the board (구절판 만들기)**: Put photos into nine cells and save the result as a PNG.
  - Click a number to select it; click again to choose a photo. Pasting (⌘+V) and drag-and-drop files also work.
  - Drag a photo to reposition it and use the mouse wheel to zoom. Press and hold, then drag to move it to another cell. Press Delete to remove it.
- **Ideal type list (이상형 리스트)**: Add ideal types one sentence at a time, then edit or delete them. The list is saved on the server under a per-browser ID.
- **Balance game (밸런스게임)**: Choose the number of questions (in steps of 10, up to all of them) and pick one of two options each time. The arrows let you go back and change an answer. When every question is answered, you can send your picks to the ideal type list.
  - Questions are shuffled so the same topic (ex-partners, cheating, contact, etc.) does not appear back to back.

### Similar sentence detection

When you add a sentence by hand or send picks from the game, sentences that mean nearly the same as an existing one are flagged or skipped.

- It uses a free model that runs in the browser (`Xenova/paraphrase-multilingual-MiniLM-L12-v2` via [Transformers.js](https://github.com/huggingface/transformers.js)). There is no server or API cost.
- The model (about 100–120 MB) is downloaded once and kept in the browser. A loading popup appears while it downloads.
- Two sentences count as similar at a similarity of 0.85 or higher. The model can be wrong, so when adding by hand you can choose "Add anyway".
- If the model cannot be loaded (for example, offline), only sentences that are exactly identical are filtered out.

### How data is stored

- Each browser creates a random ID, keeps it in localStorage, and uses it to save the ideal type list on the server (Upstash Redis). Different people's lists do not mix.
- Clearing browser data or using a private window creates a new ID, so the earlier list will not appear. It also does not appear on other devices.
- If saving to the server fails, the list is still saved in localStorage, so the page keeps working.
- Board photos are not saved.

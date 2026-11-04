  firebase.initializeApp({
    apiKey: "AIzaSyBd0j9J78QI9AFLFS3TPaWwgFdoUMxTsqE",
    authDomain: "pass-it-auth.firebaseapp.com",
    databaseURL: "https://pass-it-auth-default-rtdb.firebaseio.com",
    projectId: "pass-it-auth",
    storageBucket: "pass-it-auth.firebasestorage.app",
    messagingSenderId: "513075711876",
    appId: "1:513075711876:web:3a577b54daca07f17a17d1"
  });
  var fbdb = firebase.database();

// ---- DATA ----
const PIECES = [
  { type:'common',    label:'Обычный', cls:'piece-common' },
  { type:'rare',      label:'Редкий',  cls:'piece-rare' },
  { type:'legendary', label:'Легенд.', cls:'piece-legendary' },
];
const COIN = { type:'coin', label:'Монеты +10' };

// рандомный пул для слот-машины (много обычных, мало легендарных)
function buildPool(includeCoin) {
  let pool = [];
  for (let i=0; i<8; i++) pool.push(PIECES[0]); // common
  for (let i=0; i<4; i++) pool.push(PIECES[1]); // rare
  for (let i=0; i<2; i++) pool.push(PIECES[2]); // legendary
  if (includeCoin) for (let i=0; i<6; i++) pool.push(COIN);
  // shuffle
  for (let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool;
}

function randomDrop(isThirdSlot) {
  if (isThirdSlot) {
    return Math.random() < 0.4 ? COIN : PIECES[Math.floor(Math.random()*3)];
  }
  const r = Math.random();
  if (r < 0.6) return PIECES[0];
  if (r < 0.85) return PIECES[1];
  return PIECES[2];
}

function makePieceHTML(item) {
  if (item.type === 'coin') {
    return `<div class="coin-shape"><span class="coin-letter">H</span></div>
            <div class="slot-badge badge-coin">монеты</div>`;
  }
  const badgeCls = {common:'badge-common', rare:'badge-rare', legendary:'badge-legendary'}[item.type];
  return `<div class="piece-shape ${item.cls}"></div>
          <div class="slot-badge ${badgeCls}">${item.label}</div>`;
}

function makeResultHTML(item) {
  if (item.type === 'coin') {
    return `<div class="result-item">
      <div class="coin-shape" style="width:44px;height:44px;font-size:18px;"><span class="coin-letter">H</span></div>
      <div class="result-label">+10 монет</div>
    </div>`;
  }
  const badgeCls = {common:'badge-common', rare:'badge-rare', legendary:'badge-legendary'}[item.type];
  return `<div class="result-item">
    <div class="piece-shape ${item.cls}" style="width:44px;height:44px;border-radius:8px;"></div>
    <div class="slot-badge ${badgeCls}" style="font-size:10px;">${item.label}</div>
  </div>`;
}

// ---- PHASES ----
let phase = 0;

function boStartOpen() {
  if (boPhase !== 0) return;
  boPhase = 1;

  const box = document.getElementById('boCrystalBox');
  box.classList.add('fixing');

  setTimeout(() => {
    // fade out box, show unfold
    document.getElementById('boBoxStage').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('boBoxStage').style.display = 'none';
      boShowUnfold();
    }, 400);
  }, 500);
}

function boShowUnfold() {
  const stage = document.getElementById('boUnfoldStage');
  stage.style.display = 'flex';

  const faces = stage.querySelectorAll('.unfold-face');
  // появляются по очереди
  faces.forEach((f, i) => {
    setTimeout(() => {
      f.style.opacity = '1';
      f.style.transition = 'opacity 0.15s, transform 0.3s';
    }, i * 80);
  });

  // разлёт граней
  setTimeout(() => {
    const offsets = [
      {x:0,y:0}, {x:0,y:-70}, {x:0,y:70}, {x:-70,y:0}, {x:70,y:0}
    ];
    faces.forEach((f, i) => {
      f.style.transition = 'transform 0.35s cubic-bezier(.4,0,.6,1), opacity 0.35s';
      f.style.transform = `translate(${offsets[i].x}px, ${offsets[i].y}px)`;
      f.style.opacity = '0.4';
    });
  }, 500);

  // взрыв
  setTimeout(() => boDoExplosion(), 750);
}

function boDoExplosion() {
  const exp = document.getElementById('boExplosion');
  exp.style.transition = 'none';
  exp.style.opacity = '1';
  exp.style.width = '0px'; exp.style.height = '0px';
  exp.style.transform = 'translate(-50%,-50%)';

  requestAnimationFrame(() => {
    exp.style.transition = 'width 0.4s ease-out, height 0.4s ease-out, opacity 0.4s ease-out';
    exp.style.width = '400px'; exp.style.height = '400px';
    exp.style.transform = 'translate(-200px,-200px)';
  });

  boSpawnParticles();

  setTimeout(() => {
    exp.style.opacity = '0';
    document.getElementById('boUnfoldStage').style.display = 'none';
    boShowSlots();
  }, 600);
}

function boSpawnParticles() {
  const scene = document.getElementById('boScene');
  const colors = ['#867DCE','#CF5C86','#4566BB','#d4af37','#ffffff'];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'bo-particle';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.left = '50%'; p.style.top = '50%';
    const angle = Math.random()*360;
    const dist = 80 + Math.random()*160;
    const dx = Math.cos(angle*Math.PI/180)*dist;
    const dy = Math.sin(angle*Math.PI/180)*dist;
    p.style.transition = `transform ${0.5+Math.random()*0.4}s ease-out, opacity 0.6s`;
    scene.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      p.style.opacity = '0';
    });
    setTimeout(() => p.remove(), 1200);
  }
}

// ---- SLOTS ----
const drops = [null, null, null];

function boShowSlots() {
  const stage = document.getElementById('boSlotsStage');
  stage.style.display = 'flex';
  stage.style.transition = 'opacity 0.3s';
  requestAnimationFrame(() => { stage.style.opacity = '1'; });

  // используем дропы из магазина (_boDrops) или рандомные
  const boDropsToUse = [0,1,2].map(i => {
    const d = _boDrops && _boDrops[i];
    if (!d) return randomDrop(i===2);
    if (d.type === 'coin') return COIN;
    const rarity = d.themeId === 'rumi' ? 'legendary' : d.themeId === 'zoi' ? 'rare' : 'common';
    return { type: rarity, label: {mira:'Мира', zoi:'Зои', rumi:'Руми ✦'}[d.themeId] || d.themeId, cls: 'piece-' + rarity };
  });
  drops[0] = boDropsToUse[0]; drops[1] = boDropsToUse[1]; drops[2] = boDropsToUse[2];

  setTimeout(() => boSpinSlot(0, drops[0], () => {
    setTimeout(() => boSpinSlot(1, drops[1], () => {
      setTimeout(() => boSpinSlot(2, drops[2], () => {
        setTimeout(boShowResult, 700);
      }), 300);
    }), 300);
  }), 300);
}

function boSpinSlot(idx, winItem, cb) {
  const inner = document.getElementById('boInner' + idx);
  const slot = document.getElementById('boSlot' + idx);
  const pool = buildPool(idx===2);

  // строим список айтемов: пул + победитель в конце
  const items = [];
  for (let i=0;i<18;i++) items.push(pool[i % pool.length]);
  items.push(winItem);

  inner.innerHTML = items.map(item =>
    `<div class="slot-item">${makePieceHTML(item)}</div>`
  ).join('');

  const itemH = 90 + 4; // height + gap
  const totalItems = items.length;
  const targetY = -(totalItems - 1) * itemH;

  // быстрая прокрутка → замедление
  inner.style.transition = 'none';
  inner.style.transform = 'translateY(0)';

  // фаза 1: быстро до -15 айтемов
  requestAnimationFrame(() => {
    inner.style.transition = `transform ${2.2 + idx*0.4}s cubic-bezier(0.15, 0.05, 0.05, 1.0)`;  // CS2-style: fast start, very slow crawl at end
    inner.style.transform = `translateY(${targetY}px)`;
  });

  const duration = (2.2 + idx*0.4) * 1000;
  setTimeout(() => {
    slot.classList.add('winning');
    if (cb) cb();
  }, duration);
}

function boShowResult() {
  document.getElementById('boSlotsStage').style.display = 'none';

  const stage = document.getElementById('boResultStage');
  const items = document.getElementById('boResultItems');
  items.innerHTML = drops.map(d => makeResultHTML(d)).join('');

  // применяем дропы только сейчас — после анимации
  if (_boDrops && _boDrops.length) {
    applyBoxDrops(_boDrops);
    updateShopUI();
  }

  stage.style.display = 'flex';
  stage.style.transition = 'opacity 0.4s';
  requestAnimationFrame(() => { stage.style.opacity = '1'; });
}

function boRestart() {
  return;
}

// ====== UTILS ======
function save(k, v) { localStorage.setItem('passit4_' + k, JSON.stringify(v)); }
function load(k, def) {
  const v = localStorage.getItem('passit4_' + k);
  if (v === null) return def;
  try {
    return JSON.parse(v);
  } catch (e) {
    console.warn('Failed to parse localStorage key:', k, e);
    return def;
  }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function formatLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

const EMOJIS_COMMON = ['💻','📚','🏃','🧠','🎯','✏️','📋','💪','🔥','📖','🎨','🏆','⭐','🚀','🎮','🌐','🏋️','💰','⚡','🔵'];
const EMOJIS_ALL = [...EMOJIS_COMMON,'🧘','🎵','🎸','🎹','🏊','🚴','🧗','⚽','🏀','🎾','🏐','🧩','🎲','🃏','🎭','🍎','🥗','💊','🧪','🔬','🌱','🌍','✈️','🏠','📊','📈','💼','🔑','🛡️','⚔️','🏅','🥇','🎖️','🌟','💫','✨','🎉','🪄','🦁','🦊','🐺','🦅','🐉','🌙','☀️','⛅','🌈','❄️','🌊','🏔️','🌲'];
const EMOJIS = EMOJIS_ALL;
let emojiShowMore = {};

// ====== PASSES DATA STRUCTURE ======
// passes = [ { id, name, emoji, quests[], megaQuests[] }, ... ]
let passes = [];
let currentPassId = null;

function getCurrentPass() {
  return passes.find(p => p.id === currentPassId) || passes[0];
}
function getQuests() { return normalizeArray(getCurrentPass()?.quests); }
function getMegaQuests() { return normalizeArray(getCurrentPass()?.megaQuests); }

function savePasses() {
  save('passes', passes);
  save('currentPassId', currentPassId);
  cloudSave();
}

// ====== MIGRATION from old format ======
function migrateOldData() {
  const oldQuests = localStorage.getItem('passit3_quests');
  const oldMega = localStorage.getItem('passit3_megaQuests');
  if (!oldQuests && !oldMega) return null;
  return {
    quests: oldQuests ? JSON.parse(oldQuests) : [],
    megaQuests: oldMega ? JSON.parse(oldMega) : []
  };
}

function initPasses(data) {
  // data = { passes, currentPassId } from cloud or local
  // OR data = old format { quests, megaQuests }
  if (data && data.passes && Array.isArray(data.passes) && data.passes.length > 0) {
    passes = normalizePassesList(data.passes);
    currentPassId = data.currentPassId || passes[0].id;
  } else if (data && data.quests !== undefined) {
    // old format — migrate into first pass
    passes = [{
      id: uid(), name: 'Мой пасс', emoji: '🎯',
      quests: normalizeArray(data.quests),
      megaQuests: normalizeArray(data.megaQuests),
      passType: 'standard'
    }];
    currentPassId = passes[0].id;
  } else {
    // fresh start
    passes = [{ id: uid(), name: 'Мой пасс', emoji: '🎯', quests: [], megaQuests: [], passType: 'standard' }];
    currentPassId = passes[0].id;
  }
  passes = normalizePassesList(passes);
  // ensure currentPassId is valid
  if (!passes.find(p => p.id === currentPassId)) currentPassId = passes[0].id;
  if (typeof migrateMegaQuestsToFocusPasses === 'function') migrateMegaQuestsToFocusPasses();
  if (typeof migratePassLayoutOnce === 'function') migratePassLayoutOnce();
  if (typeof migrateBattlePassesToStandardOnce === 'function') migrateBattlePassesToStandardOnce();
}

// Load local
const localOld = migrateOldData();
const localNew = load('passes', null);
const localCurId = load('currentPassId', null);
if (localNew) {
  initPasses({ passes: localNew, currentPassId: localCurId });
} else if (localOld) {
  initPasses(localOld);
} else {
  initPasses(null);
}

// ====== PASS MENU ======
let passMenuOpen = false;
let createPassEmoji = EMOJIS[0];
let pendingPassType = 'standard';
let renamePassEmoji = EMOJIS[0];

function togglePassMenu(e) {
  if (e) e.stopPropagation();
  passMenuOpen = !passMenuOpen;
  document.getElementById('passMenuDropdown').classList.toggle('open', passMenuOpen);
  document.getElementById('passMenuArrow').classList.toggle('open', passMenuOpen);
  if (passMenuOpen) renderPassMenuList();
}

function closePassMenu() {
  passMenuOpen = false;
  document.getElementById('passMenuDropdown').classList.remove('open');
  document.getElementById('passMenuArrow').classList.remove('open');
}

function renderPassMenuList() {
  const list = document.getElementById('passMenuList');
  list.innerHTML = passes.map(p => `
    <div class="pass-menu-item ${p.id === currentPassId ? 'active' : ''}" onclick="switchPass('${p.id}')">
      <span class="pass-menu-item-emoji">${escapeHtml(p.emoji)}</span>
      <span style="flex:1;min-width:0;">${escapeHtml(p.name)}${p.passType === 'focus' ? ' <span style="opacity:0.55;font-size:10px;">· мега</span>' : ''}</span>
    </div>`).join('');
}

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr : Object.values(arr || {});
}

function normalizePass(pass) {
  if (!pass || typeof pass !== 'object') return pass;
  let quests = normalizeArray(pass.quests);
  if (pass.passType === 'focus') {
    while (quests.length < 9) quests.push(null);
    if (quests.length > 9) quests = quests.slice(0, 9);
  }
  return {
    ...pass,
    quests,
    megaQuests: normalizeArray(pass.megaQuests).map(mq => mq && typeof mq === 'object'
      ? { ...mq, tasks: normalizeArray(mq.tasks) }
      : mq)
  };
}

function ensureFocusPassQuestSlots(pass) {
  const p = pass || getCurrentPass();
  if (!p || !isFocusPass(p)) return;
  p.quests = normalizeArray(p.quests);
  while (p.quests.length < 9) p.quests.push(null);
  if (p.quests.length > 9) p.quests.length = 9;
}

function trimPassQuestTrailingNulls(pass) {
  const p = pass || getCurrentPass();
  if (!p) return;
  if (isFocusPass(p)) {
    ensureFocusPassQuestSlots(p);
    return;
  }
  p.quests = normalizeArray(p.quests);
  while (p.quests.length > 0 && p.quests[p.quests.length - 1] === null) p.quests.pop();
}

function megaQuestToFocusQuests(mq) {
  const fixedXp = 100;
  const quests = Array(9).fill(null);
  const tasks = normalizeArray(mq.tasks).filter(t => t && (t.text || '').trim());
  if (mq.taskMode && tasks.length > 0) {
    tasks.slice(0, 9).forEach((task, i) => {
      quests[i] = {
        id: uid(),
        emoji: mq.emoji || '🎯',
        name: (task.text || '').trim() || `Подзадача ${i + 1}`,
        sub: mq.sub || '',
        max: 1,
        current: task.done ? 1 : 0,
        xp: fixedXp,
        repeat: { type: 'daily' }
      };
    });
  } else {
    quests[0] = {
      id: uid(),
      emoji: mq.emoji || '🎯',
      name: mq.name || 'Мегазадача',
      sub: mq.sub || '',
      max: Math.max(1, mq.max || 1),
      current: mq.current || 0,
      xp: fixedXp,
      repeat: { type: 'daily' }
    };
  }
  return quests;
}

function migrateMegaQuestsToFocusPasses() {
  const newPasses = [];
  let migrated = 0;

  passes.forEach(parentPass => {
    const megas = normalizeArray(parentPass.megaQuests).filter(Boolean);
    if (megas.length === 0) return;
    parentPass.megaQuests = [];

    megas.forEach(mq => {
      newPasses.push({
        id: uid(),
        name: mq.name || 'Мегазадача',
        emoji: mq.emoji || '🎯',
        quests: megaQuestToFocusQuests(mq),
        megaQuests: [],
        passType: 'focus',
        fixedQuestXp: 100
      });
      migrated++;
    });
  });

  if (newPasses.length > 0) {
    passes.push(...newPasses);
    savePasses();
    showToast(`Мегаквесты перенесены в пассы: ${migrated}`);
  }
}

function migratePassLayoutOnce() {
  if (load('passit_layout_v2')) return;
  passes.forEach(p => {
    if (p.passType === 'focus') return;
    if (p.passType !== 'standard') p.passType = 'legacy';
    p.quests = normalizeArray(p.quests);
    while (p.quests.length > 0 && p.quests[p.quests.length - 1] === null) p.quests.pop();
    p.megaQuests = normalizeArray(p.megaQuests);
  });
  save('passit_layout_v2', true);
  savePasses();
}

function migrateBattlePassesToStandardOnce() {
  if (load('passit_layout_v3')) return;
  passes.forEach(p => {
    if (p?.passType === 'focus') return;
    p.passType = 'standard';
    p.quests = normalizeArray(p.quests);
    while (p.quests.length > 0 && p.quests[p.quests.length - 1] === null) p.quests.pop();
    p.megaQuests = normalizeArray(p.megaQuests);
  });
  save('passit_layout_v3', true);
  savePasses();
}

function getPassType(pass) {
  const p = pass || getCurrentPass();
  return p?.passType === 'focus' ? 'focus' : 'standard';
}
function isFocusPass(pass) {
  return getPassType(pass) === 'focus';
}
function getPassQuestLimit(pass) {
  const type = getPassType(pass);
  if (type === 'focus') return 9;
  if (type === 'standard') return 6;
  return userIsPro ? 18 : 9;
}
function getPassFixedQuestXp(pass) {
  const p = pass || getCurrentPass();
  return p?.fixedQuestXp || 100;
}
function applyPassTypeUI() {
  const focus = getCurrentPass()?.passType === 'focus';
  const megaSec = document.getElementById('megaQuestsSection');
  if (megaSec) megaSec.style.display = 'none';
  const questHeader = document.getElementById('questsSectionHeader');
  if (questHeader) questHeader.textContent = focus ? '◉ Подзадачи' : '⚡ Quests';
  const addBtn = document.getElementById('addQuestBtn');
  if (addBtn) addBtn.textContent = focus ? '+ Подзадача' : '+ Добавить квест';
}
function setQuestXpFieldsVisible(visible) {
  const q = document.getElementById('questXpField');
  const e = document.getElementById('editQuestXpField');
  if (q) q.style.display = visible ? '' : 'none';
  if (e) e.style.display = visible ? '' : 'none';
}

function normalizePassesList(list) {
  return normalizeArray(list).map(normalizePass);
}

function switchPass(id) {
  currentPassId = id;
  save('currentPassId', currentPassId);
  mqFocused = -1;
  closePassMenu();
  render();
}

function updatePassMenuTrigger() {
  const p = getCurrentPass();
  if (!p) return;
  document.getElementById('passMenuEmoji').textContent = p.emoji;
  document.getElementById('passMenuName').textContent = p.name;
  document.getElementById('passTitle').textContent = p.name;

  // считаем невыполненные активные квесты в ДРУГИХ пассах
  const hint = document.getElementById('passMenuHint');
  if (passes.length <= 1) { hint.className = 'pass-menu-hint'; return; }

  let otherIncomplete = 0;
  let otherPassesWithTasks = 0;
  passes.forEach(op => {
    if (op.id === currentPassId) return;
    const quests = normalizeArray(op.quests);
    const incomplete = quests.filter(q => q && !q.frozen && isQuestActiveToday(q) && (q.current || 0) < q.max).length;
    if (incomplete > 0) { otherIncomplete += incomplete; otherPassesWithTasks++; }
  });

  if (otherIncomplete === 0) {
    hint.className = 'pass-menu-hint';
    return;
  }

  hint.className = 'pass-menu-hint visible';
  if (otherPassesWithTasks === passes.length - 1) {
    hint.textContent = `Не забудь про другие пассы: ${otherIncomplete} квест${plural(otherIncomplete)} ждут!`;
  } else {
    hint.textContent = `Ещё ${otherIncomplete} квест${plural(otherIncomplete)} в других пассах`;
  }
}

function plural(n) {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'а';
  return 'ов';
}

function closePassTypePicker() {
  document.getElementById('passTypeOverlay').classList.remove('open');
  pendingPassType = null;
}

function openCreatePassPopup() {
  closePassMenu();
  pendingPassType = null;
  document.getElementById('passTypeOverlay').classList.add('open');
}

function selectPassType(type) {
  pendingPassType = type;
  closePassTypePicker();
  openCreatePassDetailsPopup();
}

function openCreatePassDetailsPopup() {
  const isFocus = pendingPassType === 'focus';
  createPassEmoji = isFocus ? '🎯' : '📝';
  const titleEl = document.querySelector('#createPassOverlay .popup-title');
  if (titleEl) titleEl.textContent = isFocus ? 'Новая мегазадача' : 'Новый пасс';
  const nameInput = document.getElementById('createPassName');
  if (nameInput) {
    nameInput.placeholder = isFocus ? 'Название мегазадачи...' : 'Название пасса...';
    nameInput.value = '';
  }
  renderEmojiGrid('createPassEmojiGrid', createPassEmoji, (el, e) => {
    createPassEmoji = e;
    document.querySelectorAll('#createPassEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  });
  document.getElementById('createPassOverlay').classList.add('open');
}

function createPass() {
  const name = document.getElementById('createPassName').value.trim();
  if (!name) { showToast('Введи название!'); return; }
  const type = pendingPassType || 'standard';
  const isFocus = type === 'focus';
  const newPass = {
    id: uid(), name, emoji: createPassEmoji,
    quests: isFocus ? Array(9).fill(null) : [],
    megaQuests: [],
    passType: type
  };
  if (isFocus) newPass.fixedQuestXp = 100;
  passes.push(newPass);
  currentPassId = newPass.id;
  mqFocused = -1;
  pendingPassType = null;
  savePasses();
  closePopup('createPassOverlay');
  render();
  showToast(isFocus ? '✅ Мегазадача создана!' : '✅ Пасс создан!');
}

function openRenamePassPopup() {
  closePassMenu();
  const p = getCurrentPass();
  renamePassEmoji = p.emoji;
  renderEmojiGrid('renamePassEmojiGrid', renamePassEmoji, (el, e) => {
    renamePassEmoji = e;
    document.querySelectorAll('#renamePassEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
  });
  document.getElementById('renamePassName').value = p.name;
  document.getElementById('renamePassOverlay').classList.add('open');
}

function saveRenamePass() {
  const name = document.getElementById('renamePassName').value.trim();
  if (!name) { showToast('Введи название!'); return; }
  const p = getCurrentPass();
  p.name = name;
  p.emoji = renamePassEmoji;
  savePasses();
  closePopup('renamePassOverlay');
  render();
}

function deleteCurrentPass() {
  closePassMenu();
  if (passes.length <= 1) { showToast('Нельзя удалить единственный пасс'); return; }
  const p = getCurrentPass();
  if (!confirm(`Удалить пасс "${p.name}"? Все квесты внутри будут удалены.`)) return;
  passes = passes.filter(x => x.id !== currentPassId);
  currentPassId = passes[0].id;
  mqFocused = -1;
  savePasses();
  render();
  showToast('Пасс удалён');
}

// close pass menu when clicking outside
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('passMenuWrap');
  if (wrap && !wrap.contains(e.target)) closePassMenu();
});

// ====== DRAG TO PASS ======
let dragToPassActive = false;

function initDragToPass() {
  const wrap = document.getElementById('passMenuWrap');
  if (!wrap) return;
  let leaveTimer = null;

  wrap.addEventListener('dragover', (e) => {
    if (dragSrcIndex === null) return;
    e.preventDefault();
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    if (!dragToPassActive) {
      dragToPassActive = true;
      wrap.classList.add('drag-expanded');
      renderPassMenuListDrag();
      document.getElementById('passMenuDropdown').classList.add('open');
      document.getElementById('passMenuArrow').classList.add('open');
    }
  });

  wrap.addEventListener('dragleave', () => {
    leaveTimer = setTimeout(() => {
      dragToPassActive = false;
      wrap.classList.remove('drag-expanded');
      document.getElementById('passMenuDropdown').classList.remove('open');
      document.getElementById('passMenuArrow').classList.remove('open');
    }, 150);
  });

  wrap.addEventListener('drop', (e) => {
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    dragToPassActive = false;
    wrap.classList.remove('drag-expanded');
    document.getElementById('passMenuDropdown').classList.remove('open');
    document.getElementById('passMenuArrow').classList.remove('open');
  });
}

function renderPassMenuListDrag() {
  const list = document.getElementById('passMenuList');
  list.innerHTML = `<div class="pass-menu-drag-hint">перенести квест в:</div>` +
    passes.map(p => `
      <div class="pass-menu-item ${p.id === currentPassId ? 'active' : 'drag-target'}"
        ondragover="event.preventDefault(); this.classList.add('drag-target-hover')"
        ondragleave="this.classList.remove('drag-target-hover')"
        ondrop="dropQuestToPass('${p.id}', event)"
        onclick="${p.id !== currentPassId ? `switchPass('${p.id}')` : ''}">
        <span class="pass-menu-item-emoji">${escapeHtml(p.emoji)}</span>
        <span>${escapeHtml(p.name)}${p.id === currentPassId ? ' (текущий)' : ''}</span>
      </div>`).join('');
}

function dropQuestToPass(targetPassId, e) {
  e.preventDefault();
  dragToPassActive = false;
  document.getElementById('passMenuWrap').classList.remove('drag-expanded');
  document.getElementById('passMenuDropdown').classList.remove('open');
  document.getElementById('passMenuArrow').classList.remove('open');

  if (dragSrcIndex === null || targetPassId === currentPassId) return;

  const srcPass = getCurrentPass();
  const targetPass = passes.find(p => p.id === targetPassId);
  if (!targetPass || !srcPass) return;

  const quest = srcPass.quests.splice(dragSrcIndex, 1)[0];
  if (!targetPass.quests) targetPass.quests = [];
  targetPass.quests.push(quest);
  dragSrcIndex = null;
  savePasses();
  renderQuests();
  showToast(`✅ Квест перенесён в «${targetPass.name}»`);
}

// Добавить стиль drag-target-hover
(function() {
  const style = document.createElement('style');
  style.textContent = '.pass-menu-item.drag-target-hover { background: var(--accent2) !important; }';
  document.head.appendChild(style);
})();
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
let selectedQuestDays = [];
let editQuestDays = [];

function selectRepeatTab(el, tabsId, extraId) {
  document.querySelectorAll('#' + tabsId + ' .repeat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const extra = document.getElementById(extraId);
  const type = el.dataset.type;
  const isEdit = tabsId.startsWith('edit');
  const prefix = isEdit ? 'editQuest' : 'quest';

  // show/hide deadline active day checkbox
  const activeDayWrap = document.getElementById(prefix + 'DeadlineActiveDayWrap');
  const deadlineInput = document.getElementById(prefix + 'Deadline');
  if (activeDayWrap) {
    if (type === 'weekly') {
      activeDayWrap.style.display = 'flex';
    } else {
      activeDayWrap.style.display = 'none';
      if (document.getElementById(prefix + 'DeadlineActiveDay')) {
        document.getElementById(prefix + 'DeadlineActiveDay').checked = false;
      }
      if (deadlineInput) deadlineInput.disabled = false;
    }
  }

  if (type === 'weekly') {
    const daysArr = isEdit ? editQuestDays : selectedQuestDays;
    extra.style.display = '';
    extra.innerHTML = `<div class="days-grid">${DAYS.map((d, i) =>
      `<div class="day-btn ${daysArr.includes(i) ? 'active' : ''}" onclick="toggleDay(this,${i},'${tabsId}')">${d}</div>`
    ).join('')}</div>`;
  } else {
    extra.style.display = 'none';
    extra.innerHTML = '';
  }
}

function toggleDeadlineActiveDay(prefix) {
  const checked = document.getElementById(prefix + 'DeadlineActiveDay').checked;
  const deadlineInput = document.getElementById(prefix + 'Deadline');
  if (checked) {
    deadlineInput.disabled = true;
    deadlineInput.value = '';
    deadlineInput.placeholder = 'авто — ближайший активный день';
  } else {
    deadlineInput.disabled = false;
    deadlineInput.placeholder = '';
  }
}

function toggleDay(el, idx, tabsId) {
  const isEdit = tabsId.startsWith('edit');
  const arr = isEdit ? editQuestDays : selectedQuestDays;
  const pos = arr.indexOf(idx);
  if (pos >= 0) arr.splice(pos, 1); else arr.push(idx);
  el.classList.toggle('active', arr.includes(idx));
}

function getRepeatFromPopup(tabsId) {
  const activeTab = document.querySelector('#' + tabsId + ' .repeat-tab.active');
  const type = activeTab ? activeTab.dataset.type : 'daily';
  const isEdit = tabsId.startsWith('edit');
  const days = isEdit ? [...editQuestDays] : [...selectedQuestDays];
  return type === 'weekly' ? { type, days } : { type };
}

const CURRENT_VERSION = 'v2.0';
function checkUpdateBanner() {
  const seen = load('lastSeenVersion', null);
  if (seen !== CURRENT_VERSION) {
    document.getElementById('updateBanner').style.display = 'flex';
  }
}
function dismissUpdate() {
  save('lastSeenVersion', CURRENT_VERSION);
  document.getElementById('updateBanner').style.display = 'none';
}

function todayStr() {
  return formatLocalDate(new Date());
}
function todayDowIndex() { return (new Date().getDay() + 6) % 7; }

const LOBBY_WEEK_SHOP_ITEMS = [
  { name: 'Night Shift', price: 200, flavor: 'Weekly featured skin pack' },
  { name: 'Star Tape', price: 140, flavor: 'Retro reward capsule' },
  { name: 'Gold Signal', price: 260, flavor: 'Limited premium placeholder' }
];
let lobbyShopIndex = 0;

function getLobbyLastDaySummary() {
  return load('passit_last_day_summary', null);
}
function saveLobbyLastDaySummary(summary) {
  save('passit_last_day_summary', summary);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/lastDaySummary').set(summary);
}
function getLobbySnapshotDate() {
  const today = todayStr();
  const lastReset = load('lastAutoReset', null);
  if (lastReset && lastReset < today) {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return formatLocalDate(d);
  }
  return today;
}
function getLobbyQuestProgressFromPass(pass) {
  const quests = normalizeArray(pass && pass.quests).filter(q => q && !q.frozen && isQuestActiveToday(q));
  const total = quests.length;
  const done = quests.filter(q => (q.current || 0) >= q.max).length;
  return { done, total, ratio: total ? done / total : 0 };
}
function getLobbyTaskLeaders() {
  return normalizeArray(getCurrentPass()?.quests)
    .filter(q => q && !q.frozen)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 2);
}
function formatLobbyWeekday(dateStr) {
  if (!dateStr) return 'No snapshot';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
function stepLobbyShop(dir) {
  lobbyShopIndex = (lobbyShopIndex + dir + LOBBY_WEEK_SHOP_ITEMS.length) % LOBBY_WEEK_SHOP_ITEMS.length;
  renderLobbyShop();
}
function renderLobbyShop() {
  const item = LOBBY_WEEK_SHOP_ITEMS[lobbyShopIndex];
  const nameEl = document.getElementById('lobbyShopName');
  const priceEl = document.getElementById('lobbyShopPrice');
  const countEl = document.getElementById('lobbyShopCount');
  const flavorEl = document.getElementById('lobbyShopFlavor');
  if (nameEl) nameEl.textContent = item.name;
  if (priceEl) priceEl.textContent = `${item.price} Coins`;
  if (countEl) countEl.textContent = `${lobbyShopIndex + 1}/${LOBBY_WEEK_SHOP_ITEMS.length}`;
  if (flavorEl) flavorEl.textContent = item.flavor;
}
function setLobbyVisible(visible) {
  const overlay = document.getElementById('lobbyOverlay');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !visible);
}
function enterAppFromLobby() {
  setLobbyVisible(false);
}
function returnToLobby() {
  setLobbyVisible(true);
}
function renderLobbyPassTrack(rootId, labels, progress, options = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const author = !!options.author;
  const clamped = Math.max(0, Math.min(progress, 1));
  const totalSegments = Math.max(labels.length - 1, 1);
  let html = '';
  labels.forEach((label, idx) => {
    const nodeProgress = labels.length === 1 ? clamped : clamped * totalSegments;
    const filled = idx < Math.floor(nodeProgress);
    const currentIndex = Math.min(Math.floor(nodeProgress), labels.length - 1);
    const current = !filled && idx === currentIndex;
    const nodeClass = [
      'lobby-pass-node',
      filled ? (author ? 'author-filled' : 'filled') : '',
      current ? (author ? 'author-current' : 'current') : ''
    ].filter(Boolean).join(' ');
    html += `<div class="${nodeClass}">${label}</div>`;
    if (idx < labels.length - 1) {
      const segmentFill = Math.max(0, Math.min(nodeProgress - idx, 1)) * 100;
      html += `<div class="lobby-pass-line"><div class="lobby-pass-line-fill ${author ? 'author-line' : ''}" style="width:${segmentFill}%;"></div></div>`;
    }
  });
  root.innerHTML = html;
}

function renderWeeklyAuthorQuestCards(ids) {
  const weeklyState = getWeeklyChallengeState();
  const weekXPstored = weeklyState.xp;
  const personalQuestsLive = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen && isQuestActiveToday(q)));
  const personalLiveToday = personalQuestsLive.reduce((sum, q) => sum + Math.round(Math.min(1, (q.current||0)/q.max) * (q.xp||100)), 0);
  const weekTarget = weeklyState.target;
  const weekXP = weeklyState.completed ? weekTarget : Math.min(weekXPstored + personalLiveToday, weekTarget);
  const weekPct = Math.min(100, Math.round((weekXP / weekTarget) * 100));
  const weekDone = weekXP >= weekTarget;
  if (weekDone && !weeklyState.completed) saveWeeklyChallengeState({ completed: true });

  const weekBar = document.getElementById(ids.weekBar);
  const weekMeta = document.getElementById(ids.weekMeta);
  if (weekBar) weekBar.style.width = weekPct + '%';
  if (weekMeta) weekMeta.textContent = `${weekXP} / ${weekTarget} XP · +1500 XP`;
  const weekCard = document.getElementById(ids.weekCard);
  if (weekCard) {
    weekCard.style.opacity = weekDone ? '1' : '0.75';
    weekCard.style.borderColor = weekDone ? 'rgba(200,140,0,0.6)' : '';
  }

  const qow = qowGetProgress();
  const qowBar = document.getElementById(ids.qowBar);
  const qowName = document.getElementById(ids.qowName);
  const qowMeta = document.getElementById(ids.qowMeta);
  if (qowName) qowName.textContent = `${qow.emoji} ${qow.name}`;
  if (qowBar) qowBar.style.width = Math.round((qow.done / qow.target) * 100) + '%';
  if (qowMeta) qowMeta.textContent = `${qow.done} / ${qow.target} · +1000 XP`;
  const qowCard = document.getElementById(ids.qowCard);
  if (qowCard) {
    qowCard.style.opacity = qow.done >= qow.target ? '1' : '0.75';
    qowCard.style.borderColor = qow.done >= qow.target ? 'rgba(200,140,0,0.6)' : '';
  }

  const streakCount = getStreakCount();
  const streakTarget = 4;
  const streakProgress = Math.min(streakCount, streakTarget);
  const streakBar = document.getElementById(ids.streakBar);
  const streakName = document.getElementById(ids.streakName);
  const streakMeta = document.getElementById(ids.streakMeta);
  if (streakName) streakName.textContent = `🔥 Продли стрик (${streakCount} дн.)`;
  if (streakBar) streakBar.style.width = Math.round((streakProgress / streakTarget) * 100) + '%';
  if (streakMeta) streakMeta.textContent = `${streakProgress} / ${streakTarget} дней · +1000 XP`;
  const streakCard = document.getElementById(ids.streakCard);
  if (streakCard) {
    streakCard.style.opacity = streakCount >= streakTarget ? '1' : '0.75';
    streakCard.style.borderColor = streakCount >= streakTarget ? 'rgba(200,140,0,0.6)' : '';
  }
}

function scrollAuthorCompactTrack(dir) {
  const frame = document.getElementById('passAuthorTrackFrame');
  if (!frame) return;
  frame.scrollBy({ left: dir * 178, behavior: 'smooth' });
}

function renderCompactAuthorPass() {
  const root = document.getElementById('passAuthorCompact');
  if (!root) return;

  const totalXP = getTotalAuthorXP();
  const level = syncAuthorLevel();
  const boxes = getPendingBoxes();
  const xpPerLevel = 500;
  const xpInLevel = totalXP % xpPerLevel;
  const xpToNext = level >= 150 ? 0 : Math.max(0, xpPerLevel - xpInLevel);
  const levelProgressPct = level >= 150 ? 100 : Math.round((xpInLevel / xpPerLevel) * 100);

  let html = `
    <div class="pass-author-compact-head">
      <div class="pass-author-compact-head-top">
        <div class="pass-author-compact-label">Авторский пасс</div>
        <button class="pass-author-compact-boxes" type="button" onclick="openShop()">📦 ${boxes}</button>
      </div>
      <div class="pass-author-compact-level">Ур. ${level} · ${totalXP} XP</div>
      <div class="pass-author-compact-next">${level >= 150 ? 'Макс. уровень' : `${xpToNext} XP до след. уровня`}</div>
    </div>
    <div class="pass-author-track-shell">
      <button class="pass-author-track-nav" type="button" onclick="scrollAuthorCompactTrack(-1)">‹</button>
      <div class="pass-author-track-frame" id="passAuthorTrackFrame">
        <div class="pass-author-track-row">`;

  for (let i = 0; i <= 150; i++) {
    const isBox = i > 0 && i % 5 === 0;
    const isPiece = i > 0 && i % 3 === 0 && !isBox;
    const done = i < level;
    const current = i === level;
    const rewardClass = (isBox || isPiece) ? 'reward' : '';
    const levelRewardClass = (isBox && i <= level) ? 'level-reward' : '';
    const icon = isBox ? '📦' : isPiece ? '🧩' : (current ? '◉' : done ? '✓' : '');
    const title = isBox ? `Уровень ${i} · бокс` : isPiece ? `Уровень ${i} · кусочек` : `Уровень ${i}`;
    const click = (isBox && i <= level) ? ` onclick="openShop()"` : '';
    html += `
      <div class="pass-author-track-node ${rewardClass} ${done ? 'done' : ''} ${current ? 'current' : ''} ${levelRewardClass}" data-level="${i}" title="${title}"${click}>
        <div class="pass-author-track-value">${icon}</div>
      </div>`;
    if (i < 150) {
      const segmentPct = i < level - 1 ? 100 : i === level ? levelProgressPct : 0;
      html += `<div class="pass-author-track-line"><div class="pass-author-track-line-fill" style="width:${segmentPct}%"></div></div>`;
    }
  }

  html += `
        </div>
      </div>
      <button class="pass-author-track-nav" type="button" onclick="scrollAuthorCompactTrack(1)">›</button>
    </div>`;

  root.innerHTML = html;

  const frame = document.getElementById('passAuthorTrackFrame');
  const currentNode = root.querySelector(`.pass-author-track-node[data-level="${level}"]`);
  if (frame && currentNode) {
    requestAnimationFrame(() => {
      const hiddenLeft = 172;
      const target = currentNode.offsetLeft - hiddenLeft;
      frame.scrollLeft = Math.max(0, target);
    });
  }
}

function renderLobby() {
  renderLobbyShop();

  const welcomeName = document.getElementById('lobbyWelcomeName');
  if (welcomeName) {
    const raw = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Commander';
    welcomeName.textContent = `, ${raw}`;
  }

  const currentPass = getCurrentPass();
  const todayProg = getLobbyQuestProgressFromPass(currentPass);
  const todayMeta = document.getElementById('lobbyTodayMeta');
  if (todayMeta) todayMeta.textContent = `${todayProg.done}/${todayProg.total} quests completed today`;
  renderLobbyPassTrack('lobbyTodayTrack', ['1', '2', '3'], todayProg.ratio);

  const lastDay = getLobbyLastDaySummary();
  const lastMeta = document.getElementById('lobbyLastDayMeta');
  if (lastDay) {
    const seenText = `Last seen: ${formatLobbyWeekday(lastDay.date)} · ${lastDay.done}/${lastDay.total} quests`;
    if (lastMeta) lastMeta.textContent = seenText;
    renderLobbyPassTrack('lobbyLastDayTrack', ['1', '2', '3'], lastDay.ratio || 0);
  } else {
    if (lastMeta) lastMeta.textContent = 'No previous snapshot yet';
    renderLobbyPassTrack('lobbyLastDayTrack', ['1', '2', '3'], 0);
  }

  const topTasks = getLobbyTaskLeaders();
  const t1 = topTasks[0] || null;
  const t2 = topTasks[1] || null;
  const task1Name = document.getElementById('lobbyTask1Name');
  const task1XP = document.getElementById('lobbyTask1XP');
  const task2Name = document.getElementById('lobbyTask2Name');
  const task2XP = document.getElementById('lobbyTask2XP');
  if (task1Name) task1Name.textContent = t1 ? t1.name : 'No task yet';
  if (task1XP) task1XP.textContent = t1 ? `${t1.xp || 0} XP` : '0 XP';
  if (task2Name) task2Name.textContent = t2 ? t2.name : 'No task yet';
  if (task2XP) task2XP.textContent = t2 ? `${t2.xp || 0} XP` : '0 XP';

  const totalAuthorXP = getTotalAuthorXP();
  const authorLevel = Math.min(Math.floor(totalAuthorXP / 500), 150);
  const authorMeta = document.getElementById('lobbyAuthorMeta');
  if (authorMeta) authorMeta.textContent = `Level ${authorLevel} · ${totalAuthorXP} XP`;
  renderLobbyPassTrack(
    'lobbyAuthorTrack',
    [authorLevel, Math.min(authorLevel + 1, 150), Math.min(authorLevel + 2, 150)].map(String),
    (totalAuthorXP % 500) / 500,
    { author: true }
  );

  renderWeeklyAuthorQuestCards({
    weekBar: 'lobbyAwq0bar',
    weekMeta: 'lobbyAwq0meta',
    weekCard: 'lobbyAwq0card',
    qowBar: 'lobbyAwq1bar',
    qowName: 'lobbyAwq1name',
    qowMeta: 'lobbyAwq1meta',
    qowCard: 'lobbyAwq1card',
    streakBar: 'lobbyAwq2bar',
    streakName: 'lobbyAwq2name',
    streakMeta: 'lobbyAwq2meta',
    streakCard: 'lobbyAwq2card'
  });
}

function isQuestActiveToday(q) {
  const today = todayStr();
  if (q.startDate && q.startDate > today) return false; // ещё не началось
  if (!q.repeat || q.repeat.type === 'daily') return true;
  if (q.repeat.type === 'once') {
    // активен с момента создания до дедлайна включительно
    if (!q.deadline) return true;
    return today <= q.deadline;
  }
  if (q.repeat.type === 'weekly') return (q.repeat.days || []).includes(todayDowIndex());
  return true;
}
function daysUntilDeadline(deadlineStr) {
  if (!deadlineStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(deadlineStr); dl.setHours(0,0,0,0);
  return Math.round((dl - today) / 86400000);
}
function nextActiveDay(q) {
  if (!q.repeat || q.repeat.type !== 'weekly') return null;
  const days = q.repeat.days || [];
  if (days.length === 0) return null;
  const today = todayDowIndex();
  for (let i = 1; i <= 7; i++) {
    const d = (today + i) % 7;
    if (days.includes(d)) return DAYS[d];
  }
  return null;
}

// ====== EMOJI GRID ======
function renderEmojiGrid(gridId, current, onPick) {
  const grid = document.getElementById(gridId);
  const showAll = emojiShowMore[gridId] || false;
  const list = showAll ? EMOJIS_ALL : EMOJIS_COMMON;
  grid.innerHTML = list.map(e =>
    `<div class="emoji-opt ${e === current ? 'selected' : ''}" onclick="(${onPick.toString()})(this,'${e}')">${e}</div>`
  ).join('') +
  `<div class="emoji-opt emoji-more-btn" onclick="toggleEmojiMore('${gridId}')" title="${showAll ? 'Меньше' : 'Ещё'}">${showAll ? '▲' : '···'}</div>`;
}

function toggleEmojiMore(gridId) {
  emojiShowMore[gridId] = !emojiShowMore[gridId];
  // перерисовываем — находим текущий выбранный эмодзи
  const grid = document.getElementById(gridId);
  const sel = grid.querySelector('.emoji-opt.selected:not(.emoji-more-btn)');
  const current = sel ? sel.textContent : EMOJIS_COMMON[0];
  // находим onPick по gridId
  const pickFns = {
    'questEmojiGrid': pickQuestEmoji,
    'editQuestEmojiGrid': (el,e) => { editQuestEmoji = e; document.querySelectorAll('#editQuestEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); },
    'megaEmojiGrid': pickMegaEmoji,
    'editMegaEmojiGrid': (el,e) => { editMegaEmoji = e; document.querySelectorAll('#editMegaEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); },
  };
  const fn = pickFns[gridId] || ((el,e) => {});
  renderEmojiGrid(gridId, current, fn);
}

let selectedQuestEmoji = EMOJIS[0];
let selectedMegaEmoji = EMOJIS[0];
function pickQuestEmoji(el, emoji) { selectedQuestEmoji = emoji; document.querySelectorAll('#questEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); }
function pickMegaEmoji(el, emoji) { selectedMegaEmoji = emoji; document.querySelectorAll('#megaEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); }
function selectXP(el) { document.querySelectorAll('.xp-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); }

// ====== PASS LEVELS (horizontal scroll) ======
function updatePass() {
  const allQuests = normalizeArray(getCurrentPass()?.quests);
  const quests = allQuests.filter(q => q !== null && !q.frozen && isQuestActiveToday(q));
  const totalMaxXP = quests.reduce((s, q) => s + q.xp, 0);
  const totalEarnedXP = quests.reduce((s, q) => s + (Math.min(q.current || 0, q.max) / q.max) * q.xp, 0);
  const pct = totalMaxXP > 0 ? Math.min((totalEarnedXP / totalMaxXP) * 100, 100) : 0;

  // обновляем счётчик XP дня
  const xpEl = document.getElementById('dailyXpCounter');
  if (xpEl) {
    const earned = Math.round(totalEarnedXP);
    const pctClass = earned === totalMaxXP && totalMaxXP > 0 ? 'color:var(--accent);font-weight:800;' : '';
    xpEl.innerHTML = `<span style="${pctClass}">${earned}</span> / ${totalMaxXP} XP`;
  }

  const container = document.getElementById('passLevels');
  container.innerHTML = '';
  const n = quests.length; // только активные
  const circles = n + 1;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;position:relative;width:100%;min-width:' + (circles * 46) + 'px;';

  const track = document.createElement('div');
  track.style.cssText = 'position:absolute;top:50%;left:19px;right:19px;height:5px;background:var(--bar-bg);border-radius:2px;transform:translateY(-50%);z-index:0;';
  const fill = document.createElement('div');
  fill.style.cssText = `height:100%;background:var(--accent);border-radius:2px;transition:width 0.5s ease;width:${pct}%;`;
  track.appendChild(fill);
  wrap.appendChild(track);

  for (let i = 0; i < circles; i++) {
    const threshold = i === 0 ? 0 : (i / n) * 100;
    const filled = i === 0 || pct >= threshold;
    const div = document.createElement('div');
    div.className = 'pass-level' + (filled ? ' filled' : '');
    div.textContent = i;
    div.style.zIndex = 1;
    wrap.appendChild(div);
  }
  container.appendChild(wrap);
}

// ====== RENDER QUESTS with drag & drop (snake order) ======
// Snake order: row 0 L→R, row 1 R→L, row 2 L→R ...
// Grid has 3 rows, columns auto-added. Visual index to array index mapping:
// col 0: [0,1,2], col 1: [3,4,5] etc but snake flips columns:
// snake pos 0=top-left, 1=top-mid, 2=top-right, 3=mid-right, 4=mid-mid, 5=mid-left...

let dragSrcIndex = null;
let questClipboard = null; // скопированный квест

function copyQuest(i) {
  const q = getCurrentPass()?.quests[i];
  if (!q) return;
  questClipboard = JSON.parse(JSON.stringify(q)); // deep copy
  questClipboard.current = 0; // сбрасываем прогресс
  showToast('📋 Квест скопирован!');
  // обновляем кнопки вставки
  document.querySelectorAll('.quest-paste-btn').forEach(b => b.style.display = '');
}

function pasteQuest() {
  if (!questClipboard) return;
  const p = getCurrentPass();
  p.quests = normalizeArray(p.quests);
  const maxQ = getPassQuestLimit(p);
  const filled = normalizeArray(p.quests).filter(q => q !== null).length;
  if (filled >= maxQ) { showToast('Нет свободных слотов!'); return; }
  const copy = JSON.parse(JSON.stringify(questClipboard));
  const firstNull = p.quests.indexOf(null);
  if (firstNull !== -1) p.quests[firstNull] = copy;
  else p.quests.push(copy);
  savePasses();
  questClipboard = null; // очищаем буфер после вставки
  renderQuests();
  showToast('✅ Квест вставлен!');
}

function snakeToGrid(snakeIdx, cols) {
  // Returns {row, col} for a snake index given number of columns
  const row = Math.floor(snakeIdx / cols);
  const posInRow = snakeIdx % cols;
  const col = (row % 2 === 0) ? posInRow : (cols - 1 - posInRow);
  return { row, col };
}

function gridToSnake(row, col, cols) {
  return (row % 2 === 0) ? row * cols + col : row * cols + (cols - 1 - col);
}

function updateAuthorIfOpen() {
  checkStreakToday();
  qowCheck();
  syncAuthorLevel();
  renderCompactAuthorPass();
  if (authorScreenOpen) updateAuthorPassUI();
}
function renderQuests() {
  const pass = getCurrentPass();
  const focus = pass?.passType === 'focus';
  if (focus) ensureFocusPassQuestSlots(pass);
  const quests = normalizeArray(pass?.quests);
  const grid = document.getElementById('questsGrid');
  const scrollWrap = grid?.closest('.quests-scroll-wrap');
  if (scrollWrap) scrollWrap.classList.toggle('quests-scroll-focus', focus);
  if (grid) grid.className = 'quests-grid' + (focus ? ' quests-grid-focus' : '');
  const maxQ = getPassQuestLimit(pass);
  const COLS = 3;
  const ROWS = focus ? 3 : 2;
  const BLOCK = COLS * ROWS;

  // считаем блоки по реальной длине (включая null-слоты)
  const nonNull = quests.filter(q => q !== null).length;
  const effectiveLen = Math.max(quests.length, nonNull);
  const filledBlocks = Math.ceil(Math.max(1, effectiveLen) / BLOCK);
  let cappedBlocks;
  if (focus) {
    cappedBlocks = 1;
  } else {
    const totalBlocks = (nonNull % BLOCK === 0 && nonNull < maxQ) ? filledBlocks + 1 : filledBlocks;
    cappedBlocks = Math.min(totalBlocks, Math.ceil(maxQ / BLOCK));
  }

  grid.style.gridTemplateRows = `repeat(${ROWS}, minmax(0, 1fr))`;
  grid.style.gridAutoColumns = `calc((100% - ${(COLS - 1) * 10}px) / ${COLS})`;
  grid.style.height = '100%';
  grid.style.alignContent = 'stretch';
  grid.innerHTML = '';

  for (let blockIdx = 0; blockIdx < cappedBlocks; blockIdx++) {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const posInRow = col;
        const snakeCol = (row % 2 === 0) ? posInRow : (COLS - 1 - posInRow);
        const snakeIdxInBlock = row * COLS + snakeCol;
        const globalSnakeIdx = blockIdx * BLOCK + snakeIdxInBlock;

        const div = document.createElement('div');
        const q = quests[globalSnakeIdx] || null;

        if (q) {
          const cur = q.current || 0;
          const pct = Math.min((cur / q.max) * 100, 100).toFixed(1);
          const done = cur >= q.max;
          const frozen = !!q.frozen;
          const notStarted = q.startDate && q.startDate > todayStr();
          const active = !frozen && !notStarted && isQuestActiveToday(q);

          let effectiveDeadline = q.deadline;
          if (q.deadlineActiveDay && q.repeat?.type === 'weekly' && (q.repeat.days || []).length > 0) {
            const todayDow = todayDowIndex();
            const days = q.repeat.days;
            for (let i = 1; i <= 7; i++) {
              const d = (todayDow + i) % 7;
              if (days.includes(d)) {
                const dt = new Date();
                dt.setDate(dt.getDate() + i);
                effectiveDeadline = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
                break;
              }
            }
          }
          const deadlineDays = daysUntilDeadline(effectiveDeadline);
          const deadlineHtml = deadlineDays !== null
            ? `<span class="quest-deadline ${deadlineDays <= 2 ? 'urgent' : ''}">${deadlineDays < 0 ? 'просрочен' : deadlineDays === 0 ? 'сегодня' : `ещё ${deadlineDays}д`}</span>`
            : (q.repeat?.type === 'weekly' && active ? `<span class="quest-deadline" style="opacity:0.6;">активен сегодня</span>` : '');
          const nextDay = !active && !frozen ? nextActiveDay(q) : null;

          div.className = 'quest-card' + (done ? ' done' : '') + (!active && !frozen ? ' inactive' : '') + (frozen ? ' frozen' : '');
          div.draggable = !notStarted;
          div.dataset.snakeIdx = globalSnakeIdx;
          div.innerHTML = `
            <div class="quest-card-top">
              <span class="quest-emoji">${escapeHtml(q.emoji)}${frozen ? '❄️' : ''}</span>
              <div style="flex:1;min-width:0;"><div class="quest-name">${escapeHtml(q.name)}</div><div class="quest-sub">${escapeHtml(q.sub)}</div></div>
              <span class="quest-xp-badge ${q.xp >= 500 ? 'xp-epic' : q.xp >= 250 ? 'xp-rare' : 'xp-common'}">${q.xp}XP</span>
              <button class="quest-freeze-btn" onclick="toggleFreezeQuest(${globalSnakeIdx})" title="${frozen ? 'Разморозить' : 'Заморозить'}" ondragstart="event.stopPropagation()">${frozen ? '🔥' : '❄️'}</button>
              <button class="quest-freeze-btn" onclick="copyQuest(${globalSnakeIdx})" title="Копировать квест" ondragstart="event.stopPropagation()">📋</button>
              <button class="quest-edit" onclick="openEditQuest(${globalSnakeIdx})" ondragstart="event.stopPropagation()">✏️</button>
              <button class="quest-delete" onclick="deleteQuest(${globalSnakeIdx})" ondragstart="event.stopPropagation()">🗑️</button>
            </div>
            <div class="quest-bottom">
              ${frozen ? `<div class="quest-frozen-label">❄️ заморожен</div>` :
                active ? `
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="quest-metric"><span class="editable" contenteditable="true" data-quest="${globalSnakeIdx}">${cur}</span><span>/${q.max}</span></div>
                <div style="display:flex;gap:6px;align-items:center;">${deadlineHtml}<button class="change-metric-btn" onclick="openChangeMetric('quest',${globalSnakeIdx})">изменить</button></div>
              </div>
              <div class="progress-bar-bg"><div class="progress-bar-fill" id="qbar-${globalSnakeIdx}" style="width:${pct}%"></div></div>
              ` : `<div class="quest-inactive-label">${
                notStarted ? `начнётся ${new Date(q.startDate + 'T00:00:00').toLocaleDateString('ru',{day:'numeric',month:'short'})}` :
                nextDay ? `активен в ${nextDay}` :
                q.repeat?.type === 'once' && q.deadline ? new Date(q.deadline + 'T00:00:00').toLocaleDateString('ru',{day:'numeric',month:'short'}) :
                'не активен сегодня'
              }</div>`}
            </div>`;

          div.addEventListener('dragstart', (e) => {
            dragSrcIndex = globalSnakeIdx;
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
          });
          div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            document.querySelectorAll('.quest-card, .quest-empty').forEach(c => {
              c.classList.remove('drag-over');
              c.style.borderColor = '';
            });
          });
          div.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.querySelectorAll('.quest-card, .quest-empty').forEach(c => c.classList.remove('drag-over'));
            div.classList.add('drag-over');
          });
          div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
          div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.classList.remove('drag-over');
            const targetIdx = parseInt(div.dataset.snakeIdx);
            if (dragSrcIndex === null || dragSrcIndex === targetIdx) return;
            const p = getCurrentPass();
            // SWAP позиций — квест занимает конкретный слот
            const tmp = p.quests[dragSrcIndex];
            p.quests[dragSrcIndex] = p.quests[targetIdx];
            p.quests[targetIdx] = tmp;
            dragSrcIndex = null;
            savePasses();
            renderQuests();
          });
          setupTouchDrag(div, globalSnakeIdx);

        } else if (globalSnakeIdx < maxQ) {
          // Пустой слот — принимает drop
          div.className = 'quest-empty';
          div.dataset.snakeIdx = globalSnakeIdx;
          div.innerHTML = questClipboard
            ? `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;opacity:0.6;"><span style="font-size:14px;">📋</span><span style="font-size:9px;font-weight:700;">вставить</span></div>`
            : `<span style="font-size:18px;opacity:0.3;">+</span>`;
          div.title = questClipboard ? 'Вставить квест' : 'Добавить квест';
          div.style.cursor = 'pointer';
          div.addEventListener('click', () => {
            if (dragSrcIndex !== null) return;
            if (questClipboard) pasteQuest();
            else onAddQuest();
          });
          div.addEventListener('dragover', (e) => { e.preventDefault(); div.style.borderColor = 'var(--accent)'; });
          div.addEventListener('dragleave', () => { div.style.borderColor = ''; });
          div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.style.borderColor = '';
            if (dragSrcIndex === null) return;
            const p = getCurrentPass();
            p.quests = normalizeArray(p.quests);
            // перемещаем квест в пустой слот, старый слот становится null
            const targetIdx = parseInt(div.dataset.snakeIdx);
            // расширяем массив если нужно
            while (p.quests.length <= targetIdx) p.quests.push(null);
            p.quests[targetIdx] = p.quests[dragSrcIndex];
            p.quests[dragSrcIndex] = null;
            trimPassQuestTrailingNulls(p);
            dragSrcIndex = null;
            savePasses();
            renderQuests();
          });
        }

        if (col === 0 && blockIdx > 0) div.style.marginLeft = '20px';
        grid.appendChild(div);
      }
    }
  }
  bindQuestEditables();
  updatePass();
}

function setupTouchDrag(el, snakeIdx) {
  let touchStartX, touchStartY, clone, startScrollLeft;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    dragSrcIndex = snakeIdx;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    startScrollLeft = document.querySelector('.quests-scroll-wrap')?.scrollLeft || 0;
    clone = el.cloneNode(true);
    clone.style.cssText = `position:fixed;opacity:0.8;pointer-events:none;z-index:9999;width:${el.offsetWidth}px;transform:scale(1.05);border-radius:12px;`;
    clone.style.left = touchStartX - el.offsetWidth / 2 + 'px';
    clone.style.top = touchStartY - el.offsetHeight / 2 + 'px';
    document.body.appendChild(clone);
    el.classList.add('dragging');
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (!clone) return;
    e.preventDefault();
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    clone.style.left = tx - el.offsetWidth / 2 + 'px';
    clone.style.top = ty - el.offsetHeight / 2 + 'px';
    document.querySelectorAll('.quest-card').forEach(c => c.classList.remove('drag-over'));
    const target = document.elementFromPoint(tx, ty)?.closest('.quest-card');
    if (target && target !== el) target.classList.add('drag-over');
  }, { passive: false });

  el.addEventListener('touchend', (e) => {
    if (!clone) return;
    const tx = e.changedTouches[0].clientX;
    const ty = e.changedTouches[0].clientY;
    document.body.removeChild(clone);
    clone = null;
    el.classList.remove('dragging');
    document.querySelectorAll('.quest-card').forEach(c => c.classList.remove('drag-over'));
    const target = document.elementFromPoint(tx, ty)?.closest('[data-snake-idx]');
    if (target && dragSrcIndex !== null) {
      const p = getCurrentPass();
      p.quests = normalizeArray(p.quests);
      const targetIdx = parseInt(target.dataset.snakeIdx);
      if (dragSrcIndex !== targetIdx) {
        // swap positions
        while (p.quests.length <= targetIdx) p.quests.push(null);
        const tmp = p.quests[dragSrcIndex];
        p.quests[dragSrcIndex] = p.quests[targetIdx];
        p.quests[targetIdx] = tmp;
        trimPassQuestTrailingNulls(p);
        savePasses();
        renderQuests();
      }
    }
    dragSrcIndex = null;
  });
}

function toggleFreezeQuest(i) {
  const p = getCurrentPass();
  p.quests[i].frozen = !p.quests[i].frozen;
  if (p.quests[i].frozen) {
    showToast('❄️ Квест заморожен');
  } else {
    showToast('🔥 Квест разморожен');
  }
  savePasses();
  renderQuests();
}

function deleteQuest(i) {
  const p = getCurrentPass();
  p.quests = normalizeArray(p.quests);
  const q = p.quests[i];
  if (!q) return;
  if (q.repeat?.type === 'once') {
    const choice = confirm(`«${q.name}» удалится сам в полночь.\n\nНажмите OK чтобы удалить вручную сейчас, или Отмена чтобы подождать.`);
    if (!choice) return;
  } else {
    if (!confirm(`Удалить квест «${q.name}»?`)) return;
  }
  p.quests = normalizeArray(p.quests);
  p.quests[i] = null;
  trimPassQuestTrailingNulls(p);
  savePasses();
  renderQuests();
}

function bindQuestEditables() {
  document.querySelectorAll('.editable[data-quest]').forEach(el => {
    el.addEventListener('blur', function() {
      const p = getCurrentPass();
      const i = parseInt(this.dataset.quest);
      const q = p.quests[i];
      if (!q) return;
      const val = Math.min(Math.max(parseInt(this.innerText) || 0, 0), q.max);
      this.innerText = val;
      const oldVal = q.current || 0;
      q.current = val;
      savePasses();
      const bar = document.getElementById('qbar-' + i);
      if (bar) bar.style.width = ((val / q.max) * 100) + '%';
      this.closest('.quest-card').classList.toggle('done', val >= q.max);
      updatePass();
      // логируем и проверяем QOW/стрик — так же как при изменении через попап
      if (val !== oldVal) {
        const oldPct = Math.min(1, oldVal / q.max);
        const newPct = Math.min(1, val / q.max);
        const delta = newPct - oldPct;
        if (delta > 0) logActivity('quest', {
          name: q.name, passName: p.name || '',
          xp: Math.round(delta * (q.xp || 100)),
          detail: `${val}/${q.max} ${q.unit||''}`.trim(),
        });
      }
      if (val >= q.max) onQuestCompleted(q.name);
      else updateAuthorIfOpen(); // обновить даже если не 100% — для снятия QOW дня
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });
}

// ====== RENDER MEGA QUESTS ======
let mqFocused = -1;

function mqPct(mq) { return Math.min(Math.round(((mq.current || 0) / mq.max) * 100), 100); }

function deleteMega(i) {
  const p = getCurrentPass();
  if (!confirm(`Удалить мегаквест "${p.megaQuests[i].name}"?`)) return;
  p.megaQuests.splice(i, 1);
  savePasses();
  mqFocused = -1;
  renderMega();
}

function renderMega() {
  const megaQuests = getMegaQuests();
  const listEl = document.getElementById('mqList');
  const focusEl = document.getElementById('mqFocus');

  if (megaQuests.length === 0) {
    listEl.innerHTML = '<div class="mq-empty">Нет мегаквестов</div>';
    listEl.classList.remove('hidden');
    focusEl.classList.remove('active');
    document.getElementById('addMegaBtn').disabled = false;
    return;
  }

  if (mqFocused >= 0 && mqFocused < megaQuests.length) {
    listEl.classList.add('hidden');
    focusEl.classList.add('active');
    renderMqFocus(mqFocused);
  } else {
    listEl.classList.remove('hidden');
    focusEl.classList.remove('active');
    renderMqList();
  }
  document.getElementById('addMegaBtn').disabled = false;
}

function renderMqList() {
  const megaQuests = getMegaQuests();
  const listEl = document.getElementById('mqList');
  listEl.innerHTML = megaQuests.map((mq, i) => {
    const pc = mqPct(mq);
    const xp = Math.round(300 + 700 * (mq.max / (mq.max + 100)));
    const earnedXp = Math.round(xp * pc / 100);
    return `<div class="mq-row" draggable="true" data-mqi="${i}"
      ondragstart="mqDragStart(event,${i})"
      ondragover="mqDragOver(event)"
      ondrop="mqDrop(event,${i})"
      ondragleave="mqDragLeave(event)"
      onclick="mqOpenFocus(${i})">
      <div class="mq-row-emoji" style="cursor:grab;">⠿</div>
      <div class="mq-row-emoji">${escapeHtml(mq.emoji)}</div>
      <div class="mq-row-info">
        <div class="mq-row-name">${escapeHtml(mq.name)}</div>
        <div class="mq-row-pct">${pc}% — ${mq.current || 0}/${mq.max} ${mq.unit || 'ед.'}</div>
        <div class="mq-row-bar"><div class="mq-row-fill" style="width:${pc}%"></div></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;">
        <div class="mq-row-arrow">›</div>
        <div class="mq-xp-counter">${earnedXp}/${xp} XP</div>
      </div>
    </div>`;
  }).join('');
}

function mqOpenFocus(i) { mqFocused = i; renderMega(); }
function mqGoBack() { mqFocused = -1; renderMega(); }

function renderMqFocus(i) {
  const megaQuests = getMegaQuests();
  const mq = megaQuests[i];
  const tasks = normalizeArray(mq.tasks);
  let cur, maxVal;
  if (mq.taskMode) {
    cur = tasks.filter(t => t.done).length;
    maxVal = Math.max(mq.minMetric || 0, tasks.length);
    mq.current = cur; mq.max = maxVal;
  } else {
    cur = mq.current || 0; maxVal = mq.max;
  }
  const pc = maxVal > 0 ? Math.min(Math.round((cur / maxVal) * 100), 100) : 0;
  const taskItems = tasks.map((t, ti) => `
    <div class="mega-task-item" id="task-item-${i}-${ti}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${i},${ti},this.checked)">
      <span class="${t.done ? 'done-task' : ''}" ondblclick="editTaskInline(${i},${ti})">${escapeHtml(t.text)}</span>
      <button class="task-edit-btn" onclick="editTaskInline(${i},${ti})" title="Редактировать">✏️</button>
      <button class="task-delete-btn" onclick="deleteTask(${i},${ti})" title="Удалить">✕</button>
    </div>`).join('');

  document.getElementById('mqFocusCard').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
      <button class="mq-back-btn" onclick="mqGoBack()" title="Закрыть">✕</button>
      <div style="display:flex;gap:6px;">
        <button class="mega-edit" onclick="openEditMega(${i})" title="Редактировать">✏️</button>
        <button class="popup-btn primary" onclick="completeMega(${i})" style="font-size:11px;padding:4px 10px;">✓ Завершить</button>
        <button class="mega-delete" onclick="deleteMega(${i})" title="Удалить мегаквест">🗑️</button>
      </div>
    </div>
    <div class="flang-emoji-area">${escapeHtml(mq.emoji)}</div>
    <div class="flang-desc-area"><div class="flang-title">${escapeHtml(mq.name)}</div><div class="flang-subtitle">${escapeHtml(mq.sub)}</div></div>
    <div style="flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:6px;justify-content:space-between;">
        <button class="mega-tasks-toggle" onclick="toggleTasksPanel(${i})">📋 Задачи <span id="task-count-${i}">(${tasks.length})</span> ▾</button>
        <button class="mega-task-clear-btn" onclick="clearTasks(${i})">Очистить</button>
      </div>
      <div class="mega-tasks-panel open" id="tasks-panel-${i}">
        ${taskItems}
        <div class="mega-task-add">
          <input class="mega-task-input" id="task-input-${i}" placeholder="Новая задача..." maxlength="120" onkeydown="if(event.key==='Enter') addTask(${i})">
          <button class="mega-task-add-btn" onclick="addTask(${i})">+</button>
        </div>
      </div>
    </div>
    <div class="flang-bar-area">
      <div class="flang-metric-row">
        <span>${mq.unit || (mq.taskMode ? 'задач' : 'ед.')}</span>
        <div style="display:flex;gap:2px;align-items:center;">
          ${mq.taskMode ? `<span style="font-weight:800;color:var(--text);">${cur}</span>` : `<span class="editable" contenteditable="true" data-mega="${i}">${cur}</span>`}
          <span>/${maxVal}</span>
        </div>
      </div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" id="mbar-${i}" style="width:${pc}%"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
        <button class="change-metric-btn" onclick="openChangeMetric('mega',${i})">изменить прогресс</button>
        <div class="mq-xp-counter" style="font-size:11px;">${Math.round((300 + 700 * (maxVal / (maxVal + 100))) * pc / 100)} / ${Math.round(300 + 700 * (maxVal / (maxVal + 100)))} XP</div>
      </div>
    </div>`;

  const rest = megaQuests.filter((_, j) => j !== i);
  document.getElementById('mqStacked').innerHTML = rest.map(mq2 => {
    const ri = megaQuests.indexOf(mq2);
    return `<div class="mq-stacked-row" onclick="mqOpenFocus(${ri})">
      <div class="mq-stacked-emoji">${escapeHtml(mq2.emoji)}</div>
      <div class="mq-stacked-name">${escapeHtml(mq2.name)}</div>
      <div class="mq-stacked-pct">${mqPct(mq2)}%</div>
    </div>`;
  }).join('');
  document.querySelector('.mq-stacked-label').style.display = rest.length > 0 ? '' : 'none';
  bindMegaEditables();
}

function bindMegaEditables() {
  document.querySelectorAll('.editable[data-mega]').forEach(el => {
    el.addEventListener('blur', function() {
      const p = getCurrentPass();
      const i = parseInt(this.dataset.mega);
      const val = Math.min(Math.max(parseInt(this.innerText) || 0, 0), p.megaQuests[i].max);
      this.innerText = val;
      p.megaQuests[i].current = val;
      savePasses();
      const bar = document.getElementById('mbar-' + i);
      if (bar) bar.style.width = ((val / p.megaQuests[i].max) * 100) + '%';
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });
}

// ====== POPUPS ======
function closePopup(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'createPassOverlay') pendingPassType = null;
}
function closePopupOutside(e, id) { if (e.target === document.getElementById(id)) closePopup(id); }

function openQuestPopup() {
  selectedQuestEmoji = EMOJIS[0];
  selectedQuestDays = [];
  renderEmojiGrid('questEmojiGrid', selectedQuestEmoji, pickQuestEmoji);
  document.getElementById('questName').value = '';
  document.getElementById('questSub').value = '';
  document.getElementById('questMetric').value = '';
  document.getElementById('questDeadline').value = '';
  document.getElementById('questDeadline').disabled = false;
  document.getElementById('questDeadlineActiveDay').checked = false;
  document.getElementById('questDeadlineActiveDayWrap').style.display = 'none';
  document.getElementById('questTrackDebt').checked = false;
  document.getElementById('questStartDate').value = '';
  document.querySelectorAll('.xp-opt').forEach((o,i) => o.classList.toggle('selected', i === 0));
  // reset repeat tabs
  document.querySelectorAll('#questRepeatTabs .repeat-tab').forEach((t,i) => t.classList.toggle('active', i===0));
  document.getElementById('questRepeatExtra').style.display = 'none';
  document.getElementById('questRepeatExtra').innerHTML = '';
  setQuestXpFieldsVisible(!isFocusPass());
  document.getElementById('questPopupOverlay').classList.add('open');
}

function openMegaPopup() {
  selectedMegaEmoji = EMOJIS[0];
  renderEmojiGrid('megaEmojiGrid', selectedMegaEmoji, pickMegaEmoji);
  document.getElementById('megaName').value = '';
  document.getElementById('megaSub').value = '';
  document.getElementById('megaMetric').value = '';
  document.getElementById('megaUnit').value = '';
  document.getElementById('megaTaskMode').checked = false;
  document.getElementById('megaMetricField').querySelector('.popup-label').textContent = 'Метрика (максимум)';
  document.getElementById('megaPopupOverlay').classList.add('open');
}

function toggleMegaTaskMode() {
  const checked = document.getElementById('megaTaskMode').checked;
  document.getElementById('megaMetricField').querySelector('.popup-label').textContent = checked ? 'Минимальное количество задач' : 'Метрика (максимум)';
  const unitInput = document.getElementById('megaUnit');
  if (checked && !unitInput.value.trim()) unitInput.value = 'задач';
}

function toggleEditMegaTaskMode() {
  const checked = document.getElementById('editMegaTaskMode').checked;
  document.getElementById('editMegaMetricField').querySelector('.popup-label').textContent = checked ? 'Минимальное количество задач' : 'Метрика (максимум)';
  const unitInput = document.getElementById('editMegaUnit');
  if (checked && !unitInput.value.trim()) unitInput.value = 'задач';
}

function addQuest() {
  const p = getCurrentPass();
  const name = document.getElementById('questName').value.trim();
  const sub = document.getElementById('questSub').value.trim();
  const metric = parseInt(document.getElementById('questMetric').value);
  const xpEl = document.querySelector('.xp-opt.selected');
  const xp = isFocusPass(p) ? getPassFixedQuestXp(p) : (xpEl ? parseInt(xpEl.dataset.xp) : 100);
  const repeat = getRepeatFromPopup('questRepeatTabs');
  const deadlineActiveDay = repeat.type === 'weekly' && document.getElementById('questDeadlineActiveDay').checked;
  const deadline = deadlineActiveDay ? null : (document.getElementById('questDeadline').value || null);
  const trackDebt = document.getElementById('questTrackDebt').checked;
  const startDate = document.getElementById('questStartDate').value || null;
  if (!name || !metric || metric < 1) { showToast('Заполни название и метрику!'); return; }
  const newQuest = { id: uid(), emoji: selectedQuestEmoji, name, sub: sub || '', max: metric, xp, current: 0, repeat, deadline, deadlineActiveDay, trackDebt, startDate };
  p.quests = normalizeArray(p.quests);
  // найти первый свободный слот
  const firstNull = p.quests.indexOf(null);
  if (firstNull !== -1) {
    p.quests[firstNull] = newQuest;
  } else {
    p.quests.push(newQuest);
  }
  savePasses();
  closePopup('questPopupOverlay');
  renderQuests();
  checkAchievements(false);
}

function addMega() {
  const p = getCurrentPass();
  const name = document.getElementById('megaName').value.trim();
  const sub = document.getElementById('megaSub').value.trim();
  const metric = parseInt(document.getElementById('megaMetric').value) || 0;
  const unit = document.getElementById('megaUnit').value.trim();
  const taskMode = document.getElementById('megaTaskMode').checked;
  if (!name) { showToast('Заполни название!'); return; }
  if (!taskMode && (!metric || metric < 1)) { showToast('Заполни метрику!'); return; }
  p.megaQuests.push({ id: uid(), emoji: selectedMegaEmoji, name, sub: sub || '', max: metric || 1, minMetric: metric || 0, unit: unit || (taskMode ? 'задач' : 'ед.'), current: 0, taskMode });
  savePasses();
  closePopup('megaPopupOverlay');
  mqFocused = p.megaQuests.length - 1;
  renderMega();
}

// ====== LIMITS ======
function onAddMega() {
  const p = getCurrentPass();
  const limit = userIsPro ? 5 : 3;
  if (normalizeArray(p?.megaQuests).length >= limit) { openSubPopup(); return; }
  openMegaPopup();
}

function onAddQuest() {
  const p = getCurrentPass();
  const limit = getPassQuestLimit(p);
  const filled = normalizeArray(p?.quests).filter(q => q !== null).length;
  if (filled >= limit) { openSubPopup(); return; }
  openQuestPopup();
}

// ====== EDIT QUEST ======
let editQuestIndex = -1;
let editQuestEmoji = EMOJIS[0];

function openEditQuest(i) {
  editQuestIndex = i;
  const q = getCurrentPass().quests[i];
  editQuestEmoji = q.emoji;
  editQuestDays = q.repeat?.days ? [...q.repeat.days] : [];
  renderEmojiGrid('editQuestEmojiGrid', editQuestEmoji, (el, e) => { editQuestEmoji = e; document.querySelectorAll('#editQuestEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); });
  document.getElementById('editQuestName').value = q.name;
  document.getElementById('editQuestSub').value = q.sub;
  document.getElementById('editQuestMetric').value = q.max;
  document.getElementById('editQuestDeadline').value = q.deadline || '';
  document.querySelectorAll('#editXpOptions .xp-opt').forEach(o => o.classList.toggle('selected', parseInt(o.dataset.xp) === q.xp));
  // set repeat tabs
  const repeatType = q.repeat?.type || 'daily';
  document.querySelectorAll('#editQuestRepeatTabs .repeat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === repeatType);
  });
  const extra = document.getElementById('editQuestRepeatExtra');
  if (repeatType === 'weekly') {
    extra.style.display = '';
    extra.innerHTML = `<div class="days-grid">${DAYS.map((d, di) =>
      `<div class="day-btn ${editQuestDays.includes(di) ? 'active' : ''}" onclick="toggleDay(this,${di},'editQuestRepeatTabs')">${d}</div>`
    ).join('')}</div>`;
  } else {
    extra.style.display = 'none';
    extra.innerHTML = '';
  }
  // restore deadline active day
  const activeDayWrap = document.getElementById('editQuestDeadlineActiveDayWrap');
  const activeDayCheck = document.getElementById('editQuestDeadlineActiveDay');
  const editDeadlineInput = document.getElementById('editQuestDeadline');
  if (repeatType === 'weekly') {
    activeDayWrap.style.display = 'flex';
    activeDayCheck.checked = !!q.deadlineActiveDay;
    if (q.deadlineActiveDay) {
      editDeadlineInput.disabled = true;
      editDeadlineInput.value = '';
      editDeadlineInput.placeholder = 'авто — ближайший активный день';
    } else {
      editDeadlineInput.disabled = false;
      editDeadlineInput.placeholder = '';
    }
  } else {
    activeDayWrap.style.display = 'none';
    activeDayCheck.checked = false;
    editDeadlineInput.disabled = false;
  }
  document.getElementById('editQuestTrackDebt').checked = !!q.trackDebt;
  document.getElementById('editQuestStartDate').value = q.startDate || '';
  setQuestXpFieldsVisible(!isFocusPass());
  document.getElementById('editQuestOverlay').classList.add('open');
}

function selectEditXP(el) { document.querySelectorAll('#editXpOptions .xp-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); }

function saveEditQuest() {
  const p = getCurrentPass();
  const name = document.getElementById('editQuestName').value.trim();
  const sub = document.getElementById('editQuestSub').value.trim();
  const metric = parseInt(document.getElementById('editQuestMetric').value);
  const xpEl = document.querySelector('#editXpOptions .xp-opt.selected');
  const xp = isFocusPass(p) ? (p.quests[editQuestIndex].xp || getPassFixedQuestXp(p)) : (xpEl ? parseInt(xpEl.dataset.xp) : p.quests[editQuestIndex].xp);
  const repeat = getRepeatFromPopup('editQuestRepeatTabs');
  const deadlineActiveDay = repeat.type === 'weekly' && document.getElementById('editQuestDeadlineActiveDay').checked;
  const deadline = deadlineActiveDay ? null : (document.getElementById('editQuestDeadline').value || null);
  const trackDebt = document.getElementById('editQuestTrackDebt').checked;
  const startDate = document.getElementById('editQuestStartDate').value || null;
  if (!name || !metric || metric < 1) { showToast('Заполни название и метрику!'); return; }
  p.quests[editQuestIndex] = { ...p.quests[editQuestIndex], emoji: editQuestEmoji, name, sub, max: metric, xp, repeat, deadline, deadlineActiveDay, trackDebt, startDate };
  savePasses();
  closePopup('editQuestOverlay');
  renderQuests();
}

// ====== EDIT MEGA ======
let editMegaIndex = -1;
let editMegaEmoji = EMOJIS[0];

function openEditMega(i) {
  editMegaIndex = i;
  const mq = getMegaQuests()[i];
  editMegaEmoji = mq.emoji;
  renderEmojiGrid('editMegaEmojiGrid', editMegaEmoji, (el, e) => { editMegaEmoji = e; document.querySelectorAll('#editMegaEmojiGrid .emoji-opt').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); });
  document.getElementById('editMegaName').value = mq.name;
  document.getElementById('editMegaSub').value = mq.sub;
  document.getElementById('editMegaMetric').value = mq.taskMode ? (mq.minMetric || 0) : mq.max;
  document.getElementById('editMegaUnit').value = mq.unit || '';
  const tm = document.getElementById('editMegaTaskMode');
  tm.checked = !!mq.taskMode;
  document.getElementById('editMegaMetricField').querySelector('.popup-label').textContent = mq.taskMode ? 'Минимальное количество задач' : 'Метрика (максимум)';
  document.getElementById('editMegaOverlay').classList.add('open');
}

function saveEditMega() {
  const p = getCurrentPass();
  const name = document.getElementById('editMegaName').value.trim();
  const sub = document.getElementById('editMegaSub').value.trim();
  const metric = parseInt(document.getElementById('editMegaMetric').value) || 0;
  const unit = document.getElementById('editMegaUnit').value.trim();
  const taskMode = document.getElementById('editMegaTaskMode').checked;
  if (!name) { showToast('Заполни название!'); return; }
  if (!taskMode && (!metric || metric < 1)) { showToast('Заполни метрику!'); return; }
  p.megaQuests[editMegaIndex] = { ...p.megaQuests[editMegaIndex], emoji: editMegaEmoji, name, sub, max: taskMode ? Math.max(metric, (p.megaQuests[editMegaIndex].tasks || []).length) : metric, minMetric: metric, unit: unit || (taskMode ? 'задач' : 'ед.'), taskMode };
  savePasses();
  closePopup('editMegaOverlay');
  mqFocused = editMegaIndex;
  renderMega();
}

// ====== MEGA TASKS ======
function toggleTasksPanel(i) { const panel = document.getElementById('tasks-panel-' + i); if (panel) panel.classList.toggle('open'); }

function addTask(i) {
  const p = getCurrentPass();
  const input = document.getElementById('task-input-' + i);
  const text = input.value.trim();
  if (!text) return;
  if (!p.megaQuests[i].tasks) p.megaQuests[i].tasks = [];
  p.megaQuests[i].tasks.push({ text, done: false });
  savePasses();
  renderMqFocus(i);
  setTimeout(() => {
    const panel = document.getElementById('tasks-panel-' + i);
    if (panel) panel.classList.add('open');
    const newInput = document.getElementById('task-input-' + i);
    if (newInput) newInput.focus();
  }, 10);
}

function deleteTask(i, ti) {
  const p = getCurrentPass();
  p.megaQuests[i].tasks.splice(ti, 1);
  savePasses();
  renderMqFocus(i);
  setTimeout(() => {
    const panel = document.getElementById('tasks-panel-' + i);
    if (panel) panel.classList.add('open');
  }, 10);
}

function editTaskInline(i, ti) {
  const p = getCurrentPass();
  const task = p.megaQuests[i].tasks[ti];
  const itemEl = document.getElementById(`task-item-${i}-${ti}`);
  if (!itemEl) return;

  const span = itemEl.querySelector('span');
  const editBtn = itemEl.querySelector('.task-edit-btn');
  const deleteBtn = itemEl.querySelector('.task-delete-btn');

  // Replace span with input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-inline-input';
  input.value = task.text;
  input.maxLength = 120;
  span.replaceWith(input);
  editBtn.style.display = 'none';
  deleteBtn.style.display = 'none';
  input.focus();
  input.select();

  function save() {
    const newText = input.value.trim();
    if (newText) p.megaQuests[i].tasks[ti].text = newText;
    savePasses();
    renderMqFocus(i);
    setTimeout(() => {
      const panel = document.getElementById('tasks-panel-' + i);
      if (panel) panel.classList.add('open');
    }, 10);
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = task.text; input.blur(); }
  });
}

function clearTasks(i) {
  if (!confirm('Удалить все задачи этого мегаквеста?')) return;
  p.megaQuests[i].tasks = [];
  savePasses();
  renderMqFocus(i);
}

function toggleTask(i, ti, checked) {
  const p = getCurrentPass();
  if (!p.megaQuests[i].tasks) return;
  p.megaQuests[i].tasks[ti].done = checked;
  savePasses();
  if (p.megaQuests[i].taskMode) {
    renderMqFocus(i);
    setTimeout(() => { const panel = document.getElementById('tasks-panel-' + i); if (panel) panel.classList.add('open'); }, 10);
  } else {
    const span = document.querySelector(`#tasks-panel-${i} .mega-task-item:nth-child(${ti+1}) span`);
    if (span) span.classList.toggle('done-task', checked);
  }
}

// ====== CHANGE METRIC ======
let changeMetricType = '';
let changeMetricIndex = -1;

function handleMetricOverlayMousedown(e) {
  if (e.target === document.getElementById('changeMetricOverlay')) {
    closePopup('changeMetricOverlay');
  }
} // 'abs' или 'pct'
let changeMetricMax = 0;

function setMetricMode(mode) {
  metricMode = mode;
  document.getElementById('metricModeAbs').classList.toggle('active', mode === 'abs');
  document.getElementById('metricModePct').classList.toggle('active', mode === 'pct');
  const inputEl = document.getElementById('changeMetricInput');
  const unitEl = document.getElementById('changeMetricUnit');
  const hintEl = document.getElementById('changeMetricHint');
  if (mode === 'pct') {
    inputEl.max = 100;
    inputEl.min = 0;
    unitEl.textContent = '%';
    const curVal = parseInt(inputEl.value) || 0;
    const pct = Math.round((curVal / changeMetricMax) * 100);
    inputEl.value = pct;
    hintEl.textContent = `= ${Math.round(pct / 100 * changeMetricMax)} из ${changeMetricMax}`;
    setTimeout(() => { inputEl.focus(); inputEl.select(); }, 10);
  } else {
    inputEl.max = changeMetricMax;
    inputEl.min = 0;
    unitEl.textContent = `/ ${changeMetricMax}`;
    const pct = parseInt(inputEl.value) || 0;
    inputEl.value = Math.round(pct / 100 * changeMetricMax);
    hintEl.textContent = '';
  }
  inputEl.addEventListener('input', updateMetricHint);
}

function updateMetricHint() {
  const hintEl = document.getElementById('changeMetricHint');
  const val = parseInt(document.getElementById('changeMetricInput').value) || 0;
  if (metricMode === 'pct') {
    hintEl.textContent = `= ${Math.round(val / 100 * changeMetricMax)} из ${changeMetricMax}`;
  } else {
    hintEl.textContent = `= ${Math.round(val / changeMetricMax * 100)}%`;
  }
}

function openChangeMetric(type, i) {
  changeMetricType = type; changeMetricIndex = i;
  metricMode = 'abs';
  const p = getCurrentPass();
  const titleEl = document.getElementById('changeMetricTitle');
  const labelEl = document.getElementById('changeMetricLabel');
  const inputEl = document.getElementById('changeMetricInput');
  const unitEl = document.getElementById('changeMetricUnit');
  const hintEl = document.getElementById('changeMetricHint');
  document.getElementById('metricModeAbs').classList.add('active');
  document.getElementById('metricModePct').classList.remove('active');

  if (type === 'quest') {
    const q = p.quests[i];
    changeMetricMax = q.max;
    titleEl.textContent = 'Изменить прогресс';
    labelEl.textContent = `Текущее значение`;
    inputEl.max = q.max;
    inputEl.value = q.current || 0;
  } else {
    const mq = p.megaQuests[i];
    changeMetricMax = mq.max;
    titleEl.textContent = 'Изменить прогресс';
    labelEl.textContent = `Текущее значение`;
    inputEl.max = mq.max;
    inputEl.value = mq.current || 0;
  }
  unitEl.textContent = `/ ${changeMetricMax}`;
  hintEl.textContent = `= ${Math.round((parseInt(inputEl.value) || 0) / changeMetricMax * 100)}%`;
  inputEl.removeEventListener('input', updateMetricHint);
  inputEl.addEventListener('input', updateMetricHint);
  document.getElementById('changeMetricOverlay').classList.add('open');
  setTimeout(() => { inputEl.focus(); inputEl.select(); }, 100);
}

function saveMetricChange() {
  const p = getCurrentPass();
  const inputEl = document.getElementById('changeMetricInput');
  let val;
  if (metricMode === 'pct') {
    const pct = Math.min(Math.max(parseInt(inputEl.value) || 0, 0), 100);
    val = Math.round(pct / 100 * changeMetricMax);
  } else {
    val = Math.min(Math.max(parseInt(inputEl.value) || 0, 0), changeMetricMax);
  }
  if (changeMetricType === 'debt') {
    const debts = getDebts();
    if (debts[changeDebtIndex]) {
      debts[changeDebtIndex].current = val;
      if (val >= debts[changeDebtIndex].max) {
        debts.splice(changeDebtIndex, 1);
        showToast('✅ Долг закрыт!');
      }
      saveDebts(debts);
      updateDebtBadge();
      closePopup('changeMetricOverlay');
      renderDebtList();
    }
  } else if (changeMetricType === 'quest') {
    const q = p.quests[changeMetricIndex];
    if (!q) { showToast('Ошибка: квест не найден'); return; }
    const oldPct = Math.min(1, (q.current || 0) / q.max);
    q.current = val;
    const newPct = Math.min(1, val / q.max);
    const delta = newPct - oldPct;
    // XP теперь считается live через getTotalAuthorXP()
    if (val >= q.max) onQuestCompleted(q.name);
    // логируем изменение
    if (delta > 0) {
      const p2 = getCurrentPass();
      logActivity('quest', {
        name: q.name,
        passName: p2?.name || '',
        xp: Math.round(delta * (q.xp || 100)),
        detail: `${val}/${q.max} ${q.unit||''}`.trim(),
      });
    }
    savePasses();
    closePopup('changeMetricOverlay');
    renderQuests();
    updateAuthorIfOpen();
  } else {
    p.megaQuests[changeMetricIndex].current = val;
    savePasses();
    closePopup('changeMetricOverlay');
    renderMqFocus(changeMetricIndex);
  }
}

// ====== MEGAQUEST DRAG REORDER ======
let mqDragSrc = null;
function mqDragStart(e, i) { mqDragSrc = i; e.dataTransfer.effectAllowed = 'move'; e.currentTarget.style.opacity = '0.5'; }
function mqDragOver(e) { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }
function mqDragLeave(e) { e.currentTarget.style.borderColor = ''; }
function mqDrop(e, i) {
  e.preventDefault();
  e.currentTarget.style.borderColor = '';
  e.currentTarget.style.opacity = '';
  if (mqDragSrc === null || mqDragSrc === i) return;
  const p = getCurrentPass();
  const mqs = p.megaQuests;
  const dragged = mqs.splice(mqDragSrc, 1)[0];
  mqs.splice(i, 0, dragged);
  mqDragSrc = null;
  savePasses();
  renderMega();
}

// ====== THEME PREVIEW ======
const THEME_PREVIEW_DATA = {
  huntrxh: {
    name: 'UNIT-02', steps: ['color','gradient','border'], stepLabels: ['Цвет','Градиент','Рамки'],
    dark: { bg:'#0e0b1f', accent:'#A78BFA', text:'#EDE9FF', cardBg:'rgba(45,40,100,0.4)', borderColor:'rgba(167,139,250,0.2)', mesh:'radial-gradient(ellipse at 20% 50%, rgba(123,47,247,0.3) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(45,212,191,0.2) 0%, transparent 50%)', glowBorder:'rgba(167,139,250,0.6)', glowShadow:'0 4px 20px rgba(167,139,250,0.3), 0 0 0 1px rgba(167,139,250,0.3)' },
    light: { bg:'#F0EEFF', accent:'#7B6FD4', text:'#1a1540', cardBg:'rgba(255,255,255,0.75)', borderColor:'rgba(123,111,212,0.2)', mesh:'radial-gradient(ellipse at 20% 50%, rgba(123,111,212,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(45,212,191,0.12) 0%, transparent 50%)', glowBorder:'rgba(123,111,212,0.5)', glowShadow:'0 4px 20px rgba(123,111,212,0.2), 0 0 0 1px rgba(123,111,212,0.25)' }
  },
  zoi: {
    name: 'Зои', steps: ['color','gradient','border'], stepLabels: ['Цвет','Градиент','Рамки'],
    dark: { bg:'#080d1a', accent:'#4566BB', text:'#dde8ff', cardBg:'rgba(27,67,108,0.4)', borderColor:'rgba(69,102,187,0.25)', mesh:'radial-gradient(ellipse at 25% 40%, rgba(69,102,187,0.35) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(210,125,164,0.25) 0%, transparent 50%)', glowBorder:'rgba(69,102,187,0.65)', glowShadow:'0 4px 20px rgba(69,102,187,0.35), 0 0 0 1px rgba(69,102,187,0.35)' },
    light: { bg:'#eef2ff', accent:'#4566BB', text:'#0d1a3a', cardBg:'rgba(255,255,255,0.8)', borderColor:'rgba(69,102,187,0.2)', mesh:'radial-gradient(ellipse at 25% 40%, rgba(69,102,187,0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(210,125,164,0.1) 0%, transparent 50%)', glowBorder:'rgba(69,102,187,0.45)', glowShadow:'0 4px 18px rgba(69,102,187,0.2), 0 0 0 1px rgba(69,102,187,0.25)' }
  },
  mira: {
    name: 'Мира', steps: ['color','gradient','border'], stepLabels: ['Цвет','Градиент','Рамки'],
    dark: { bg:'#160810', accent:'#CF5C86', text:'#ffe8ef', cardBg:'rgba(74,28,41,0.45)', borderColor:'rgba(207,92,134,0.25)', mesh:'radial-gradient(ellipse at 30% 50%, rgba(207,92,134,0.32) 0%, transparent 55%), radial-gradient(ellipse at 70% 25%, rgba(244,185,190,0.2) 0%, transparent 50%)', glowBorder:'rgba(207,92,134,0.65)', glowShadow:'0 4px 20px rgba(207,92,134,0.35), 0 0 0 1px rgba(207,92,134,0.35)' },
    light: { bg:'#fff0f4', accent:'#CF5C86', text:'#3a0a17', cardBg:'rgba(255,255,255,0.8)', borderColor:'rgba(207,92,134,0.2)', mesh:'radial-gradient(ellipse at 30% 50%, rgba(207,92,134,0.1) 0%, transparent 55%), radial-gradient(ellipse at 70% 25%, rgba(244,185,190,0.15) 0%, transparent 50%)', glowBorder:'rgba(207,92,134,0.45)', glowShadow:'0 4px 18px rgba(207,92,134,0.2), 0 0 0 1px rgba(207,92,134,0.25)' }
  },
  rumi: {
    name: 'Руми ✦', steps: ['color','gradient','border'], stepLabels: ['Цвет','Градиент','Рамки'],
    dark: { bg:'#0d0c18', accent:'#867DCE', text:'#ede8ff', cardBg:'rgba(64,62,114,0.4)', borderColor:'rgba(134,125,206,0.25)', mesh:'radial-gradient(ellipse at 20% 60%, rgba(134,125,206,0.3) 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(174,109,166,0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(232,150,10,0.15) 0%, transparent 40%)', glowBorder:'rgba(232,180,60,0.7)', glowShadow:'0 4px 24px rgba(232,150,10,0.3), 0 0 0 1px rgba(232,180,60,0.5)' },
    light: { bg:'#f4f2ff', accent:'#867DCE', text:'#1a1540', cardBg:'rgba(255,255,255,0.8)', borderColor:'rgba(134,125,206,0.2)', mesh:'radial-gradient(ellipse at 20% 60%, rgba(134,125,206,0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(174,109,166,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(232,150,10,0.08) 0%, transparent 40%)', glowBorder:'rgba(200,160,40,0.55)', glowShadow:'0 4px 20px rgba(200,160,40,0.2), 0 0 0 1px rgba(200,160,40,0.4)' }
  }
};

let pvActiveSteps = {};

function openThemePreview(themeId) {
  const data = THEME_PREVIEW_DATA[themeId];
  if (!data) { showToast('Предпросмотр скоро будет доступен!'); return; }

  pvActiveSteps = {};
  data.steps.forEach(s => pvActiveSteps[s] = true);

  pvIsDark = true;
  document.getElementById('pvDarkToggle').textContent = '🌙 Тёмная';
  const titleEl = document.getElementById('themePreviewTitle');
  titleEl.textContent = `Предпросмотр · ${data.name}`;
  titleEl.dataset.themeId = themeId;
  renderThemePreviewToggles(themeId);
  applyThemePreview(themeId);
  document.getElementById('themePreviewOverlay').classList.add('open');
}

function renderThemePreviewToggles(themeId) {
  const data = THEME_PREVIEW_DATA[themeId];
  const container = document.getElementById('themePreviewToggles');
  container.innerHTML = data.steps.map((s, i) => `
    <div class="repeat-tab ${pvActiveSteps[s] ? 'active' : ''}"
      onclick="togglePvStep('${themeId}','${s}',this)"
      style="cursor:pointer;user-select:none;">
      ${data.stepLabels[i]}
    </div>`).join('');
}

let pvIsDark = true;

function togglePvDark() {
  pvIsDark = !pvIsDark;
  const btn = document.getElementById('pvDarkToggle');
  btn.textContent = pvIsDark ? '🌙 Тёмная' : '☀️ Светлая';
  const themeId = document.getElementById('themePreviewTitle').dataset.themeId;
  if (themeId) applyThemePreview(themeId);
}

function togglePvStep(themeId, step, el) {
  pvActiveSteps[step] = !pvActiveSteps[step];
  el.classList.toggle('active', pvActiveSteps[step]);
  applyThemePreview(themeId);
}

function applyThemePreview(themeId) {
  const data = THEME_PREVIEW_DATA[themeId];
  const area = document.getElementById('themePreviewArea');
  const cards = area.querySelectorAll('.pv-quest-card');
  const bar = document.getElementById('pvPassBar');
  const title = document.getElementById('pvPassTitle');

  const palette = pvIsDark ? data.dark : data.light;

  // step 1: color
  if (pvActiveSteps['color']) {
    area.style.background = palette.bg;
    area.style.backgroundImage = '';
    title.style.color = palette.text;
    bar.style.background = palette.accent;
    cards.forEach(c => {
      c.style.background = palette.cardBg;
      c.style.borderColor = palette.borderColor;
      c.style.boxShadow = '';
      c.querySelectorAll('.pv-quest-name').forEach(n => n.style.color = palette.text);
      c.querySelectorAll('.pv-quest-fill').forEach(f => f.style.background = palette.accent);
    });
  } else {
    area.style.background = 'var(--surface)';
    area.style.backgroundImage = '';
    title.style.color = 'var(--text)';
    bar.style.background = 'var(--accent)';
    cards.forEach(c => {
      c.style.background = 'var(--card-bg)';
      c.style.borderColor = 'var(--border)';
      c.style.boxShadow = '';
      c.querySelectorAll('.pv-quest-name').forEach(n => n.style.color = 'var(--text)');
      c.querySelectorAll('.pv-quest-fill').forEach(f => f.style.background = 'var(--accent)');
    });
  }

  // step 2: gradient mesh
  if (pvActiveSteps['gradient'] && pvActiveSteps['color']) {
    area.style.backgroundImage = palette.mesh;
  }

  // step 3: border glow
  cards.forEach(c => {
    if (pvActiveSteps['border'] && pvActiveSteps['color']) {
      c.style.borderColor = palette.glowBorder;
      c.style.boxShadow = palette.glowShadow;
    } else if (pvActiveSteps['color']) {
      c.style.borderColor = palette.borderColor;
      c.style.boxShadow = '';
    }
  });
}

// ====== ONBOARDING ======
const ONBOARDING_STEPS = [
  {
    emoji: '👋',
    title: 'Хэй! Добро пожаловать в PASS IT',
    text: 'Здесь ты превращаешь свои цели в квесты, фармишь опыт и открываешь оформления — как в любимых играх, только в реальной жизни 😉 Расскажу всё по порядку.',
    highlight: null, pos: 'center'
  },
  {
    emoji: '🗂️',
    title: 'Твои пассы',
    text: 'Каждый пасс — отдельная сфера жизни: учёба, спорт, проекты. Создавай, переименовывай, переключайся. На Free плане доступен один пасс — хочешь больше, прокачай план 😜',
    highlight: '.pass-menu-wrap', pos: 'right', arrow: 'left'
  },
  {
    emoji: '⚡',
    title: 'Квесты — твои ежедневные задачи',
    text: 'При создании задаёшь название, метрику, повторяемость и опыт за выполнение. Перетаскивай квесты как удобно, замораживай временно неактуальные. Счётчик XP дня — на полоске пасса.',
    highlight: '.quests-section', pos: 'left', arrow: 'right'
  },
  {
    emoji: '🏆',
    title: 'Мегаквесты — большие цели',
    text: 'Задачи которые не закроешь за день. Составляй список внутри, отслеживай метрику, и когда готово — завершай. Мегаквест уходит в архив, а опыт засчитывается в еженедельный прогресс.',
    highlight: '.flangs-section', pos: 'right', arrow: 'left'
  },
  {
    emoji: '🌅',
    title: 'Сброс дня и долги',
    text: 'Каждый день начинается заново — прогресс квестов обнуляется, а невыполненные уходят в долговую книгу. Там можно доделать их позже. Это не штраф, просто память 🙂',
    highlight: '.header-btn', pos: 'top', arrow: 'down'
  },
  {
    emoji: '📈',
    title: 'Авторский пасс',
    text: 'Сезонный трек на 150 уровней — 500 XP равно одному уровню. Выполняй ежедневные задания, закрывай еженедельные цели, поддерживай стрик хотя бы 4 дня из 7. Есть 3 заморозки в неделю.',
    highlight: '.pass-switch-wrap', pos: 'top', arrow: 'down',
    action: () => { if (!authorScreenOpen) toggleAuthorScreen(); }
  },
  {
    emoji: '📦',
    title: 'Боксы и оформления',
    text: 'За уровни авторского пасса получаешь боксы с кусочками сезонных тем. В этом сезоне три темы: Мира, Зои и Руми ✦ — каждая открывается поэтапно. Руми легендарная — там особый финал.',
    highlight: null, pos: 'center',
    action: () => { if (authorScreenOpen) toggleAuthorScreen(); }
  },
  {
    emoji: '🔥',
    title: 'Всё готово!',
    text: 'Создай первый квест и начни сезон. Первый сезон скоро начнётся — всё готово! 🔥',
    highlight: null, pos: 'center', isLast: true
  }
];

let onboardingStep = 0;

function showOnboarding() {
  // закрываем все открытые попапы
  document.querySelectorAll('.popup-overlay.open, .theme-overlay.open, .left-menu-overlay.open').forEach(el => {
    el.classList.remove('open');
  });
  document.getElementById('newDayOverlay').style.display = 'none';
  onboardingStep = 0;
  document.getElementById('onboardingOverlay').style.display = 'block';
  renderOnboardingStep();
}

function applyOnboardingHighlight(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const overlay = document.getElementById('onboardingOverlay');

  const r = el.getBoundingClientRect();
  const pad = 8;
  const x1 = r.left - pad, y1 = r.top - pad;
  const x2 = r.right + pad, y2 = r.bottom + pad;
  const rx = 12; // border-radius

  // SVG clip-path: вся область затемнена кроме прямоугольника вокруг элемента
  overlay.style.background = 'transparent';
  overlay.style.backdropFilter = 'none';

  // Создаём SVG оверлей с вырезом
  let svgOverlay = document.getElementById('onboardingCutout');
  if (!svgOverlay) {
    svgOverlay = document.createElement('div');
    svgOverlay.id = 'onboardingCutout';
    svgOverlay.style.cssText = 'position:fixed;inset:0;z-index:1999;pointer-events:none;';
    document.body.appendChild(svgOverlay);
  }
  const W = window.innerWidth, H = window.innerHeight;
  svgOverlay.innerHTML = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="cutoutMask">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" rx="${rx}" fill="black"/>
      </mask>
    </defs>
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.78)" mask="url(#cutoutMask)"/>
    <rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" rx="${rx}" fill="none" stroke="rgba(150,160,250,0.9)" stroke-width="2.5"/>
  </svg>`;

  // Убеждаемся что элемент виден сквозь оверлей
  el.dataset.onboardingHighlight = '1';
  el.style.position = 'relative';
  el.style.zIndex = '2001';
}

function clearOnboardingHighlight() {
  const overlay = document.getElementById('onboardingOverlay');
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.backdropFilter = 'blur(6px)';

  const svgOverlay = document.getElementById('onboardingCutout');
  if (svgOverlay) svgOverlay.remove();

  document.querySelectorAll('[data-onboarding-highlight]').forEach(el => {
    el.style.zIndex = '';
    el.style.position = '';
    delete el.dataset.onboardingHighlight;
  });
  const arrow = document.getElementById('onboardingArrow');
  if (arrow) arrow.remove();
}

function skipOnboarding() {
  if (_pvSlideTimer) { clearInterval(_pvSlideTimer); _pvSlideTimer = null; }
  document.getElementById('onboardingOverlay').style.display = 'none';
  clearOnboardingHighlight();
  positionOnboardingCenter();
  if (authorScreenOpen) toggleAuthorScreen();
  save('passit_onboarding_done', true);
}

function nextOnboarding() {
  clearOnboardingHighlight();
  onboardingStep++;
  if (onboardingStep >= ONBOARDING_STEPS.length) {
    skipOnboarding();
    return;
  }
  renderOnboardingStep();
}

let _pvSlideTimer = null;

function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStep];
  const total = ONBOARDING_STEPS.length;

  if (step.action) step.action();

  document.getElementById('onboardingEmoji').textContent = step.emoji;
  document.getElementById('onboardingTitle').textContent = step.title;
  document.getElementById('onboardingText').textContent = step.text;

  const nextBtn = document.getElementById('onboardingNext');
  nextBtn.textContent = step.isLast ? 'Начать! 🔥' : 'Далее →';
  document.getElementById('onboardingSkip').style.display = step.isLast ? 'none' : '';

  // dots
  const dots = document.getElementById('onboardingDots');
  dots.innerHTML = Array.from({length: total}, (_, i) =>
    `<div style="width:${i===onboardingStep?18:6}px;height:6px;border-radius:3px;background:${i===onboardingStep?'var(--accent)':'var(--border)'};transition:all 0.3s;flex-shrink:0;"></div>`
  ).join('');

  // позиционирование — после небольшой задержки чтобы DOM успел отрисоваться
  setTimeout(() => {
    if (step.highlight) {
      positionOnboardingBox(step.highlight, step.pos, step.arrow);
    } else {
      positionOnboardingCenter();
    }
  }, 50);
}

function positionOnboardingBox(selector, pos, arrow) {
  const el = document.querySelector(selector);
  const box = document.getElementById('onboardingBox');
  if (!el) { positionOnboardingCenter(); return; }

  // подсветка элемента
  applyOnboardingHighlight(selector);

  const r = el.getBoundingClientRect();
  const bw = box.offsetWidth || 580;
  const bh = box.offsetHeight || 320;
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;
  if (pos === 'right') {
    left = r.right + pad;
    top = r.top + r.height/2 - bh/2;
    if (left + bw > vw - pad) left = r.left - bw - pad;
  } else if (pos === 'left') {
    left = r.left - bw - pad;
    top = r.top + r.height/2 - bh/2;
    if (left < pad) left = r.right + pad;
  } else if (pos === 'top') {
    top = r.top - bh - pad;
    left = r.left + r.width/2 - bw/2;
    if (top < pad) top = r.bottom + pad;
  } else if (pos === 'bottom') {
    top = r.bottom + pad;
    left = r.left + r.width/2 - bw/2;
  } else {
    positionOnboardingCenter(); return;
  }

  // clamp
  left = Math.max(pad, Math.min(left, vw - bw - pad));
  top = Math.max(pad, Math.min(top, vh - bh - pad));

  box.style.top = top + 'px';
  box.style.left = left + 'px';
  box.style.transform = 'none';

  // arrow
  const existing = document.getElementById('onboardingArrow');
  if (existing) existing.remove();
  if (arrow) {
    const arrowEl = document.createElement('div');
    arrowEl.id = 'onboardingArrow';
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    let style = `position:fixed;z-index:2003;pointer-events:none;width:12px;height:12px;border-top:3px solid rgba(150,160,250,0.9);border-right:3px solid rgba(150,160,250,0.9);`;
    if (arrow === 'left')  { style += `top:${cy-6}px;left:${r.left-24}px;transform:rotate(225deg);`; }
    if (arrow === 'right') { style += `top:${cy-6}px;left:${r.right+12}px;transform:rotate(45deg);`; }
    if (arrow === 'down')  { style += `top:${r.bottom+8}px;left:${cx-6}px;transform:rotate(-45deg);`; }
    arrowEl.style.cssText = style;
    document.body.appendChild(arrowEl);
  }
}

function positionOnboardingCenter() {
  const box = document.getElementById('onboardingBox');
  box.style.top = '50%';
  box.style.left = '50%';
  box.style.transform = 'translate(-50%, -50%)';
  const existing = document.getElementById('onboardingArrow');
  if (existing) existing.remove();
}

function replayAuthorOnboarding() {
  save('passit_author_onboarding_done', false);
  toggleMenu();
  if (!authorScreenOpen) toggleAuthorScreen();
  else showAuthorOnboarding();
}

function replayOnboarding() {
  save('passit_onboarding_done', false);
  toggleMenu();
  showOnboarding();
}

function checkOnboarding() {
  if (!load('passit_onboarding_done', false)) {
    setTimeout(showOnboarding, 800);
  }
}

// ====== AUTHOR PASS ONBOARDING ======
const AUTHOR_ONBOARDING_STEPS = [
  {
    emoji: '✦',
    title: 'Авторский пасс — Сезон 1',
    text: 'Это сезонный трек на 150 уровней. Здесь ты фармишь темы оформления, боксы и монетки. Первый сезон — KPDH. 70 дней, три темы, много кайфа.',
    highlight: null, pos: 'center', art: 0
  },
  {
    emoji: '📊',
    title: 'Полоска прогресса',
    text: 'Каждые 500 XP — новый уровень. Кружки с 📦 — это боксы, с 🧩 — кусочки бокса. Скролль вправо чтобы увидеть что тебя ждёт впереди.',
    highlight: '.pass-levels-wrap', pos: 'bottom', arrow: 'up'
  },
  {
    emoji: '⚡',
    title: 'Задания двигают полоску',
    text: 'Ежедневные задания обновляются каждое утро — выполни 25%, 50% или все квесты. Еженедельные дают больше XP за стабильность на неделе.',
    highlight: '.quests-section', pos: 'left', arrow: 'right', art: 1
  },
  {
    emoji: '🔥',
    title: 'Стрик — не прерывай',
    text: 'Нужно 4 дня из 7. Достаточно выполнить половину метрики любого квеста. Есть 3 заморозки в неделю — они применяются автоматически если пропустил день.',
    highlight: '#streakWidget', pos: 'bottom', arrow: 'up'
  },
  {
    emoji: '📦',
    title: 'Магазин и боксы',
    text: 'Боксы накапливаются автоматически с каждым уровнем. Открывай их здесь — 3 слота, каждый выдаёт кусочек темы или монетки. Монетки трать на конкретные кусочки.',
    highlight: '.flangs-section', pos: 'right', arrow: 'left'
  },
  {
    emoji: '🎨',
    title: 'Три темы сезона',
    text: 'Мира, Зои и Руми. Каждая открывается поэтапно: цвет → градиент → рамки → эффект. Руми легендарная — там анимированная рамка для тех кто дойдёт до конца ✦',
    highlight: null, pos: 'center', isLast: true
  }
];



let authorOnboardingStep = 0;

function checkAuthorOnboarding() {
  // не запускать если идёт основной онбординг
  if (document.getElementById('onboardingOverlay').style.display !== 'none') return;
  if (!load('passit_author_onboarding_done', false)) {
    setTimeout(showAuthorOnboarding, 600);
  }
}

function showAuthorOnboarding() {
  authorOnboardingStep = 0;
  document.getElementById('authorOnboardingOverlay').style.display = 'block';
  renderAuthorOnboardingStep();
}

function skipAuthorOnboarding() {
  if (_pvSlideTimer) { clearInterval(_pvSlideTimer); _pvSlideTimer = null; }
  document.getElementById('authorOnboardingOverlay').style.display = 'none';
  clearAuthorOnboardingHighlight();
  save('passit_author_onboarding_done', true);
}

function nextAuthorOnboarding() {
  clearAuthorOnboardingHighlight();
  authorOnboardingStep++;
  if (authorOnboardingStep >= AUTHOR_ONBOARDING_STEPS.length) {
    skipAuthorOnboarding();
    return;
  }
  renderAuthorOnboardingStep();
}

function renderAuthorOnboardingStep() {
  const step = AUTHOR_ONBOARDING_STEPS[authorOnboardingStep];
  const total = AUTHOR_ONBOARDING_STEPS.length;

  document.getElementById('aobEmoji').textContent = step.emoji;
  document.getElementById('aobTitle').textContent = step.title;
  document.getElementById('aobText').textContent = step.text;

  const nextBtn = document.getElementById('aobNext');
  nextBtn.textContent = step.isLast ? 'Начать сезон ✦' : 'Далее →';
  document.getElementById('aobSkip').style.display = step.isLast ? 'none' : '';

  // dots
  document.getElementById('aobDots').innerHTML = Array.from({length: total}, (_, i) =>
    `<div style="width:${i===authorOnboardingStep?18:6}px;height:6px;border-radius:3px;background:${i===authorOnboardingStep?'#E8960A':'rgba(180,120,0,0.25)'};transition:all 0.3s;flex-shrink:0;"></div>`
  ).join('');

  setTimeout(() => {
    if (step.highlight) positionAuthorOnboarding(step.highlight, step.pos, step.arrow);
    else positionAuthorOnboardingCenter();
  }, 50);
}

function positionAuthorOnboarding(selector, pos, arrow) {
  const el = document.querySelector(selector);
  const box = document.getElementById('authorOnboardingBox');
  if (!el) { positionAuthorOnboardingCenter(); return; }

  applyAuthorOnboardingHighlight(selector);

  const r = el.getBoundingClientRect();
  const bw = box.offsetWidth || 480;
  const bh = box.offsetHeight || 280;
  const pad = 16, vw = window.innerWidth, vh = window.innerHeight;

  let top, left;
  if (pos === 'right')  { left = r.right + pad; top = r.top + r.height/2 - bh/2; }
  else if (pos === 'left')   { left = r.left - bw - pad; top = r.top + r.height/2 - bh/2; }
  else if (pos === 'bottom') { top = r.bottom + pad; left = r.left + r.width/2 - bw/2; }
  else if (pos === 'top')    { top = r.top - bh - pad; left = r.left + r.width/2 - bw/2; }
  else { positionAuthorOnboardingCenter(); return; }

  if (left + bw > vw - pad) left = vw - bw - pad;
  if (left < pad) left = pad;
  top = Math.max(pad, Math.min(top, vh - bh - pad));

  box.style.top = top + 'px'; box.style.left = left + 'px';
  box.style.transform = 'none';

  // arrow
  const existing = document.getElementById('aobArrow');
  if (existing) existing.remove();
  if (arrow) {
    const a = document.createElement('div');
    a.id = 'aobArrow';
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    let s = 'position:fixed;z-index:2003;pointer-events:none;width:12px;height:12px;border-top:3px solid rgba(232,150,10,0.9);border-right:3px solid rgba(232,150,10,0.9);';
    if (arrow === 'left')  s += `top:${cy-6}px;left:${r.left-24}px;transform:rotate(225deg);`;
    if (arrow === 'right') s += `top:${cy-6}px;left:${r.right+12}px;transform:rotate(45deg);`;
    if (arrow === 'up')    s += `top:${r.top-24}px;left:${cx-6}px;transform:rotate(-45deg);`;
    if (arrow === 'down')  s += `top:${r.bottom+8}px;left:${cx-6}px;transform:rotate(135deg);`;
    a.style.cssText = s; document.body.appendChild(a);
  }
}

function positionAuthorOnboardingCenter() {
  const box = document.getElementById('authorOnboardingBox');
  box.style.top = '50%'; box.style.left = '50%';
  box.style.transform = 'translate(-50%, -50%)';
  const a = document.getElementById('aobArrow');
  if (a) a.remove();
  // тёмный фон без выреза
  const overlay = document.getElementById('authorOnboardingOverlay');
  overlay.style.background = 'transparent';
  overlay.style.backdropFilter = 'none';
  let svgCutout = document.getElementById('aobCutout');
  if (!svgCutout) {
    svgCutout = document.createElement('div');
    svgCutout.id = 'aobCutout';
    svgCutout.style.cssText = 'position:fixed;inset:0;z-index:2099;pointer-events:none;';
    document.body.appendChild(svgCutout);
  }
  const W = window.innerWidth, H = window.innerHeight;
  svgCutout.innerHTML = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.75)"/></svg>`;
}

function applyAuthorOnboardingHighlight(selector) {
  const el = document.querySelector(selector);
  const overlay = document.getElementById('authorOnboardingOverlay');

  // оверлей всегда прозрачный — затемнение только через SVG cutout
  overlay.style.background = 'transparent';
  overlay.style.backdropFilter = 'none';

  if (!el) {
    // нет элемента — просто тёмный фон без выреза
    let svgCutout = document.getElementById('aobCutout');
    if (!svgCutout) {
      svgCutout = document.createElement('div');
      svgCutout.id = 'aobCutout';
      svgCutout.style.cssText = 'position:fixed;inset:0;z-index:2099;pointer-events:none;';
      document.body.appendChild(svgCutout);
    }
    const W = window.innerWidth, H = window.innerHeight;
    svgCutout.innerHTML = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.78)"/></svg>`;
    return;
  }

  const r = el.getBoundingClientRect();
  const pad = 8;
  const x1 = r.left - pad, y1 = r.top - pad;
  const x2 = r.right + pad, y2 = r.bottom + pad;

  let svgCutout = document.getElementById('aobCutout');
  if (!svgCutout) {
    svgCutout = document.createElement('div');
    svgCutout.id = 'aobCutout';
    svgCutout.style.cssText = 'position:fixed;inset:0;z-index:2099;pointer-events:none;';
    document.body.appendChild(svgCutout);
  }
  const W = window.innerWidth, H = window.innerHeight;
  svgCutout.innerHTML = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><mask id="aobMask">
      <rect width="${W}" height="${H}" fill="white"/>
      <rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" rx="12" fill="black"/>
    </mask></defs>
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.78)" mask="url(#aobMask)"/>
    <rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" rx="12" fill="none" stroke="rgba(232,150,10,0.9)" stroke-width="2.5"/>
  </svg>`;
  el.dataset.aobHighlight = '1';
}

function clearAuthorOnboardingHighlight() {
  const overlay = document.getElementById('authorOnboardingOverlay');
  if (overlay) {
    overlay.style.background = 'rgba(0,0,0,0.75)';
    overlay.style.backdropFilter = 'blur(6px)';
  }
  const svg = document.getElementById('aobCutout');
  if (svg) svg.remove();
  document.querySelectorAll('[data-aob-highlight]').forEach(el => {
    el.style.zIndex = ''; el.style.position = '';
    delete el.dataset.aobHighlight;
  });
  const a = document.getElementById('aobArrow');
  if (a) a.remove();
}

// ====== BOX & PIECE REWARD SYSTEM ======
const COIN_PER_PIECE = 10;
const COIN_PER_BOX = 50;
const COIN_2BOXES = 90;
const COIN_PIECE_SHOP = 80;

function getCoins() { return load('passit_coins', 0); }
function addCoins(n) {
  const v = getCoins() + n;
  save('passit_coins', v);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/coins').set(v);
  return v;
}
function spendCoins(n) {
  const v = getCoins() - n;
  if (v < 0) return false;
  save('passit_coins', v);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/coins').set(v);
  return true;
}

function getBoxPieces() { return load('passit_box_pieces', 0); }
function addBoxPieces(n) {
  let v = getBoxPieces() + n;
  let boxes = 0;
  while (v >= 5) { v -= 5; boxes++; }
  save('passit_box_pieces', v);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/boxPieces').set(v);
  if (boxes > 0) {
    awardBoxes(boxes);
  } else {
    showToast(`🧩 Кусочек бокса! (${v}/5)`);
  }
  return v;
}

function getPendingBoxes() { return load('passit_pending_boxes', 0); }
function getTempLevelBoxes() { return load('passit_temp_level_boxes', 0); }
function getGrantedLevelRewards() {
  const stored = load('passit_level_rewards_granted', null);
  if (Array.isArray(stored)) return stored;
  const rewardedUpTo = load('passit_rewards_up_to', 0);
  const seeded = [];
  for (let l = 1; l <= rewardedUpTo; l++) seeded.push(l);
  save('passit_level_rewards_granted', seeded);
  return seeded;
}
function saveGrantedLevelRewards(levels) {
  save('passit_level_rewards_granted', levels);
}
function awardBoxes(n, options = {}) {
  const { temporaryLevel = false } = options;
  const v = getPendingBoxes() + n;
  save('passit_pending_boxes', v);
  if (temporaryLevel) {
    save('passit_temp_level_boxes', getTempLevelBoxes() + n);
  }
  showToast(`📦 Получен${n > 1 ? 'о ' + n : ''} бокс${n > 1 ? 'а' : ''}! Открой в магазине.`);
}
function revokeTempLevelBoxes(n) {
  if (!n) return;
  const temp = getTempLevelBoxes();
  const pending = getPendingBoxes();
  const toRemove = Math.min(n, temp, pending);
  if (toRemove <= 0) return;
  save('passit_temp_level_boxes', temp - toRemove);
  save('passit_pending_boxes', pending - toRemove);
  showToast(`↩️ Временн${toRemove > 1 ? 'ые боксы убраны' : 'ый бокс убран'} после отката уровня`);
}
function commitTempLevelBoxes() {
  if (getTempLevelBoxes() > 0) save('passit_temp_level_boxes', 0);
}
function useBox() {
  const v = getPendingBoxes();
  if (v <= 0) return false;
  save('passit_pending_boxes', v - 1);
  const temp = getTempLevelBoxes();
  if (temp > 0) save('passit_temp_level_boxes', temp - 1);
  return true;
}

// Called when level up
function processLevelRewards(newLevel) {
  const granted = getGrantedLevelRewards();
  if (granted.includes(newLevel)) return;
  const isBox = newLevel > 0 && newLevel % 5 === 0;
  const isPiece = newLevel > 0 && newLevel % 3 === 0 && !isBox;
  if (isBox) { awardBoxes(1); }
  else if (isPiece) { addBoxPieces(1); }
  granted.push(newLevel);
  saveGrantedLevelRewards(granted);
}

// Догоняет пропущенные награды если rewardsUpTo отстал от реального уровня
function recoverMissingRewards() {
  const currentLevel = getAuthorPassLevel();
  const rewardedUpTo = load('passit_rewards_up_to', 0);
  // если разрыв больше 30 уровней — скорее всего данные слетели,
  // просто фиксируем без выдачи чтобы не спамить боксами
  if (currentLevel - rewardedUpTo > 30) {
    save('passit_rewards_up_to', currentLevel);
    return;
  }
  if (rewardedUpTo >= currentLevel) return;
  for (let l = rewardedUpTo + 1; l <= currentLevel; l++) {
    processLevelRewards(l);
  }
  save('passit_rewards_up_to', currentLevel);
}

// Theme piece drop from box — weighted random
function getAvailableThemeDropIds() {
  return ['mira','zoi','rumi'].filter(id => {
    const theme = SEASONAL_THEMES[id];
    return theme && getThemePieces(id) < theme.totalPieces;
  });
}

function rollThemePiece() {
  // исключаем полностью собранные темы
  const available = getAvailableThemeDropIds();
  if (available.length === 0) {
    // все темы собраны — выдаём монетки
    return null;
  }
  // веса: mira=55%, zoi=30%, rumi=15% — нормируем по доступным
  const weights = { mira: 55, zoi: 30, rumi: 15 };
  const total = available.reduce((s, id) => s + weights[id], 0);
  let r = Math.random() * total;
  for (const id of available) {
    r -= weights[id];
    if (r <= 0) return id;
  }
  return available[available.length - 1];
}

function openBoxAndGetDrops() {
  // слот 1 и 2 — кусочки тем 100%
  // слот 3 — 60% кусочек, 40% монеты
  const drops = [];
  for (let i = 0; i < 2; i++) {
    const themeId = rollThemePiece();
    if (themeId) drops.push({ type: 'piece', themeId });
    else drops.push({ type: 'coin', amount: COIN_PER_PIECE });
  }
  // слот 3: 60% кусочек, 40% монетки
  const t3 = rollThemePiece();
  if (t3 && Math.random() < 0.6) {
    drops.push({ type: 'piece', themeId: t3 });
  } else {
    drops.push({ type: 'coin', amount: 10 });
  }
  return drops;
}

function applyBoxDrops(drops) {
  drops.forEach(drop => {
    if (drop.type === 'piece') {
      if (!drop.themeId) { addCoins(COIN_PER_PIECE); return; }
      const theme = SEASONAL_THEMES[drop.themeId];
      const prev = getThemePieces(drop.themeId);
      const newVal = addThemePieces(drop.themeId, 1);
      // проверяем новый шаг
      const oldStep = getStepForPieces(drop.themeId, prev);
      const newStep = getStepForPieces(drop.themeId, newVal);
      if (newStep > oldStep) {
        showToast(`✨ ${theme.name}: разблокирован шаг «${theme.stepNames[newStep-1]}»!`);
      }
      // лишний кусочек
      if (newVal > theme.totalPieces) {
        addThemePieces(drop.themeId, -1); // не добавляем
        addCoins(COIN_PER_PIECE);
        showToast(`🔄 Лишний кусочек → +${COIN_PER_PIECE} монеток`);
      }
    } else if (drop.type === 'coin') {
      addCoins(drop.amount);
    }
  });
  updateShopUI();
}

function getStepForPieces(themeId, pieces) {
  const theme = SEASONAL_THEMES[themeId];
  if (!theme) return 0;
  let total = 0;
  for (let i = 0; i < theme.steps.length; i++) {
    total += theme.steps[i];
    if (pieces < total) return i;
  }
  return theme.steps.length;
}


// ====== BOX OPENING (from box_opening.html) ======

// BO: open animation with app drops
let boPhase = 0;
function openBoxAnimation(boxDrops) {
  const overlay = document.getElementById('boxOpenOverlay');
  overlay.style.display = 'flex';
  // reset state
  _boDrops = boxDrops;
  boPhase = 0;
  phase = 0; // reset original phase too
  const stage = document.getElementById('boBoxStage');
  stage.style.display = 'flex';
  stage.style.opacity = '1';
  document.getElementById('boSlotsStage').style.display = 'none';
  document.getElementById('boSlotsStage').style.opacity = '0';
  document.getElementById('boResultStage').style.display = 'none';
  document.getElementById('boResultStage').style.opacity = '0';
  document.getElementById('boUnfoldStage').style.display = 'none';
  // сброс слотов
  document.querySelectorAll('#boxOpenOverlay .bo-slot').forEach(s => s.classList.remove('winning'));
  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById('boInner' + i);
    if (inner) { inner.innerHTML = ''; inner.style.transform = ''; inner.style.transition = ''; }
  }
  const crystal = document.getElementById('boCrystalBox');
  crystal.classList.remove('fixing');
  crystal.style.opacity = '1';
  crystal.style.animation = '';
  requestAnimationFrame(() => { crystal.style.animationName = 'spinBox'; });
}

function boCloseAnimation() {
  document.getElementById('boxOpenOverlay').style.display = 'none';
}

let _boDrops = [];


// ---- DATA ----
// ====== OLD BOX CODE (replaced) ======
let _boxDrops = [];
let _boxOpened = false;

function showBoxOpeningPopup(boxDrops) { openBoxAnimation(boxDrops); return; } function _oldShowBoxOpeningPopup(boxDrops) {
  _boxDrops = drops;
  _boxOpened = false;
  const overlay = document.getElementById('boxOpenOverlay');
  overlay.style.display = 'flex';
  document.getElementById('boxSlotsArea').style.display = 'none';
  document.getElementById('boxOpenStage').style.display = 'flex';
  document.getElementById('boxOpenHint').style.display = '';
  const crystal = document.getElementById('boxCrystal');
  crystal.style.animation = 'boxSpin 5s linear infinite';
}

function triggerBoxOpen() {
  if (_boxOpened) return;
  _boxOpened = true;
  document.getElementById('boxOpenHint').style.display = 'none';
  const crystal = document.getElementById('boxCrystal');
  crystal.style.animation = 'none';
  crystal.style.transition = 'transform 0.4s, opacity 0.4s';
  crystal.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1.1)';
  setTimeout(() => {
    crystal.style.opacity = '0';
    crystal.style.transform = 'scale(2)';
  }, 300);
  setTimeout(() => {
    document.getElementById('boxOpenStage').style.display = 'none';
    showBoxSlots();
  }, 700);
}

function showBoxSlots() {
  const area = document.getElementById('boxSlotsArea');
  area.style.display = 'flex';
  const slotsEl = document.getElementById('boxSlots');
  const names = { mira: 'Мира', zoi: 'Зои', rumi: 'Руми ✦' };
  const colors = { mira: 'linear-gradient(135deg,#F4B9BE,#CF5C86)', zoi: 'linear-gradient(135deg,#D27DA4,#4566BB)', rumi: 'linear-gradient(135deg,#d4af37,#867DCE)' };

  slotsEl.innerHTML = _boxDrops.map((drop, idx) => `
    <div class="box-slot" id="bslot${idx}">
      <div class="box-slot-inner" id="binner${idx}"></div>
    </div>`).join('');

  _boxDrops.forEach((drop, idx) => {
    setTimeout(() => spinBoxSlot(idx, drop), idx * 600);
  });
}

function spinBoxSlot(idx, winDrop) {
  const inner = document.getElementById(`binner${idx}`);
  const slot = document.getElementById(`bslot${idx}`);
  const names = { mira: 'Мира', zoi: 'Зои', rumi: 'Руми ✦' };
  const colors = { mira: 'linear-gradient(135deg,#F4B9BE,#CF5C86)', zoi: 'linear-gradient(135deg,#D27DA4,#4566BB)', rumi: 'linear-gradient(135deg,#d4af37,#867DCE)' };

  const availableThemes = getAvailableThemeDropIds();
  const pool = [];
  if (availableThemes.length > 0) {
    for (let i = 0; i < 3; i++) {
      availableThemes.forEach(themeId => pool.push({ type:'piece', themeId }));
      pool.push({ type:'coin' });
    }
  } else {
    for (let i = 0; i < 6; i++) pool.push({ type:'coin' });
  }
  pool.push(winDrop);

  inner.innerHTML = pool.map(d => {
    if (d.type === 'coin') return `<div class="box-slot-item"><div class="bsi-coin">H</div><div class="bsi-label" style="color:#d4af37;">монеты</div></div>`;
    return `<div class="box-slot-item"><div class="bsi-piece" style="background:${colors[d.themeId]};"></div><div class="bsi-label" style="color:rgba(200,180,255,0.7);">${names[d.themeId]}</div></div>`;
  }).join('');

  const itemH = 80;
  const targetY = -(pool.length - 1) * itemH;
  inner.style.transform = 'translateY(0)';
  inner.style.transition = 'none';
  requestAnimationFrame(() => {
    inner.style.transition = `transform ${1.8 + idx * 0.3}s cubic-bezier(0.15,0.05,0.05,1.0)`;
    inner.style.transform = `translateY(${targetY}px)`;
  });
  setTimeout(() => {
    slot.style.borderColor = 'rgba(212,175,55,0.8)';
    slot.style.boxShadow = '0 0 16px rgba(212,175,55,0.3)';
  }, (1.8 + idx * 0.3) * 1000);
}

function closeBoxOpening() {
  document.getElementById('boxOpenOverlay').style.display = 'none';
  const crystal = document.getElementById('boxCrystal');
  crystal.style.opacity = '1';
  crystal.style.transform = '';
  crystal.style.transition = '';
}

// ====== ПРОМОКОДЫ (Firebase) ======
function redeemPromo() {
  const input = document.getElementById('promoInput');
  const result = document.getElementById('promoResult');
  const code = (input.value || '').trim().toUpperCase();
  if (!code) { result.style.color = 'var(--text2)'; result.textContent = 'Введи код'; return; }

  if (!currentUser) {
    result.style.color = '#e04040';
    result.textContent = '✕ Нужно войти в аккаунт';
    return;
  }

  result.style.color = 'var(--text2)';
  result.textContent = 'Проверяем...';

  const uid = currentUser.uid;
  const codeRef = fbdb.ref('promo_codes/' + code);
  const usedRef = fbdb.ref('promo_used/' + code + '/' + uid);

  // проверяем использовал ли уже этот юзер
  usedRef.once('value', snap => {
    if (snap.val()) {
      result.style.color = '#e04040';
      result.textContent = '✕ Ты уже использовал этот код';
      return;
    }

    // читаем код из базы
    codeRef.once('value', codeSnap => {
      const promo = codeSnap.val();
      if (!promo) {
        result.style.color = '#e04040';
        result.textContent = '✕ Неверный код';
        return;
      }
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        result.style.color = '#e04040';
        result.textContent = '✕ Код больше не активен';
        return;
      }

      // атомарно увеличиваем счётчик и помечаем юзера
      codeRef.child('usedCount').transaction(cur => (cur || 0) + 1);
      usedRef.set(true);

      // выдаём награду
      if (promo.boxes) awardBoxes(promo.boxes);
      if (promo.coins) addCoins(promo.coins);

      input.value = '';
      result.style.color = '#2a9a2a';
      result.textContent = '✓ Получено: ' + (promo.label || `${promo.boxes||0} бокс(ов)`);
      updateShopUI();
    });
  });
}

// ====== SHOP POPUP ======
function openShop() {
  updateShopUI();
  document.getElementById('shopOverlay').classList.add('open');
}

function updateShopUI() {
  const coins = getCoins();
  const boxes = getPendingBoxes();
  const pieces = getBoxPieces();

  const coinsEl = document.getElementById('shopCoins');
  const boxesEl = document.getElementById('shopBoxes');
  const piecesEl = document.getElementById('shopPiecesCount');
  if (coinsEl) coinsEl.textContent = coins;
  if (boxesEl) boxesEl.textContent = boxes;
  if (piecesEl) piecesEl.textContent = pieces + '/5';

  const b1 = document.getElementById('shopBuyBox1');
  const b2 = document.getElementById('shopBuyBox2');
  const b0 = document.getElementById('shopOpenBox');
  if (b1) b1.disabled = coins < COIN_PER_BOX;
  if (b2) b2.disabled = coins < COIN_2BOXES;
  if (b0) b0.disabled = boxes <= 0;

  // обновляем виджет магазина в авторском пассе
  const boxBadge = document.getElementById('shopBoxBadge');
  const coinsWidget = document.getElementById('shopCoinsWidget');
  const piecesWidget = document.getElementById('shopPiecesWidget');
  if (boxBadge) boxBadge.textContent = 'Боксов: ' + boxes;
  if (coinsWidget) coinsWidget.textContent = coins;
  if (piecesWidget) piecesWidget.textContent = pieces + '/5';
}

function shopBuyBox(count) {
  const cost = count === 1 ? COIN_PER_BOX : COIN_2BOXES;
  if (!spendCoins(cost)) { showToast('Недостаточно монеток'); return; }
  awardBoxes(count);
  updateShopUI();
  showToast(`📦 Куплено ${count === 1 ? '1 бокс' : '2 бокса'}!`);
}

function shopOpenBox() {
  if (!useBox()) { showToast('Нет боксов'); return; }
  const drops = openBoxAndGetDrops();
  // НЕ применяем дропы сразу — применим после анимации в boShowResult
  updateShopUI();
  showBoxOpeningPopup(drops);
}

// ====== SEASONAL THEMES SYSTEM ======
const SEASONAL_THEMES = {
  mira: {
    name: 'Мира', season: 1, rarity: 'common',
    accentLight: '#4aa8e0', accentDark: '#1a6fa0',
    steps: [4, 5, 6, 7], // кусочков на каждый шаг
    stepNames: ['Цвет', 'Градиент', 'Рамки', 'Статус'],
    profileStatus: 'Путь Гок-До',
    totalPieces: 22
  },
  zoi: {
    name: 'Зои', season: 1, rarity: 'rare',
    accentLight: '#9b5de5', accentDark: '#5a1fa0',
    steps: [6, 7, 8, 9],
    stepNames: ['Цвет', 'Градиент', 'Рамки', 'Статус'],
    profileStatus: 'Искра Шин-Каль',
    totalPieces: 30
  },
  rumi: {
    name: 'Руми', season: 1, rarity: 'legendary',
    accentLight: '#E8960A', accentDark: '#8B5E00',
    steps: [8, 10, 12, 14],
    stepNames: ['Цвет', 'Градиент', 'Рамки', 'Эффект + Статус'],
    profileStatus: 'Золотая Печать',
    totalPieces: 44
  }
};

function getThemePieces(themeId) {
  return load(`passit_theme_pieces_${themeId}`, 0);
}

function addThemePieces(themeId, count) {
  const current = getThemePieces(themeId);
  const newVal = current + count;
  save(`passit_theme_pieces_${themeId}`, newVal);
  if (currentUser) fbdb.ref(`passit_users/${currentUser.uid}/themePieces/${themeId}`).set(newVal);
  return newVal;
}

function getThemeStep(themeId) {
  // возвращает текущий разблокированный шаг (0 = ничего, 1-4 = шаги)
  const theme = SEASONAL_THEMES[themeId];
  if (!theme) return 0;
  const pieces = getThemePieces(themeId);
  let total = 0;
  for (let i = 0; i < theme.steps.length; i++) {
    total += theme.steps[i];
    if (pieces < total) return i; // шаг i ещё не разблокирован
  }
  return theme.steps.length; // все шаги разблокированы
}

function getThemeStepProgress(themeId) {
  // прогресс к следующему шагу
  const theme = SEASONAL_THEMES[themeId];
  if (!theme) return { current: 0, needed: 1, step: 0 };
  const pieces = getThemePieces(themeId);
  const step = getThemeStep(themeId);
  if (step >= theme.steps.length) return { current: pieces, needed: pieces, step };
  let totalBefore = theme.steps.slice(0, step).reduce((a,b) => a+b, 0);
  return {
    current: pieces - totalBefore,
    needed: theme.steps[step],
    step,
    stepName: theme.stepNames[step]
  };
}

function getUnlockedSeasonStatuses() {
  return Object.entries(SEASONAL_THEMES)
    .filter(([themeId, theme]) => getThemeStep(themeId) >= theme.steps.length)
    .map(([themeId, theme]) => ({
      themeId,
      label: theme.profileStatus,
      accent: dark ? theme.accentDark : theme.accentLight
    }));
}

// ====== ACHIEVEMENTS ======
const ACHIEVEMENTS = [
  { id: 'first_quest', emoji: '⚡', name: 'Первый квест', desc: 'Выполни любой квест', reward: '🎁 Бокс', rewardType: 'box', rewardAmount: 1, check: () => {
    return passes.some(p => normalizeArray(p.quests).some(q => q && (q.current||0) >= q.max));
  }},
  { id: 'first_mega', emoji: '🏆', name: 'Мегастарт', desc: 'Заверши первый мегаквест', reward: '🎁 Бокс', rewardType: 'box', rewardAmount: 1, check: () => {
    return getCompletedMegas().length >= 1;
  }},
  { id: 'streak_3', emoji: '🔥', name: 'Огонёк', desc: 'Продли стрик 3 дня подряд', reward: '💰 100 монет', rewardType: 'coins', rewardAmount: 100, check: () => {
    return getStreakCount() >= 3;
  }},
  { id: 'streak_7', emoji: '🌟', name: 'Неделя силы', desc: 'Продли стрик 7 дней подряд', reward: '🎁 Редкий бокс', rewardType: 'box', rewardAmount: 2, check: () => {
    return getStreakCount() >= 7;
  }},
  { id: 'all_quests', emoji: '💯', name: 'Идеальный день', desc: 'Выполни все активные квесты в текущем пассе за день', reward: '💰 200 монет', rewardType: 'coins', rewardAmount: 200, check: () => {
    const allQ = normalizeArray(getCurrentPass()?.quests).filter(q => q && !q.frozen && isQuestActiveToday(q));
    return allQ.length > 0 && allQ.every(q=>(q.current||0)>=q.max);
  }},
  { id: 'full_pass', emoji: '🎯', name: 'Заполни пасс', desc: 'Создай 9 квестов в одном пассе', reward: '💰 150 монет', rewardType: 'coins', rewardAmount: 150, check: () => {
    return passes.some(p=>normalizeArray(p.quests).filter(q=>q).length>=9);
  }},
];

function getUnlockedAchievements() { return load('passit_achievements', []); }
function saveUnlockedAchievements(arr) { save('passit_achievements', arr); }
function getRewardedAchievements() { return load('passit_achievements_rewarded', []); }
function saveRewardedAchievements(arr) { save('passit_achievements_rewarded', arr); }

function grantAchievementReward(achievement) {
  if (achievement.rewardType === 'coins') {
    addCoins(achievement.rewardAmount || 0);
  } else if (achievement.rewardType === 'box') {
    awardBoxes(achievement.rewardAmount || 1);
  }
}

function recoverMissingAchievementRewards(showToasts = false) {
  const unlocked = getUnlockedAchievements();
  const rewarded = getRewardedAchievements();
  let unlockedChanged = false;
  let rewardedChanged = false;
  let unlockedNow = 0;
  let rewardedNow = 0;

  ACHIEVEMENTS.forEach((achievement) => {
    const achievedNow = achievement.check();
    const alreadyUnlocked = unlocked.includes(achievement.id);

    if (achievedNow && !alreadyUnlocked) {
      unlocked.push(achievement.id);
      unlockedChanged = true;
      unlockedNow++;
      if (showToasts) showToast(`🎖️ Достижение: ${achievement.name}!`);
    }

    if ((achievedNow || alreadyUnlocked) && !rewarded.includes(achievement.id)) {
      grantAchievementReward(achievement);
      rewarded.push(achievement.id);
      rewardedChanged = true;
      rewardedNow++;
      if (showToasts) showToast(`🎁 Награда за достижение «${achievement.name}»: ${achievement.reward}`);
    }
  });

  if (unlockedChanged) saveUnlockedAchievements(unlocked);
  if (rewardedChanged) saveRewardedAchievements(rewarded);
  if (unlockedChanged || rewardedChanged) {
    updateShopUI();
    updateAuthorPassUI();
    cloudSave();
  }
  return { unlockedNow, rewardedNow };
}

function checkAchievements(showToasts = true) {
  recoverMissingAchievementRewards(showToasts);
}

function forceRecoverAchievements() {
  const result = recoverMissingAchievementRewards(true);
  openAchievements();
  if (!result.unlockedNow && !result.rewardedNow) {
    showToast('Новых начислений по достижениям нет');
  } else {
    showToast(`✅ Зачтено: ${result.unlockedNow} достиж. / ${result.rewardedNow} наград`);
  }
}

function resetAchievementRewardStatus() {
  saveRewardedAchievements([]);
  cloudSave();
  const result = recoverMissingAchievementRewards(true);
  openAchievements();
  showToast(`♻️ Статус наград сброшен: заново начислено ${result.rewardedNow}`);
}

function openAchievements() {
  checkAchievements();
  const unlocked = getUnlockedAchievements();
  const list = document.getElementById('achievementsList');
  list.innerHTML = ACHIEVEMENTS.map(a => {
    const done = unlocked.includes(a.id);
    return `<div style="background:var(--card-bg);border:1.5px solid ${done ? 'var(--accent)' : 'var(--border)'};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;opacity:${done?'1':'0.6'};">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:22px;">${a.emoji}</span>
        <div>
          <div style="font-size:13px;font-weight:800;color:var(--text);">${a.name}</div>
          <div style="font-size:10px;color:var(--text2);">${a.desc}</div>
        </div>
        ${done ? '<span style="margin-left:auto;font-size:16px;">✓</span>' : ''}
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--accent);">Награда: ${a.reward}</div>
      <div style="height:3px;background:var(--bar-bg);border-radius:3px;overflow:hidden;"><div style="height:100%;background:var(--accent);width:${done?'100':'0'}%;border-radius:3px;"></div></div>
    </div>`;
  }).join('');
  document.getElementById('achievementsOverlay').classList.add('open');
}

// ====== COMPLETED MEGAQUESTS BOOK ======
function getCompletedMegas() { return load('passit_completed_megas', []); }
function saveCompletedMegas(arr) {
  save('passit_completed_megas', arr);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/completedMegas').set(arr);
}

function completeMega(i) {
  const p = getCurrentPass();
  // перепроверяем что индекс актуален — рендер мог пересоздать кнопку со старым i
  const mq = p.megaQuests[i];
  if (!mq) { showToast('Мегаквест не найден, попробуй ещё раз'); renderMega(); return; }

  if (!confirm(`Завершить мегаквест «${mq.name}»? Он уйдёт в архив.`)) return;

  // считаем XP по формуле
  const maxVal = mq.taskMode ? Math.max(mq.minMetric || 0, normalizeArray(mq.tasks).length) : mq.max;
  const xp = Math.round(300 + 700 * (maxVal / (maxVal + 100)));

  // логируем ДО splice, пока mq ещё жив
  logActivity('mega', { name: mq.name, passName: p.name, xp });

  const completed = getCompletedMegas();
  completed.unshift({
    emoji: mq.emoji,
    name: mq.name,
    sub: mq.sub || '',
    max: maxVal,
    unit: mq.unit || '',
    xp,
    passName: p.name,
    completedAt: todayStr()
  });
  saveCompletedMegas(completed);

  // добавляем XP
  addXPToday(xp);
  addAuthorXP(Math.round(xp * 0.5));

  // удаляем из пасса
  p.megaQuests.splice(i, 1);
  mqFocused = -1;
  savePasses();
  renderMega();
  checkAchievements(false);
  showToast(`🏆 Мегаквест завершён! +${xp} XP`);
}

function openCompletedMegas() {
  document.getElementById('menuOverlay').classList.remove('open');
  const list = document.getElementById('completedMegasList');
  const completed = getCompletedMegas();
  if (!completed.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;opacity:0.6;">Пока нет завершённых мегаквестов</div>';
  } else {
    list.innerHTML = completed.map((m, i) => `
      <div style="background:var(--card-bg);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:24px;">${m.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:800;color:var(--text);">${m.name}</div>
          <div style="font-size:11px;color:var(--text2);">${m.passName} · ${m.completedAt}</div>
          ${m.sub ? `<div style="font-size:11px;color:var(--text2);">${m.sub}</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div class="quest-xp-badge xp-epic">+${m.xp} XP</div>
        </div>
      </div>`).join('');
  }
  document.getElementById('completedMegasOverlay').classList.add('open');
}

// ====== MENU ======
function toggleMenu() { document.getElementById('menuOverlay').classList.toggle('open'); }
function closeMenuOutside(e) { if (e.target === document.getElementById('menuOverlay')) document.getElementById('menuOverlay').classList.remove('open'); }

function performDayReset(isManual) {
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  const ydDow = (yesterday.getDay() + 6) % 7;

  // дата долга — вчера при автосбросе, сегодня при ручном
  const debtDate = isManual ? today : yd;
  const debtDow = isManual ? todayDowIndex() : ydDow;

  function wasActiveOn(q, dateStr, dow) {
    if (q.startDate && q.startDate > dateStr) return false;
    if (!q.repeat || q.repeat.type === 'daily') return true;
    // для "один раз" — в долг только если дедлайн совпадает с датой долга
    if (q.repeat.type === 'once') return q.deadline === dateStr;
    if (q.repeat.type === 'weekly') return (q.repeat.days || []).includes(dow);
    return true;
  }

  // добавляем долги только без дублей (проверка по имени + дата долга)
  const existingDebts = getDebts();
  passes.forEach(p => {
    normalizeArray(p.quests).forEach(q => {
      if (!q || q.frozen) return;
      if (!wasActiveOn(q, debtDate, debtDow)) return;
      if (!q.trackDebt) return;
      if ((q.current || 0) >= q.max) return; // выполнен — не долг
      // проверка дубля по имени и дате
      const isDupe = existingDebts.some(d => d.name === q.name && d.date === debtDate);
      if (!isDupe) addDebt(q, p.name, debtDate);
    });
  });

  const lobbyProg = getLobbyQuestProgressFromPass(getCurrentPass());
  saveLobbyLastDaySummary({
    date: getLobbySnapshotDate(),
    done: lobbyProg.done,
    total: lobbyProg.total,
    ratio: lobbyProg.ratio
  });

  // сохраняем прогресс авторского пасса ДО сброса квестов
  processAuthorDailyReward();

  // сброс активных квестов
  passes.forEach(p => {
    normalizeArray(p.quests).forEach(q => {
      if (!q || q.frozen) return;
      if (isQuestActiveToday(q)) {
        q.current = 0;
      }
    });
  });

  save('lastAutoReset', today);
  save('lastNewDay', today);
  if (currentUser) {
    fbdb.ref('passit_users/' + currentUser.uid + '/lastAutoReset').set(today);
    fbdb.ref('passit_users/' + currentUser.uid + '/lastNewDay').set(today);
  }
  savePasses();
  cleanupExpiredQuests();
  renderQuests();
  updateDebtBadge();
  renderLobby();
  cloudSave();
}

function newDay() {
  performDayReset(false);
  document.getElementById('menuOverlay').classList.remove('open');
  showToast('🌅 Новый день начат!');
}

function exportJSON() {
  const data = { passes, currentPassId, exportedAt: new Date().toISOString() };
  const json = JSON.stringify(data, null, 2);
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const filename = `passit_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}.json`;
  const blob = new Blob([json], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

function importJSON() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.passes) && data.passes.length > 0) initPasses({ passes: data.passes, currentPassId: data.currentPassId });
        else if (data.quests) initPasses(data);
        else throw new Error('Invalid import payload');
        savePasses();
        document.getElementById('menuOverlay').classList.remove('open');
        render(); showToast('Данные загружены!');
      } catch { showToast('Ошибка чтения файла!'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function fullReset() {
  if (!confirm('Удалить ВСЕ пассы и квесты? Это нельзя отменить!')) return;
  passes = [{ id: uid(), name: 'Мой пасс', emoji: '🎯', quests: [], megaQuests: [] }];
  currentPassId = passes[0].id;
  mqFocused = -1;
  savePasses();
  document.getElementById('menuOverlay').classList.remove('open');
  render();
}

function saveAndClose() {
  savePasses();
  document.getElementById('menuOverlay').classList.remove('open');
  showToast('Прогресс сохранён!');
}

// ====== RENDER ALL ======
// ====== ИСТОРИЯ АКТИВНОСТИ ======
function getHistory() { return load('passit_history', []); }
function saveHistory(arr) {
  // храним только последние 500 записей
  save('passit_history', arr.slice(0, 500));
}

function logActivity(type, data) {
  try {
    const arr = getHistory();
    arr.unshift({
      type,        // 'quest' | 'mega' | 'author_level'
      date: todayStr(),
      ts: Date.now(),
      ...data
    });
    saveHistory(arr);
  } catch(e) {
    // логирование не должно ломать основную логику
    console.warn('logActivity error:', e);
  }
}

function openHistory() {
  document.getElementById('menuOverlay').classList.remove('open');
  const content = document.getElementById('historyContent');
  const history = getHistory();

  if (!history.length) {
    content.innerHTML = '<div style="text-align:center;color:var(--text2);padding:32px;opacity:0.6;">История пока пуста</div>';
    document.getElementById('historyOverlay').classList.add('open');
    return;
  }

  // группируем по дням
  const byDay = {};
  history.forEach(entry => {
    const d = entry.date || '?';
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(entry);
  });

  const typeIcon = { quest: '⚡', mega: '🏆', author_level: '⬆️' };
  const typeLabel = { quest: 'Квест', mega: 'Мегаквест', author_level: 'Уровень' };

  content.innerHTML = Object.entries(byDay).map(([date, entries]) => {
    const totalXP = entries.reduce((s, e) => s + (e.xp || 0), 0);
    const dateLabel = date === todayStr() ? 'Сегодня' : date;
    const rows = entries.map(e => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:16px;width:24px;text-align:center;">${typeIcon[e.type] || '•'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.name || '')}</div>
          <div style="font-size:10px;color:var(--text2);">${escapeHtml(typeLabel[e.type] || e.type)}${e.passName ? ' · ' + escapeHtml(e.passName) : ''}</div>
        </div>
        ${e.xp ? `<div class="quest-xp-badge xp-rare" style="flex-shrink:0;">+${e.xp} XP</div>` : ''}
      </div>`).join('');
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:11px;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:1px;">${dateLabel}</div>
          ${totalXP ? `<div style="font-size:11px;font-weight:700;color:var(--accent);">+${totalXP} XP</div>` : ''}
        </div>
        <div style="background:var(--card-bg);border:1.5px solid var(--border);border-radius:12px;padding:4px 12px;">
          ${rows}
        </div>
      </div>`;
  }).join('');

  document.getElementById('historyOverlay').classList.add('open');
}

function render() {
  updatePassMenuTrigger();
  applyPassTypeUI();
  renderCompactAuthorPass();
  renderMega();
  renderQuests();
  renderLobby();
}

let renderTimeout;
function scheduleRender() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(render, 50);
}

// ====== SUBSCRIPTION ======
var userIsPro = false;

function setProStatus(val) { userIsPro = val; updateSubUI(); updateProfileMenu(); }

function updateSubUI() {
  var freeLabel = document.getElementById('subFreeBtnLabel');
  var proLabel = document.getElementById('subProBtnLabel');
  if (freeLabel && proLabel) {
    if (userIsPro) { freeLabel.textContent = 'Бесплатный план'; freeLabel.className = 'sub-plan-btn current'; proLabel.textContent = '✓ Pro активна'; proLabel.className = 'sub-plan-btn current'; }
    else { freeLabel.textContent = 'Ваш текущий план'; freeLabel.className = 'sub-plan-btn current'; proLabel.textContent = 'Активировать Pro'; proLabel.className = 'sub-plan-btn upgrade'; }
  }
  document.getElementById('addMegaBtn').disabled = false;
  document.getElementById('addQuestBtn').disabled = false;
}

function openSubPopup() { updateSubUI(); document.getElementById('subCodeInput').value = ''; document.getElementById('subCodeMsg').textContent = ''; document.getElementById('subOverlay').classList.add('open'); }
function closeSubPopup() { document.getElementById('subOverlay').classList.remove('open'); }
function closeSubOutside(e) { if (e.target === document.getElementById('subOverlay')) closeSubPopup(); }
function focusCodeInput() { document.getElementById('subCodeInput').focus(); }

function applyCode() {
  var code = document.getElementById('subCodeInput').value.trim().toUpperCase();
  var msgEl = document.getElementById('subCodeMsg');
  if (!code) { msgEl.style.color = '#e04040'; msgEl.textContent = 'Введи код'; return; }
  fbdb.ref('passit_codes/' + code).once('value').then(function(snap) {
    if (!snap.exists()) { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Код не найден'; return; }
    var action = snap.val().action;
    if (action === 'activate_pro') {
      setProStatus(true);
      if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/subscription').set({ type: 'pro', activatedAt: Date.now() });
      msgEl.style.color = 'var(--accent)'; msgEl.textContent = '✓ Pro активирована!'; showToast('👑 Pro активирована!');
    } else if (action === 'revoke_pro') {
      setProStatus(false);
      if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/subscription').set({ type: 'free', revokedAt: Date.now() });
      msgEl.style.color = 'var(--text2)'; msgEl.textContent = '✓ Подписка сброшена до Free'; showToast('Подписка сброшена до Free');
    } else { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Неизвестный код'; }
  }).catch(function() { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Ошибка подключения'; });
}

// ====== UNLOCK CELEBRATION ======
const COSMETIC_META = {
  huntrxh: {
    name: 'UNIT-02',
    rarity: 'Легендарный',
    rarityColor: '#b06000',
    rarityBg: 'rgba(240,160,20,0.2)',
    rarityBorder: 'rgba(240,160,20,0.5)',
    bg: 'linear-gradient(135deg,#E2DEFF 0%,#A78BFA 50%,#2DD4BF 100%)'
  },
  huntrxs: {
    name: 'UNIT-01',
    rarity: 'Редкий',
    rarityColor: '#5a4fa0',
    rarityBg: 'rgba(123,111,212,0.15)',
    rarityBorder: 'rgba(123,111,212,0.3)',
    bg: 'linear-gradient(135deg,#F8EAFA 0%,#96A0E2 50%,#C90060 100%)'
  }
};

function showUnlockCelebration(themeId) {
  const meta = COSMETIC_META[themeId];
  if (!meta) return;
  document.getElementById('unlockTitle').textContent = meta.name;
  document.getElementById('unlockPreview').style.background = meta.bg;
  const rarityEl = document.getElementById('unlockRarity');
  rarityEl.textContent = meta.rarity;
  rarityEl.style.background = meta.rarityBg;
  rarityEl.style.color = meta.rarityColor;
  rarityEl.style.border = '1px solid ' + meta.rarityBorder;
  document.getElementById('unlockOverlay').classList.add('open');
  startConfetti();
}

function closeUnlockCelebration() {
  document.getElementById('unlockOverlay').classList.remove('open');
  stopConfetti();
}

let confettiAnim = null;
let confettiParticles = [];

function startConfetti() {
  const canvas = document.getElementById('unlockParticles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#A78BFA','#2DD4BF','#FFD700','#FF69B4','#7B6FD4','#ffffff'];
  confettiParticles = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    r: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 3,
    spin: Math.random() * Math.PI * 2,
    spinV: (Math.random() - 0.5) * 0.2,
    shape: Math.random() > 0.5 ? 'rect' : 'circle'
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.spin += p.spinV;
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r/2, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    confettiAnim = requestAnimationFrame(draw);
  }
  draw();
}

function stopConfetti() {
  if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; }
  const canvas = document.getElementById('unlockParticles');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

// ====== COSMETIC UNLOCKS ======
function getUnlockedCosmetics() { return load('unlockedCosmetics', []); }
function saveUnlockedCosmetics(arr) { save('unlockedCosmetics', arr); }

function isCosmeticUnlocked(id) {
  // базовые всегда разблокированы
  if (id === 'basic' || id === 'huntrxs') return true;
  return getUnlockedCosmetics().includes(id);
}

function unlockCosmetic(id) {
  const arr = getUnlockedCosmetics();
  if (!arr.includes(id)) { arr.push(id); saveUnlockedCosmetics(arr); }
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/unlockedCosmetics').set(arr);
}

function applyCosmeticCode() {
  var code = document.getElementById('cosmeticCodeInput').value.trim().toUpperCase();
  var msgEl = document.getElementById('cosmeticCodeMsg');
  if (!code) { msgEl.style.color = '#e04040'; msgEl.textContent = 'Введи код'; return; }
  fbdb.ref('passit_codes/' + code).once('value').then(function(snap) {
    if (!snap.exists()) { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Код не найден'; return; }
    var data = snap.val();
    var action = data.action;
    if (action && action.startsWith('unlock_theme_')) {
      var themeId = action.replace('unlock_theme_', '');
      if (isCosmeticUnlocked(themeId)) {
        msgEl.style.color = 'var(--text2)'; msgEl.textContent = '✓ Уже разблокировано';
      } else {
        unlockCosmetic(themeId);
        msgEl.style.color = 'var(--accent)'; msgEl.textContent = '✨ Тема разблокирована!';
        closeThemePicker();
        setTimeout(() => showUnlockCelebration(themeId), 100);
      }
    } else { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Этот код не для оформления'; }
  }).catch(function() { msgEl.style.color = '#e04040'; msgEl.textContent = '❌ Ошибка подключения'; });
}

function loadCloudCosmetics() {
  if (!currentUser) return;
  fbdb.ref('passit_users/' + currentUser.uid + '/unlockedCosmetics').once('value').then(function(snap) {
    if (snap.exists()) {
      const cloudArr = snap.val() || [];
      const localArr = getUnlockedCosmetics();
      // объединяем облачные и локальные
      const merged = [...new Set([...cloudArr, ...localArr])];
      saveUnlockedCosmetics(merged);
      // если локальных больше — обновляем облако
      if (merged.length > cloudArr.length) {
        fbdb.ref('passit_users/' + currentUser.uid + '/unlockedCosmetics').set(merged);
      }
    } else {
      // нет данных в облаке — загружаем локальные
      const localArr = getUnlockedCosmetics();
      if (localArr.length > 0) {
        fbdb.ref('passit_users/' + currentUser.uid + '/unlockedCosmetics').set(localArr);
      }
    }
  });
}

// ====== THEME ======
const THEMES = {
  tactical: {
    light: { '--bg':'#f0f2f7','--surface':'#ffffff','--accent':'#0066cc','--accent2':'#cc2233','--text':'#0a0d14','--text2':'#4a5568','--border':'rgba(0,102,204,0.2)','--bar-bg':'rgba(0,102,204,0.06)','--card-bg':'rgba(255,255,255,0.9)','--overlay':'rgba(0,102,204,0.05)','--blur-bg':'rgba(240,242,247,0.97)' },
    dark: { '--bg':'#0a0d14','--surface':'#111520','--accent':'#00f5ff','--accent2':'#ff4655','--text':'#e8eaf0','--text2':'#6b7a99','--border':'rgba(0,245,255,0.15)','--bar-bg':'rgba(0,245,255,0.06)','--card-bg':'rgba(17,21,32,0.95)','--overlay':'rgba(0,245,255,0.05)','--blur-bg':'rgba(10,13,20,0.97)' }
  },
  huntrxs: {
    light: { '--bg':'#F8EAFA','--surface':'#EEDDFF','--accent':'#96A0E2','--accent2':'#F9DABB','--text':'#2a1a4a','--text2':'#7a5ab0','--border':'rgba(150,160,226,0.35)','--bar-bg':'rgba(150,160,226,0.18)','--card-bg':'rgba(255,255,255,0.55)','--overlay':'rgba(200,180,255,0.25)','--blur-bg':'rgba(238,221,255,0.92)' },
    dark: { '--bg':'#090107','--surface':'#1a1330','--accent':'#C90060','--accent2':'#554EA7','--text':'#F6E3C2','--text2':'#b89a70','--border':'rgba(201,0,96,0.3)','--bar-bg':'rgba(201,0,96,0.12)','--card-bg':'rgba(85,78,167,0.22)','--overlay':'rgba(9,1,7,0.75)','--blur-bg':'rgba(26,19,48,0.95)' }
  },
  huntrxh: {
    light: { '--bg':'#F0EEFF','--surface':'#E2DEFF','--accent':'#7B6FD4','--accent2':'#FFD6F0','--text':'#1a1540','--text2':'#5a4fa0','--border':'rgba(123,111,212,0.3)','--bar-bg':'rgba(123,111,212,0.12)','--card-bg':'rgba(255,255,255,0.7)','--overlay':'rgba(200,190,255,0.25)','--blur-bg':'rgba(240,238,255,0.96)' },
    dark: { '--bg':'#0e0b1f','--surface':'#1a1640','--accent':'#A78BFA','--accent2':'#2DD4BF','--text':'#EDE9FF','--text2':'#A78BFA','--border':'rgba(167,139,250,0.3)','--bar-bg':'rgba(167,139,250,0.12)','--card-bg':'rgba(45,40,100,0.35)','--overlay':'rgba(14,11,31,0.8)','--blur-bg':'rgba(26,22,64,0.97)' }
  },
  basic: {
    light: { '--bg':'#FFFFFF','--surface':'#F0F4FF','--accent':'#4A90D9','--accent2':'#C8DFF8','--text':'#0d1f3c','--text2':'#4a70a0','--border':'rgba(74,144,217,0.25)','--bar-bg':'rgba(74,144,217,0.1)','--card-bg':'rgba(255,255,255,0.8)','--overlay':'rgba(74,144,217,0.12)','--blur-bg':'rgba(240,244,255,0.96)' },
    dark: { '--bg':'#0a0a0a','--surface':'#141414','--accent':'#C8B89A','--accent2':'#2a2520','--text':'#F2E8D9','--text2':'#9a8a6a','--border':'rgba(200,184,154,0.25)','--bar-bg':'rgba(200,184,154,0.1)','--card-bg':'rgba(200,184,154,0.06)','--overlay':'rgba(0,0,0,0.6)','--blur-bg':'rgba(14,14,14,0.97)' }
  },
  // Сезонные темы — применяются пошагово по кусочкам
  mira: {
    light: { '--bg':'#fff0f4','--surface':'#ffe0ea','--accent':'#CF5C86','--accent2':'#F4B9BE','--text':'#3a0a17','--text2':'#8a3a55','--border':'rgba(207,92,134,0.25)','--bar-bg':'rgba(207,92,134,0.12)','--card-bg':'rgba(255,255,255,0.8)','--overlay':'rgba(207,92,134,0.12)','--blur-bg':'rgba(255,240,244,0.96)' },
    dark: { '--bg':'#160810','--surface':'#2a1020','--accent':'#CF5C86','--accent2':'#4A1C29','--text':'#ffe8ef','--text2':'#d4849e','--border':'rgba(207,92,134,0.3)','--bar-bg':'rgba(207,92,134,0.14)','--card-bg':'rgba(74,28,41,0.45)','--overlay':'rgba(22,8,16,0.75)','--blur-bg':'rgba(30,10,20,0.96)' }
  },
  zoi: {
    light: { '--bg':'#eef2ff','--surface':'#dde5ff','--accent':'#4566BB','--accent2':'#D27DA4','--text':'#0d1a3a','--text2':'#3a5088','--border':'rgba(69,102,187,0.25)','--bar-bg':'rgba(69,102,187,0.12)','--card-bg':'rgba(255,255,255,0.8)','--overlay':'rgba(69,102,187,0.12)','--blur-bg':'rgba(238,242,255,0.96)' },
    dark: { '--bg':'#080d1a','--surface':'#101830','--accent':'#4566BB','--accent2':'#1B436C','--text':'#dde8ff','--text2':'#7a96cc','--border':'rgba(69,102,187,0.3)','--bar-bg':'rgba(69,102,187,0.14)','--card-bg':'rgba(27,67,108,0.4)','--overlay':'rgba(8,13,26,0.75)','--blur-bg':'rgba(10,16,32,0.96)' }
  },
  rumi: {
    light: { '--bg':'#f4f2ff','--surface':'#e8e4ff','--accent':'#867DCE','--accent2':'#d4af37','--text':'#1a1540','--text2':'#5a50a0','--border':'rgba(134,125,206,0.25)','--bar-bg':'rgba(134,125,206,0.12)','--card-bg':'rgba(255,255,255,0.8)','--overlay':'rgba(134,125,206,0.12)','--blur-bg':'rgba(244,242,255,0.96)' },
    dark: { '--bg':'#0d0c18','--surface':'#1a1830','--accent':'#867DCE','--accent2':'#d4af37','--text':'#ede8ff','--text2':'#a099d8','--border':'rgba(134,125,206,0.3)','--bar-bg':'rgba(134,125,206,0.14)','--card-bg':'rgba(64,62,114,0.4)','--overlay':'rgba(13,12,24,0.75)','--blur-bg':'rgba(16,14,28,0.96)' }
  }
};

// Тоглы шагов темы: { themeId: { color: true, gradient: true, border: true } }
function getThemeToggles(themeId) {
  return load('passit_theme_toggles_' + themeId, { color: true, gradient: true, border: true });
}
function saveThemeToggles(themeId, toggles) {
  save('passit_theme_toggles_' + themeId, toggles);
}

let dark = load('darkMode', false);
let currentTheme = load('currentTheme', 'huntrxs');
// migrate old key
if (currentTheme === 'huntrx') { currentTheme = 'huntrxs'; save('currentTheme', 'huntrxs'); }

function applyTheme() {
  document.body.classList.toggle('dark', dark);
  document.getElementById('themeBtn').textContent = dark ? '☀️' : '🌙';
  const mode = dark ? 'dark' : 'light';
  const vars = THEMES[currentTheme] ? THEMES[currentTheme][mode] : THEMES.huntrxs[mode];
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

  // применяем шаги сезонной темы
  const seasonal = ['mira','zoi','rumi'];
  if (seasonal.includes(currentTheme)) {
    const step = getThemeStep(currentTheme);
    const toggles = getThemeToggles(currentTheme);
    const data = THEME_PREVIEW_DATA[currentTheme];
    if (!data) return;
    const palette = data[mode];

    // шаг 1: цвет — уже применён через THEMES выше
    // шаг 2: градиент
    const meshEl = document.getElementById('themeMeshLayer');
    if (step >= 2 && toggles.gradient && palette.mesh) {
      if (!meshEl) {
        const el = document.createElement('div');
        el.id = 'themeMeshLayer';
        el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;transition:opacity 0.5s;';
        document.body.prepend(el);
      }
      const mesh = document.getElementById('themeMeshLayer');
      mesh.style.background = palette.mesh;
      mesh.style.opacity = '1';
    } else if (meshEl) {
      meshEl.style.opacity = '0';
    }

    // шаг 3: рамки квест-карточек
    const glowStyle = (step >= 3 && toggles.border)
      ? `box-shadow: ${palette.glowShadow}; border-color: ${palette.glowBorder} !important;`
      : '';
    let styleEl = document.getElementById('themeGlowStyle');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'themeGlowStyle';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = glowStyle
      ? `.quest-card { ${glowStyle} } .mq-row { ${glowStyle} }`
      : '';
  } else {
    // базовая тема — убираем эффекты
    const meshEl = document.getElementById('themeMeshLayer');
    if (meshEl) meshEl.style.opacity = '0';
    const styleEl = document.getElementById('themeGlowStyle');
    if (styleEl) styleEl.textContent = '';
  }
  updateProfileMenu();
}
function toggleTheme() { dark = !dark; save('darkMode', dark); applyTheme(); }
function renderPiecesGrids() {
  document.querySelectorAll('.cos-card.locked[data-pieces]').forEach(card => {
    const total = parseInt(card.dataset.pieces) || 4;
    const collected = parseInt(card.dataset.collected) || 0;
    const grid = card.querySelector('.cos-pieces');
    if (!grid) return;
    grid.innerHTML = Array.from({length: total}, (_, i) =>
      `<div class="cos-piece ${i < collected ? 'got' : ''}"></div>`
    ).join('');
  });
}

let cosFilterOpen = false;
let cosFilterActive = 'all';

function toggleCosFilter() {
  cosFilterOpen = !cosFilterOpen;
  const panel = document.getElementById('cosFilterPanel');
  const arrow = document.getElementById('cosFilterArrow');
  panel.style.display = cosFilterOpen ? 'flex' : 'none';
  arrow.textContent = cosFilterOpen ? '▴' : '▾';
}

function setCosFilter(el, filter) {
  cosFilterActive = filter;
  document.querySelectorAll('.cos-filter-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  applyCosFilter();
}

function applyCosFilter() {
  const cols = document.querySelector('.cos-cols');
  if (!cols) return;
  const leftCol = cols.children[0];  // базовые
  const rightCol = cols.children[1]; // сезонные

  if (cosFilterActive === 'all') {
    leftCol.style.display = ''; rightCol.style.display = '';
  } else if (cosFilterActive === 'basic') {
    leftCol.style.display = ''; rightCol.style.display = 'none';
  } else if (cosFilterActive === 'seasonal') {
    leftCol.style.display = 'none'; rightCol.style.display = '';
  } else if (cosFilterActive === 'owned') {
    // показываем только разблокированные карточки
    leftCol.style.display = ''; rightCol.style.display = '';
    document.querySelectorAll('.cos-card').forEach(card => {
      const isOwned = !card.classList.contains('locked');
      card.style.display = isOwned ? '' : 'none';
    });
    return;
  }
  // сброс видимости карточек
  document.querySelectorAll('.cos-card').forEach(card => card.style.display = '');
}

function openRoadmap(themeId) {
  const theme = SEASONAL_THEMES[themeId];
  if (!theme) return;
  const pieces = getThemePieces(themeId);
  const accent = { mira:'#CF5C86', zoi:'#4566BB', rumi:'#867DCE' }[themeId] || 'var(--accent)';

  document.getElementById('roadmapTitle').textContent = `${theme.name} — Роадмап`;
  document.getElementById('roadmapSubtitle').textContent = `${pieces} / ${theme.totalPieces} кусочков собрано`;

  const stepDescs = [
    'Базовая палитра — цвет фона, акцентов и текста меняется под тему',
    'Градиентный меш — за карточками появляются живые цветовые пятна',
    'Рамки — квест-карточки получают свечение и тень в цвет темы',
    themeId === 'rumi'
      ? 'Анимированная рамка + эксклюзивный статус сезона ✦'
      : 'Эксклюзивный статус сезона — показывается в профиле'
  ];
  const stepIcons = ['🎨','🌊','✨', themeId === 'rumi' ? '⚡' : '🏅'];

  let cumulative = 0;
  const stepsHtml = theme.steps.map((cost, i) => {
    const needed = cumulative + cost;
    const prevNeeded = cumulative;
    cumulative += cost;
    const isDone = pieces >= needed;
    const isActive = !isDone && pieces >= prevNeeded;
    const gotInStep = Math.max(0, Math.min(cost, pieces - prevNeeded));

    const circleClass = isDone ? 'done' : isActive ? 'active' : '';
    const circleStyle = isDone ? `background:${accent};border-color:${accent};color:white;`
                      : isActive ? `border-color:${accent};color:${accent};` : '';
    const status = isDone ? '<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px;background:rgba(50,200,80,0.15);color:#1a8a30;margin-left:6px;">✓ Открыто</span>'
                 : isActive ? `<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px;background:rgba(var(--accent-rgb),0.12);color:var(--accent);margin-left:6px;">В процессе</span>`
                 : `<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px;background:var(--bar-bg);color:var(--text2);margin-left:6px;">🔒 ${needed} 🧩</span>`;

    const rarityLabel = { 0: 'Обычный', 1: 'Обычный', 2: 'Редкий', 3: themeId === 'rumi' ? 'Легендарный' : 'Редкий' }[i] || 'Обычный';
    const rarityColor = { mira: '#CF5C86', zoi: '#4566BB', rumi: '#867DCE' }[themeId];
    const lighterColor = { mira: 'rgba(207,92,134,0.15)', zoi: 'rgba(69,102,187,0.15)', rumi: 'rgba(134,125,206,0.15)' }[themeId];

    const pieceDots = Array.from({length: cost}, (_, pi) => {
      const isGot = pi < gotInStep;
      const pGrad = { mira: 'linear-gradient(135deg,#F4B9BE,#CF5C86)', zoi: 'linear-gradient(135deg,#D27DA4,#4566BB)', rumi: 'linear-gradient(135deg,#d4af37,#867DCE)' }[themeId];
      return isGot
        ? `<div style="width:14px;height:14px;border-radius:4px;background:${pGrad};box-shadow:0 0 8px ${rarityColor}60;" title="${theme.name}"></div>`
        : `<div style="width:14px;height:14px;border-radius:4px;background:var(--bar-bg);border:1px solid var(--border);opacity:0.5;"></div>`;
    }).join('');

    return `<div class="roadmap-step">
      <div class="roadmap-step-circle ${circleClass}" style="${circleStyle}">${isDone ? '✓' : stepIcons[i]}</div>
      <div class="roadmap-step-info">
        <div class="roadmap-step-name">${theme.stepNames[i]}${status}</div>
        <div class="roadmap-step-desc">${stepDescs[i]}</div>
        <div style="margin-top:8px;">
          <div style="font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${rarityColor};margin-bottom:4px;">${rarityLabel} · ${theme.name}</div>
          <div class="roadmap-pieces-row">${pieceDots}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:4px;">${gotInStep} / ${cost} кусочков</div>
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('roadmapSteps').innerHTML = stepsHtml;
  // закрываем theme picker чтобы роадмап был виден
  document.getElementById('themePickerOverlay').classList.remove('open');
  document.getElementById('roadmapOverlay').classList.add('open');
}

function openThemePicker() {
  // фильтр Season 1 hunter themes по authorLevel
  const authorLevel = getAuthorPassLevel();
  const season1HunterGrid = document.getElementById('season1HunterGrid');
  if (season1HunterGrid) {
    season1HunterGrid.style.display = authorLevel > 0 ? 'grid' : 'none';
  }
  
  // обновляем счётчики кусочков
  ['mira','zoi','rumi'].forEach(id => {
    const theme = SEASONAL_THEMES[id];
    if (!theme) return;
    const pieces = getThemePieces(id);
    const pct = Math.round((pieces / theme.totalPieces) * 100);
    // находим карточку по data-theme
    const card = document.querySelector(`.cos-card[data-theme="${id}"]`);
    if (!card) return;
    const counter = card.querySelector('[data-piece-counter]');
    if (counter) counter.textContent = `${pieces}/${theme.totalPieces} 🧩`;
    const bar = card.querySelector('.cos-bar-fill');
    if (bar) bar.style.width = pct + '%';
    // прогресс бар
    const step = getThemeStep(id);
    if (step >= 1 && !isCosmeticUnlocked(id)) {
      card.classList.remove('locked');
      // частично разблокирована
      card.style.opacity = '1';
    }
  });
  renderPiecesGrids();
  document.querySelectorAll('.cos-card[data-theme]').forEach(card => {
    const themeId = card.dataset.theme;
    const step = getThemeStep(themeId);
    const unlocked = isCosmeticUnlocked(themeId);

    if (unlocked) {
      card.classList.remove('locked');
      card.querySelector('.cos-pieces')?.remove();
      const fill = card.querySelector('.cos-bar-fill');
      if (fill) fill.style.width = '100%';
      if (!card.getAttribute('onclick')) {
        card.setAttribute('onclick', `selectTheme('${themeId}')`);
      }
    }
    // сезонные темы с хотя бы 1 разблокированным шагом тоже кликабельны
    if (!unlocked && step >= 1) {
      card.classList.remove('locked');
      card.style.opacity = '1';
      if (!card.getAttribute('onclick')) {
        card.setAttribute('onclick', `selectTheme('${themeId}')`);
      }
    }
    // предпросмотр доступен всегда — и для locked и для разблокированных
    const prevBtn = card.querySelector('.cos-preview-btn');
    if (prevBtn && THEME_PREVIEW_DATA[themeId]) {
      prevBtn.classList.add('clickable');
      prevBtn.style.pointerEvents = 'all';
      prevBtn.onclick = (e) => { e.stopPropagation(); openThemePreview(themeId); };
    }
  });
  updateSwatchSelected();
  document.getElementById('cosmeticCodeInput').value = '';
  document.getElementById('cosmeticCodeMsg').textContent = '';
  // сбрасываем фильтр
  cosFilterOpen = false;
  const fp = document.getElementById('cosFilterPanel');
  if (fp) fp.style.display = 'none';
  const fa = document.getElementById('cosFilterArrow');
  if (fa) fa.textContent = '▾';
  document.querySelectorAll('.cos-filter-tag').forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
  cosFilterActive = 'all';
  document.querySelectorAll('.cos-card').forEach(c => c.style.display = '');
  document.querySelectorAll('.cos-col').forEach(c => c.style.display = '');
  document.getElementById('themePickerOverlay').classList.add('open');
}
function closeThemePicker() { document.getElementById('themePickerOverlay').classList.remove('open'); }
function closeThemePickerOutside(e) { if (e.target === document.getElementById('themePickerOverlay')) closeThemePicker(); }
function selectTheme(name) { currentTheme = name; save('currentTheme', name); applyTheme(); updateSwatchSelected(); }
function updateSwatchSelected() {
  document.querySelectorAll('.cos-card').forEach(c => c.classList.remove('selected'));
  const sel = document.querySelector(`.cos-card[onclick*="${currentTheme}"]`);
  if (sel) sel.classList.add('selected');
  // показываем тоглы шагов если активная тема сезонная
  renderThemeToggles();
}

function renderThemeToggles() {
  // убираем старые тоглы
  document.querySelectorAll('.theme-step-toggles').forEach(el => el.remove());

  const seasonal = ['mira','zoi','rumi'];
  if (!seasonal.includes(currentTheme)) return;

  const step = getThemeStep(currentTheme);
  if (step < 1) return; // ни одного шага не разблокировано

  const card = document.querySelector(`.cos-card[onclick*="${currentTheme}"]`);
  if (!card) return;

  const toggles = getThemeToggles(currentTheme);
  const stepNames = { gradient: 'Градиент', border: 'Рамки' };
  const stepMinStep = { gradient: 2, border: 3 };

  const container = document.createElement('div');
  container.className = 'theme-step-toggles';
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-top:1px solid var(--border);margin-top:4px;';

  ['gradient','border'].forEach(key => {
    if (step < stepMinStep[key]) return; // шаг не разблокирован
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
    const on = toggles[key];
    row.innerHTML = `
      <span style="font-size:11px;color:var(--text2);font-weight:600;">${stepNames[key]}</span>
      <button onclick="toggleThemeStep('${currentTheme}','${key}')" style="
        width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;
        background:${on ? 'var(--accent)' : 'var(--bar-bg)'};
        position:relative;transition:background 0.2s;
      ">
        <span style="
          position:absolute;top:2px;width:16px;height:16px;border-radius:50%;
          background:white;transition:left 0.2s;
          left:${on ? '18px' : '2px'};
        "></span>
      </button>`;
    container.appendChild(row);
  });

  card.appendChild(container);
}

function toggleThemeStep(themeId, key) {
  const toggles = getThemeToggles(themeId);
  toggles[key] = !toggles[key];
  saveThemeToggles(themeId, toggles);
  applyTheme();
  renderThemeToggles();
}

// ====== MIDNIGHT CLEANUP ======
function cleanupExpiredQuests() {
  const today = todayStr();
  let changed = false;
  passes.forEach(p => {
    p.quests = normalizeArray(p.quests);
    const before = p.quests.length;
    p.quests = p.quests.map(q => {
      if (!q) return null;
      if (q.frozen) return q;
      if (q.repeat?.type !== 'once') return q;
      // удаляем если просрочен по дедлайну (долг уже добавлен в performDayReset)
      if (q.deadline && q.deadline < today) return null;
      // удаляем если выполнен
      if ((q.current || 0) >= q.max && q.max > 0) return null;
      return q;
    }).filter(q => q !== null); // убираем null из всего массива, не только с конца
    if (p.quests.length !== before) changed = true;
  });
  if (changed) { savePasses(); renderQuests(); showToast('🗑 Одноразовые квесты удалены'); }
}

function scheduleMidnightCleanup() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 10, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    showNewDayPopup();
    scheduleMidnightCleanup();
  }, msUntilMidnight);
}

// ====== NEW DAY POPUP ======
function showNewDayPopup() {
  document.getElementById('newDayOverlay').classList.add('open');
}

function confirmDayReset() {
  document.getElementById('newDayOverlay').classList.remove('open');
  performDayReset(false);
  showToast('🌅 Новый день начат — квесты сброшены!');
}

function skipDayReset() {
  // отложить до следующего открытия — не сохраняем lastAutoReset
  document.getElementById('newDayOverlay').classList.remove('open');
  showToast('⏸ Сброс отложен — напомним позже');
}

// ====== DEBT SYSTEM ======
function getDebts() { return load('passit_debts', []); }
function saveDebts(d) { save('passit_debts', d); }

function addDebt(quest, passName, date) {
  const debts = getDebts();
  debts.push({
    id: Date.now() + Math.random(),
    emoji: quest.emoji,
    name: quest.name,
    sub: quest.sub || '',
    current: quest.current || 0,
    max: quest.max,
    unit: quest.unit || 'ед.',
    xp: quest.xp || 100,
    trackDebt: quest.trackDebt,
    passName: passName,
    date: date || todayStr()
  });
  saveDebts(debts);
  updateDebtBadge();
}

function updateDebtBadge() {
  const debts = getDebts();
  const badge = document.getElementById('debtBadge');
  if (!badge) return;
  if (debts.length > 0) {
    badge.textContent = debts.length > 9 ? '9+' : debts.length;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

function openDebts() {
  renderDebtList();
  document.getElementById('debtOverlay').classList.add('open');
}
function closeDebts() { document.getElementById('debtOverlay').classList.remove('open'); }
function closeDebtOutside(e) { if (e.target === document.getElementById('debtOverlay')) closeDebts(); }

function renderDebtList() {
  const debts = getDebts();
  const list = document.getElementById('debtList');
  if (debts.length === 0) {
    list.innerHTML = '<div class="debt-empty">🎉 Долгов нет!</div>';
    return;
  }
  list.innerHTML = debts.map((d, i) => `
    <div class="debt-item">
      <span style="font-size:20px;">${d.emoji}</span>
      <div class="debt-item-info">
        <div class="debt-item-name">${d.name}</div>
        <div class="debt-item-meta">${d.passName} · ${d.date}</div>
        <div class="debt-item-progress"><div class="debt-item-fill" style="width:${Math.round(((d.current||0)/d.max)*100)}%"></div></div>
        <div style="font-size:10px;color:var(--accent);margin-top:3px;cursor:pointer;font-weight:700;" onclick="openChangeDebt(${i})">${d.current||0} / ${d.max} — нажми чтобы изменить</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
        <button class="debt-delete-btn" onclick="addDebtToPass(${i})" title="Добавить в пасс" style="background:rgba(var(--accent-rgb,96,160,96),0.12);border-color:var(--accent);color:var(--accent);font-size:11px;padding:3px 7px;border-radius:8px;border:1px solid;cursor:pointer;font-weight:700;">+ В пасс</button>
        <button class="debt-delete-btn" onclick="removeDebt(${i})" title="Закрыть долг">🗑️</button>
      </div>
    </div>`).join('');
}

function addDebtToPass(i) {
  const debts = getDebts();
  const d = debts[i];
  if (!d) return;
  const p = getCurrentPass();
  const maxQ = userIsPro ? 18 : 9;
  const nonNull = normalizeArray(p.quests).filter(q => q !== null).length;
  if (nonNull >= maxQ) { showToast('Пасс заполнен — освободи место'); return; }

  const questName = `${d.name} (долг от ${d.date})`;
  const quest = {
    id: uid(),
    emoji: d.emoji || '📋',
    name: questName,
    sub: '',   // не undefined
    max: d.max || 1,
    current: d.current || 0,
    unit: d.unit || 'ед.',
    xp: d.xp || 100,
    repeat: { type: 'once' },
    trackDebt: false,
  };
  p.quests = normalizeArray(p.quests);
  p.quests.push(quest);
  debts.splice(i, 1);
  saveDebts(debts);
  savePasses();
  render(); // полный ре-рендер чтобы показался новый блок
  updateAuthorIfOpen();
  updateDebtBadge();
  showToast(`✅ «${d.name}» добавлен в пасс`);
  renderDebtList();
}

let changeDebtIndex = -1;

function openChangeDebt(i) {
  const debts = getDebts();
  const d = debts[i];
  changeDebtIndex = i;
  changeMetricType = 'debt';
  changeMetricMax = d.max;
  metricMode = 'abs';
  const inputEl = document.getElementById('changeMetricInput');
  const unitEl = document.getElementById('changeMetricUnit');
  const hintEl = document.getElementById('changeMetricHint');
  document.getElementById('changeMetricTitle').textContent = d.name;
  document.getElementById('changeMetricLabel').textContent = 'Текущее значение';
  document.getElementById('metricModeAbs').classList.add('active');
  document.getElementById('metricModePct').classList.remove('active');
  inputEl.max = d.max; inputEl.value = d.current || 0;
  unitEl.textContent = `/ ${d.max}`;
  hintEl.textContent = `= ${Math.round(((d.current||0) / d.max) * 100)}%`;
  inputEl.removeEventListener('input', updateMetricHint);
  inputEl.addEventListener('input', updateMetricHint);
  document.getElementById('changeMetricOverlay').classList.add('open');
  setTimeout(() => { inputEl.focus(); inputEl.select(); }, 100);
}

function removeDebt(i) {
  const debts = getDebts();
  debts.splice(i, 1);
  saveDebts(debts);
  updateDebtBadge();
  renderDebtList();
}

function clearAllDebts() {
  if (!confirm('Очистить все долги?')) return;
  saveDebts([]);
  updateDebtBadge();
  renderDebtList();
}

// ====== AUTO RESET ON PAGE LOAD ======
function checkAndAutoReset() {
  const today = todayStr();
  const lastReset = load('lastAutoReset', null);
  if (lastReset === today) return;

  // проверяем стрик за пропущенные дни
  // если не открывали приложение — нужно применить заморозку за каждый пропущенный день
  if (lastReset && lastReset < today) {
    const last = new Date(lastReset + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const missedDays = Math.round((now - last) / 86400000) - 1; // -1 т.к. сегодня ещё не сбросили
    if (missedDays > 0) {
      // применяем заморозку или сброс за каждый пропущенный день
      for (let d = 0; d < missedDays; d++) {
        applyStreakFreeze();
      }
    }
  }

  performDayReset(false);
}

// ====== AUTHOR PASS SCREEN ======
let authorScreenOpen = false;

function toggleAuthorScreen() {
  authorScreenOpen = !authorScreenOpen;
  const wrap = document.getElementById('screensWrap');
  const btn = document.getElementById('passSwitchBtn');
  const icon = document.getElementById('passSwitchIcon');
  const label = document.getElementById('passSwitchLabel');
  const header = document.getElementById('mainHeader');
  const headerTitle = document.getElementById('headerTitle');
  const debtWrap = document.getElementById('headerDebtWrap');
  const themeBtn = document.getElementById('themeBtn');
  const cosmeticsBtn = document.getElementById('headerCosmeticsBtn');

  document.getElementById('passSwitchWrap').classList.toggle('author-mode', authorScreenOpen);
  wrap.classList.toggle('author-shown', authorScreenOpen);
  btn.classList.toggle('author-active', authorScreenOpen);
  header.classList.toggle('author-mode', authorScreenOpen);

  if (authorScreenOpen) {
    icon.textContent = '▼';
    label.textContent = 'Личный пасс';
    headerTitle.textContent = 'Season Pass';
    debtWrap.style.display = 'none';
    themeBtn.style.display = 'none';
    cosmeticsBtn.style.display = 'none';
    document.getElementById('streakWidget').style.display = 'flex';
    document.getElementById('shopBtn').style.display = '';
    document.getElementById('achievementsBtn').style.display = 'none';
    checkStreakToday();
    updateAuthorPassUI();
    syncAuthorLevel();
    // инициализируем квест недели при открытии
    qowInit();
    checkAuthorOnboarding();
  } else {
    icon.textContent = '▲';
    label.textContent = 'Авторский пасс';
    headerTitle.textContent = 'Your Daily Pass';
    debtWrap.style.display = '';
    themeBtn.style.display = '';
    cosmeticsBtn.style.display = '';
    document.getElementById('streakWidget').style.display = 'none';
    document.getElementById('shopBtn').style.display = 'none';
    document.getElementById('achievementsBtn').style.display = '';
  }
}

// ====== AUTHOR PASS SYSTEM ======

// --- СТРИК С ЗАМОРОЗКАМИ ---
function getStreak() { return load('passit_streak', { count: 0, lastDate: null, weekDays: {}, freezesUsed: 0, freezeWeek: null }); }
function saveStreak(s) { save('passit_streak', s); if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/streak').set(s); }

function getWeekDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['вс','пн','вт','ср','чт','пт','сб'][d.getDay()];
}

function checkStreakToday() {
  const today = todayStr();
  const streak = getStreak();

  const allQuests = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen));
  const activeToday = allQuests.filter(q => isQuestActiveToday(q));

  // если нет активных квестов вообще — не трогаем стрик
  if (activeToday.length === 0) return streak;

  const streakMet = activeToday.some(q => (q.current || 0) >= q.max * 0.5);

  // если стрик был засчитан сегодня но условие больше не выполняется — убираем
  if (!streakMet && streak.lastDate === today) {
    const weekStart = getCurrentWeekStart();
    const weekDays = (streak.freezeWeek === weekStart) ? { ...(streak.weekDays || {}) } : {};
    delete weekDays[today];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    const newStreak = {
      count: streak.count > 0 ? streak.count - 1 : 0,
      lastDate: streak.count > 1 ? yd : null,
      weekDays, freezesUsed: (streak.freezeWeek === weekStart) ? (streak.freezesUsed || 0) : 0,
      freezeWeek: weekStart
    };
    saveStreak(newStreak);
    if (authorScreenOpen) renderStreakWidget();
    return newStreak;
  }

  if (!streakMet) return streak;

  // уже засчитан сегодня — не перезаписываем счётчик
  if (streak.lastDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

  const weekStart = getCurrentWeekStart();
  // всегда берём weekDays текущей недели
  const weekDays = (streak.freezeWeek === weekStart) ? { ...(streak.weekDays || {}) } : {};
  const freezesUsed = (streak.freezeWeek === weekStart) ? (streak.freezesUsed || 0) : 0;

  weekDays[today] = 'done';
  const prevCount = streak.count || 0;
  const newStreak = {
    count: (streak.lastDate === yd) ? prevCount + 1 : 1,
    lastDate: today, weekDays, freezesUsed, freezeWeek: weekStart
  };
  saveStreak(newStreak);
  if (authorScreenOpen) renderStreakWidget();
  return newStreak;
}

function applyStreakFreeze() {
  // вызывается при сбросе дня если стрик не продлён
  const today = todayStr();
  const streak = getStreak();
  const weekStart = getCurrentWeekStart();
  const freezesUsed = (streak.freezeWeek === weekStart) ? (streak.freezesUsed || 0) : 0;

  if (freezesUsed < 3 && streak.count > 0) {
    // weekDays: берём если та же неделя ИЛИ если freezeWeek не установлен но lastDate сегодня
  const weekDays = (streak.freezeWeek === weekStart) ? (streak.weekDays || {}) :
    (streak.weekDays && streak.lastDate && streak.lastDate >= weekStart) ? streak.weekDays : {};
    weekDays[today] = 'frozen';
    saveStreak({ ...streak, freezesUsed: freezesUsed + 1, freezeWeek: weekStart, weekDays, lastDate: today });
    return true; // заморозка применена
  }
  // заморозок нет — сбрасываем стрик
  saveStreak({ count: 0, lastDate: null, weekDays: {}, freezesUsed: 0, freezeWeek: weekStart });
  return false;
}

function getStreakCount() {
  const streak = getStreak();
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  if (streak.lastDate === today || streak.lastDate === yd) return streak.count;
  return 0;
}

function renderStreakWidget() {
  const streak = getStreak();
  const weekStart = getCurrentWeekStart();
  const count = getStreakCount();
  const freezesUsed = (streak.freezeWeek === weekStart) ? (streak.freezesUsed || 0) : 0;
  // weekDays: берём если та же неделя ИЛИ если freezeWeek не установлен но lastDate сегодня
  const weekDays = (streak.freezeWeek === weekStart) ? (streak.weekDays || {}) :
    (streak.weekDays && streak.lastDate && streak.lastDate >= weekStart) ? streak.weekDays : {};

  const countEl = document.getElementById('streakCount');
  const freezeEl = document.getElementById('streakFreezeCount');
  const daysEl = document.getElementById('streakDaysRow');
  if (countEl) countEl.textContent = count;
  if (freezeEl) freezeEl.textContent = 3 - freezesUsed;

  if (daysEl) {
    // показываем дни текущей недели пн-вс
    const days = ['пн','вт','ср','чт','пт','сб','вс'];
    const weekStartDate = new Date(weekStart + 'T00:00:00');
    daysEl.innerHTML = days.map((label, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const state = weekDays[ds];
      const cls = state === 'done' ? 'done' : state === 'frozen' ? 'frozen' : '';
      const icon = state === 'done' ? '✓' : state === 'frozen' ? '❄' : label;
      return `<div class="streak-day-dot ${cls}">${icon}</div>`;
    }).join('');
  }
}

// --- XP СИСТЕМA ---
function getWeeklyXP() { return load('passit_weekly_xp', { xp: 0, weekStart: null, target: null, completed: false }); }
function saveWeeklyXP(w) { save('passit_weekly_xp', w); }
function getWeeklyTargetBase() {
  const allPersonalQ = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen));
  return Math.max(allPersonalQ.reduce((sum, q) => sum + (q.xp || 100), 0), 500) * 3;
}
function getWeeklyChallengeState() {
  const weekStart = getCurrentWeekStart();
  const stored = getWeeklyXP();
  const isCurrentWeek = stored.weekStart === weekStart;
  const target = isCurrentWeek && stored.target ? stored.target : getWeeklyTargetBase();
  const xp = isCurrentWeek ? (stored.xp || 0) : 0;
  const completed = isCurrentWeek ? !!stored.completed : false;
  return { weekStart, xp, target, completed };
}
function saveWeeklyChallengeState(patch) {
  const current = getWeeklyChallengeState();
  const next = { ...current, ...patch };
  next.completed = !!next.completed || next.xp >= next.target;
  saveWeeklyXP(next);
  return next;
}

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=вс, 1=пн...
  const diff = (day === 0 ? -6 : 1 - day); // пн этой недели
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return `${mon.getFullYear()}-${String(mon.getMonth()+1).padStart(2,'0')}-${String(mon.getDate()).padStart(2,'0')}`;
}

function addXPToday(xp) {
  // вызывается при завершении мегаквеста — сохраняем сразу в weekly
  if (!xp || xp <= 0) return;
  const weekly = getWeeklyChallengeState();
  saveWeeklyChallengeState({ xp: weekly.xp + xp });
}

function getWeeklyXPValue() {
  // weekly XP = только накопленный из прошлых дней (сохраняется при сбросе дня)
  // сегодняшний день не засчитывается пока не будет сброса
  return getWeeklyChallengeState().xp;
}

// --- КВЕСТ НЕДЕЛИ ---

function qowWeekKey() { return 'passit_qow_' + getCurrentWeekStart(); }
function qowGetData() { return load(qowWeekKey(), { id: null, name: null, emoji: null, dates: [] }); }
function qowSaveData(d) { save(qowWeekKey(), d); }

function qowFindQuest() {
  const d = qowGetData();
  if (!d.id && !d.name) return null;
  for (const p of passes) {
    for (const q of normalizeArray(p.quests)) {
      if (!q) continue;
      // ищем по id если есть, иначе по имени
      if (d.id && q.id && String(q.id) === String(d.id)) return q;
      if (!d.id && d.name && q.name === d.name) return q;
    }
  }
  return null;
}

function qowInit() {
  localStorage.removeItem('passit4_passit_qow_name');
  localStorage.removeItem('passit4_passit_qow_pass');
  localStorage.removeItem('passit4_passit_qow_week');

  const d = qowGetData();

  // если уже выбран на этой неделе — не перевыбираем посреди недели
  if (d.id || d.name) {
    return d;
  }

  // выбираем один раз на неделю среди всех живых личных квестов
  const all = passes.flatMap(p =>
    normalizeArray(p.quests).filter(q => q && !q.frozen)
  );
  if (!all.length) return { id: null, name: null, emoji: null, dates: [] };
  const chosen = [...all].sort((a, b) => (a.current||0)/a.max - (b.current||0)/b.max)[0];
  // убеждаемся что id есть — добавляем если нет
  if (!chosen.id) chosen.id = Date.now() + Math.random();
  const newD = { id: String(chosen.id), name: chosen.name, emoji: chosen.emoji || '🎯', dates: [] };
  qowSaveData(newD);
  return newD;
}

function qowCheck() {
  const d = qowInit();
  if (!d.id && !d.name) return;
  const found = qowFindQuest();
  if (!found) return;
  // засчитываем только если квест активен сегодня
  if (!isQuestActiveToday(found)) return;

  const today = todayStr();
  const isComplete = (found.current || 0) >= found.max;
  const alreadyCounted = (d.dates || []).includes(today);

  if (isComplete && !alreadyCounted) {
    d.dates = [...(d.dates || []), today];
    qowSaveData(d);
    showToast('🎯 Квест недели: ' + d.dates.length + '/3');
  } else if (!isComplete && alreadyCounted) {
    d.dates = (d.dates || []).filter(dt => dt !== today);
    qowSaveData(d);
  }
}

function qowGetProgress() {
  const d = qowInit();
  const found = qowFindQuest();
  return {
    name: found?.name || d.name || 'Квест недели',
    emoji: found?.emoji || d.emoji || '🎯',
    done: (d.dates || []).length,
    target: 3
  };
}

// вызывается при каждом изменении квеста
function onQuestCompleted(questName) {
  checkStreakToday();
  qowCheck();
  checkAchievements();
  if (authorScreenOpen) updateAuthorPassUI();
}


// --- УРОВНИ АВТОРСКОГО ПАССА ---
function getAuthorPassLevel() { return load('passit_author_level', 0); }
function saveAuthorPassLevel(l) {
  save('passit_author_level', l);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/authorLevel').set(l);
}

function tryAddAuthorLevel(count) {
  const current = getAuthorPassLevel();
  const newLevel = Math.min(current + count, 150);
  if (newLevel > current) {
    saveAuthorPassLevel(newLevel);
    if (authorScreenOpen) updateAuthorPassUI();
  }
}

function processAuthorDailyReward() {
  // Защита от дупа — фиксируем только один раз за текущий день сброса
  const today = todayStr();
  const lastSaved = load('passit_author_xp_date', null);
  if (lastSaved === today) return;

  const todayXP = getTodayLiveXP();
  const oldStoredXP = getAuthorXP();
  const oldCommittedLevel = Math.min(Math.floor(oldStoredXP / 500), 150);
  const oldRewardsUpTo = load('passit_rewards_up_to', 0);

  // сохраняем в исторический XP авторского пасса
  const newTotalXP = oldStoredXP + todayXP;
  save('passit_author_xp', newTotalXP);
  save('passit_author_xp_date', today);
  const committedLevel = Math.min(Math.floor(newTotalXP / 500), 150);
  saveAuthorPassLevel(committedLevel);

  if (currentUser) {
    fbdb.ref('passit_users/' + currentUser.uid + '/authorXP').set(newTotalXP);
    fbdb.ref('passit_users/' + currentUser.uid + '/authorXPDate').set(today);
  }

  // Награды за уже зафиксированные уровни: боксы были временными и просто закрепляются,
  // а кусочки/прочие постоянные награды нужно долить здесь.
  for (let l = Math.max(oldRewardsUpTo + 1, oldCommittedLevel + 1); l <= committedLevel; l++) {
    if (l > 0 && l % 5 === 0) continue;
    processLevelRewards(l);
  }
  save('passit_rewards_up_to', Math.max(oldRewardsUpTo, committedLevel));
  commitTempLevelBoxes();

  // стрик
  const streakMet = checkStreakToday();
  if (!streakMet || streakMet.lastDate !== todayStr()) {
    applyStreakFreeze();
  }

  // weekly XP — из ЛИЧНЫХ квестов, сохраняем один раз при сбросе дня
  // используем отдельный guard по дате
  const weeklyGuardKey = 'passit_weekly_saved_' + today;
  if (!load(weeklyGuardKey, false)) {
    save(weeklyGuardKey, true);
    const personalQuests = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen && isQuestActiveToday(q)));
    const personalXPToday = personalQuests.reduce((sum, q) => {
      const pct = Math.min(1, (q.current || 0) / q.max);
      return sum + Math.round(pct * (q.xp || 100));
    }, 0);
    const weekly = getWeeklyChallengeState();
    saveWeeklyChallengeState({ xp: weekly.xp + personalXPToday });
  }

  if (authorScreenOpen) updateAuthorPassUI();
}

// --- АВТОР XP ---
function getAuthorXP() { return load('passit_author_xp', 0); }

// XP за сегодня — как в памятке:
// процент выполнения каждого авторского квеста * его XP = вклад в прогресс
// Ежедневки: +200, +300, +500 XP — пропорционально прогрессу каждой
// Итого макс за день = 1000 XP = 2 уровня при полном выполнении
function getTodayLiveXP() {
  const allQuests = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen));
  const activeToday = allQuests.filter(q => {
    if (!isQuestActiveToday(q)) return false;
    if (q.deadline) {
      const days = daysUntilDeadline(q.deadline);
      if (days !== null && days > 7) return false;
    }
    return true;
  });
  const total = activeToday.length;
  const done = total ? activeToday.reduce((s, q) => s + Math.min(1, (q.current||0)/q.max), 0) : 0;

  const t1 = Math.max(1, Math.ceil(total * 0.25));
  const t2 = Math.max(1, Math.ceil(total * 0.5));
  const t3 = total || 1;

  // adq0: прогресс / цель × 200
  const xp0 = Math.round(Math.min(done / t1, 1) * 200);
  // adq1: прогресс / цель × 300
  const xp1 = Math.round(Math.min(done / t2, 1) * 300);
  // adq2: прогресс / цель × 500
  const xp2 = Math.round(Math.min(done / t3, 1) * 500);

  // awq2: стрик — streakCount/4 × 1000
  const streakXP = Math.round(Math.min(getStreakCount() / 4, 1) * 1000);

  // awq0: XP за неделю — (накопленный + живой) / цель × 1500
  const weekly = getWeeklyChallengeState();
  const weekStored = weekly.xp;
  const personalLive = activeToday.reduce((s, q) => s + Math.round(Math.min(1,(q.current||0)/q.max)*(q.xp||100)), 0);
  // вклад мегаквестов пропорционально прогрессу
  const megaLive = passes.flatMap(p => normalizeArray(p.megaQuests)).reduce((s, mq) => {
    if (!mq) return s;
    const tasks = normalizeArray(mq.tasks);
    const maxVal = mq.taskMode ? Math.max(mq.minMetric || 0, tasks.length) : (mq.max || 1);
    const cur = mq.taskMode ? tasks.filter(t => t.done).length : (mq.current || 0);
    const xp = Math.round(300 + 700 * (maxVal / (maxVal + 100)));
    return s + Math.round(Math.min(1, cur / maxVal) * xp);
  }, 0);
  // цель недели = сумма XP всех личных квестов × 3 дня
  const allPersonalQuests = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen));
  const weekTarget = weekly.target;
  const liveWeekComplete = (weekStored + personalLive + megaLive) >= weekTarget;
  if (liveWeekComplete && !weekly.completed) saveWeeklyChallengeState({ completed: true });
  const effectiveWeekXP = (weekly.completed || liveWeekComplete) ? weekTarget : Math.min(weekStored + personalLive + megaLive, weekTarget);
  const weeklyXPtaskXP = Math.round(Math.min(effectiveWeekXP / weekTarget, 1) * 1500);

  // awq1: квест недели — done/3 × 1000
  const qowProg = qowGetProgress();
  const qowXP = Math.round(Math.min(qowProg.done / qowProg.target, 1) * 1000);

  return xp0 + xp1 + xp2 + streakXP + weeklyXPtaskXP + qowXP;
}

// Полный XP = исторический + сегодняшний живой
function getTotalAuthorXP() {
  return getAuthorXP() + getTodayLiveXP();
}

// Синхронизирует уровень из live XP и выдаёт награды если уровень вырос
function syncAuthorLevel() {
  const totalXP = getTotalAuthorXP();
  const newLevel = Math.min(Math.floor(totalXP / 500), 150);
  const oldLevel = getAuthorPassLevel();
  const committedLevel = Math.min(Math.floor(getAuthorXP() / 500), 150);
  const rewardedUpTo = load('passit_rewards_up_to', 0);

  if (newLevel > oldLevel) {
    saveAuthorPassLevel(newLevel);
    for (let l = oldLevel + 1; l <= newLevel; l++) {
      if (l > committedLevel) {
        if (l > 0 && l % 5 === 0) awardBoxes(1, { temporaryLevel: true });
      } else if (l > rewardedUpTo) {
        processLevelRewards(l);
      }
    }
    save('passit_rewards_up_to', Math.max(rewardedUpTo, Math.min(newLevel, committedLevel)));
    showToast(`⬆️ Уровень ${newLevel}!`);
    logActivity('author_level', { name: `Уровень ${newLevel}`, xp: 0 });
  } else if (newLevel < oldLevel) {
    saveAuthorPassLevel(newLevel);
    let tempLostBoxes = 0;
    for (let l = newLevel + 1; l <= oldLevel; l++) {
      if (l > committedLevel && l % 5 === 0) tempLostBoxes++;
    }
    revokeTempLevelBoxes(tempLostBoxes);
  }
  return newLevel;
}
function addAuthorXP(xp) {
  const current = getAuthorXP();
  const newXP = current + xp;
  save('passit_author_xp', newXP);
  if (currentUser) fbdb.ref('passit_users/' + currentUser.uid + '/authorXP').set(newXP);
  syncAuthorLevel(); // syncAuthorLevel выдаёт награды и тост
  renderCompactAuthorPass();
}

function renderAuthorCircles() {
  const row = document.getElementById('authorCirclesRow');
  if (!row) return;
  const totalXP = getTotalAuthorXP();
  const level = syncAuthorLevel(); // синхронизируем и берём актуальный уровень
  const XP_PER_LEVEL = 500;
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const pctInLevel = xpInLevel / XP_PER_LEVEL;

  let html = '';
  for (let i = 0; i <= 150; i++) {
    const filled = i < level;
    const current = i === level;
    const isBox = i > 0 && i % 5 === 0;
    const isPiece = i > 0 && i % 3 === 0 && !isBox;
    const size = isBox ? 52 : 40;

    let bg, border, color, shadow = '';
    if (filled) {
      bg = 'linear-gradient(135deg,#E8960A,#F5C842)';
      border = '#C07800'; color = 'white';
      if (isBox) shadow = 'box-shadow:0 0 10px rgba(232,150,10,0.5);';
    } else if (current) {
      bg = 'rgba(255,255,255,0.7)';
      border = '#E8960A'; color = '#6B4400';
      shadow = 'box-shadow:0 0 0 3px rgba(232,150,10,0.2);';
    } else {
      bg = 'rgba(255,255,255,0.3)';
      border = 'rgba(180,120,0,0.2)'; color = 'rgba(120,70,0,0.35)';
    }

    let inner = '';
    if (isBox) inner = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;"><span style="font-size:9px;font-weight:800;color:${color};">${i}</span><span style="font-size:${filled?12:10}px;line-height:1;">📦</span></div>`;
    else if (isPiece) inner = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;"><span style="font-size:9px;font-weight:800;color:${color};">${i}</span><span style="font-size:${filled?9:8}px;line-height:1;">🧩</span></div>`;
    else inner = `<span style="font-size:${current?13:11}px;font-weight:800;color:${color};">${i}</span>`;

    html += `<div class="ap-node-circle" data-tip="${isBox ? '📦 Бокс' : isPiece ? '🧩 Кусочек' : 'Ур. ' + i}" style="width:${size}px;height:${size}px;border-radius:50%;border:${filled?'2.5px':current?'3px':'1.5px'} solid ${border};background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;${shadow}">${inner}</div>`;

    if (i < 150) {
      // линия: заполнена если уровень пройден, частично если текущий
      let lineBg;
      if (filled) {
        lineBg = '#E8960A';
      } else if (current) {
        const p = Math.round(pctInLevel * 100);
        lineBg = `linear-gradient(to right, #E8960A ${p}%, rgba(180,120,0,0.15) ${p}%)`;
      } else {
        lineBg = 'rgba(180,120,0,0.15)';
      }
      html += `<div style="width:28px;height:4px;background:${lineBg};border-radius:2px;flex-shrink:0;"></div>`;
    }
  }
  row.innerHTML = html;

  const scrollEl = document.getElementById('authorCirclesScroll');
  if (scrollEl) scrollEl.scrollLeft = Math.max(0, level * 68 - 150);
}
function updateAuthorPassUI() {
  const allQuests = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen));
  // исключаем задачи с дедлайном дальше 7 дней
  const activeToday = allQuests.filter(q => {
    if (!isQuestActiveToday(q)) return false;
    if (q.deadline) {
      const days = daysUntilDeadline(q.deadline);
      if (days !== null && days > 7) return false;
    }
    return true;
  });
  const total = activeToday.length;
  // done = сумма пропорционального прогресса по всем квестам
  // квест на 50% = 0.5, на 100% = 1.0
  const done = activeToday.reduce((sum, q) => {
    const pct = Math.min(1, (q.current || 0) / q.max);
    return sum + pct;
  }, 0);

  // ЕЖЕДНЕВКИ — пороги 25/50/100%
  const targets = [
    Math.max(1, Math.ceil(total * 0.25)),
    Math.max(1, Math.ceil(total * 0.5)),
    total || 1
  ];
  const dailyNames = [
    `Выполни ${targets[0]} квест${targets[0] > 1 ? 'а' : ''}`,
    `Выполни ${targets[1]} из ${total}`,
    `Выполни все (${total})`
  ];
  for (let i = 0; i < 3; i++) {
    const pct = Math.min(100, Math.round((done / targets[i]) * 100));
    const isDone = done >= targets[i];
    const el = document.getElementById(`adq${i}`);
    if (!el) continue;
    document.getElementById(`adq${i}name`).textContent = dailyNames[i];
    document.getElementById(`adq${i}bar`).style.width = pct + '%';
    document.getElementById(`adq${i}meta`).textContent = `${Math.min(Math.floor(done), targets[i])} / ${targets[i]} · +${[200,300,500][i]} XP`;
    el.style.opacity = isDone ? '1' : '0.75';
    el.style.borderColor = isDone ? 'rgba(200,140,0,0.6)' : '';
  }

  // ЕЖЕНЕДЕЛЬНЫЕ — XP
  const weeklyState = getWeeklyChallengeState();
  const weekXPstored = weeklyState.xp;
  const personalQuestsLive = passes.flatMap(p => normalizeArray(p.quests).filter(q => q && !q.frozen && isQuestActiveToday(q)));
  const personalLiveToday = personalQuestsLive.reduce((sum, q) => sum + Math.round(Math.min(1, (q.current||0)/q.max) * (q.xp||100)), 0);
  const weekTarget = weeklyState.target;
  const weekXP = weeklyState.completed ? weekTarget : Math.min(weekXPstored + personalLiveToday, weekTarget);
  const weekPct = Math.min(100, Math.round((weekXP / weekTarget) * 100));
  const weekDone = weekXP >= weekTarget;
  if (weekDone && !weeklyState.completed) saveWeeklyChallengeState({ completed: true });
  const awq0 = document.getElementById('awq0bar');
  const awq0meta = document.getElementById('awq0meta');
  if (awq0) awq0.style.width = weekPct + '%';
  if (awq0meta) awq0meta.textContent = `${weekXP} / ${weekTarget} XP · +1500 XP`;
  const awq0card = awq0?.closest('.author-quest-card');
  if (awq0card) {
    awq0card.style.opacity = weekDone ? '1' : '0.75';
    awq0card.style.borderColor = weekDone ? 'rgba(200,140,0,0.6)' : '';
  }

  // КВЕСТ НЕДЕЛИ
  const qow = qowGetProgress();
  const awq1 = document.getElementById('awq1bar');
  const awq1name = document.getElementById('awq1name');
  const awq1meta = document.getElementById('awq1meta');
  if (awq1name) awq1name.textContent = `${qow.emoji} ${qow.name}`;
  if (awq1) awq1.style.width = Math.round((qow.done / qow.target) * 100) + '%';
  if (awq1meta) awq1meta.textContent = `${qow.done} / ${qow.target} · +1000 XP`;
  const awq1card = document.getElementById('awq1card');
  if (awq1card) {
    awq1card.style.opacity = qow.done >= qow.target ? '1' : '0.75';
    awq1card.style.borderColor = qow.done >= qow.target ? 'rgba(200,140,0,0.6)' : '';
  }

  // СТРИК
  const streakCount = getStreakCount();
  const awq2 = document.getElementById('awq2bar');
  const awq2name = document.getElementById('awq2name');
  const awq2meta = document.getElementById('awq2meta');
  const streakTarget = 4;
  const streakProgress = Math.min(streakCount, streakTarget);
  if (awq2name) awq2name.textContent = `🔥 Продли стрик (${streakCount} дн.)`;
  if (awq2) awq2.style.width = Math.round((streakProgress / streakTarget) * 100) + '%';
  if (awq2meta) awq2meta.textContent = `${streakProgress} / ${streakTarget} дней · +1000 XP`;
  const awq2card = awq2?.closest('.author-quest-card');
  if (awq2card) {
    awq2card.style.opacity = streakCount >= streakTarget ? '1' : '0.75';
    awq2card.style.borderColor = streakCount >= streakTarget ? 'rgba(200,140,0,0.6)' : '';
  }

  const totalXP = getTotalAuthorXP();
  const level = Math.min(Math.floor(totalXP / 500), 150);
  const levelNum = document.getElementById('authorLevelNum');
  const xpNum = document.getElementById('authorXPTotalNum');
  if (levelNum) levelNum.textContent = level;
  if (xpNum) xpNum.textContent = totalXP;

  // счётчик дней до конца сезона
  const seasonDaysEl = document.getElementById('seasonDaysLeft');
  if (seasonDaysEl) {
    const start = new Date('2026-03-30');
    const end = new Date(start);
    end.setDate(end.getDate() + 75);
    const now = new Date();
    now.setHours(0,0,0,0);
    const daysLeft = Math.max(0, Math.round((end - now) / 86400000));
    seasonDaysEl.textContent = daysLeft > 0 ? `${daysLeft} дн. до конца сезона` : 'Сезон завершён';
  }

  renderStreakWidget();
  renderAuthorCircles();

  // обновляем виджет магазина
  const boxBadge = document.getElementById('shopBoxBadge');
  const coinsWidget = document.getElementById('shopCoinsWidget');
  const piecesWidget = document.getElementById('shopPiecesWidget');
  if (boxBadge) boxBadge.textContent = `Боксов: ${getPendingBoxes()}`;
  if (coinsWidget) coinsWidget.textContent = getCoins();
  if (piecesWidget) piecesWidget.textContent = `${getBoxPieces()}/5`;
}

// ====== AUTHOR PASS (old popup — kept for compat) ======
function openAuthorPass() {
  document.getElementById('authorOverlay').classList.add('open');
}
function closeAuthorPass() {
  document.getElementById('authorOverlay').classList.remove('open');
}
function closeAuthorOutside(e) {
  if (e.target === document.getElementById('authorOverlay')) closeAuthorPass();
}

// ====== PROFILE MENU ======
function toggleProfileMenu() {
  document.getElementById('profileDropdown').classList.toggle('open');
}
function closeProfileMenu() {
  document.getElementById('profileDropdown').classList.remove('open');
}
function updateProfileMenu() {
  const emailEl = document.getElementById('profileEmail');
  const subEl = document.getElementById('profileSubStatus');
  const seasonEl = document.getElementById('profileSeasonStatus');
  const authBtn = document.getElementById('profileAuthBtn');
  if (currentUser) {
    emailEl.textContent = currentUser.email;
    subEl.textContent = userIsPro ? '👑 Pro план' : 'Free план';
    authBtn.textContent = '🚪 Выйти';
  } else {
    emailEl.textContent = 'Не авторизован';
    subEl.textContent = 'Free план';
    authBtn.textContent = '🔑 Войти через Google';
  }
  const statuses = getUnlockedSeasonStatuses();
  if (seasonEl) {
    if (statuses.length > 0) {
      seasonEl.style.display = 'block';
      seasonEl.textContent = statuses.map(s => s.label).join(' • ');
      seasonEl.style.color = statuses.length === 1 ? statuses[0].accent : 'var(--accent)';
      seasonEl.style.fontWeight = '800';
    } else {
      seasonEl.style.display = 'none';
      seasonEl.textContent = '';
    }
  }
}
function profileAuthAction() {
  closeProfileMenu();
  if (currentUser) {
    firebase.auth().signOut();
  } else {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(e => showToast('Ошибка: ' + e.message));
  }
}
function openFeedbackExt() {
  window.open('https://docs.google.com/forms/d/e/1FAIpQLSf_placeholder/viewform', '_blank');
}

// close profile on outside click
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('profileWrap');
  if (wrap && !wrap.contains(e.target)) closeProfileMenu();
});

// ====== ENTER KEY FOR POPUPS ======
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  // не срабатывает на textarea
  if (e.target.tagName === 'TEXTAREA') return;
  const actions = {
    'questPopupOverlay':    () => addQuest(),
    'editQuestOverlay':     () => saveEditQuest(),
    'megaPopupOverlay':     () => addMega(),
    'editMegaOverlay':      () => saveEditMega(),
    'createPassOverlay':    () => createPass(),
    'renamePassOverlay':    () => renamePass(),
    'changeMetricOverlay':  () => saveMetricChange(),
  };
  for (const [id, fn] of Object.entries(actions)) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open')) {
      e.preventDefault();
      fn();
      return;
    }
  }
});
function openFeedback() { document.getElementById('feedbackOverlay').classList.add('open'); }

applyTheme();
render();
checkAchievements(false);
checkUpdateBanner();
initDragToPass();
checkAndAutoReset();
cleanupExpiredQuests();
checkOnboarding();
scheduleMidnightCleanup();
updateDebtBadge();
// recoverMissingRewards вызывается только после загрузки облака (в onAuthStateChanged)

// ====== FIREBASE AUTH ======
var currentUser = null;

function authClick() {
  if (currentUser) {
    document.getElementById('accountEmail').textContent = currentUser.email;
    document.getElementById('accountUploadBtn').onclick = function() {
      cloudSave();
      document.getElementById('accountModal').style.display = 'none';
      showToast('✅ Прогресс привязан к аккаунту!');
    };
    document.getElementById('accountSignoutBtn').onclick = function() {
      firebase.auth().signOut();
      document.getElementById('accountModal').style.display = 'none';
    };
    document.getElementById('accountModal').style.display = 'flex';
  } else {
    document.getElementById('authModal').style.display = 'flex';
  }
}

document.getElementById('googleBtn').onclick = function() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function() { document.getElementById('authModal').style.display = 'none'; })
    .catch(function(e) { showToast('Ошибка: ' + e.message); });
};

firebase.auth().onAuthStateChanged(function(user) {
  currentUser = user;
  updateProfileMenu();
  if (user) {
    logSession();
    loadCloudCosmetics();
    fbdb.ref('passit_users/' + user.uid).once('value').then(function(snap) {
      var sub = null;
      if (snap.exists()) { sub = snap.val().subscription; }
      if (sub && sub.type === 'pro') setProStatus(true); else setProStatus(false);

      var cloudData = snap.exists() ? snap.val() : null;

      // Нормализуем облачные данные — старый формат или новый
      var cloudPasses = null;
      var cloudCurId = null;
      if (cloudData) {
        if (cloudData.passes && Array.isArray(cloudData.passes)) {
          cloudPasses = cloudData.passes;
          cloudCurId = cloudData.currentPassId;
        } else if (cloudData.quests || cloudData.megaQuests) {
          // старый формат — мигрируем
          cloudPasses = [{ id: 'migrated', name: 'Мой пасс', emoji: '🎯', quests: normalizeArray(cloudData.quests), megaQuests: normalizeArray(cloudData.megaQuests) }];
          cloudCurId = 'migrated';
        }
      }

      // Нормализуем пассы — у каждого должны быть массивы
      if (cloudPasses) {
        cloudPasses = normalizePassesList(cloudPasses);
      }

      var localHasData = passes.some(p => normalizeArray(p.quests).length > 0 || normalizeArray(p.megaQuests).length > 0);
      var cloudHasData = cloudPasses && cloudPasses.some(p => normalizeArray(p.quests).filter(q=>q).length > 0 || normalizeArray(p.megaQuests).length > 0);
      var isReturningUser = !!load('lastAutoReset', null) || !!load('lastNewDay', null) || !!load('passit_onboarding_done', false);

      if (cloudHasData) {
        // всегда берём облако если оно есть — без вопросов
        initPasses({ passes: cloudPasses, currentPassId: cloudCurId });
        // восстанавливаем все важные данные из облака
        if (cloudData.authorXP != null)        save('passit_author_xp', cloudData.authorXP);
        if (cloudData.authorLevel != null)      save('passit_author_level', cloudData.authorLevel);
        if (cloudData.authorXPDate != null)     save('passit_author_xp_date', cloudData.authorXPDate);
        // rewardsUpTo: если нет в облаке — ставим равным уровню, чтобы не пересчитывать
        const cloudRewardsUpTo = cloudData.rewardsUpTo != null ? cloudData.rewardsUpTo : (cloudData.authorLevel || 0);
        save('passit_rewards_up_to', cloudRewardsUpTo);
        if (cloudData.pendingBoxes != null)     save('passit_pending_boxes', cloudData.pendingBoxes);
        if (cloudData.boxPieces != null)        save('passit_box_pieces', cloudData.boxPieces);
        if (cloudData.coins != null)            save('passit_coins', cloudData.coins);
        if (cloudData.achievements != null)     save('passit_achievements', cloudData.achievements);
        if (cloudData.achievementsRewarded != null) save('passit_achievements_rewarded', cloudData.achievementsRewarded);
        if (cloudData.themePiecesMira != null)  save('passit_theme_pieces_mira', cloudData.themePiecesMira);
        if (cloudData.themePiecesZoi != null)   save('passit_theme_pieces_zoi', cloudData.themePiecesZoi);
        if (cloudData.themePiecesRumi != null)  save('passit_theme_pieces_rumi', cloudData.themePiecesRumi);
        if (cloudData.streak != null)           save('passit_streak', cloudData.streak);
        if (cloudData.weeklyXP != null)         save('passit_weekly_xp', cloudData.weeklyXP);
        const localLastAutoReset = load('lastAutoReset', null);
        if (cloudData.lastAutoReset != null && (!localLastAutoReset || cloudData.lastAutoReset > localLastAutoReset)) {
          save('lastAutoReset', cloudData.lastAutoReset);
        }
        const localLastNewDay = load('lastNewDay', null);
        if (cloudData.lastNewDay != null && (!localLastNewDay || cloudData.lastNewDay > localLastNewDay)) {
          save('lastNewDay', cloudData.lastNewDay);
        }
        const localLastDaySummary = load('passit_last_day_summary', null);
        if (cloudData.lastDaySummary != null && (!localLastDaySummary?.date || cloudData.lastDaySummary.date >= localLastDaySummary.date)) {
          save('passit_last_day_summary', cloudData.lastDaySummary);
        }
        if (cloudData.levelRewardsGranted != null) save('passit_level_rewards_granted', cloudData.levelRewardsGranted);
        scheduleRender();
        checkAndAutoReset();
        scheduleRender();
        recoverMissingRewards();
        recoverMissingAchievementRewards(false);
      } else if (localHasData && !cloudHasData) {
        // первый вход с локальными данными — тихо сохраняем в облако
        cloudSave(); scheduleRender(); checkAndAutoReset(); scheduleRender(); recoverMissingRewards(); recoverMissingAchievementRewards(false);
      } else {
        scheduleRender();
        checkAndAutoReset();
        scheduleRender();
        recoverMissingAchievementRewards(false);
      }
    });
  } else {
    setProStatus(false);
    renderLobby();
  }
});

function showMergeModal(localPasses, cloudPasses, cloudCurId) {
  var localTotal = localPasses.reduce((s,p) => s + normalizeArray(p.quests).length + normalizeArray(p.megaQuests).length, 0);
  var cloudTotal = cloudPasses.reduce((s,p) => s + normalizeArray(p.quests).length + normalizeArray(p.megaQuests).length, 0);
  document.getElementById('mergeModalDesc').innerHTML =
    'В облаке: <b>' + cloudPasses.length + '</b> пасс(ов), <b>' + cloudTotal + '</b> элементов.<br>' +
    'Локально: <b>' + localPasses.length + '</b> пасс(ов), <b>' + localTotal + '</b> элементов.';
  document.getElementById('mergeBtnKeepCloud').onclick = function() {
    initPasses({ passes: cloudPasses, currentPassId: cloudCurId });
    savePasses(); document.getElementById('mergeModal').style.display = 'none'; render(); showToast('☁️ Загружено из облака!');
  };
  document.getElementById('mergeBtnKeepLocal').onclick = function() {
    cloudSave(); document.getElementById('mergeModal').style.display = 'none'; render(); showToast('✅ Локальные данные сохранены!');
  };
  document.getElementById('mergeBtnMerge').onclick = function() {
    var merged = [...cloudPasses];
    localPasses.forEach(function(lp) { if (!merged.find(function(cp) { return cp.name === lp.name; })) merged.push(lp); });
    initPasses({ passes: merged, currentPassId: cloudCurId || merged[0].id });
    // если сегодня уже был сброс — применяем нулевые значения из локальных данных
    const today = todayStr();
    if (load('lastAutoReset', null) === today) {
      passes.forEach(p => {
        normalizeArray(p.quests).forEach(q => {
          if (!q || q.frozen) return;
          if (isQuestActiveToday(q)) q.current = 0;
        });
      });
    }
    savePasses(); document.getElementById('mergeModal').style.display = 'none'; render(); showToast('✅ Данные объединены!');
  };
  document.getElementById('mergeModal').style.display = 'flex';
}

function cloudSave() {
  if (!currentUser) return;
  const now = new Date();
  const readable = now.toLocaleString('ru', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  fbdb.ref('passit_users/' + currentUser.uid).update({
    passes, currentPassId,
    updated: readable,
    updatedTs: now.getTime(),
    // авторский пасс
    authorXP: load('passit_author_xp', 0),
    authorLevel: load('passit_author_level', 0),
    authorXPDate: load('passit_author_xp_date', null),
    rewardsUpTo: load('passit_rewards_up_to', 0),
    // боксы и монеты
    pendingBoxes: load('passit_pending_boxes', 0),
    boxPieces: load('passit_box_pieces', 0),
    coins: load('passit_coins', 0),
    achievements: load('passit_achievements', []),
    achievementsRewarded: load('passit_achievements_rewarded', []),
    // кусочки тем
    themePiecesMira: load('passit_theme_pieces_mira', 0),
    themePiecesZoi: load('passit_theme_pieces_zoi', 0),
    themePiecesRumi: load('passit_theme_pieces_rumi', 0),
    // стрик
    streak: load('passit_streak', null),
    // weekly XP
    weeklyXP: load('passit_weekly_xp', null),
    lastAutoReset: load('lastAutoReset', null),
    lastNewDay: load('lastNewDay', null),
    lastDaySummary: load('passit_last_day_summary', null),
    levelRewardsGranted: load('passit_level_rewards_granted', []),
  });
}

function logSession() {
  if (!currentUser) return;
  const now = new Date();
  const readable = now.toLocaleString('ru', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  fbdb.ref('passit_users/' + currentUser.uid + '/sessions').push({
    at: readable,
    ts: now.getTime()
  });
}

setInterval(cloudSave, 60000);

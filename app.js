// ==========================================================================
// APP.JS - INTERACTIVE PHILOSOPHY LAB & READER WITH TOPIC QUIZZES
// ==========================================================================

let currentExperimentId = 1;
let currentFilterTheme = 'all';
let searchQuery = '';
let currentFontSize = 20;
let userQuizAnswers = {}; // { [expId]: selectedOptionIndex }

// THEMATIC DOMAINS
const DOMAINS = [
  { id: 'all', label: 'Semua (100)' },
  { id: 'Epistemologi', label: 'Epistemologi & Kebenaran' },
  { id: 'Pikiran', label: 'Pikiran, Jiwa & AI' },
  { id: 'Identitas', label: 'Identitas Diri & Waktu' },
  { id: 'Etika', label: 'Etika & Moralitas' },
  { id: 'Keadilan', label: 'Keadilan & Politik' },
  { id: 'Estetika', label: 'Estetika & Bahasa' },
  { id: 'Logika', label: 'Logika & Paradoks' }
];

// ==========================================================================
// ROBUST MARKDOWN & LATEX INLINE RENDERER
// ==========================================================================
function renderMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let str = raw;

  // 1. Math / LaTeX Symbols replacement
  str = str.replace(/\\times\b/g, '×')
           .replace(/\\pm\b/g, '±')
           .replace(/\\neq\b/g, '≠')
           .replace(/\\leq\b/g, '≤')
           .replace(/\\geq\b/g, '≥')
           .replace(/\\infty\b/g, '∞')
           .replace(/\\leftrightarrow\b/g, '↔')
           .replace(/\\to\b/g, '→')
           .replace(/\\rightarrow\b/g, '→')
           .replace(/\\leftarrow\b/g, '←')
           .replace(/\\lor\b/g, '∨')
           .replace(/\\land\b/g, '∧')
           .replace(/\\neg\b/g, '¬')
           .replace(/\\forall\b/g, '∀')
           .replace(/\\exists\b/g, '∃')
           .replace(/\\in\b/g, '∈');

  // Math inline $...$
  str = str.replace(/\$([^\$]+)\$/g, '<span class="math-inline">$1</span>');

  // 2. Inline Code `code`
  str = str.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 3. Bold + Italic: ***text*** or ___text___ or **_text_** or _**text**_
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
           .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
           .replace(/\*\*\_([^_]+)\_\*\*/g, '<strong><em>$1</em></strong>')
           .replace(/\_\*\*([^*]+)\*\*\_/g, '<strong><em>$1</em></strong>');

  // 4. Bold: **text** or __text__
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
           .replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 5. Italic / Book Titles / Internal Asterisks: *text* or _text_
  // Handles punctuation boundaries e.g. "*book*", (*book*), *book*, *book*.
  str = str.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  str = str.replace(/(^|\s|>|\()_([^_]+)_($|\s|<|\)|\.|\,)/g, '$1<em>$2</em>$3');

  // 6. Typographic dashes & ellipsis
  str = str.replace(/---/g, '—')
           .replace(/--/g, '–');

  return str;
}

// Strip markdown for plain-text previews (e.g. search snippet)
function stripMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/___([^_]+)___/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\$([^\$]+)\$/g, '$1');
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderThemeChips();
  renderExplorerGrid();
  populateChapterSelect();
  loadExperiment(1);
  
  // Close theme dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-menu')) {
      const dd = document.getElementById('theme-dropdown');
      if (dd) dd.classList.remove('show');
    }
  });
});

// THEME SYSTEM
function initTheme() {
  const saved = localStorage.getItem('pig_theme') || 'classic';
  setTheme(saved);
}

function toggleThemeMenu() {
  const dd = document.getElementById('theme-dropdown');
  if (dd) dd.classList.toggle('show');
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pig_theme', theme);
  const dd = document.getElementById('theme-dropdown');
  if (dd) dd.classList.remove('show');
}

// VIEW ROUTING
function switchView(viewName) {
  const views = ['explorer', 'reader'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const btn = document.getElementById(`btn-tab-${v}`);
    if (el) el.classList.remove('active');
    if (btn) btn.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${viewName}`);
  const activeBtn = document.getElementById(`btn-tab-${viewName}`);
  if (activeView) activeView.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// EXPLORER VIEW RENDERING
function renderThemeChips() {
  const container = document.getElementById('theme-chips-container');
  if (!container) return;

  container.innerHTML = DOMAINS.map(d => `
    <button class="chip-btn ${currentFilterTheme === d.id ? 'active' : ''}" onclick="filterByDomain('${d.id}')">
      ${d.label}
    </button>
  `).join('');
}

function filterByDomain(domainId) {
  currentFilterTheme = domainId;
  renderThemeChips();
  renderExplorerGrid();
}

function handleSearch(val) {
  searchQuery = val.trim().toLowerCase();
  renderExplorerGrid();
}

function renderExplorerGrid() {
  const grid = document.getElementById('experiments-grid');
  const countEl = document.getElementById('results-count');
  const filterLabel = document.getElementById('active-filter-label');
  if (!grid) return;

  const filtered = EXPERIMENTS_DATA.filter(exp => {
    // Theme match
    let themeMatch = true;
    if (currentFilterTheme !== 'all') {
      themeMatch = exp.theme.toLowerCase().includes(currentFilterTheme.toLowerCase());
    }

    // Search match
    let searchMatch = true;
    if (searchQuery) {
      const matchNum = exp.id.toString() === searchQuery;
      const matchTitleId = exp.title_id.toLowerCase().includes(searchQuery);
      const matchTitleEn = exp.title_en.toLowerCase().includes(searchQuery);
      const matchSource = exp.source ? exp.source.toLowerCase().includes(searchQuery) : false;
      const matchScenario = exp.scenario.some(p => p.toLowerCase().includes(searchQuery));
      searchMatch = matchNum || matchTitleId || matchTitleEn || matchSource || matchScenario;
    }

    return themeMatch && searchMatch;
  });

  if (countEl) countEl.innerText = `Menampilkan ${filtered.length} dari 100 eksperimen pikiran`;
  if (filterLabel) {
    const domainObj = DOMAINS.find(d => d.id === currentFilterTheme);
    filterLabel.innerText = `Domain: ${domainObj ? domainObj.label : 'Semua'}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <p style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.5rem;">Tidak ditemukan eksperimen pikiran yang cocok</p>
        <p class="sans" style="font-size: 0.95rem;">Coba gunakan kata kunci lain atau pilih domain "Semua".</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(exp => {
    const rawSnippet = exp.scenario.length > 0 ? exp.scenario[0] : '';
    const snippetParsed = renderMarkdown(rawSnippet);
    const sourceBrief = exp.source ? stripMarkdown(exp.source).replace(/^Source:\s*/i, '').replace(/^Sumber:\s*/i, '') : 'Eksperimen Bebas';
    const isAnswered = userQuizAnswers[exp.id] !== undefined;
    
    return `
      <div class="exp-card" onclick="openExperiment(${exp.id})">
        <div>
          <div class="card-top">
            <span class="card-num"># ${String(exp.id).padStart(3, '0')}</span>
            <span class="card-theme">${exp.theme.split('&')[0].trim()}</span>
          </div>
          <h3 class="card-title">${renderMarkdown(exp.title_id)}</h3>
          <div class="card-title-en">${exp.title_en}</div>
          <div class="card-snippet">${snippetParsed}</div>
        </div>
        <div class="card-footer">
          <span class="card-source-tag" title="${sourceBrief}">📖 ${sourceBrief}</span>
          <span class="card-arrow">${isAnswered ? '✅ Selesai &rarr;' : 'Baca & Kuis &rarr;'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// QUICK-JUMP CHAPTER SELECTOR
function populateChapterSelect() {
  const select = document.getElementById('reader-chapter-select');
  if (!select) return;

  select.innerHTML = EXPERIMENTS_DATA.map(exp => `
    <option value="${exp.id}"># ${String(exp.id).padStart(3, '0')}. ${stripMarkdown(exp.title_id)}</option>
  `).join('');
}

function openExperiment(id) {
  currentExperimentId = id;
  loadExperiment(id);
  switchView('reader');

  const select = document.getElementById('reader-chapter-select');
  if (select) select.value = id;
}

function openRandomExperiment() {
  const randId = Math.floor(Math.random() * 100) + 1;
  openExperiment(randId);
}

function navigateChapter(delta) {
  const nextId = currentExperimentId + delta;
  if (nextId >= 1 && nextId <= 100) {
    openExperiment(nextId);
  }
}

function adjustFontSize(delta) {
  currentFontSize = Math.max(16, Math.min(26, currentFontSize + delta * 1.5));
  document.documentElement.style.setProperty('--reader-font-size', `${currentFontSize}px`);
}

function loadExperiment(id) {
  const exp = EXPERIMENTS_DATA.find(e => e.id === id);
  if (!exp) return;

  const contentBody = document.getElementById('reader-content-body');
  const bottomNav = document.getElementById('reader-bottom-nav');
  const select = document.getElementById('reader-chapter-select');
  if (select) select.value = id;

  // Render all markdown & LaTeX in scenario and commentary
  const scenarioHTML = exp.scenario.map(p => `<p>${renderMarkdown(p)}</p>`).join('');
  const commentaryHTML = exp.commentary.map(p => `<p>${renderMarkdown(p)}</p>`).join('');

  const sourceHTML = exp.source ? `
    <div class="source-citation">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      <div><strong>Sumber Rujukan:</strong> ${renderMarkdown(exp.source.replace(/^\*\*Sumber:\s*/i, '').replace(/\*\*$/i, ''))}</div>
    </div>
  ` : '';

  // QUIZ HTML GENERATION
  const quiz = exp.quiz;
  const answeredIdx = userQuizAnswers[exp.id];
  const optionLetters = ['A', 'B', 'C', 'D'];

  const quizOptionsHTML = quiz.options.map((opt, idx) => {
    let extraClass = '';
    if (answeredIdx !== undefined) {
      if (opt.isCorrect) extraClass = 'correct';
      else if (answeredIdx === idx && !opt.isCorrect) extraClass = 'incorrect';
    }

    return `
      <button class="quiz-opt-btn ${extraClass}" 
              ${answeredIdx !== undefined ? 'disabled' : ''} 
              onclick="submitQuizAnswer(${exp.id}, ${idx})">
        <span class="quiz-opt-letter">${optionLetters[idx]}.</span>
        <span style="flex:1;">${renderMarkdown(opt.text)}</span>
      </button>
    `;
  }).join('');

  let feedbackHTML = '';
  if (answeredIdx !== undefined) {
    const selectedOpt = quiz.options[answeredIdx];
    const isCorrect = selectedOpt.isCorrect;
    feedbackHTML = `
      <div class="quiz-feedback-box show ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="feedback-heading">
          ${isCorrect ? '✅ Jawaban Tepat!' : '❌ Refleksi Filosofis:'}
        </div>
        <p>${renderMarkdown(selectedOpt.explanation)}</p>
      </div>
    `;
  }

  const quizHTML = `
    <div class="quiz-card" id="quiz-card-${exp.id}">
      <div class="quiz-header">
        <span class="quiz-badge">Kuis Filosofis</span>
        <span class="quiz-status-tag">${answeredIdx !== undefined ? 'Status: Terjawab' : 'Uji Pemahaman'}</span>
      </div>
      <h3 class="quiz-question">${renderMarkdown(quiz.question)}</h3>
      <div class="quiz-options-list">
        ${quizOptionsHTML}
      </div>
      <div id="quiz-feedback-container-${exp.id}">
        ${feedbackHTML}
      </div>
    </div>
  `;

  // SEE ALSO SECTION
  const seeAlsoHTML = exp.see_also.length > 0 ? `
    <div class="see-also-container">
      <h3 class="see-also-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Eksperimen Pikiran Terkait
      </h3>
      <div class="see-also-grid">
        ${exp.see_also.map(ref => {
          const targetExp = EXPERIMENTS_DATA.find(e => e.id === ref.id);
          const targetTitle = targetExp ? targetExp.title_id : ref.title;
          return `
            <div class="see-also-card" onclick="openExperiment(${ref.id})">
              <span class="see-also-num">${String(ref.id).padStart(3, '0')}</span>
              <span class="see-also-name">${renderMarkdown(targetTitle)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  contentBody.innerHTML = `
    <header class="article-header">
      <div class="article-meta-badge">
        <span class="article-number"># ${String(exp.id).padStart(3, '0')}</span>
        <span class="article-theme-tag">${exp.theme}</span>
      </div>
      <h1 class="article-title">${renderMarkdown(exp.title_id)}</h1>
      <div class="article-title-en">${exp.title_en}</div>
    </header>

    <!-- SCENARIO VIGNETTE -->
    <div class="scenario-vignette">
      <div class="scenario-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Skenario Perumpamaan
      </div>
      <div class="scenario-content">
        ${scenarioHTML}
      </div>
    </div>

    <!-- SOURCE -->
    ${sourceHTML}

    <!-- COMMENTARY BODY -->
    <div class="commentary-section">
      ${commentaryHTML}
    </div>

    <!-- INTERACTIVE PHILOSOPHICAL QUIZ -->
    ${quizHTML}

    <!-- SEE ALSO -->
    ${seeAlsoHTML}
  `;

  // BOTTOM NAVIGATION
  if (bottomNav) {
    const prevExp = id > 1 ? EXPERIMENTS_DATA.find(e => e.id === id - 1) : null;
    const nextExp = id < 100 ? EXPERIMENTS_DATA.find(e => e.id === id + 1) : null;

    let prevHTML = prevExp ? `
      <div class="chapter-nav-card" onclick="openExperiment(${prevExp.id})">
        <span class="nav-direction-label">&larr; Bab Sebelumnya</span>
        <span class="nav-card-title"># ${String(prevExp.id).padStart(3, '0')}. ${stripMarkdown(prevExp.title_id)}</span>
      </div>
    ` : '<div></div>';

    let nextHTML = nextExp ? `
      <div class="chapter-nav-card next" onclick="openExperiment(${nextExp.id})">
        <span class="nav-direction-label">Bab Berikutnya &rarr;</span>
        <span class="nav-card-title"># ${String(nextExp.id).padStart(3, '0')}. ${stripMarkdown(nextExp.title_id)}</span>
      </div>
    ` : '<div></div>';

    bottomNav.innerHTML = prevHTML + nextHTML;
  }
}

function submitQuizAnswer(expId, optionIdx) {
  userQuizAnswers[expId] = optionIdx;
  loadExperiment(expId);
}

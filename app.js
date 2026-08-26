// ==========================================================================
// APP.JS - INTERACTIVE PHILOSOPHY LAB & READER
// ==========================================================================

let currentExperimentId = 1;
let currentFilterTheme = 'all';
let searchQuery = '';
let currentFontSize = 19;
let isConstellationInitialized = false;

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

// REFLECTION POLL QUESTIONS GENERATOR (Customized per experiment)
function getReflectionPrompt(exp) {
  const customQuestions = {
    1: {
      q: "Jika Anda tidak bisa membuktikan 100% bahwa Anda sedang tidak tertipu oleh iblis pengelabui, apakah Anda masih menganggap keyakinan sehari-hari Anda rasional?",
      optA: "Ya, pragmatisme dan konsistensi pengalaman sudah cukup.",
      optB: "Tidak, tanpa kepastian mutlak, semua pengetahuan sesungguhnya rapuh."
    },
    2: {
      q: "Jika sebuah teletransporter menghancurkan atom tubuh Anda di Bumi lalu menyusun duplikat persis di Mars, apakah orang di Mars itu adalah ANDA?",
      optA: "Ya, selama kontinuitas ingatan dan kesadaran psikologis berlanjut.",
      optB: "Tidak, saya telah tewas dan yang di Mars hanyalah kloningan saya."
    },
    5: {
      q: "Jika seekor hewan hasil rekayasa genetika secara sadar dan sukarela memohon untuk dimakan, apakah memakannya etis bagi seorang vegetarian?",
      optA: "Etis, karena tidak ada pemaksaan atau pelanggaran hak keberadaan.",
      optB: "Tetap tidak etis, menciptakan makhluk yang berhasrat dimangsa adalah kekejian moral."
    },
    10: {
      q: "Di balik Selubung Ketidaktahuan (tanpa tahu status sosial Anda di masa depan), sistem masyarakat mana yang akan Anda pilih?",
      optA: "Sistem meritokrasi bebas: siapa yang unggul berhak mendapat sebanyak-banyaknya.",
      optB: "Sistem Rawlsian: memastikan kelompok paling tertindas mendapat jaminan terbaik."
    },
    39: {
      q: "Apakah komputer canggih yang mampu menjawab percakapan manusia dengan sempurna benar-benar MEMAHAMI bahasa tersebut?",
      optA: "Ya, pemahaman pada hakikatnya adalah kemampuan pemrosesan dan respons yang tepat.",
      optB: "Tidak, itu sekadar manipulasi simbol sintaksis tanpa makna subjektif (semantik)."
    },
    98: {
      q: "Jika ada 'Mesin Pengalaman' yang bisa memberi Anda simulasi kebahagiaan sempurna tanpa batas seumur hidup, maukah Anda masuk ke dalamnya?",
      optA: "Mau, kebahagiaan subjektif adalah tujuan tertinggi dalam hidup.",
      optB: "Tidak, realitas nyata dan keaslian hidup jauh lebih berharga daripada ilusi."
    }
  };

  if (customQuestions[exp.id]) {
    return customQuestions[exp.id];
  }

  // Default thought-provoking philosophical dilemma
  return {
    q: `Bagaimana kesimpulan Anda terhadap dilema moral/nalar dalam "${exp.title_id}"?`,
    optA: "Argumen ini menunjukkan adanya celah mendasar dalam cara kita memandang realitas.",
    optB: "Intuisi akal sehat kita tetap benar; eksperimen ini sekadar ilusi bahasa/teka-teki teoretis."
  };
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderThemeChips();
  renderExplorerGrid();
  renderSidebarTOC();
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
  const views = ['explorer', 'reader', 'constellation', 'collider'];
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

  if (viewName === 'constellation') {
    if (!isConstellationInitialized) {
      setTimeout(initConstellation, 100);
      isConstellationInitialized = true;
    }
  } else if (viewName === 'collider') {
    generateColliderPair();
  }
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
    const snippet = exp.scenario.length > 0 ? exp.scenario[0] : '';
    const sourceBrief = exp.source ? exp.source.replace(/^Source:\s*/i, '').replace(/^Sumber:\s*/i, '') : 'Eksperimen Bebas';
    return `
      <div class="exp-card" onclick="openExperiment(${exp.id})">
        <div>
          <div class="card-top">
            <span class="card-num"># ${String(exp.id).padStart(3, '0')}</span>
            <span class="card-theme">${exp.theme.split('&')[0].trim()}</span>
          </div>
          <h3 class="card-title">${exp.title_id}</h3>
          <div class="card-title-en">${exp.title_en}</div>
          <div class="card-snippet">${snippet}</div>
        </div>
        <div class="card-footer">
          <span class="card-source-tag" title="${sourceBrief}">📖 ${sourceBrief}</span>
          <span class="card-arrow">Baca &rarr;</span>
        </div>
      </div>
    `;
  }).join('');
}

// READER VIEW RENDERING
function renderSidebarTOC() {
  const list = document.getElementById('sidebar-nav-list');
  if (!list) return;

  list.innerHTML = EXPERIMENTS_DATA.map(exp => `
    <li>
      <button class="sidebar-item-btn ${exp.id === currentExperimentId ? 'active' : ''}" 
              id="toc-btn-${exp.id}" 
              onclick="openExperiment(${exp.id})">
        <span class="sidebar-item-num">${String(exp.id).padStart(3, '0')}</span>
        <span class="sidebar-item-text">${exp.title_id}</span>
      </button>
    </li>
  `).join('');
}

function openExperiment(id) {
  currentExperimentId = id;
  loadExperiment(id);
  switchView('reader');

  // Update TOC active state
  document.querySelectorAll('.sidebar-item-btn').forEach(btn => btn.classList.remove('active'));
  const activeTocBtn = document.getElementById(`toc-btn-${id}`);
  if (activeTocBtn) {
    activeTocBtn.classList.add('active');
    activeTocBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
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
  currentFontSize = Math.max(16, Math.min(24, currentFontSize + delta * 1.5));
  document.documentElement.style.setProperty('--reader-font-size', `${currentFontSize}px`);
}

function loadExperiment(id) {
  const exp = EXPERIMENTS_DATA.find(e => e.id === id);
  if (!exp) return;

  const contentBody = document.getElementById('reader-content-body');
  const prevBtn = document.getElementById('btn-prev-chapter');
  const nextBtn = document.getElementById('btn-next-chapter');

  if (prevBtn) prevBtn.disabled = (id === 1);
  if (nextBtn) nextBtn.disabled = (id === 100);

  const scenarioHTML = exp.scenario.map(p => `<p>${p}</p>`).join('');
  const commentaryHTML = exp.commentary.map(p => `<p>${p}</p>`).join('');
  const reflection = getReflectionPrompt(exp);

  const sourceHTML = exp.source ? `
    <div class="source-citation">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      <div><strong>Sumber Rujukan:</strong> ${exp.source}</div>
    </div>
  ` : '';

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
              <span class="see-also-name">${targetTitle}</span>
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
      <h1 class="article-title">${exp.title_id}</h1>
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

    <!-- INTERACTIVE REFLECTION POLL -->
    <div class="reflection-card">
      <div class="reflection-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span class="reflection-title">Dilema & Perenungan Anda</span>
      </div>
      <div class="reflection-prompt">"${reflection.q}"</div>
      <div class="reflection-options" id="reflection-options-${exp.id}">
        <button class="poll-btn" onclick="voteDilemma(${exp.id}, 'A')">
          <span>A. ${reflection.optA}</span>
          <span class="mono" id="vote-pct-a" style="display:none; font-size:0.8rem; color:var(--text-muted);">63%</span>
        </button>
        <button class="poll-btn" onclick="voteDilemma(${exp.id}, 'B')">
          <span>B. ${reflection.optB}</span>
          <span class="mono" id="vote-pct-b" style="display:none; font-size:0.8rem; color:var(--text-muted);">37%</span>
        </button>
      </div>
    </div>

    <!-- SEE ALSO -->
    ${seeAlsoHTML}
  `;
}

function voteDilemma(expId, choice) {
  const container = document.getElementById(`reflection-options-${expId}`);
  if (!container) return;
  const btns = container.querySelectorAll('.poll-btn');
  btns.forEach(b => b.classList.remove('voted'));

  const clickedIdx = (choice === 'A') ? 0 : 1;
  if (btns[clickedIdx]) btns[clickedIdx].classList.add('voted');

  const pctA = document.getElementById('vote-pct-a');
  const pctB = document.getElementById('vote-pct-b');
  if (pctA) pctA.style.display = 'inline';
  if (pctB) pctB.style.display = 'inline';
}

// ==========================================================================
// CONSTELLATION GRAPH NETWORK (CANVAS PHYSICS)
// ==========================================================================
function initConstellation() {
  const canvas = document.getElementById('constellation-canvas');
  const tooltip = document.getElementById('constellation-tooltip');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  canvas.width = width;
  canvas.height = height;

  const nodes = EXPERIMENTS_DATA.map((exp, idx) => {
    const angle = (idx / 100) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.38 + (Math.random() - 0.5) * 80;
    return {
      id: exp.id,
      title: exp.title_id,
      theme: exp.theme,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: exp.see_also.length >= 4 ? 7 : 5,
      see_also: exp.see_also.map(r => r.id)
    };
  });

  const edges = [];
  EXPERIMENTS_DATA.forEach(exp => {
    exp.see_also.forEach(ref => {
      if (ref.id > exp.id) {
        edges.push({ source: exp.id, target: ref.id });
      }
    });
  });

  let hoveredNode = null;

  function getNode(id) {
    return nodes.find(n => n.id === id);
  }

  function getThemeColor(theme) {
    if (theme.includes('Epistemologi')) return '#b43b24';
    if (theme.includes('Pikiran') || theme.includes('Kesadaran')) return '#2b5c54';
    if (theme.includes('Etika') || theme.includes('Moral')) return '#c28827';
    if (theme.includes('Identitas')) return '#5a3d7a';
    if (theme.includes('Keadilan')) return '#1e5f8a';
    if (theme.includes('Estetika')) return '#8c4b6b';
    return '#555555';
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Physics step: soft attraction to center and damping
    nodes.forEach(n => {
      const dx = width / 2 - n.x;
      const dy = height / 2 - n.y;
      n.vx += dx * 0.0003;
      n.vy += dy * 0.0003;
      n.vx *= 0.96;
      n.vy *= 0.96;
      n.x += n.vx;
      n.y += n.vy;

      // Bound within canvas
      n.x = Math.max(20, Math.min(width - 20, n.x));
      n.y = Math.max(20, Math.min(height - 20, n.y));
    });

    // Draw Edges
    edges.forEach(e => {
      const n1 = getNode(e.source);
      const n2 = getNode(e.target);
      if (!n1 || !n2) return;

      const isConnectedToHover = hoveredNode && (hoveredNode.id === n1.id || hoveredNode.id === n2.id);

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      if (isConnectedToHover) {
        ctx.strokeStyle = '#b43b24';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(168, 162, 158, 0.25)';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
    });

    // Draw Nodes
    nodes.forEach(n => {
      const isHovered = hoveredNode && hoveredNode.id === n.id;
      const isConnected = hoveredNode && (hoveredNode.see_also.includes(n.id) || n.see_also.includes(hoveredNode.id));

      ctx.beginPath();
      ctx.arc(n.x, n.y, isHovered ? n.radius + 4 : n.radius, 0, Math.PI * 2);
      ctx.fillStyle = getThemeColor(n.theme);
      ctx.fill();

      if (isHovered || isConnected) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    });

    requestAnimationFrame(animate);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  });

  // Mouse interactivity
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    for (const n of nodes) {
      const dist = Math.hypot(n.x - mx, n.y - my);
      if (dist < n.radius + 6) {
        found = n;
        break;
      }
    }

    hoveredNode = found;
    if (found) {
      canvas.style.cursor = 'pointer';
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${mx + rect.left}px`;
        tooltip.style.top = `${my + rect.top}px`;
        tooltip.innerHTML = `<strong>#${found.id}. ${found.title}</strong><br><span style="font-size:0.75rem; opacity:0.85;">${found.theme}</span>`;
      }
    } else {
      canvas.style.cursor = 'default';
      if (tooltip) tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('click', () => {
    if (hoveredNode) {
      openExperiment(hoveredNode.id);
    }
  });
}

// ==========================================================================
// THOUGHT COLLIDER (DUAL COLLISION ENGINE)
// ==========================================================================
function generateColliderPair() {
  const container = document.getElementById('collider-columns');
  if (!container) return;

  const id1 = Math.floor(Math.random() * 100) + 1;
  let id2 = Math.floor(Math.random() * 100) + 1;
  while (id2 === id1) {
    id2 = Math.floor(Math.random() * 100) + 1;
  }

  const exp1 = EXPERIMENTS_DATA.find(e => e.id === id1);
  const exp2 = EXPERIMENTS_DATA.find(e => e.id === id2);

  function renderColliderCard(exp) {
    return `
      <div class="collider-card">
        <div>
          <div class="card-top">
            <span class="card-num"># ${String(exp.id).padStart(3, '0')}</span>
            <span class="card-theme">${exp.theme}</span>
          </div>
          <h3 class="card-title">${exp.title_id}</h3>
          <div class="card-title-en">${exp.title_en}</div>
          <div class="card-snippet" style="-webkit-line-clamp: 6;">
            ${exp.scenario.join(' ')}
          </div>
        </div>
        <button class="nav-btn" style="margin-top:1.5rem; justify-content:center; background:var(--bg-surface); border:1px solid var(--border-color);" onclick="openExperiment(${exp.id})">
          Baca Selengkapnya &rarr;
        </button>
      </div>
    `;
  }

  container.innerHTML = `
    ${renderColliderCard(exp1)}
    <div class="collider-vs-badge">VS</div>
    ${renderColliderCard(exp2)}
  `;
}

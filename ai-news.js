/**
 * ai-news.js — Fetch Google Sheet data via the gviz/tq endpoint,
 * filter for today's news, and render expandable cards inside a modal.
 *
 * The gviz/tq endpoint works because the sheet is shared with
 * "Anyone with the link can view" — it returns CSV with CORS headers.
 *
 * Expected columns (positional, no header row in gviz CSV output):
 *   0 = Retrieved At (UTC)   — e.g. "2026-06-24T01:37:14.179160+00:00"
 *   1 = Title                — article headline
 *   2 = URL                  — link to the article
 *   3 = Published Date       — e.g. "Tue, 23 Jun 2026 06:40:00 GMT"
 *   4 = Popularity Score     — e.g. 0.5787
 *   5 = Simple Explanation   — bullet-point summary
 */

// ════════════════════════════════════════════════════════════════
//  CONFIG — Edit these if your sheet ID or tab changes
// ════════════════════════════════════════════════════════════════
const SHEET_ID  = "1ArvmgYYZvol4J7Kxm60iCieFOtn2GfJ_XSUidVIHrZQ";
const SHEET_GID = 0; // "AI News" tab — 0 for first sheet

// The gviz/tq endpoint is CORS-friendly and works without publishing.
// CSV format is tried first, then JSON format as fallback.
const GVIZ_CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
const GVIZ_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
const PUBLISHED_CSV_URL = ""; // ← Paste your "/pub?output=csv" URL here if you publish the sheet

// ── DOM refs ──
const techplusContainer = document.getElementById("techplusContainer");
const trigger       = document.getElementById("techplusTrigger");
const techplusMenu  = document.getElementById("techplusMenu");
const overlay       = document.getElementById("aiNewsOverlay");
const closeBtn      = document.getElementById("aiNewsClose");
const bodyEl        = document.getElementById("aiNewsBody");
const dateEl        = document.getElementById("aiNewsDate");
const updatedEl     = document.getElementById("aiNewsUpdated");
const refreshEl     = document.getElementById("aiNewsRefresh");
const badgeEl       = document.getElementById("aiNewsBadge");
const badgeMenuEl   = document.getElementById("aiNewsBadgeMenu");
const searchInput   = document.getElementById("aiNewsSearch");
const loadMoreBtn   = document.getElementById("aiNewsLoadMore");
const aiNewsMenuItem = document.querySelector('.techplus-menu-item[data-action="ai-news"]');

// ── State ――
let newsCache          = [];
let allArticles        = [];   // All fetched articles (unfiltered)
let isModalOpen        = false;
let autoRefreshInterval = null;
let currentFilter      = 'today'; // 'today' | '3days' | 'week' | 'month'
let searchTerm         = '';
let displayCount       = 0;
const PAGE_SIZE        = 10;

// ── Today's date in UTC (YYYY-MM-DD) ──
function getTodayUTC() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ── Date N days ago in UTC (YYYY-MM-DD) ──
function getDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// ── Filter articles by date range ──
function filterArticles(articles, filter) {
  const today = getTodayUTC();
  let cutoff;
  switch (filter) {
    case '3days': cutoff = getDateDaysAgo(3); break;
    case 'week':  cutoff = getDateDaysAgo(7); break;
    case 'month': cutoff = getDateDaysAgo(30); break;
    case 'today':
    default:      cutoff = today; break;
  }
  return articles.filter(a => {
    const date = (a.retrievedAt || "").slice(0, 10);
    return date >= cutoff && date <= today;
  });
}

// ── Filter title map ──
const FILTER_TITLES = {
  'today': "Today's",
  '3days': "Last 3 Days'",
  'week':  "Last Week's",
  'month': "Last Month's"
};

// ════════════════════════════════════════════════════════════════
//  SEARCH — matchesSearch(item, term)
// ════════════════════════════════════════════════════════════════
function matchesSearch(item, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  const title = (item.title || "").toLowerCase();
  const explanation = (item.explanation || "").toLowerCase();
  return title.includes(t) || explanation.includes(t);
}

// ════════════════════════════════════════════════════════════════
//  COMBINED FILTER — getFilteredArticles()
// ════════════════════════════════════════════════════════════════
function getFilteredArticles() {
  const byDate = filterArticles(allArticles, currentFilter);
  if (!searchTerm) return byDate;
  return byDate.filter(a => matchesSearch(a, searchTerm));
}

// ── Parse a single CSV line (handles quoted commas and newlines) ──
function parseCSVRow(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Handle escaped quotes ""
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Parse full CSV text into an array of row-arrays ──
function parseCSV(csvText) {
  const text = csvText.trim();
  if (!text) return [];

  // Split into lines, respecting quoted multi-line fields
  const lines = [];
  let lineStart = 0;
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') inQ = !inQ;
    if (text[i] === "\n" && !inQ) {
      lines.push(text.slice(lineStart, i));
      lineStart = i + 1;
    }
  }
  lines.push(text.slice(lineStart));

  return lines.filter(l => l.trim()).map(l => parseCSVRow(l));
}

// ── Convert parsed rows into article objects ──
function rowsToArticles(rows) {
  return rows.map(cols => ({
    retrievedAt:   cols[0] || "",
    title:         cols[1] || "Untitled",
    url:           cols[2] || "",
    publishedDate: cols[3] || "",
    score:         cols[4] || "",
    explanation:   cols[5] || "No details available.",
  }));
}

// ── Fetch CSV from a URL ──
async function tryFetchCSV(url, label) {
  if (!url) return null;
  const res = await fetch(url, { cache: "no-cache", mode: "cors" });
  if (!res.ok) throw new Error(`${label} — HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error(`${label} — empty response`);
  return parseCSV(text);
}

// ── Fetch JSON from gviz and parse into row arrays ──
async function tryFetchJSON(url, label) {
  if (!url) return null;
  const res = await fetch(url, { cache: "no-cache", mode: "cors" });
  if (!res.ok) throw new Error(`${label} — HTTP ${res.status}`);
  let text = await res.text();
  if (!text.trim()) throw new Error(`${label} — empty response`);

  text = text.replace(/^\/\*O_o\*\//, "").trim();
  const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?\s*$/s);
  if (!match) throw new Error(`${label} — unexpected JSON format`);
  const data = JSON.parse(match[1]);
  if (!data || !data.table || !data.table.rows) throw new Error(`${label} — no table data`);

  const cols = data.table.cols || [];
  return data.table.rows.map(row => {
    const arr = [];
    if (row.c) {
      row.c.forEach(cell => {
        arr.push(cell && cell.v !== undefined ? String(cell.v) : "");
      });
    }
    while (arr.length < 6) arr.push("");
    return arr;
  });
}

// ════════════════════════════════════════════════════════════════
//  FETCH & RENDER PIPELINE
// ════════════════════════════════════════════════════════════════

// ── Fetch news with fallback chain ──
async function fetchNews() {
  try {
    showLoading();

    let rows = null;
    let usedSource = "";

    // Strategy 1: gviz CSV endpoint (CORS-friendly)
    try {
      rows = await tryFetchCSV(GVIZ_CSV_URL, "gviz CSV");
      if (rows && rows.length > 0) usedSource = "gviz CSV";
    } catch (e) {
      console.warn("gviz CSV failed:", e.message);
    }

    // Strategy 2: gviz JSON endpoint (more reliable in some browsers)
    if (!rows || rows.length === 0) {
      try {
        rows = await tryFetchJSON(GVIZ_JSON_URL, "gviz JSON");
        if (rows && rows.length > 0) usedSource = "gviz JSON";
      } catch (e) {
        console.warn("gviz JSON failed:", e.message);
      }
    }

    // Strategy 3: published CSV (if user provided the URL)
    if (!rows || rows.length === 0) {
      try {
        rows = await tryFetchCSV(PUBLISHED_CSV_URL, "published CSV");
        if (rows && rows.length > 0) usedSource = "published CSV";
      } catch (e) {
        console.warn("published CSV failed:", e.message);
      }
    }

    if (!rows || rows.length === 0) {
      throw new Error(
        "Could not fetch data from the Google Sheet. " +
        "Make sure the sheet is shared with 'Anyone with the link can view'."
      );
    }

    // Convert to articles
    allArticles = rowsToArticles(rows);
    if (allArticles.length === 0) throw new Error("No data rows in sheet");

    // Reset pagination on fresh fetch
    displayCount = PAGE_SIZE;

    // Apply current filter + search, then render
    applyFiltersAndRender();
    updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()} · ${usedSource}`;
  } catch (err) {
    console.error("AI News error:", err);
    showError(
      "Could not load news. Make sure your Google Sheet is shared with " +
      "'Anyone with the link can view'. Error: " + err.message
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  APPLY FILTERS & RENDER — applies date filter + search
// ════════════════════════════════════════════════════════════════
function applyFiltersAndRender() {
  const filtered = getFilteredArticles();
  newsCache = filtered;
  displayCount = PAGE_SIZE;
  renderPaginated();
}

// ════════════════════════════════════════════════════════════════
//  PAGINATED RENDER — renderPaginated()
// ════════════════════════════════════════════════════════════════
function renderPaginated() {
  const filtered = getFilteredArticles();
  const slice = filtered.slice(0, displayCount);
  renderNews(slice);

  // Badge shows total filtered count
  updateBadge(filtered.length);

  // Show / hide "Load more" button
  if (!loadMoreBtn) return;

  if (filtered.length > displayCount) {
    loadMoreBtn.style.display = "";
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = `Load more (${slice.length} / ${filtered.length})`;
  } else {
    loadMoreBtn.disabled = true;
    if (filtered.length > PAGE_SIZE) {
      loadMoreBtn.style.display = "";
      loadMoreBtn.textContent = `All ${filtered.length} articles loaded`;
    } else if (filtered.length > 0) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

// ── Show loading spinner ──
function showLoading() {
  bodyEl.innerHTML = `
    <div class="ai-news-loading">
      <div class="ai-news-spinner"></div>
      <p>Loading latest AI news…</p>
    </div>
  `;
}

// ── Show empty state ──
function showEmpty() {
  const messages = {
    'today':  ["No AI news for today yet.", "Check back later!"],
    '3days':  ["No AI news in the last 3 days.", "Try a wider date range!"],
    'week':   ["No AI news in the last week.", "Try a wider date range!"],
    'month':  ["No AI news in the last month.", "Try a wider date range!"]
  };
  const [msg, hint] = messages[currentFilter] || messages['today'];
  const searchHint = searchTerm ? ` No results for "${escapeHtml(searchTerm)}".` : "";
  bodyEl.innerHTML = `
    <div class="ai-news-empty">
      <p style="font-size:2rem;margin:0 0 8px;">📭</p>
      <p>${msg}${searchHint}</p>
      <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);">${hint}</p>
    </div>
  `;
}

// ── Show error ──
function showError(msg) {
  bodyEl.innerHTML = `
    <div class="ai-news-error">
      <p style="font-size:2rem;margin:0 0 8px;">⚠️</p>
      <p><strong>Could not load news.</strong></p>
      <p style="font-size:0.8rem;margin-top:8px;color:rgba(255,255,255,0.55);line-height:1.6;">
        ${escapeHtml(msg)}
      </p>
      <p style="font-size:0.75rem;margin-top:14px;color:var(--cyan);">
        💡 Make sure your sheet is shared as "Anyone with the link can view"
      </p>
    </div>
  `;
}

// ── Render news cards (receives a slice of articles) ──
function renderNews(rows) {
  if (rows.length === 0) {
    showEmpty();
    return;
  }

  let html = '<div class="ai-news-list">';
  rows.forEach((item, idx) => {
    const title = escapeHtml(item.title);
    const url   = escapeHtml(item.url);
    const date  = escapeHtml(item.publishedDate);
    const score = escapeHtml(item.score);
    const expl  = escapeHtml(item.explanation).replace(/\n/g, "<br>");

    const linkTag = url
      ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>`
      : title;

    const linkInText = url
      ? `<br><br><a href="${url}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;font-weight:600;">🔗 Read full article →</a>`
      : "";

    html += `
      <div class="ai-news-card" data-index="${idx}">
        <div class="ai-news-title-row">
          <h3>${linkTag}</h3>
          <button class="ai-news-expand-btn" data-target="${idx}" aria-label="Toggle details">
            <i class='bx bx-chevron-down'></i>
          </button>
        </div>
        <div class="ai-news-meta">
          ${date ? `<span>📅 ${date}</span>` : ""}
          ${score ? `<span class="ai-news-score">⭐ ${score}</span>` : ""}
        </div>
        <div class="ai-news-explanation" id="aiNewsExpl${idx}">
          <p>${expl}${linkInText}</p>
        </div>
      </div>
    `;
  });
  html += "</div>";
  bodyEl.innerHTML = html;

  // Attach expand/collapse listeners
  bodyEl.querySelectorAll(".ai-news-expand-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleExpand(this);
    });
  });
}

// ── Toggle expand/collapse (only one open at a time) ──
function toggleExpand(btn) {
  const idx = btn.getAttribute("data-target");
  const explEl = document.getElementById(`aiNewsExpl${idx}`);
  if (!explEl) return;

  const isOpen = explEl.classList.contains("open");
  if (isOpen) {
    explEl.classList.remove("open");
    btn.classList.remove("expanded");
    btn.querySelector("i").className = "bx bx-chevron-down";
  } else {
    bodyEl.querySelectorAll(".ai-news-explanation.open").forEach(el => {
      el.classList.remove("open");
    });
    bodyEl.querySelectorAll(".ai-news-expand-btn.expanded").forEach(b => {
      b.classList.remove("expanded");
      b.querySelector("i").className = "bx bx-chevron-down";
    });

    explEl.classList.add("open");
    btn.classList.add("expanded");
    btn.querySelector("i").className = "bx bx-chevron-up";
  }
}

// ── Update badge count ──
function updateBadge(count) {
  badgeEl.textContent = count;
  badgeEl.style.display = count > 0 ? "flex" : "none";
  if (badgeMenuEl) {
    badgeMenuEl.textContent = count;
    badgeMenuEl.style.display = count > 0 ? "flex" : "none";
  }
}

// ── Open modal ──
function openModal() {
  if (isModalOpen) return;
  isModalOpen = true;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  // Show today's date in header
  const d = new Date();
  dateEl.textContent = d.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // Update header title and filter button active state
  document.getElementById("aiNewsTitle").textContent = `${FILTER_TITLES[currentFilter]} AI News`;
  document.querySelectorAll(".ai-news-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });

  if (allArticles.length === 0) {
    fetchNews();
  } else {
    // Re-apply filters + search + pagination
    displayCount = PAGE_SIZE;
    renderPaginated();
    updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
  }

  // Auto-refresh every 30 min while open
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(fetchNews, 30 * 60 * 1000);
}

// ── Close modal ──
function closeModal() {
  if (!isModalOpen) return;
  isModalOpen = false;
  overlay.classList.remove("open");
  document.body.style.overflow = "";

  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// ── Escape HTML (XSS-safe) ──
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

// ── TECH PLUS trigger toggle ──
trigger.addEventListener("click", function (e) {
  e.stopPropagation();
  trigger.classList.toggle("open");
  techplusMenu.classList.toggle("open");
});

// ── AI NEWS menu item opens modal ──
if (aiNewsMenuItem) {
  aiNewsMenuItem.addEventListener("click", function (e) {
    e.preventDefault();
    // Close menu
    trigger.classList.remove("open");
    techplusMenu.classList.remove("open");
    // Open modal
    openModal();
  });
}

// ── Close menu when clicking outside ──
document.addEventListener("click", function (e) {
  if (techplusMenu.classList.contains("open") &&
      !techplusContainer.contains(e.target)) {
    techplusMenu.classList.remove("open");
    trigger.classList.remove("open");
  }
});

closeBtn.addEventListener("click", closeModal);

// Click overlay backdrop to close
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

// Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isModalOpen) closeModal();
});

// Refresh button
refreshEl.addEventListener("click", fetchNews);

// ── Filter button events ──
document.querySelectorAll(".ai-news-filter-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    const filter = this.dataset.filter;
    if (filter === currentFilter && !searchTerm) return;

    // Update active state
    document.querySelectorAll(".ai-news-filter-btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");

    // Update state and title
    currentFilter = filter;
    document.getElementById("aiNewsTitle").textContent = `${FILTER_TITLES[filter]} AI News`;

    // Re-apply filters + search from cached articles
    if (allArticles.length > 0) {
      displayCount = PAGE_SIZE;
      applyFiltersAndRender();
    } else {
      fetchNews();
    }
  });
});

// ── Search input with debounce ──
let searchDebounce = null;
if (searchInput) {
  searchInput.addEventListener("input", function () {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = this.value.trim();
      if (allArticles.length > 0) {
        displayCount = PAGE_SIZE;
        applyFiltersAndRender();
      }
    }, 250);
  });
}

// ── Load more ──
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", function () {
    displayCount += PAGE_SIZE;
    renderPaginated();
  });
}

// Fetch initial data when page loads (background — fills the badge count)
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(fetchNews, 1500);
});

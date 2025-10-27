// Data: edit your bookmarks here
const BOOKMARKS = [
  {
    group: "Primary",
    items: [
      { name: "Google", url: "https://www.google.com" },
      { name: "Facebook", url: "https://www.facebook.com" },
      { name: "YouTube", url: "https://www.youtube.com" },
      { name: "Instagram", url: "https://www.instagram.com" },
      { name: "ChatGPT", url: "https://www.chatgpt.com" },
    ],
  },
  {
    group: "Secondary",
    items: [
      { name: "Perplexity", url: "https://www.perplexity.ai" },
      { name: "GitHub", url: "https://www.github.com" },
    ],
  },
];

// Brand accents by domain keyword
const BRAND_ACCENTS = new Map([
  ["google", "#4285F4"],
  ["facebook", "#1877F2"],
  ["youtube", "#FF0033"],
  ["instagram", "#E4405F"],
  ["chatgpt", "#10A37F"],
  ["openai", "#10A37F"],
  ["perplexity", "#6B4EFF"],
  ["github", "#171515"],
  ["git", "#171515"],
]);

const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const groupsEl = qs("#groups");
const searchInput = qs("#searchInput");
const themeToggle = qs("#themeToggle");

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function guessAccent(url) {
  const domain = getDomain(url).toLowerCase();
  for (const [key, color] of BRAND_ACCENTS) {
    if (domain.includes(key)) return color;
  }
  // Simple deterministic color fallback by hash
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 55%)`;
}

function faviconUrl(url) {
  // Google s2 favicons service
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

function createCard(item) {
  const accent = guessAccent(item.url);
  const a = document.createElement("a");
  a.className = "card";
  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.setProperty("--accent", accent);
  a.setAttribute("data-domain", getDomain(item.url));

  const iconWrap = document.createElement("div");
  iconWrap.className = "icon-wrap";

  const img = document.createElement("img");
  img.className = "favicon";
  img.alt = `${item.name} favicon`;
  img.loading = "lazy";
  img.src = faviconUrl(item.url);
  img.onerror = () => {
    img.replaceWith(makeFallbackIcon());
  };

  iconWrap.appendChild(img);

  const meta = document.createElement("div");
  meta.className = "meta";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = item.name;

  const url = document.createElement("div");
  url.className = "url";
  url.textContent = getDomain(item.url);

  meta.appendChild(name);
  meta.appendChild(url);

  a.appendChild(iconWrap);
  a.appendChild(meta);
  return a;
}

function makeFallbackIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.classList.add("fallback-icon");
  svg.innerHTML = `
    <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2H12.5L8 22v-2.5H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h10v-2H6Z"/>
  `;
  return svg;
}

function renderGroups(data) {
  groupsEl.innerHTML = "";
  data.forEach(group => {
    const section = document.createElement("section");
    section.className = "group";

    const header = document.createElement("div");
    header.className = "group-header";

    const badge = document.createElement("div");
    badge.className = "group-badge";
    badge.textContent = group.group;

    const count = document.createElement("div");
    count.className = "count";
    count.textContent = `${group.items.length} link${group.items.length !== 1 ? "s" : ""}`;

    header.appendChild(badge);
    header.appendChild(count);

    const grid = document.createElement("div");
    grid.className = "grid";
    group.items.forEach(item => grid.appendChild(createCard(item)));

    section.appendChild(header);
    section.appendChild(grid);
    groupsEl.appendChild(section);
  });
}

function filter(term) {
  const value = term.trim().toLowerCase();
  const sections = qsa(".group", groupsEl);
  sections.forEach(section => {
    const cards = qsa(".card", section);
    let visibleCount = 0;
    cards.forEach(card => {
      const name = qs(".name", card).textContent.toLowerCase();
      const domain = card.getAttribute("data-domain");
      const show = !value || name.includes(value) || domain.includes(value);
      card.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });
    const countEl = qs(".count", section);
    if (countEl) countEl.textContent = `${visibleCount} link${visibleCount !== 1 ? "s" : ""}`;
    section.style.display = visibleCount ? "" : "none";
  });
}

function applySavedTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : current === "light" ? "dark" : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

function keyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    // Focus search
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Open first visible with Enter when focus is on search
    if (e.key === "Enter" && document.activeElement === searchInput) {
      const firstVisible = qsa(".card").find(c => c.offsetParent !== null);
      if (firstVisible) firstVisible.click();
    }
  });
}

function init() {
  renderGroups(BOOKMARKS);
  applySavedTheme();
  searchInput.addEventListener("input", (e) => filter(e.target.value));
  themeToggle.addEventListener("click", toggleTheme);
  keyboardShortcuts();
}

document.addEventListener("DOMContentLoaded", init);
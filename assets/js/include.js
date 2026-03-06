const BASE = "/UPC-LLM/"; // GitHub Pages 子路径（仓库名）

function absPath(rel) {
  return BASE + String(rel || "").replace(/^\/+/, "");
}

function stripBase(pathname) {
  const p = pathname || "/";
  if (p.startsWith(BASE)) return p.slice(BASE.length);
  return p.replace(/^\//, "");
}

function isZh() {
  return stripBase(location.pathname).startsWith("zh/");
}
function lang() {
  return isZh() ? "zh" : "en";
}

function ensureIndex(p) {
  if (!p) return "index.html";
  if (p.endsWith(".html")) return p;
  if (p.endsWith("/")) return p + "index.html";
  return p + "/index.html";
}

function pairPath(toLang) {
  const p = stripBase(location.pathname);

  if (p.startsWith("en/")) return (toLang === "zh") ? p.replace(/^en\//, "zh/") : p;
  if (p.startsWith("zh/")) return (toLang === "en") ? p.replace(/^zh\//, "en/") : p;

  return `${toLang}/`;
}

async function inject(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    el.innerHTML = ""; // 避免把 404 页面注入进来
    return;
  }
  el.innerHTML = await res.text();
  // 注入后返回元素，确保DOM已更新
  return el;
}

function setNav() {
  // 增加容错：先检查核心元素是否存在
  const headerEl = document.getElementById("site-header");
  if (!headerEl) return console.warn("Header DOM 未加载");

  const L = lang();
  const labels = {
    en: { news: "News", people: "People", publications: "Publications", join: "Join Us", toggle: "中文" },
    zh: { news: "新闻", people: "成员", publications: "论文", join: "加入我们", toggle: "EN" }
  };

  // Nav - 增加更宽松的选择器，确保匹配header内的.nav-link
  document.querySelectorAll("#site-header .nav-link").forEach(a => {
    const key = a.getAttribute("data-key");
    if (!key) return;
    a.textContent = labels[L][key] ?? a.textContent;
    a.href = absPath(`${L}/${key}/index.html`);
  });

  // Language toggle - 限定header内的元素
  const t = document.getElementById("lang-toggle");
  if (t) {
    t.textContent = labels[L].toggle;
    const targetLang = (L === "en") ? "zh" : "en";
    t.href = absPath(ensureIndex(pairPath(targetLang)));
  }

  // Active highlight - 优化路径匹配逻辑
  const p = stripBase(location.pathname).toLowerCase();
  let active = "";
  if (p.includes("news")) active = "news";
  else if (p.includes("people")) active = "people";
  else if (p.includes("publications")) active = "publications";
  else if (p.includes("join")) active = "join";

  // 增加容错，避免空选择器报错
  const activeLink = document.querySelector(`#site-header .nav-link[data-key="${active}"]`);
  if (activeLink) activeLink.classList.add("active");
}

// 核心修复：等待header注入并渲染完成后再执行setNav
(async function () {
  try {
    // 先注入header，等待DOM更新
    await inject("#site-header", absPath("partials/header.html"));
    // 注入footer
    await inject("#site-footer", absPath("partials/footer.html"));
    // 延迟执行setNav，确保header内的DOM完全渲染
    setTimeout(setNav, 0);
  } catch (e) {
    console.error("页面渲染出错：", e);
  }
})();
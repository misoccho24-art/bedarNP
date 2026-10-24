/* =====================================================================
   একক সংবাদ পেজ — /বিভাগ/article/১৫  অথবা  article.html?id=...
   মাঝখানে এক কলামের পড়ার পাতা, বড় পর্দায় বাঁ পাশে শেয়ার রেল।
   ===================================================================== */
(async () => {
await initStore();
refreshPosts();
/* খবর চেনা: article.html?n=১৫ (নম্বর দিয়ে), পুরোনো /বিভাগ/article/১৫, অথবা article.html?id=... */
const qs = new URLSearchParams(location.search);
const pathNum = location.pathname.match(/\/article\/(\d+)\/?$/);
const num = qs.get("n") || (pathNum ? pathNum[1] : "");
const id = qs.get("id");
const find = () => num ? POSTS.find(p => String(p.no) === String(num)) : byId(id);
let post = find();

/* ?id=... দিয়ে এলে ঠিকানার ঘরে নম্বরের লিংকটি দেখানো (পেজ রিলোড হয় না) */
function tidyUrl() {
  if (post && post.no && !qs.get("n") && !pathNum) history.replaceState(null, "", link(post));
}
tidyUrl();

mountShell(post ? post.cat : null);

/* ---------- পড়ার অগ্রগতি (ছোট হেডারের নিচের রেখা) --------------------- */
const bar = document.getElementById("readProgress");
function updateProgress() {
  const art = document.getElementById("article");
  if (!bar || !art) return;
  const start = art.offsetTop, end = start + art.offsetHeight - innerHeight;
  const p = end > start ? Math.min(1, Math.max(0, (scrollY - start) / (end - start))) : 0;
  bar.style.transform = `scaleX(${p})`;
}
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);

/* ---------- লেখার আকার (পাঠকের পছন্দ মনে থাকে) ------------------------- */
const SIZES = [1, 1.08, 1.15, 1.25, 1.38];
let sizeIdx = Math.min(SIZES.length - 1, Math.max(0, parseInt(safeStore.get("beda-read-size") || "2", 10) || 2));
const applySize = () => document.documentElement.style.setProperty("--read-size", `${SIZES[sizeIdx]}rem`);
applySize();

/* পেজ আঁকা — সংরক্ষিত কপি দিয়ে সঙ্গে সঙ্গে; পেছনে এই খবরটি বদলে বা মুছে গেলে আবার */
function render() {
const relatedWrap = document.getElementById("relatedWrap");
const moreWrap = document.getElementById("moreWrap");

/* ---------- খবরটি না পাওয়া গেলে --------------------------------------- */
if (!post) {
  document.title = `খবরটি পাওয়া যায়নি — ${SITE.name}`;
  document.getElementById("article").innerHTML =
    emptyBox("খবরটি পাওয়া যায়নি", "খবরটি মুছে ফেলা হয়েছে, অথবা লিংকটি ঠিক নয়।", true);
  relatedWrap.hidden = true;
  const latest = recent(6);
  moreWrap.hidden = !latest.length;
  document.getElementById("more").innerHTML = latest.map(brief).join("");
  return;
}

document.title = `${post.title} — ${SITE.name}`;

/* মূল লেখা — নতুন পোস্টে rich HTML (post.content), পুরোনোতে অনুচ্ছেদের অ্যারে (post.body) */
let bodyHtml;
if (post.content) {
  bodyHtml = sanitizeRichHtml(post.content);           // রেন্ডারের আগে আবার ছেঁকে নেওয়া (দ্বিতীয় স্তরের সুরক্ষা)
} else {
  const paras = post.body && post.body.length ? post.body : [post.excerpt];
  const quoteAt = post.quote && paras.length > 2 ? 1 : -1;   // পুরোনো "quote" ফিল্ড থাকলে
  bodyHtml = paras.map((p, i) => {
    const html = `<p>${esc(p)}</p>`;
    return i === quoteAt ? `${html}<blockquote class="pullquote">${esc(post.quote)}</blockquote>` : html;
  }).join("");
}

const when = post.time || timeAgo(post.createdAt);
const dateFull = post.createdAt ? new Date(post.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }) : "";

/* অঞ্চল (বিভাগ/জেলা/উপজেলা) থাকলে একটি লাইনে দেখানো */
const regionParts = [post.division && divisionName(post.division), post.district, post.upazila].filter(Boolean);
const author = String(post.author || "নিজস্ব প্রতিবেদক").trim();

/* ভূমিকা আলাদা করে মোটা অক্ষরে — শুধু তখন, যখন এটি মূল লেখার শুরুর কপি নয় */
const plain = plainTextFromHtml(bodyHtml).replace(/\s+/g, " ").trim();
const exc = String(post.excerpt || "").replace(/…$/, "").replace(/\s+/g, " ").trim();
const showLede = exc && !plain.startsWith(exc);

const u = encodeURIComponent(location.href), t = encodeURIComponent(post.title);
const shareLinks = {
  fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  wa: `https://wa.me/?text=${t}%20${u}`
};

document.getElementById("article").innerHTML = `
  <div class="rail" aria-label="শেয়ার"><div class="rail__in">
    <span class="label">শেয়ার</span>
    <a href="${shareLinks.fb}" target="_blank" rel="noopener" aria-label="ফেসবুকে শেয়ার">${ICON.fb}</a>
    <a href="${shareLinks.x}" target="_blank" rel="noopener" aria-label="এক্সে শেয়ার">${ICON.x}</a>
    <a href="${shareLinks.wa}" target="_blank" rel="noopener" aria-label="হোয়াটসঅ্যাপে শেয়ার">${ICON.wa}</a>
    <button type="button" class="js-copy" aria-label="লিংক কপি">${ICON.copy}</button>
  </div></div>

  <header class="story__head">
    <nav class="crumbs" aria-label="অবস্থান"><a href="index.html">প্রচ্ছদ</a>${ICON.chev}<a href="${topicLink(post.cat)}">${catName(post.cat)}</a></nav>
    <div class="story__kick">
      <a class="label" href="${topicLink(post.cat)}">${catName(post.cat)}</a>
      ${post.exclusive && post.cat !== "exclusive" ? `<span class="label ex">${ICON.star}এক্সক্লুসিভ</span>` : ""}
    </div>
    <h1 class="story__title">${esc(post.title)}</h1>
    ${post.subHeadline ? `<p class="story__sub">${esc(post.subHeadline)}</p>` : ""}
    <div class="story__by">
      <span>লিখেছেন <b>${esc(author)}</b></span>
      <span title="${esc(dateFull)}">${ICON.clock}${esc(when)}</span>
      <span>${ICON.book}${bnNum(post.read || 1)} মিনিটের পাঠ</span>
      ${regionParts.length ? `<span>${ICON.pin}${esc(regionParts.join(", "))}</span>` : ""}
    </div>
    <div class="story__tools">
      <button type="button" id="fontDown" aria-label="লেখা ছোট করুন">অ−</button>
      <button type="button" id="fontUp" aria-label="লেখা বড় করুন">অ+</button>
      <button type="button" id="shareTop">${ICON.share}শেয়ার</button>
    </div>
  </header>

  <figure class="story__fig">
    <div class="st__img"><img src="${imgFor(post)}" alt="${esc(post.title)}" fetchpriority="high" decoding="async"></div>
    ${post.imgCaption ? `<figcaption>${esc(post.imgCaption)}</figcaption>` : ""}
  </figure>

  <div class="story__body">
    ${showLede ? `<p class="story__lede">${esc(post.excerpt)}</p>` : ""}
    <div class="story__text">${bodyHtml}</div>
  </div>

  <footer class="story__end">
    <div class="story__tags"><span class="label">বিষয়</span>${tagsFor(post).map(tg =>
      `<a href="category.html?q=${encodeURIComponent(tg)}">${esc(tg)}</a>`).join("")}</div>
    <div class="shares" id="share">
      <span class="label">শেয়ার করুন</span>
      <a href="${shareLinks.fb}" target="_blank" rel="noopener">${ICON.fb}ফেসবুক</a>
      <a href="${shareLinks.x}" target="_blank" rel="noopener">${ICON.x}এক্স</a>
      <a href="${shareLinks.wa}" target="_blank" rel="noopener">${ICON.wa}হোয়াটসঅ্যাপ</a>
      <button type="button" class="js-copy">${ICON.copy}<span>লিংক কপি</span></button>
    </div>
  </footer>`;

/* লিংক কপি — রেল ও নিচের দুই জায়গাতেই */
$$(".js-copy").forEach(btn => btn.addEventListener("click", () => {
  navigator.clipboard?.writeText(location.href).then(() => {
    const label = $("span", btn);
    if (label) {
      label.textContent = "কপি হয়েছে ✓";
      setTimeout(() => (label.textContent = "লিংক কপি"), 1800);
    } else {
      btn.innerHTML = ICON.check;
      setTimeout(() => (btn.innerHTML = ICON.copy), 1800);
    }
  });
}));

/* ওপরের শেয়ার বোতাম: ফোনে নিজস্ব শেয়ার মেনু, না থাকলে নিচের শেয়ার অংশে যাওয়া */
document.getElementById("shareTop").addEventListener("click", () => {
  if (navigator.share) navigator.share({ title: post.title, url: location.href }).catch(() => {});
  else document.getElementById("share").scrollIntoView({ behavior: "smooth", block: "center" });
});

document.getElementById("fontDown").addEventListener("click", () => {
  sizeIdx = Math.max(0, sizeIdx - 1); applySize(); safeStore.set("beda-read-size", String(sizeIdx));
});
document.getElementById("fontUp").addEventListener("click", () => {
  sizeIdx = Math.min(SIZES.length - 1, sizeIdx + 1); applySize(); safeStore.set("beda-read-size", String(sizeIdx));
});

/* সম্পর্কিত — একই বিভাগ আগে, কম পড়লে সাম্প্রতিক খবর দিয়ে পূরণ */
const others = POSTS.filter(a => String(a.id) !== String(post.id));
let related = inCat(post.cat).filter(a => String(a.id) !== String(post.id)).slice(0, 3);
if (related.length < 3) {
  const have = new Set(related.map(a => String(a.id)));
  related = related.concat(others.filter(a => !have.has(String(a.id))).slice(0, 3 - related.length));
}
relatedWrap.hidden = !related.length;
if (related.length) {
  const grid = document.getElementById("related");
  grid.style.setProperty("--n", 3);
  grid.innerHTML = related.map(a => story(a, { dek: true })).join("");
}

/* সর্বশেষ — সময়সহ শিরোনাম, তিন কলামে */
const relIds = new Set(related.map(a => String(a.id)));
const latest = others.filter(a => !relIds.has(String(a.id))).slice(0, 6);
moreWrap.hidden = !latest.length;
document.getElementById("more").innerHTML = latest.map(brief).join("");

updateProgress();
}

render();

/* পেছনে নতুন তালিকা এলে শুধু তখনই আবার আঁকা হয় যখন এই খবরটি নিজেই বদলেছে বা
   মুছে গেছে — নইলে পাঠক পড়তে পড়তে পেজ নড়ে যেত।                           */
let shown = post ? JSON.stringify(post) : null;
watchPosts(() => {
  const now = find();
  const sig = now ? JSON.stringify(now) : null;
  if (sig === shown) return;
  shown = sig;
  post = now;
  tidyUrl();
  render();
});

})();

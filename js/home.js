/* =====================================================================
   হোমপেজ — ব্রডশিট প্রথম পাতা। সব খবর আসে অ্যাডমিন প্যানেলের পোস্ট থেকে।
   ===================================================================== */
(async () => {
await initStore();          /* সার্ভার না লোকাল — আগে ঠিক করে নেওয়া */
mountShell(null);

const show = (id, on) => { const el = document.getElementById(id); if (el) el.hidden = !on; };

/* ---------- আমার এলাকার খবর (বিভাগ → জেলা → উপজেলা ক্যাসকেড) ----------- */
(function localFinder() {
  const form = document.getElementById("localFinderForm");
  if (!form) return;
  show("localFinderSection", true);
  const lfDivision = document.getElementById("lfDivision");
  const lfDistrict = document.getElementById("lfDistrict");
  const lfUpazila  = document.getElementById("lfUpazila");

  lfDivision.innerHTML = `<option value="">বিভাগ</option>` +
    BD_DIVISIONS.map(d => `<option value="${d.slug}">${d.name.replace(/ বিভাগ$/, "")}</option>`).join("");

  lfDivision.addEventListener("change", () => {
    lfUpazila.innerHTML = `<option value="">যেকোনো উপজেলা</option>`;
    lfUpazila.disabled = true;
    const list = BD_DISTRICTS[lfDivision.value] || [];
    if (!list.length) {
      lfDistrict.innerHTML = `<option value="">জেলা</option>`;
      lfDistrict.disabled = true;
      return;
    }
    lfDistrict.disabled = false;
    lfDistrict.innerHTML = `<option value="">যেকোনো জেলা</option>` +
      list.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
  });

  lfDistrict.addEventListener("change", () => {
    const upazilas = [...new Set(
      POSTS.filter(a => a.division === lfDivision.value && a.district === lfDistrict.value && a.upazila)
           .map(a => a.upazila)
    )];
    lfUpazila.disabled = !upazilas.length;
    lfUpazila.innerHTML = `<option value="">${upazilas.length ? "উপজেলা" : "উপজেলা নেই"}</option>` +
      upazilas.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join("");
    /* উপজেলা না থাকলে জেলা বাছাই করলেই খবরে যাওয়া */
    if (lfDistrict.value && !upazilas.length) go();
  });

  lfUpazila.addEventListener("change", () => { if (lfUpazila.value) go(); });

  /* বোতাম নেই — শেষ ড্রপডাউন বাছাই করলেই সেই এলাকার খবর খোলে */
  function go() {
    const params = new URLSearchParams({ division: lfDivision.value });
    if (lfDistrict.value) params.set("district", lfDistrict.value);
    if (lfUpazila.value) params.set("upazila", lfUpazila.value);
    location.href = `category.html?${params.toString()}`;
  }

  form.addEventListener("submit", e => { e.preventDefault(); if (lfDivision.value) go(); });
})();

/* ---------- সর্বশেষ শিরোনাম — একটি করে ওপরে সরে আসে, আগে/পরে বোতামসহ ---- */
let flashTimer = null;
function flash() {
  clearInterval(flashTimer);
  const view = document.getElementById("flashView");
  const heads = POSTS.slice(0, 5);
  show("flashWrap", heads.length > 0);
  if (!heads.length) return;
  view.innerHTML = heads.map((p, i) =>
    `<a class="flash__item${i === 0 ? " is-on" : ""}" href="${link(p)}"${i ? ' tabindex="-1"' : ""}>${esc(p.title)}</a>`).join("");
  const items = Array.from(view.children);
  const count = document.getElementById("flashCount");
  let i = 0;
  const go = dir => {
    const prev = i;
    i = (i + dir + items.length) % items.length;
    items.forEach((el, k) => {
      el.classList.toggle("is-on", k === i);
      el.classList.toggle("is-out", k === prev && k !== i);
      el.tabIndex = k === i ? 0 : -1;
    });
    count.textContent = `${bnNum(i + 1)} / ${bnNum(items.length)}`;
  };
  go(0);
  document.getElementById("flashPrev").onclick = () => { go(-1); restart(); };
  document.getElementById("flashNext").onclick = () => { go(1); restart(); };
  const restart = () => {
    clearInterval(flashTimer);
    if (items.length > 1) flashTimer = setInterval(() => go(1), 5000);
  };
  restart();
}

/* ---------- পেজ আঁকা ---------------------------------------------------
   প্রথমে সংরক্ষিত কপি দিয়ে সঙ্গে সঙ্গে আঁকা হয়; পেছনে সার্ভার থেকে নতুন খবর
   এসে তালিকা বদলালে এটি আবার ডাকা হয় — তাই সবকিছু আবার চালানো নিরাপদ।   */
function render() {
  flash();

  if (!POSTS.length) {
    ["latestSection", "videoSection", "opinionSection", "deskSection"].forEach(id => show(id, false));
    document.getElementById("front").innerHTML = `<div style="grid-column:1/-1;padding:0">
      ${emptyBox("এখনো কোনো খবর প্রকাশিত হয়নি", "নতুন প্রতিবেদন প্রকাশ হলে এখানে দেখা যাবে।")}</div>`;
    document.getElementById("topics").innerHTML = "";
    return;
  }

  /* ---------- প্রথম পাতা --------------------------------------------
     "প্রধান খবর" চিহ্নিত পোস্ট আগে, তারপর সাম্প্রতিক দিয়ে পূরণ (সর্বোচ্চ ৪টি):
     মাঝে বড় প্রধান খবর, ডানে আরও ৩টি, বাঁয়ে সময়সহ "সর্বশেষ" কলাম।      */
  const marked = POSTS.filter(p => p.isLead);
  const rest = POSTS.filter(p => !p.isLead);
  const leads = [...marked, ...rest].slice(0, 4);
  const heroIds = new Set(leads.map(p => String(p.id)));
  const [lead, ...side] = leads;

  document.getElementById("front").innerHTML = `
    <aside class="front__latest">${latestColumn(6)}</aside>
    <div class="front__lead">${story(lead, { size: "xl", dek: true, eager: true })}</div>
    ${side.length ? `<div class="front__side">${side.map((a, i) =>
        story(a, { size: i === 0 ? "md" : "sm", img: i === 0, eager: i === 0 })).join("")}</div>` : ""}`;

  document.getElementById("topics").innerHTML = topicsStrip();

  /* ---------- লেটেস্ট নিউজ — রেখা দিয়ে আলাদা কলাম -------------------- */
  const latest = POSTS.filter(a => !heroIds.has(String(a.id))).slice(0, 4);
  show("latestSection", latest.length > 0);
  if (latest.length) {
    const box = document.getElementById("latest");
    box.style.setProperty("--n", Math.max(latest.length, 2));
    box.innerHTML = latest.map(a => story(a, { size: "sm" })).join("");
  }

  /* ---------- বিভাগের পাতা (যে বিভাগে খবর আছে শুধু সেটি) -------------
     প্রতিটির সর্বোচ্চ ৪টি খবর, পালাক্রমে দুই রকম বিন্যাসে:
     ক) বাঁয়ে বড় ফিচার, ডানে শিরোনামের তালিকা   খ) রেখা দেওয়া কলাম।
     হিরোতে থাকা পোস্টও এখানে বাদ যায় না — নইলে কোনো বিভাগের নিজের খবর
     তার নিজের সেকশন থেকেই হারিয়ে যেত।                                  */
  let n = 0;
  const singles = [];          /* একটিমাত্র খবরের বিভাগগুলো — এক সারিতে একসাথে দেখানো হয় */
  function desk(cat) {
    const list = inCat(cat.slug).slice(0, 4);
    if (!list.length) return "";
    if (list.length === 1) { singles.push(list[0]); return ""; }
    const [first, ...others] = list;
    let body;
    if (n++ % 2 === 0) {
      body = `<div class="lay-a">
        ${feature(first)}
        <div class="numbered">${others.map(a => story(a, { size: "sm", img: false })).join("")}</div>
      </div>`;
    } else {
      body = `<div class="cols cols--media" style="--n:${list.length}">${list.map((a, i) =>
        story(a, { size: i === 0 ? "lg" : "md", dek: i === 0 })).join("")}</div>`;
    }
    return `<section class="section">${deskHead(cat.name, topicLink(cat.slug))}${body}</section>`;
  }

  let desks = CATEGORIES.filter(c => c.slug !== "video" && c.slug !== "opinion").map(desk).join("");
  for (let i = 0; i < singles.length; i += 4) {
    const row = singles.slice(i, i + 4);
    desks += `<section class="section">${i === 0 ? deskHead("বিভাগ থেকে") : ""}
      <div class="cols cols--media" style="--n:${Math.max(row.length, 2)}">${row.map(a => story(a, { dek: true })).join("")}</div></section>`;
  }
  show("deskSection", !!desks);
  document.getElementById("deskSection").innerHTML = desks;

  /* ---------- ভিডিও ---------------------------------------------------- */
  const videos = inCat("video").filter(a => !heroIds.has(String(a.id))).slice(0, 4);
  show("videoSection", videos.length > 0);
  if (videos.length) {
    const grid = document.getElementById("videoGrid");
    grid.style.setProperty("--n", Math.max(videos.length, 2));
    grid.innerHTML = videos.map(videoCard).join("");
  }

  /* ---------- মতামত ---------------------------------------------------- */
  const opinions = [...inCat("opinion"), ...inCat("lifestyle")]
    .filter(a => !heroIds.has(String(a.id))).slice(0, 3);
  show("opinionSection", opinions.length > 0);
  if (opinions.length) {
    document.getElementById("opinionGrid").innerHTML = opinions.map(opinionCard).join("");
  }
}

render();
watchPosts(render);

})();

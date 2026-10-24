/* =====================================================================
   অ্যাডমিন প্যানেল — খবর পোস্ট, খসড়া, সম্পাদনা, প্রকাশ ও মুছে ফেলা
   ===================================================================== */
(async () => {
await initStore({ fresh: true });   /* অ্যাডমিনে সবসময় সার্ভার থেকে সরাসরি — সংরক্ষিত কপি নয় */
mountShell(null);

const main = document.getElementById("adminMain");

if (isAdmin()) {
  renderPanel();
} else {
  renderGate();
}

/* ---------- পাসওয়ার্ড গেট (যাচাই শুধু সার্ভারে) ------------------------------ */
function renderGate() {
  main.innerHTML = `
    <div class="gate">
      <div class="pass">
        <div class="pass__band"><span>প্রেস পাস · সম্পাদকীয় ডেস্ক</span>${ICON.lock}</div>
        <div class="pass__body">
          <h1>অ্যাডমিন প্রবেশ</h1>
          <p>${SITE.name} — চালিয়ে যেতে পাসওয়ার্ড দিন।</p>
          <form id="gateForm" novalidate>
            <label class="field"><span class="field__label">পাসওয়ার্ড</span>
              <input type="password" id="gatePass" inputmode="numeric" autocomplete="current-password"></label>
            <p class="gate__err" id="gateErr" role="alert"></p>
            <button class="btn btn--primary" type="submit" style="width:100%" id="gateBtn">${ICON.lock}প্রবেশ করুন</button>
          </form>
        </div>
      </div>
    </div>`;

  const form = document.getElementById("gateForm");
  const pass = document.getElementById("gatePass");
  const err = document.getElementById("gateErr");
  const btn = document.getElementById("gateBtn");
  setTimeout(() => pass.focus(), 50);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.textContent = "";
    if (!pass.value.trim()) { pass.focus(); return; }
    btn.disabled = true;

    const problem = await logIn(pass.value.trim());

    if (problem) {
      btn.disabled = false;
      err.textContent = problem;
      pass.value = "";
      pass.focus();
      return;
    }

    await runUnlockSequence();
    renderPanel();
  });
}

/* ---------- লগইন সফল হলে ৫ সেকেন্ডের আনলক অ্যানিমেশন ---------------------
   ছাপাখানার মতো লাইনগুলো একে একে ভরে ওঠে, শেষে "APPROVED" সিল পড়ে।     */
function runUnlockSequence() {
  return new Promise(resolve => {
    document.body.style.overflow = "hidden";

    const overlay = document.createElement("div");
    overlay.className = "unlock";
    overlay.innerHTML = `
      <div class="unlock__box">
        <div class="unlock__name">${SITE.name}</div>
        <div class="unlock__lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p class="unlock__text" id="unlockText">PROCESSING ACCESS</p>
        <span class="unlock__stamp">APPROVED</span>
      </div>`;
    document.body.appendChild(overlay);

    const text = overlay.querySelector("#unlockText");

    requestAnimationFrame(() => {
      overlay.classList.add("is-in");
      requestAnimationFrame(() => overlay.classList.add("is-run"));
    });

    const setStep = msg => {
      text.classList.add("is-out");
      setTimeout(() => { text.textContent = msg; text.classList.remove("is-out"); }, 150);
    };

    setTimeout(() => setStep("CHECKING PASSKEY"), 1600);
    setTimeout(() => { setStep("ACCESS GRANTED"); overlay.classList.add("is-done"); }, 3100);
    setTimeout(() => overlay.classList.add("is-leaving"), 4600);
    setTimeout(() => {
      document.body.style.overflow = "";
      overlay.remove();
      resolve();
    }, 5000);
  });
}

/* ---------- অ্যাডমিন প্যানেল --------------------------------------------- */
function renderPanel() {

/* ---------- কোন মোডে চলছে ----------------------------------------------- */
const onServer = storeMode() === "server";
const modeNote = onServer
  ? `<div class="mode mode--server">
       <strong>✓ সার্ভার মোড — সব ডিভাইসে দেখা যাবে</strong>
       খবর সার্ভারে জমা হচ্ছে। এখান থেকে পোস্ট করলে মোবাইল, অন্য কম্পিউটার — সব
       ডিভাইসেই একই খবর দেখা যাবে, এবং আপনি নিজে না মুছলে কখনো হারাবে না।
     </div>`
  : `<div class="mode mode--local">
       <strong>⚠ লোকাল মোড — খবর অন্য ডিভাইসে যাবে না</strong>
       এখন খবর শুধু <em>এই ব্রাউজারে</em> জমা হচ্ছে। এই অবস্থায় পিসিতে পোস্ট করলে
       তা মোবাইলে দেখা যাবে না।
       <span class="mode__why">কারণ: ${esc(storeReason())}</span>
       <span class="mode__fix">সমাধান: সাইটটি PHP সমর্থিত হোস্টিংয়ে আপলোড করুন, অথবা
       পরীক্ষার জন্য <code>preview-server.ps1</code> ফাইলটি "Run as Administrator"
       দিয়ে চালিয়ে ফোনে সেই নেটওয়ার্ক ঠিকানা খুলুন। বিস্তারিত README-তে।</span>
     </div>`;

/* ---------- প্যানেল ----------------------------------------------------- */
main.innerHTML = `
  <div class="admin__top">
    <div>
      <div class="crumbs"><a href="index.html">প্রচ্ছদ</a>${ICON.chev}<span>অ্যাডমিন</span></div>
      <h1 style="margin-top:8px">সম্পাদকীয় ডেস্ক</h1>
      <p>নতুন খবর প্রকাশ করুন, খসড়া রাখুন, সম্পাদনা করুন অথবা মুছে ফেলুন।</p>
    </div>
    <button class="btn btn--ghost" type="button" id="logoutBtn">${ICON.logout}লগআউট</button>
  </div>

  ${modeNote}

  <div class="admin__stats" id="stats">
    <div class="stat"><b id="stTotal">–</b><span>মোট খবর</span></div>
    <div class="stat stat--live"><b id="stLive">–</b><span>প্রকাশিত</span></div>
    <div class="stat stat--draft"><b id="stDraft">–</b><span>খসড়া</span></div>
  </div>

  <div class="atabs" role="tablist">
    <button type="button" class="is-on" data-tab="form" role="tab" aria-selected="true">${"নতুন খবর"}</button>
    <button type="button" data-tab="list" role="tab" aria-selected="false">ব্যবস্থাপনা</button>
  </div>

  <div class="admin__grid" id="adminGrid" data-tab="form">
    <!-- নতুন পোস্ট -->
    <section class="panel">
      <div class="panel__head">${ICON.plus}<span id="formHeading">নতুন খবর পোস্ট করুন</span></div>
      <div class="panel__body admin__form">

        <div class="toast" id="toast" hidden></div>

        <div class="editing-banner" id="editingBanner" hidden>
          <span>✎ সম্পাদনা করছেন: <strong id="editingTitle"></strong></span>
          <button type="button" id="cancelEdit">বাতিল করুন</button>
        </div>

        <form id="postForm" novalidate>

          <label class="field">
            <span class="field__label">শিরোনাম (Headline) <i>*</i></span>
            <input type="text" id="fTitle" placeholder="যেমন: অক্সিজেন উৎপাদন ০.৪ শতাংশ কমেছে" maxlength="160">
            <span class="field__err" id="eTitle"></span>
          </label>

          <label class="field">
            <span class="field__label">উপশিরোনাম (Sub Headline)</span>
            <input type="text" id="fSub" placeholder="ঐচ্ছিক — শিরোনামের নিচে ছোট করে দেখাবে" maxlength="220">
          </label>

          <label class="field">
            <span class="field__label">ভূমিকা (Intro)</span>
            <textarea id="fIntro" rows="2" placeholder="ঐচ্ছিক — খালি রাখলে মূল লেখার শুরু থেকেই নেওয়া হবে"></textarea>
          </label>

          <div class="field">
            <span class="field__label">পোস্ট কনটেন্ট (Post Content) <i>*</i></span>
            <div class="rte" id="rte">
              <div class="rte__bar">
                <button type="button" class="rte__btn" data-cmd="bold" title="বোল্ড" aria-label="বোল্ড">${ICON.bold}</button>
                <button type="button" class="rte__btn" data-cmd="italic" title="ইটালিক" aria-label="ইটালিক">${ICON.italic}</button>
                <button type="button" class="rte__btn" data-cmd="underline" title="আন্ডারলাইন" aria-label="আন্ডারলাইন">${ICON.underline}</button>
                <span class="rte__sep"></span>
                <button type="button" class="rte__btn" data-cmd="insertUnorderedList" title="বুলেট তালিকা" aria-label="বুলেট তালিকা">${ICON.ul}</button>
                <button type="button" class="rte__btn" data-cmd="insertOrderedList" title="ক্রমিক তালিকা" aria-label="ক্রমিক তালিকা">${ICON.ol}</button>
                <button type="button" class="rte__btn" data-cmd="blockquote" title="উদ্ধৃতি" aria-label="উদ্ধৃতি">${ICON.quote2}</button>
                <span class="rte__sep"></span>
                <button type="button" class="rte__btn" data-cmd="createLink" title="লিংক যোগ করুন" aria-label="লিংক">${ICON.link}</button>
                <button type="button" class="rte__btn" data-cmd="unlink" title="লিংক সরান" aria-label="লিংক সরান">${ICON.unlink}</button>
                <span class="rte__sep"></span>
                <button type="button" class="rte__btn" data-cmd="undo" title="আনডু" aria-label="আনডু">${ICON.undo}</button>
                <span class="rte__count" id="rteCount">০ শব্দ</span>
              </div>
              <div class="rte__box" id="fBody" contenteditable="true"
                   data-placeholder="খবরের বিস্তারিত লিখুন। এন্টার চাপলে নতুন অনুচ্ছেদ হবে।"></div>
            </div>
            <span class="field__err" id="eBody"></span>
          </div>

          <div class="field">
            <span class="field__label">ছবি (Featured Image)</span>
            <label class="drop" id="drop">
              <input type="file" id="fImage" accept="image/*">
              ${ICON.image}
              <b>ছবি বাছাই করুন বা এখানে টেনে আনুন</b>
              <span class="field__hint">প্রস্তাবিত মাপ: প্রস্থ ৬৪০px, উচ্চতা ৩৬০px — না দিলে স্বয়ংক্রিয়ভাবে একটি ব্যাকগ্রাউন্ড বসবে</span>
            </label>
            <span class="field__err" id="eImage"></span>
          </div>

          <div class="preview" id="preview" hidden>
            <img id="previewImg" alt="নির্বাচিত ছবির প্রিভিউ">
            <button class="preview__x" type="button" id="clearImg">ছবি সরান</button>
          </div>

          <div class="field-row">
            <label class="field">
              <span class="field__label">ছবির ক্যাপশন (Featured Image Caption)</span>
              <input type="text" id="fCaption" placeholder="ঐচ্ছিক" maxlength="200">
            </label>
            <label class="field">
              <span class="field__label">প্রকাশক নাম (Publisher Name)</span>
              <input type="text" id="fAuthor" placeholder="নিজস্ব প্রতিবেদক" maxlength="80">
            </label>
          </div>

          <label class="field">
            <span class="field__label">কীওয়ার্ড (Keywords)</span>
            <input type="text" id="fKeywords" placeholder="কমা দিয়ে আলাদা করুন, যেমন: বাজেট, অর্থনীতি">
            <span class="field__hint">এই শব্দগুলো দিয়ে খবরটি সার্চে পাওয়া যাবে</span>
          </label>

          <div class="field-row">
            <label class="field">
              <span class="field__label">বিভাগ (Category) <i>*</i></span>
              <select id="fCat">
                <option value="">— বিভাগ বাছাই করুন —</option>
                ${CATEGORIES.map(c => `<option value="${c.slug}">${c.name}</option>`).join("")}
              </select>
              <span class="field__err" id="eCat"></span>
            </label>
            <label class="field">
              <span class="field__label">উপবিভাগ (Sub Category)</span>
              <select id="fSubcat" disabled>
                <option value="">— প্রথমে বিভাগ বাছাই করুন —</option>
              </select>
            </label>
          </div>

          <div class="fgroup">
            <div class="fgroup__title">${ICON.pin}অঞ্চল <span class="field__hint">(ঐচ্ছিক — খবরটি কোন এলাকার)</span></div>
            <div class="field-row field-row--3">
              <label class="field">
                <span class="field__label">প্রশাসনিক বিভাগ</span>
                <select id="fDivision">
                  <option value="">— বাছাই করুন —</option>
                  ${BD_DIVISIONS.map(d => `<option value="${d.slug}">${d.name}</option>`).join("")}
                </select>
              </label>
              <label class="field">
                <span class="field__label">জেলা</span>
                <select id="fDistrict" disabled>
                  <option value="">— বাছাই করুন —</option>
                </select>
              </label>
              <label class="field">
                <span class="field__label">উপজেলা</span>
                <input type="text" id="fUpazila" placeholder="ঐচ্ছিক">
              </label>
            </div>
          </div>

          <div class="checks">
            <label class="check">
              <input type="checkbox" id="fLead">
              <span>প্রধান খবর হিসেবে দেখান (হোমপেজের ওপরে)</span>
            </label>
            <label class="check">
              <input type="checkbox" id="fExclusive">
              <span>${ICON.star} এক্সক্লুসিভ হিসেবে চিহ্নিত করুন</span>
            </label>
          </div>

          <div class="admin__actions">
            <button class="btn btn--ghost" type="submit" id="draftBtn" data-status="draft">খসড়া হিসেবে রাখুন</button>
            <button class="btn btn--primary" type="submit" id="postBtn" data-status="published">প্রকাশ করুন</button>
          </div>
        </form>
      </div>
    </section>

    <!-- পোস্ট ব্যবস্থাপনা -->
    <section class="panel">
      <div class="panel__head">${ICON.list} খবর ব্যবস্থাপনা</div>
      <div class="panel__body">
        <div class="mtools">
          <input class="input" type="search" id="mSearch" placeholder="শিরোনাম দিয়ে খুঁজুন..." aria-label="খবর খুঁজুন">
          <div class="chips" id="mChips">
            <button type="button" class="chip is-on" data-f="all">সব</button>
            <button type="button" class="chip" data-f="draft">খসড়া</button>
            <button type="button" class="chip" data-f="live">প্রকাশিত</button>
          </div>
        </div>
        <div id="manageList"><p class="field__hint">লোড হচ্ছে...</p></div>
      </div>
    </section>
  </div>`;

/* ---------- লগআউট ------------------------------------------------------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  logOut();
  location.href = "index.html";
});

/* ---------- মোবাইলে ফর্ম / তালিকা ট্যাব ---------------------------------- */
const grid = document.getElementById("adminGrid");
function setTab(name) {
  grid.dataset.tab = name;
  $$(".atabs button").forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$(".atabs button").forEach(b => b.addEventListener("click", () => setTab(b.dataset.tab)));

/* ---------- রিচ টেক্সট এডিটর -------------------------------------------- */
const rteBox = document.getElementById("fBody");
const rteCount = document.getElementById("rteCount");

document.querySelectorAll(".rte__btn").forEach(btn => {
  btn.addEventListener("mousedown", e => e.preventDefault()); // সিলেকশন যেন না হারায়
  btn.addEventListener("click", () => {
    const cmd = btn.dataset.cmd;
    rteBox.focus();
    if (cmd === "createLink") {
      const url = (prompt("লিংক ঠিকানা দিন (https://... বা mailto:...)") || "").trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
        alert("শুধু http://, https:// অথবা mailto: দিয়ে শুরু হওয়া লিংক দেওয়া যাবে।");
        return;
      }
      document.execCommand("createLink", false, url);
    } else if (cmd === "blockquote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else {
      document.execCommand(cmd, false, null);
    }
    updateCount();
  });
});

function updateCount() {
  const words = (rteBox.textContent || "").trim().split(/\s+/).filter(Boolean).length;
  rteCount.textContent = `${bnNum(words)} শব্দ`;
}
rteBox.addEventListener("input", updateCount);

/* ---------- বিভাগ → উপবিভাগ ক্যাসকেড ------------------------------------ */
const fCat = document.getElementById("fCat");
const fSubcat = document.getElementById("fSubcat");
fCat.addEventListener("change", () => {
  const list = SUBCATEGORIES[fCat.value] || [];
  if (!list.length) {
    fSubcat.innerHTML = `<option value="">— এই বিভাগে উপবিভাগ নেই —</option>`;
    fSubcat.disabled = true;
    return;
  }
  fSubcat.disabled = false;
  fSubcat.innerHTML = `<option value="">— উপবিভাগ বাছাই করুন —</option>` +
    list.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
});

/* ---------- প্রশাসনিক বিভাগ → জেলা ক্যাসকেড ----------------------------- */
const fDivision = document.getElementById("fDivision");
const fDistrict = document.getElementById("fDistrict");
fDivision.addEventListener("change", () => {
  const list = BD_DISTRICTS[fDivision.value] || [];
  if (!list.length) {
    fDistrict.innerHTML = `<option value="">— বাছাই করুন —</option>`;
    fDistrict.disabled = true;
    return;
  }
  fDistrict.disabled = false;
  fDistrict.innerHTML = `<option value="">— জেলা বাছাই করুন —</option>` +
    list.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
});

/* ---------- ছবি নির্বাচন (বাছাই বা টেনে আনা) ----------------------------- */
let pickedImage = "";
const fImage = document.getElementById("fImage");
const drop = document.getElementById("drop");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");

const setErr = (id, msg) => { document.getElementById(id).textContent = msg; };

async function takeFile(file) {
  setErr("eImage", "");
  if (!file) { clearImage(); return; }
  try {
    pickedImage = await fileToImage(file);
    previewImg.src = pickedImage;
    preview.hidden = false;
    drop.hidden = true;
  } catch (err) {
    clearImage();
    setErr("eImage", err.message);
  }
}
fImage.addEventListener("change", () => takeFile(fImage.files[0]));
["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("is-over")));
drop.addEventListener("drop", e => { e.preventDefault(); takeFile(e.dataTransfer.files[0]); });

document.getElementById("clearImg").addEventListener("click", clearImage);

function clearImage() {
  pickedImage = "";
  fImage.value = "";
  previewImg.removeAttribute("src");
  preview.hidden = true;
  drop.hidden = false;
}

/* ---------- ফর্ম রিসেট (নতুন পোস্টের জন্য প্রস্তুত) --------------------- */
function resetForm(form) {
  form.reset();
  rteBox.innerHTML = "";
  updateCount();
  fSubcat.innerHTML = `<option value="">— প্রথমে বিভাগ বাছাই করুন —</option>`;
  fSubcat.disabled = true;
  fDistrict.innerHTML = `<option value="">— বাছাই করুন —</option>`;
  fDistrict.disabled = true;
  clearImage();
}

/* ---------- ফর্ম জমা (দুটি বোতাম: খসড়া / প্রকাশ) ------------------------ */
let submitStatus = "published";
document.getElementById("draftBtn").addEventListener("click", () => { submitStatus = "draft"; });
document.getElementById("postBtn").addEventListener("click", () => { submitStatus = "published"; });

/* ---------- পোস্ট সম্পাদনা (বিদ্যমান পোস্ট ফর্মে লোড করা) --------------- */
let editingId = null;
const editingBanner = document.getElementById("editingBanner");
const postBtn = document.getElementById("postBtn");
const formHeading = document.getElementById("formHeading");

function startEdit(post) {
  editingId = post.id;
  setTab("form");

  document.getElementById("fTitle").value = post.title || "";
  document.getElementById("fSub").value = post.subHeadline || "";
  document.getElementById("fIntro").value = "";
  rteBox.innerHTML = post.content || (post.body || []).map(t => `<p>${esc(t)}</p>`).join("");
  updateCount();
  document.getElementById("fCaption").value = post.imgCaption || "";
  document.getElementById("fAuthor").value = post.author || "";
  document.getElementById("fKeywords").value = (post.keywords || []).join(", ");

  fCat.value = post.cat || "";
  fCat.dispatchEvent(new Event("change"));
  fSubcat.value = post.subcat || "";

  fDivision.value = post.division || "";
  fDivision.dispatchEvent(new Event("change"));
  fDistrict.value = post.district || "";
  document.getElementById("fUpazila").value = post.upazila || "";

  document.getElementById("fLead").checked = !!post.isLead;
  document.getElementById("fExclusive").checked = !!post.exclusive;

  pickedImage = post.img || "";
  if (pickedImage) {
    previewImg.src = pickedImage;
    preview.hidden = false;
    drop.hidden = true;
  } else {
    clearImage();
  }

  editingBanner.hidden = false;
  document.getElementById("editingTitle").textContent = post.title;
  formHeading.textContent = "খবর সম্পাদনা";
  postBtn.textContent = "পরিবর্তন সংরক্ষণ করুন";
  scrollTo({ top: document.getElementById("postForm").getBoundingClientRect().top + scrollY - 90, behavior: "smooth" });
  document.getElementById("fTitle").focus({ preventScroll: true });
}

function endEdit() {
  editingId = null;
  editingBanner.hidden = true;
  formHeading.textContent = "নতুন খবর পোস্ট করুন";
  postBtn.textContent = "প্রকাশ করুন";
}

document.getElementById("cancelEdit").addEventListener("click", () => {
  endEdit();
  resetForm(document.getElementById("postForm"));
});

document.getElementById("postForm").addEventListener("submit", async e => {
  e.preventDefault();

  const title = document.getElementById("fTitle").value.trim();
  const cat   = fCat.value;
  const contentHtml = sanitizeRichHtml(rteBox.innerHTML.trim());
  const plainBody = plainTextFromHtml(contentHtml).trim();

  setErr("eTitle", ""); setErr("eCat", ""); setErr("eBody", "");
  let bad = false;
  if (!title) { setErr("eTitle", "শিরোনাম লিখুন।"); bad = true; }
  if (!cat)   { setErr("eCat", "একটি বিভাগ বাছাই করুন।"); bad = true; }
  if (!plainBody) { setErr("eBody", "পোস্ট কনটেন্ট লিখুন।"); bad = true; }
  if (bad) {
    const firstErr = $(".field__err:not(:empty)");
    if (firstErr) firstErr.closest(".field").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const introRaw = document.getElementById("fIntro").value.trim();
  const excerptSrc = introRaw || plainBody;
  const excerpt = excerptSrc.length > 190 ? excerptSrc.slice(0, 190).trim() + "…" : excerptSrc;

  const keywords = document.getElementById("fKeywords").value
    .split(",").map(s => s.trim()).filter(Boolean).slice(0, 8);

  const post = {
    id: String(Date.now()),
    cat,
    subcat: fSubcat.value || "",
    title,
    subHeadline: document.getElementById("fSub").value.trim(),
    excerpt,
    content: contentHtml,
    img: pickedImage,
    imgCaption: document.getElementById("fCaption").value.trim(),
    author: document.getElementById("fAuthor").value.trim() || "নিজস্ব প্রতিবেদক",
    keywords,
    division: fDivision.value || "",
    district: fDistrict.value || "",
    upazila: document.getElementById("fUpazila").value.trim(),
    isLead: document.getElementById("fLead").checked,
    exclusive: document.getElementById("fExclusive").checked,
    status: submitStatus,
    read: readTime(plainBody),
    createdAt: Date.now()
  };

  const draftBtn = document.getElementById("draftBtn");
  draftBtn.disabled = true; postBtn.disabled = true;
  const activeBtn = submitStatus === "draft" ? draftBtn : postBtn;
  const activeLabel = activeBtn.textContent;
  activeBtn.textContent = "পাঠানো হচ্ছে...";

  const wasEditing = editingId;
  let saved;
  try {
    saved = wasEditing ? await updatePost(wasEditing, post) : await createPost(post);
  } catch (err) {
    showToast(err.message, false);
    draftBtn.disabled = false; postBtn.disabled = false;
    activeBtn.textContent = activeLabel;
    return;
  }

  draftBtn.disabled = false; postBtn.disabled = false;
  activeBtn.textContent = activeLabel;

  showToast(
    submitStatus === "draft" ? "খসড়া হিসেবে সংরক্ষিত হয়েছে"
      : (wasEditing ? "পরিবর্তন সংরক্ষিত হয়েছে" : "সাইটে আপলোড হয়েছে"),
    true, saved, submitStatus === "draft"
  );
  endEdit();
  resetForm(e.target);
  refreshPosts();
  await refreshManageList();
  scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- বার্তা ------------------------------------------------------ */
function showToast(msg, ok, saved, isDraft) {
  const t = document.getElementById("toast");
  t.className = "toast " + (ok ? "toast--ok" : "toast--bad");
  t.innerHTML = ok
    ? `<strong>✓ ${esc(msg)}</strong> ${isDraft || !saved ? "" : `<a href="${link(saved)}">খবরটি দেখুন</a>`}`
    : `<strong>${esc(msg)}</strong>`;
  t.hidden = false;
}

/* ---------- খবর ব্যবস্থাপনা তালিকা --------------------------------------- */
let filter = "all";
const mSearch = document.getElementById("mSearch");
mSearch.addEventListener("input", renderManageList);
$$("#mChips .chip").forEach(c => c.addEventListener("click", () => {
  filter = c.dataset.f;
  $$("#mChips .chip").forEach(x => x.classList.toggle("is-on", x === c));
  renderManageList();
}));

async function refreshManageList() {
  await loadManaged();
  renderManageList();
}

function renderManageList() {
  const box = document.getElementById("manageList");
  const all = managedPosts();
  const drafts = all.filter(p => p.status === "draft");
  const live   = all.filter(p => p.status !== "draft");

  document.getElementById("stTotal").textContent = bnNum(all.length);
  document.getElementById("stLive").textContent = bnNum(live.length);
  document.getElementById("stDraft").textContent = bnNum(drafts.length);

  if (!all.length) {
    box.innerHTML = `<div class="empty" style="padding:40px 16px;border:0">
        <div class="empty__icon">${ICON.news}</div>
        <h3>কোনো খবর নেই</h3>
        <p>ফর্ম থেকে প্রথম খবরটি পোস্ট করুন।</p>
      </div>`;
    return;
  }

  const q = mSearch.value.trim().toLowerCase();
  const match = p => !q || String(p.title || "").toLowerCase().includes(q);
  const showDrafts = filter !== "live" ? drafts.filter(match) : [];
  const showLive   = filter !== "draft" ? live.filter(match) : [];

  const row = p => `
      <div class="mrow" data-id="${p.id}">
        <img class="mrow__img" src="${imgFor(p)}" alt="" loading="lazy">
        <div>
          <a class="mrow__title" href="${p.status === "draft" ? `article.html?id=${p.id}` : link(p)}">${esc(p.title)}</a>
          <span class="meta" style="margin-top:4px">
            <span class="status ${p.status === "draft" ? "status--draft" : "status--live"}">${p.status === "draft" ? "খসড়া" : "প্রকাশিত"}</span>
            <span>${catName(p.cat)}</span><span>${timeAgo(p.createdAt)}</span>
          </span>
        </div>
        <div class="mrow__actions">
          <button class="mrow__edit" type="button" data-edit="${p.id}">${ICON.edit}সম্পাদনা</button>
          ${p.status === "draft" ? `<button class="mrow__pub" type="button" data-pub="${p.id}">${ICON.check}প্রকাশ করুন</button>` : ""}
          <button class="mrow__del" type="button" data-del="${p.id}" aria-label="মুছে ফেলুন">${ICON.trash}মুছুন</button>
        </div>
      </div>`;

  box.innerHTML = (!showDrafts.length && !showLive.length)
    ? `<p class="field__hint" style="padding:20px 0;text-align:center">কোনো খবর মেলেনি।</p>`
    : `${showDrafts.length ? `<p class="admin__subhead">খসড়া (${bnNum(showDrafts.length)})</p>${showDrafts.map(row).join("")}` : ""}
       ${showLive.length ? `<p class="admin__subhead">প্রকাশিত (${bnNum(showLive.length)})</p>${showLive.map(row).join("")}` : ""}`;

  box.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const post = all.find(p => String(p.id) === String(btn.dataset.edit));
      if (post) startEdit(post);
    });
  });

  box.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.del;
      const post = all.find(p => String(p.id) === String(id));
      if (!post) return;
      if (!confirm(`"${post.title}" — খবরটি মুছে ফেলা হবে। এটি আর ফেরানো যাবে না।\n\nআপনি কি নিশ্চিত?`)) return;

      btn.disabled = true;
      try {
        await removePost(id);
      } catch (err) {
        btn.disabled = false;
        showToast(err.message, false);
        return;
      }
      if (String(editingId) === String(id)) { endEdit(); resetForm(document.getElementById("postForm")); }
      refreshPosts();
      await refreshManageList();
    });
  });

  box.querySelectorAll("[data-pub]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.pub;
      btn.disabled = true;
      btn.textContent = "প্রকাশ হচ্ছে...";
      try {
        await publishPost(id);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `${ICON.check}প্রকাশ করুন`;
        showToast(err.message, false);
        return;
      }
      refreshPosts();
      await refreshManageList();
    });
  });
}

refreshManageList();
}

})();

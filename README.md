# বেদা নিউজ — Bangla News Portal with Admin Panel

A Bengali news portal styled like a printed broadsheet (red and white, with a dark
mode), with a built-in admin panel for publishing. HTML5, CSS3, vanilla JavaScript
and one small PHP file — no frameworks, no database.

The site ships **empty**. Every story on it is published from the admin panel.

## Files

```
index.html            Homepage (প্রচ্ছদ)
category.html         Section, area and search page
                        category.html?cat=dhaka            one division / section
                        category.html?division=dhaka&district=…&upazila=…   আমার এলাকার খবর
                        category.html?q=শব্দ                search
article.html          Single news page   (article.html?n=15)
article-og.php        Same page for Facebook/WhatsApp share previews (hosting only)
admin71.html          Admin panel — type /admin after the site address
admin/index.html      Makes /admin work everywhere (Live Server too): forwards to admin71.html
about.html  contact.html  privacy.html  terms.html  advertise.html   Info pages (footer links)
api/posts.php         Server API — stores posts permanently, checks the password
data/                 Where posts.json is written (needs write permission)
uploads/              Where uploaded photos are saved (needs write permission)
css/style.css         All styling (colours, layout, responsive, dark mode)
js/data.js            Site settings: name, contact details, categories
js/geo.js             Bangladesh divisions and districts (for the area dropdowns)
js/store.js           Talks to the API, falls back to browser storage
js/main.js            Header, footer, menu, theme, story templates (shared)
js/home.js            Homepage
js/category.js        Section / area / search page
js/article.js         Article page
js/admin.js           Admin panel
js/page.js            Info pages
.htaccess             Hosting rules: /admin, old short links, caching
preview-server.ps1    Local test server for Windows (no install needed)
build.ps1             Makes deploy.zip for uploading (local only)
```

## Running it on your PC

In VS Code press **Ctrl+Shift+B**. The site's own server starts and
<http://localhost:5602> opens in your browser. Everything works there, including
the admin panel and posting — it behaves exactly like PHP hosting (same
`data/posts.json`, same `uploads/` folder).

**Live Server also opens the site**, and every page and link works, but Live Server
cannot run PHP. So the site runs in *local mode* there (see below): you can log in
and post, but those posts live only in that one browser.

To open it on your phone too: right-click `preview-server.ps1` → *Run as
Administrator*. It prints a network address like `http://192.168.0.5:5599` — open
that on your phone (same Wi-Fi).

## Server mode and local mode

The site picks automatically:

| | **Server mode** (what you want) | Local mode (fallback) |
| --- | --- | --- |
| When | PHP hosting, or the preview server | Live Server, a double-clicked file, or a host without PHP |
| Posts saved in | `data/posts.json` on the server | That one browser only |
| Visible to | Every visitor, every device | Only you, on that browser |
| Password checked | On the server | In the browser, against a one-way fingerprint |

In local mode an amber **লোকাল মোড** strip appears at the top of the admin page
(and across the site while you're logged in). Its **কীভাবে ঠিক করবেন** button
shows the exact reason and the fix. Ordinary visitors never see it.

## Putting it on hosting

1. Run the builder (see below) and upload **deploy.zip** to `public_html`, then
   *Extract*. (Or upload the files by hand — everything except `.vscode/`,
   `preview-server.ps1`, `build.ps1`, `README.md` and `deploy.zip`.)
2. Set the `data/` and `uploads/` folders to permission **755** (or 775 if 755
   doesn't work). In cPanel: right-click the folder → *Change Permissions*.
3. Open `your-site.com/admin`, log in, and post a test story. It should appear on
   your phone as well.

Static-only hosts (GitHub Pages, plain Netlify) do not run PHP, so the site falls
back to local mode there.

### The deploy builder

```
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Run it after you change any `js/*.js` or `css/style.css`. It does not touch your
working files; it only writes **deploy.zip**, in which:

- `data.js + geo.js + store.js + main.js` are merged into one file, so each page
  loads one script instead of four;
- the CSS is put inside every page, so the first paint doesn't wait for it;
- every script gets a new name containing a hash (e.g. `js/core.088efae4.js`), so
  visitors' browsers can never show an old cached version;
- there is no `posts.json` and no uploaded photo — extracting it can never touch
  the news. It does include `data/.htaccess`, which keeps the data folder private.

If you upload files by hand instead, upload every changed HTML page too: the
`?v=` numbers in them are what make browsers fetch the new CSS and JS.

## Publishing news

1. Open the site address followed by **/admin** (for example `your-site.com/admin`,
   or `http://127.0.0.1:5500/newsportalbeda/admin` in Live Server).
   There is no admin link on the public pages.
2. Enter the password.
3. Fill in the form:
   - **শিরোনাম** (Headline) — required
   - **উপশিরোনাম** (Sub Headline) — optional, shown smaller under the title
   - **ভূমিকা** (Intro) — optional; leave it empty and the summary is taken from
     the start of the main content
   - **পোস্ট কনটেন্ট** (Post Content) — required; the toolbar does bold, italic,
     underline, lists, quote and links
   - **ছবি** (Featured Image) — optional; without one a coloured pattern is drawn.
     Photos are shrunk to 1200px wide JPEG before saving, so pages stay fast
   - **ছবির ক্যাপশন** (Caption), **প্রকাশক নাম** (Publisher / byline)
   - **কীওয়ার্ড** (Keywords) — comma-separated; makes the story findable in search
   - **বিভাগ** (Category) — required. Choosing **ঢাকা** puts the story on the ঢাকা
     page, **খুলনা** on the খুলনা page, and so on. **উপবিভাগ** fills in once a
     category is picked
   - **প্রশাসনিক বিভাগ / জেলা / উপজেলা** — optional; tags the area the story is
     about. It is shown on the article and powers **আমার এলাকার খবর** on the homepage
   - **প্রধান খবর হিসেবে দেখান** — puts the story at the top of the homepage
   - **এক্সক্লুসিভ** — adds the এক্সক্লুসিভ mark
4. Press **প্রকাশ করুন** (goes live now) or **খসড়া হিসেবে রাখুন** (saved as a
   draft, invisible to visitors, publish later with one click).

The list on the right of the admin panel shows every story, with edit, publish and
delete buttons. Delete asks first, then removes the story and its photo.

**Content safety:** the Post Content field only keeps a fixed set of safe HTML
(paragraphs, bold/italic/underline, lists, quotes, links). Scripts, frames and click
handlers are stripped — in the browser before sending and again on the server.

## Changing the password

The password is never in any file visitors download.

1. **`api/posts.php`** — change `const ADMIN_PASSWORD = '…';` near the top. This is
   the one that matters on hosting.
2. **`preview-server.ps1`** — change `$AdminPassword` near the top (preview server).
3. **`js/store.js`** — `LOCAL_PASS_SHA256` holds a one-way fingerprint for local mode.
   Make the new one with this command (put your password between the quotes), and
   paste the output there:

   ```
   powershell -NoProfile -Command "$b=[Text.Encoding]::UTF8.GetBytes('NEW-PASSWORD'); -join ([Security.Cryptography.SHA256]::Create().ComputeHash($b) | % { $_.ToString('x2') })"
   ```

After 5 wrong passwords in a row, the server blocks logins from that connection
for 15 minutes.

## Configuring the site

Everything else is in **`js/data.js`**:

| Name | What it controls |
| --- | --- |
| `SITE` | Site name, editor line, address, phone, email (used in the footer and the info pages), and `facebook` / `x` / `youtube` page addresses — each footer icon appears only once its address is filled in |
| `CATEGORIES` | The sections in the menu, nav bar and admin form. Adding one here adds it everywhere |
| `SUBCATEGORIES` | The উপবিভাগ choices for each category |
| `TAGS` | Topic words shown under আলোচিত (only the ones that have stories) |

The wording of the info pages (আমাদের সম্পর্কে, যোগাযোগ, গোপনীয়তা নীতি,
ব্যবহারের শর্তাবলি, বিজ্ঞাপন) is in their own `.html` files — edit the text there.

## Links

All links point at real files, so they work on hosting, on the preview server, in
Live Server and from a double-clicked file. On hosting, `.htaccess` also sends
`/admin` to the admin page and redirects old short links (`/topic/dhaka`,
`/dhaka/article/15`) to the new addresses, so links that were shared earlier keep
working.

# Putting this section on the live site

A guide for replacing the live "Choose your model and harness" section with this prototype. Read
[AGENTS.md](AGENTS.md) first for how the prototype works.

The prototype was built to run on its own, so it carries its own page around the section: a stand-in header, page-wide
styles, its own smooth scrolling and its own data. Pasted into the site as it is, those would clash with the site's
own. This guide sorts the files into what moves over, what stays behind, and what has to be reconnected to the site.

Work in the site's repository with this one open next to it. Wherever this guide says "the site's", look at how the
site's other sections do it and follow that.

## The approach

Port the section into the site's own section format, next to the current version, rather than dropping the
prototype's page in. Keep the drawing and the timeline exactly as they are. Replace the prototype's page-level
plumbing (scrolling, data, reduced motion, header height) with the site's.

## 1. Move over as-is

These don't depend on the page around them:

- **The section markup:** the `<section class="mh-scene" id="mh-scene">` block in `index.html`, with its heading,
  paragraph and Learn more link.
- **The drawing and timeline** in `section.js`: the session's design space (`SW`, `SH`, `CTL`, `LAYERS`),
  `CONFIGS`, `PICK`, `STEPS`, `TL`, the pieces and rolls, `layout()` and `frame(u)`. `frame(u)` is a pure function of
  `u` (0 to 1); keep it that way.
- **The section's styles** in `section.css`: everything from "the session, rows and pickers" onward (the `.mh-scene`,
  `.mh-stage`, `.mh-words`, session, row, picker, `.mh-line`, `.mh-label`, `.mh-cap` and `.mh-play` rules).

## 2. Leave behind

| In the prototype | Why |
|---|---|
| The header (`<header class="mh-nav">`) and its `.mh-nav`, `.mh-brand`, `.mh-links`, `.mh-tools`, `.mh-dl` styles | Stand-ins for the site's real header |
| The download notice (`<p class="mh-notice">`) and `.mh-notice` | Stand-in for the site's real notice |
| The intro and end bands (`<section class="mh-band">`) and `.mh-band`, `.mh-kicker` | Only there to give the prototype room to scroll |
| The numbered review bar (`#mh-stops`, `buildStops()`, `STOPS`, `.mh-stops`, `.mh-stop-name`) | A review tool, not part of the design. Keep `?u=` stills only if the site has a review mode |
| The page-wide rules at the top of `section.css`: `:root`, `html`, `body`, the `.lenis` rules, `html.mh-booting body` | They style the whole page. The site already sets these |
| The `<script>` in `<head>` that removes `mh-booting`, and the `.mh-review body` rule | Prototype-only loading and review behavior |
| `vendor/lenis.min.js` and `vendor/codicons/` | The site already loads Lenis and the Codicons font. Don't load them twice |
| `data.js` | Its strings belong in the site's own data (see below) |

## 3. Reconnect to the site

**Scope the styles.** The prototype puts `class="mh"` on `<body>`, so `.mh *` rules (box-sizing, fonts) reach the
whole page. Put the `mh` class on the section's root element instead. The section rules also use `--bg`, `--ink`,
`--ink-2`, `--ink-3`, `--mono`, `--ease-out`, `--link`, `--ring-c`, `--ui`, `--font`, `--font-text`, `--nav-h`,
`--notice-h` and `--col`. Map each to the site's existing tokens where they exist, and define the rest on `.mh`.

**Header and notice heights.** `section.js` hard-codes the header height (`NAV = 88`), and the CSS uses `--nav-h: 88px`
and `--notice-h: 26px`. Read these from the site instead, so the section stays correct if the header changes.

**Smooth scrolling.** `start()` creates its own Lenis instance. Use the site's instance instead; two would fight. The
player uses Lenis in two places:
- `snapIn()` glides the section into place with `lenis.scrollTo(y, { duration, lock: true, force: true, onComplete })`.
  That works on any instance.
- The half-second hold after the glide uses the `virtualScroll` option, set when Lenis is created. If the site's
  instance can't take that option, block scrolling another way for those 500ms, for example with a capture-phase
  `wheel` and `touchmove` listener that calls `preventDefault()`. Don't use `lenis.stop()`: it hides the page's
  scrollbar, which shifts the layout.

**The frame loop.** `start()` runs its own `requestAnimationFrame` loop that calls `watch()` and `frame()`. If the site
has a shared animation or scroll loop, run them from it instead. Also hook into the site's resize and font-loading
handling (the prototype waits for `document.fonts.ready`).

**Data.** `data.js` creates `window.APART.data`. The site uses that name for its own data, so one would overwrite the
other. Read the site's data instead, and add any fields it's missing. The section reads `harnesses`, `harnessMenu`,
`learnHarnesses`, `pickers`, `tabs` and `access`. It also uses `window.HfSession` for the session's title, prompt and
reply when the site provides it.

**Reduced motion.** The prototype checks `?motion=off` and the system's reduced-motion setting once, at load. The site
has its own reduced-motion switch in the header. Connect to that, so turning it on shows the still (no autoplay), as
the site's other sections do.

**The autoplay and the rest of the page.** The section is one screen tall, and the first scroll toward it glides it to
the top of the screen. Check that this doesn't fight any pinned or snapping section next to it. It only glides when
scrolling down toward it, once per page load.

## 4. Check after porting

- The section looks and plays the same as the prototype at about 1663 x 1078 and at phone width (390px).
- The rest of the page is unchanged: compare the other sections before and after (fonts, spacing, background, the
  scrollbar).
- Only one Lenis instance and one Codicons font load.
- One scroll in, it plays once (7.5 seconds) and stops on Copilot, and the next scroll moves on. Scrolling mid-play
  moves on too.
- Scrolling back up past the section doesn't trap or re-glide.
- The site's reduced-motion switch shows the still.
- The Pause / Play / Replay button works with the keyboard and has a visible focus ring.
- No console errors.

## Still to confirm

- The model names marked `VERIFY` in `data.js`, against the product's model picker.
- The copy's "Microsoft 365" and "any model from any provider", with the product team.
- Whether the current section stays available next to the new one while the team decides.

# Working on this prototype

Instructions for coding agents (and people) making changes here. Read the README first for what the prototype is.
To move the section onto the live site, follow [INTEGRATING.md](INTEGRATING.md).

## What it is

A static prototype of the "Choose your model and harness" section of the VS Code homepage. The chat session comes apart
into three rows (Harness, Model, Access); each row's real picker opens beside the session and the choice changes to
Codex, its ChatGPT model and a ChatGPT account, then everything goes back to the plain Copilot session.

It autoplays: one scroll down glides the section into place, it plays once (7.5 seconds), and the next scroll moves on.

## Run it

No build, no server, no package manager. Open `index.html` in Edge or Chrome. Keep it that way: don't add a bundler,
framework or npm dependency. Everything the page needs is in this folder (`vendor/` holds Lenis and Codicons).

- `index.html?u=0.42` shows a still frame at that point in the animation (0 to 1). Use it to check any moment.
- `index.html?motion=off` is the reduced-motion version (no autoplay, one still).

## Where things are

| Want to change | Look at |
|---|---|
| The words (heading, paragraph, link) | `index.html` |
| Colors, type, spacing, the pickers' look | `section.css` |
| Which harness, model and access it visits | `STEPS` and `CONFIGS` near the top of `section.js` (the names come from `data.js`) |
| The timing of each phase | `TL` in `section.js`: shares of the whole animation, 0 to 1 |
| How long it plays, the glide in, the hold | `PLAY` and `snapIn()` in `section.js` |
| What each frame shows | `frame(u)` in `section.js` |
| Sizes and positions of the session, rows and pickers | `layout()` in `section.js` (the session is drawn at 320 x 540 and scaled) |
| Product names: harnesses, models, ways to pay | `data.js` |

`frame(u)` must stay a pure function of `u`: same `u`, same picture, with no state carried between frames. That is what
makes `?u=` stills, the numbered review stops and Replay work. The player (`play`, `pause`, `finish`, `watch`) only
moves `u`.

## Rules for the design

1. The session's frame never moves or resizes; only what's inside it changes.
2. Nothing moves against the scroll, and nothing holds the page: a visitor can always scroll on, even mid-play.
3. It ends on the plain Copilot session.
4. Show only configurations the product really offers. Each harness takes certain models and ways to pay (see
   `pickers` and `access` in `data.js`): Codex works with a ChatGPT account or Copilot Pro+, Claude with a Copilot plan
   or an Anthropic API key. Don't pair a harness with a model or account it doesn't take.
5. Anything that moves on its own for more than five seconds needs a pause control (the button in the corner).
6. Keep reduced motion working: check `?motion=off` after any change.
7. Type: classic Segoe UI goes first in the font stack (Chromium on Windows 11 otherwise picks Segoe UI Variable).
8. Icons are Codicons (`<i class="codicon codicon-NAME">`); check the name exists in `vendor/codicons/codicon.css`.

## Checking a change

- Open the page, scroll once, and watch the whole play. Then check a few stills with `?u=` and `?motion=off`.
- Look at it at about 1663 x 1078 (a 1080p screen at 125% scaling) and at phone width (390px).
- Headless Chrome screenshots work for `?u=` stills:
  `chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1663,1078 --screenshot=out.png "file:///…/index.html?u=0.5"`
- Headless Chrome doesn't fire animation frames reliably, so the autoplay itself won't run there. To test playback
  headless, stand in for the frame timer on a scratch copy of the page:
  `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);`
- No errors in the console.

## Commits

- One commit per change, with a message that says what changed and why, so collaborators can follow the history.
- Push after each commit.
- Before shipping, the model names marked `VERIFY` in `data.js` and the copy's "Microsoft 365" and "any model from any
  provider" still need confirming with the product team.

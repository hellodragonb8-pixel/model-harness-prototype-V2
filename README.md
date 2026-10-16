# Choose your model and harness: prototype, version 2

A prototype of the "Choose your model and harness" section of the VS Code homepage. The chat session comes apart into
three rows (harness, model, access); each row's real picker opens beside the session and the choice changes to Codex, its
ChatGPT model and a ChatGPT account. It ends back on the plain Copilot session.

It autoplays: one scroll down glides the section into place, it plays once (about 7.5 seconds) and stops on Copilot, and
the next scroll moves on. Scrolling during the play moves on too; nothing holds the page. A button in the corner
pauses, plays and replays.

## Open it

Open `index.html` in a browser (Edge or Chrome). No build step and no server; everything it needs is in this folder.

- Scroll down once to start it. The numbered stops at the bottom are a review tool: each jumps to a moment, paused.
- `?u=0.42` shows a still frame at that point in the animation (0 to 1).
- `?motion=off` shows the reduced-motion version (also used when the system asks for reduced motion).

## Files

| File | What it is |
|---|---|
| `index.html` | The page: a stand-in for the site header and download notice, and the section |
| `section.css` | The page and the section's styles |
| `section.js` | The section and its player: every frame is a function of the playhead, so any moment can be shown |
| `data.js` | The product's strings: harnesses, model pickers, ways to reach a model. Names marked `VERIFY` are placeholders |
| `vendor/` | [Lenis](https://github.com/darkroomengineering/lenis) 1.3.26 for smooth scrolling (MIT) and [Codicons](https://github.com/microsoft/vscode-codicons) (CC BY 4.0) |

## Before it ships

- Check the model names marked `VERIFY` in `data.js` against the product's model picker.
- The copy keeps the live page's wording ("Microsoft 365", "any model from any provider"); confirm both with the
  product team.

# Choose your model and harness: prototype, version 2

A scroll prototype of the "Choose your model and harness" section of the VS Code homepage. The chat session comes
apart into three rows (harness, model, access); as you scroll, each row's real picker opens beside the session and the
choice changes, visiting only configurations the product offers. It ends back on the plain Copilot session.

## Open it

Open `index.html` in a browser (Edge or Chrome). No build step and no server; everything it needs is in this folder.

- Scroll to play, or use the numbered stops at the bottom.
- `?u=0.42` shows a still frame at that point in the scroll (0 to 1).
- `?motion=off` shows the reduced-motion version (also used when the system asks for reduced motion).

## Files

| File | What it is |
|---|---|
| `index.html` | The page: a stand-in for the site header and download notice, and the section |
| `section.css` | The page and the section's styles |
| `section.js` | The scroll beat: every frame is a function of scroll position, so it reverses exactly |
| `data.js` | The product's strings: harnesses, model pickers, ways to reach a model. Names marked `VERIFY` are placeholders |
| `vendor/` | [Lenis](https://github.com/darkroomengineering/lenis) 1.3.26 for smooth scrolling (MIT) and [Codicons](https://github.com/microsoft/vscode-codicons) (CC BY 4.0) |

## Before it ships

- Check the model names marked `VERIFY` in `data.js` against the product's model picker.
- The copy keeps the live page's wording ("Microsoft 365", "any model from any provider"); confirm both with the
  product team.

# If Only You Knew...

A gentle eight-scene apology game, built from the 53 supplied images.

For Railway hosting, use **If Only You Knew - Railway.zip** and follow [RAILWAY.md](RAILWAY.md). The deployment build uses Node.js and the existing prepared assets; no image preparation is needed on the host.

## Play

Open **index.html** in Chrome, Edge, Firefox, or Safari. No installation, server, or internet connection is required. Keep the `assets` folder alongside `index.html`, `style.css`, and `script.js`.

**Play Updated Game.html** is a fresh launch entry for the latest revision. Keep the versioned `style-*.css` and `script-*.js` files beside it as well; the launcher uses these to avoid stale preview copies. `style.css` and `script.js` remain the editable sources. Run `package_game.py` after edits to refresh both launchers and their versioned files.

- Tap the illustrated **Start** and **Next** buttons to follow the story. **Previous** returns through the message pages and earlier scenes; puzzle progress is preserved when going back. Start sits above its caption with clear spacing.
- Longer messages are split into readable pages, with a small page count. Next finishes the current message before moving to the next scene; all wording is preserved. The final letter also has Previous controls for rereading.
- In the sliding puzzle, tap a piece beside the empty space. Every starting arrangement is solvable and at most ten moves from the solution. **A little hint** highlights the next piece on a shortest solution; **See the picture** toggles a reference.
- Drag the flower onto the hamster, or tap the flower and then tap her. Keyboard users can activate both controls with Enter or Space.
- The pause control freezes story timing and frame animation. Escape resumes.
- Background music comes from your supplied `1015.mp4`. It starts when you tap Start, loops across scenes at a gentle volume, and pauses with the game or when the tab is hidden. The music-note button beside Pause toggles playback. Muting persists during replay.
- The final chapter, **A Little Door Left Open**, has the full ending letter and two choices. **Send a little hello 💌** opens WhatsApp to the confirmed Iraqi number +964 782 496 1601. Nothing is automatically typed or sent. The link uses WhatsApp's official click-to-chat format: https://faq.whatsapp.com/5913398998672934.
- **Keep the flower for now 🌸** quietly transitions to the “Take your time” scene without triggering any file download. Only the hedgehog appears in the “Take your time” scene. He plays the supplied **Hedgehog Alone_ Sad Sprite Sheet.png** sequence once, using 12 separately extracted and grounded frames. The scene softly fades to **A Little Flower, Just for You** and **The End 🌸**. The final screen has **Read our little story again**.
- Choosing the flower does not contact anyone, open WhatsApp, record a relationship decision, or send a notification. Both choices are entirely voluntary.

The game has no timer, failure state, account, analytics, or choice tracking. It works offline; only the deliberately clicked WhatsApp link requires internet. The layout fits a portrait 9:16 stage on phones and larger screens. Browser reduced-motion preferences disable decorative movement and shorten the ending animation.

## Files

- `index.html`, `style.css`, `script.js`: the complete game.
- `assets/`: extracted, cleaned production images, frame manifest, eight portrait backgrounds, puzzle tiles, and downloadable keepsake.
- `asset-map.json`: exact source filenames, detected crop rectangles, frame counts, and preparation notes.
- `asset-gallery.html`: an offline viewer for every extracted sequence and its frames.
- `ASSET-NOTES.md`: scene mapping and extraction decisions.
- `inspection/`: source contact sheets, extraction contact sheets, and browser verification screenshots.

The original 53 PNG files are preserved without modification in the project folder. The portable ZIP includes the prepared assets; it does not duplicate the original source sheets. The game only loads the prepared assets.

## Reproduce the asset preparation

`prepare_assets.py` requires the original 53 source PNG files beside it, plus Python, Pillow, NumPy, and OpenCV. It detects sheet borders, crops cells in reading order, removes only exterior-connected white, aligns character frames to a common ground and scale, and cuts the puzzle from a single continuous image. `make_keepsake.py` builds the downloadable card from the same original artwork.

Run `prepare_ending_assets.py` after the base preparation to extract the added sad hedgehog sheet and trim the transparent margins of the Start artwork. The original added sheet is preserved in the project folder. `check-controls.cjs` checks Previous navigation, puzzle state restoration, consistent illustrated Next buttons, Start spacing, all 12 ending frames, and removal of the Save button.

`qa.cjs` runs `audit-game.cjs` against a local preview at `http://127.0.0.1:8765`. Start that preview with `python -m http.server 8765 --bind 127.0.0.1`. The audit checks every scene and message page at four screen widths, all preserved wording, text fit, puzzle controls, flower dragging and keyboard use, music and mute persistence, pause, replay, and the keepsake download. Its local browser/runtime paths reflect the creation machine and can be changed for another machine. The game itself still works directly from its HTML launcher without a server.

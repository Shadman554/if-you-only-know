# Asset inventory and production choices

All 53 source images were visually inspected in contact sheets; representative sheet types and the puzzle were additionally inspected at full size. The individual output map is in `asset-map.json`. Original files remain untouched.

## Scene mapping

| Moment | Background | Animation / artwork |
|---|---|---|
| Title | Portrait background 1 | Hedgehog walk → breathing; hamster walk → idle/blink; original Start control |
| Overthinking | Portrait background 2 | Quiet thinking pose with a brief blink → one-time hedgehog heart reveal ending on a calm hold; hamster remains empty-handed in a listening pose with occasional blinking; extracted dialogue card; Next control |
| Sliding puzzle | Portrait background 3 | Cleaned square Kawaii Hedgehog Hamster Blossom Love illustration, nine exact adjoining tiles; pink tile style for the empty cell |
| Completion | Portrait background 4 | Same completed illustration; sparkles and floating hearts; dialogue card |
| Flower gesture | Portrait background 5 | Idle characters; draggable flower frames; animated finger drag hint |
| Receiving | Portrait background 6 | Duo handoff sequence → happy hedgehog and receiving hamster; floating hearts |
| Apology | Portrait background 7 | Sad hedgehog → bowing; sad hamster → listening |
| Ending | Portrait background 8 | Full paginated letter; separate quiet hedgehog and listening hamster, both anchored at 35% from the bottom; WhatsApp and flower choices |
| Flower ending | Portrait background 8 | The hedgehog appears alone. The added Hedgehog Alone_ Sad Sprite Sheet supplies 12 cropped frames played once on the shared 440×400 stage, with one fixed scale and ground anchor; the solo scene ends with a soft fade |
| Keepsake | Portrait background 8 | Extracted flower frame 3; “A little reminder that you matter.”; locally downloadable PNG embedded for offline use |

## Sheet families

- 10:26 files: six unframed alternate strips for walking, hamster idle, thinking, care reveal, handoff, and shy reaction. Preserved as alternate production references in the asset gallery. The handoff strip contains irregularly spaced individual and duo poses and uses manual boundaries.
- 10:28–10:29 files: framed walk, blink, thinking, care, handoff, and shy sequences. The walk sheet uniquely prints frame numbers inside the cells; the extraction excludes those numbers.
- 10:33 files: twelve-frame breathing, sad, bowing, happy, hamster walking, and hamster upset sets.
- 10:39–10:40 files: sitting, listening, receiving, smiling, hamster sitting, duo sitting, and duo looking sets.
- 10:52 files: Start, Next, Keep, Pause, hearts, questions, tile styles, flowers, grass, and dialogue cards. Every cell is extracted, including alternate control and icon states.
- 11:18 files: flower, heart, floating hearts, finger hint, sparkle, eight illustrated landscape panels, and puzzle celebration frames. The larger portrait backgrounds are used in the game; the smaller landscape and alternate puzzle celebration frames remain available in the gallery.
- 11:24 files: eight full portrait backgrounds, one per story scene. These remain opaque and preserve their original proportions.
- Kawaii Hedgehog Hamster Blossom Love: main puzzle source, matching the line-art characters. Only the straight printed grid lines were locally cleaned with a narrow inpainting mask. All nine tiles are cut from the same continuous image; the ninth appears when solved.
- Pastel Cherry Blossom Puzzle Asset Sheet: each region extracted separately—reference image, shuffled tiles, twelve flower frames, four effect sequences, and scenery/frame samples. This is a softer painted alternate reference; it is not mixed into the main doodle puzzle.
- Pastel Sakura Hedgehog Puzzle Tiles: all nine pre-separated, numbered tiles extracted without labels and retained as an alternate puzzle reference. Their separate artwork is not assumed to have exact matching edges; the playable puzzle uses the continuous square source instead.

## Extraction and animation

Framed sheets use detected border contours rather than an assumed equal grid. Titles, panel outlines, and numbering are excluded. Exterior-connected near-white pixels are made transparent, preserving enclosed pale bodies, highlights, and dialogue interiors. Character animations share a fixed stage, a common body scale, and a grass baseline; poses are never stretched. All frames retain reading order. Decorative grass, hearts, flowers, and expression marks belonging to the original drawings are retained.

The runtime uses frame changes from the supplied animation sheets, plus subtle breathing and entrance motion. Emotional sequences play once and hold the final pose; idle sequences include quiet pauses. All assets are local. Alternate sheets are included for reference and reuse without crowding the eight-scene story.

# Paste-into-Claude-Code Prompt — NYT-style redesign of Goodridge Colson Games

> Paste everything below the line into Claude Code, opened at the root of your `gc-games`
> repo. It is written against your actual files. Work through it section by section; commit
> after each game so you can review incrementally.

---

You are restyling my existing Vite + React + TypeScript + MUI app (`gc-games`) to look like
the front page of **The New York Times**, while keeping it 100% games-focused. **Do not change
any scoring logic, localStorage keys, or data flow** — this is a visual reskin plus ONE new
feature (game history). A companion file `Goodridge Colson Games.dc.html` (in this folder) is a
working HTML prototype of the target look — treat it as the source of truth for layout, type,
color, and spacing. It is a *reference*, not code to copy verbatim; recreate it with my existing
React/MUI components and patterns.

## Ground rules
- Keep the existing routing (`react-router-dom`), the per-game components, and `src/utils/scoreHelpers.ts` behavior intact.
- Preserve all localStorage keys exactly: `rummyPlayers`/`rummyScores`, `golfPlayers`/`golfScores`, `mexicanTrainPlayers`/`mexicanTrainScores`.
- Keep each game's existing rules: Rummy = 6 players × 6 fixed rounds with cumulative "scores on the doors" + emoji ranking; Golf = dynamic rounds, max score 200, deletable rounds; Mexican Train = dynamic auto-adding/removable players + dynamic rounds. **All three are LOWEST-score-wins.**
- Replace the green (`#4CAF50`) buttons and the MUI-default look with the editorial system below.
- Mobile: keep your existing responsive switch (`ResponsiveRummy`, the `< 768px` checks). The new styles must degrade gracefully — single column on narrow screens.

## 1. Type system (add a shared theme/tokens module)
Create `src/styles/tokens.ts` exporting these, and use them everywhere instead of ad-hoc values.

**Fonts**
- Masthead (the `<h1>` "Goodridge Colson Games"): **Cloister Black** — you already load it in `src/index.css` as `@font-face { font-family: 'Cloister Black'; src: url('/fonts/CloisterBlack.ttf') }`. Keep using it.
- Editorial serif (game titles, deks, standings names, log headlines): **Libre Caslon Text** (add via Google Fonts `<link>` in `index.html`, weights 400/700 + italic 400). Italic is used for all deks/subtitles.
- Numbers / score values / totals: **Georgia** (web-safe, no import).
- Labels, nav, eyebrows, buttons, meta (the "Franklin" role): **Libre Franklin** (Google Fonts, weights 400/500/600/700/800).

**Colors**
```
ink:        #121212   // primary text, strong rules, masthead
body:       #1a1a1a   // score numbers / body
soft:       #333333
meta:       #5a5a5a
meta2:      #6b6b6b
meta3:      #7a7a7a
faintLabel: #9a9a9a   // eyebrows
rank:       #b0b0b0   // rank numerals
ruleStrong: #121212   // 1–2px section rules
rule:       #e2e2e2   // section dividers
ruleFaint:  #ececec   // table row dividers
inputBorder:#cfcfcf
accent:     #d0021b   // NYT red — LIVE dot/label, leader number, destructive button
paper:      #ffffff   // page background
inputFocus: #f7f4ec   // subtle tint on focused score cell
```

**Type scale (px / weight / tracking)**
```
masthead     clamp(38,6.6vw,78) / 700 / line-height 1.04 / Cloister Black
nav item     17 / active 700 inactive 500 / active = 2px solid #121212 underline
eyebrow      11 / 700 / .16em / uppercase / #9a9a9a / Libre Franklin
game title   46 / 700 / Libre Caslon Text / #121212
dek          18 / 400 italic / Libre Caslon Text / #5a5a5a
live label   12 / 700 / .14em / uppercase   (accent when a game is live)
live head    18 / 400 / Libre Caslon Text / #121212
live meta    13 / 400 / Libre Franklin / #7a7a7a
col header   13 / 700 / Libre Franklin / #121212   (player names; ellipsis-truncate)
corner/Total 11 / 700 / .1em / uppercase / Libre Franklin
round label  13 / 400 / Libre Franklin / #8a8a8a
score input  20 / 400 / Georgia / right-aligned / borderless
total number 22 / 700 / Georgia   (leader's total = accent)
standings name 19–30 / Libre Caslon Text ; numbers Georgia 21–32 (leader = accent)
button       12 / 600 / .08em / uppercase / Libre Franklin
```

## 2. Header / chrome (replace `src/components/header_bar.tsx` and the `<hr>` rules in `App.tsx`)
Build a masthead block, centered, max-width 1180px, side padding 40px:
1. **Utility bar** (flex, space-between, Libre Franklin):
   - Left: a small search glyph (simple SVG: circle r=7 + line) + the date ("Thursday, June 19, 2026" — use real `new Date()`), with "Today's Scorebook" underlined beneath in #5a5a5a.
   - Right: eyebrow "CURRENTLY LEADING" (11px, .12em, #7a7a7a) above a 15px/600 chip showing the live leader as `Name  score` for the active scoring game, or `—` on map/video pages.
2. **Masthead** `<h1>` centered, Cloister Black, the clamp size above.
3. **Nav** centered flex, gap 30px, with a `border-top: 1px solid #121212` above it. Items: Rummy · Golf · Mexican Train · Suburb · NZ. Active item bold + 2px underline (drive off `useLocation`, same as today). Remove the old `.nav-link` green/default styling.
4. Under the nav: the NYT **double rule** — a `3px solid #121212` border-top immediately above a `1px solid #121212` (your current two `<hr>`s become this). Then a centered **live strip**: red pulsing dot + "LEADING"/"STANDBY" label, a Caslon headline ("`<name>` leads with `<total>`" or "No game in progress"), and a Franklin meta ("· N players · N rounds"). On the map page it reads "MAP — Suburbs reference map", on the video page "FEATURE — New Zealand".

## 3. Scorecard layout (Rummy / Golf / Mexican Train)
Two-column grid below the header: `grid-template-columns: 1fr 312px; gap: 48px`. Collapse to one column under ~860px.

**Left column — the card:**
- Eyebrow "THE SCORECARD", then the game name as the 46px Caslon title, then an italic Caslon dek: `"N players · N rounds played · lowest score wins"`.
- The score table as a **CSS grid** (not an HTML `<table>` — avoids fragile parsing): `grid-template-columns: minmax(58px,auto) repeat(playerCount, minmax(80px,1fr))`.
  - Header row: empty corner showing the round label ("Round"), then each player name (Franklin 13/700, right-aligned, ellipsis truncation, with a faint `×` to remove the player). `border-bottom: 1px solid #121212`.
  - Each round: left cell = round number (Franklin 13 #8a8a8a, min-height 48px), then a borderless Georgia 20px right-aligned number `<input inputmode="numeric">` per player. Row divider `1px solid #ececec`. Focus tints the cell `#f7f4ec`.
  - Totals row: "Total" corner label, then Georgia 22/700 cumulative totals, `border-top: 2px solid #121212`. The current leader's total is colored accent red.
- **Keep Rummy's existing cumulative "scores on the doors" rows and the 🟩🟦🟪🟨🟧🟥 emoji ranking + RankingKey** if you want — they can live below the grid totals. (Best = lowest, ascending sort — already in your code.) Golf & Mexican Train keep their "Total Score" cumulative rows.
- Controls (Libre Franklin uppercase buttons): primary filled-black `+ Add Round`; outline `Remove Last Round` (Golf/Mexican Train keep per-row delete `×`); an "Add another player" input + outline `Add`; then a divider and the two existing actions restyled — `Clear Scores` (small grey outline) and `Clear Players & Scores` (accent-red outline, fills red on hover). **`Clear Players & Scores` must preserve game history** (see §5).

**Right column — Standings rail:** `border-left: 1px solid #121212; padding-left: 32px`.
- Eyebrow "STANDINGS" (Franklin 12/800, accent), italic Caslon subtitle "Fewest points takes the lead."
- Leader block: "1st · In the lead" eyebrow, then leader name (Caslon 30/700) and total (Georgia 32/700, accent).
- Remaining players ranked: `rank  name … total`, dividers `1px #ececec`. Sort ascending (lowest wins) for all three games.

## 4. Suburb & NZ are NOT scorecards
- **Suburb** (`src/components/suburb.tsx`): keep the `react-svg-pan-zoom` map. Just wrap it in the editorial chrome — eyebrow "REFERENCE", 46px Caslon title "Suburb", italic dek "A pan-and-zoom reference map of the suburbs — drag to move, scroll to zoom.", then the existing pan/zoom viewer inside a `1px solid #121212` frame, full content width.
- **NZ** (`src/components/nz.tsx`): keep the Vimeo iframe (`https://player.vimeo.com/video/1090882752`). Wrap with eyebrow "FEATURE", title "NZ", italic dek "The New Zealand feature presentation.", iframe in a black `1px solid #121212` frame, `aspect-ratio: 16/9`, full width.

## 5. NEW FEATURE — game history ("Finish & Log Game" + season)
Add per-game persistent history. Store under new keys `rummyHistory`, `golfHistory`, `mexicanTrainHistory` (JSON arrays). Add helpers to `src/utils/scoreHelpers.ts`:
- `finishGame(historyKey, players, scores, lowWins=true)`: compute each active player's cumulative total, sort (ascending = winner first), push a record to the front of the history array:
  ```ts
  { id: Date.now(),
    date,  // new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
    time,  // new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
    unit: 'Round', roundCount, playerCount,
    winnerName, winnerTotal,
    results: [{ name, total }]  // sorted, winner first
  }
  ```
  Then clear only the scores/rounds (keep the players for a rematch). Persist.
- `deleteHistory(historyKey, id)` and `clearHistory(historyKey)`.
- Make `clearPlayersAndScores` (and the per-component "Clear Players & Scores") leave the history array untouched.

**UI (below the scorecard, left column):**
- "Finish & Log Game" — filled-black button + a Franklin 13px #8a8a8a helper line "Saves this result to the game's history and starts a fresh card."
- "RECENT GAMES" section (2px top rule, with a faint "Clear history" link on the right). Each entry: eyebrow `Game N · <date> · <time>`, a Caslon 23/700 headline `"<winner> won with <total>"`, a Georgia 15px #6b6b6b score line `"Name total · Name total · …"`, a right-aligned Franklin 11.5px #9a9a9a meta `"N players · N rounds"` and a `×` delete.

**UI (standings rail, below standings):**
- "THIS SEASON" section (accent eyebrow, 2px top rule, italic Caslon "N games logged in <Game>"). Aggregate across that game's history: per player `{ wins, played }`, sort by wins desc. Each row: `rank  name … <wins> WINS`, the wins number Georgia 22/700 (leader = accent).

## 6. Optional niceties (only if quick)
- A "Newsprint / Sepia" theme toggle (Sepia = page bg `#f6f1e6`, focus tint `#efe7d4`).
- The accent red is a single token — keep it centralized so it can be themed.

## Deliverable
Reskin `header_bar.tsx`, `App.tsx` chrome, `rummy.tsx`, `rummy_mobile.tsx`, `golf.tsx`,
`mexican_train.tsx`, `suburb.tsx`, `nz.tsx`, plus `scoreHelpers.ts` (new history helpers) and a
new `src/styles/tokens.ts`. Match the prototype's spacing and hierarchy closely. Keep everything
working on mobile. Don't introduce a component library beyond MUI; inline styles or your existing
approach are fine.

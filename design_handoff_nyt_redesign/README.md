# Handoff: New York Times–style redesign of *Goodridge Colson Games*

## Overview
A visual reskin of the existing `gc-games` web app (a card/board-game scorekeeper) to look
like the front page of **The New York Times**, plus one new feature: persistent **game
history** (a "Finish & Log Game" action, a Recent Games log, and a per-game season win
tally). The app's games — Rummy, Golf, Mexican Train (scorekeepers), Suburb (a pan/zoom map)
and NZ (a video) — are unchanged in behavior; only their presentation changes.

## About the design files
The file in this bundle, **`Goodridge Colson Games.dc.html`**, is a **design reference created
in HTML** — a working prototype of the intended look and behavior, not production code to copy
directly. The task is to **recreate this design inside the existing `gc-games` codebase**
(Vite + React + TypeScript + MUI + react-router) using its established patterns, keeping all
current scoring logic and `localStorage` keys intact.

> **Start here:** `CLAUDE_CODE_PROMPT.md` in this folder is a complete, paste-ready instruction
> set written against the actual repo files. Paste it into Claude Code opened at the repo root.
> This README is the deeper reference spec behind that prompt.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are specified. Recreate
the UI closely, using the codebase's existing React/MUI patterns (inline styles are already the
norm in these components).

## Screens / Views

### Shared chrome (all routes)
- **Utility bar** (max-width 1180px, 40px side padding, Libre Franklin): left = search glyph (SVG circle r7 + line) + today's date + underlined "Today's Scorebook" (#5a5a5a); right = eyebrow "CURRENTLY LEADING" (#7a7a7a) over a 15px/600 chip = live leader `Name  score`, or `—` on non-scoring pages.
- **Masthead**: centered `<h1>` "Goodridge Colson Games" in **Cloister Black**, `clamp(38px, 6.6vw, 78px)`, line-height 1.04, #121212.
- **Nav**: centered flex, gap 30px, `border-top: 1px solid #121212`. Active item = 700 weight + 2px underline; inactive = 500. Below it, an NYT **double rule** (3px solid then 1px solid #121212).
- **Live strip**: centered, `border-bottom: 1px solid #e2e2e2`. Pulsing red dot + label ("LEADING"/"STANDBY"/"MAP"/"FEATURE") + Caslon headline + Franklin meta (#7a7a7a).

### Scorecard view — Rummy, Golf, Mexican Train
- Two-column grid `1fr 312px`, gap 48px (collapse to one column < ~860px).
- **Left:** eyebrow "THE SCORECARD" → 46px Caslon game title → italic Caslon dek "N players · N rounds played · lowest score wins".
  - Score grid: `minmax(58px,auto) repeat(playerCount, minmax(80px,1fr))`. Header row (player names, Franklin 13/700, ellipsis, removable `×`), round rows (round number + borderless Georgia 20px right-aligned numeric inputs, row divider 1px #ececec, focus tint #f7f4ec), totals row (Georgia 22/700, `border-top: 2px solid #121212`, leader total = accent red).
  - **Rummy** additionally keeps its cumulative "scores on the doors" rows and 🟩🟦🟪🟨🟧🟥 emoji ranking + RankingKey (best = lowest, ascending). Golf & Mexican Train keep their "Total Score" cumulative rows.
  - Controls: filled-black `+ Add Round`; outline `Remove Last Round`; "Add another player" input + outline `Add`; divider; `Clear Scores` (grey outline) and `Clear Players & Scores` (accent-red outline → fills red on hover).
- **Right (Standings rail):** `border-left: 1px solid #121212; padding-left: 32px`. "STANDINGS" eyebrow (accent) → italic "Fewest points takes the lead." → leader block (Caslon 30/700 name + Georgia 32/700 accent total) → ranked rest (rank · name · total, dividers 1px #ececec). All three games sort **ascending** (lowest wins).

### Reference view — Suburb
The existing `react-svg-pan-zoom` suburbs map, wrapped in chrome: eyebrow "REFERENCE", 46px Caslon "Suburb", italic dek, viewer in a `1px solid #121212` frame, full content width. (Note: `suburbs.svg` is ~30 MB and was not bundled here — it lives in the repo at `src/assets/suburbs.svg`.)

### Feature view — NZ
The existing Vimeo iframe (`player.vimeo.com/video/1090882752`), wrapped in chrome: eyebrow "FEATURE", 46px Caslon "NZ", italic dek, iframe in a black `1px solid #121212` frame, `aspect-ratio: 16/9`, full width.

## Interactions & behavior
- **Nav** drives off `useLocation` (unchanged routing). Active = bold + underline.
- **Score entry** updates cumulative totals + standings live (existing logic).
- **Finish & Log Game** (new): archives the finished game to history, then clears rounds but keeps players for a rematch.
- **Recent Games**: each entry deletable (`×`); "Clear history" clears the whole list.
- **Clear Players & Scores**: must NOT delete history.
- **Live dot** pulses (opacity keyframe ~1.6s).
- Responsive: keep the existing `< 768px` mobile switch (`ResponsiveRummy`, `rummy_mobile.tsx`); columns collapse to one.

## State management
Preserve existing per-game state and these `localStorage` keys: `rummyPlayers`/`rummyScores`, `golfPlayers`/`golfScores`, `mexicanTrainPlayers`/`mexicanTrainScores`. **Add** history keys `rummyHistory`, `golfHistory`, `mexicanTrainHistory` (JSON arrays of records — see `CLAUDE_CODE_PROMPT.md` §5 for the record shape and helper signatures). Win direction is **lowest-score-wins** for all three scoring games.

## Design tokens
```
ink #121212 · body #1a1a1a · soft #333 · meta #5a5a5a/#6b6b6b/#7a7a7a
faintLabel #9a9a9a · rank #b0b0b0
rules: strong #121212 · section #e2e2e2 · row #ececec · input #cfcfcf
accent (NYT red) #d0021b
paper #ffffff (Newsprint) / #f6f1e6 (optional Sepia) · input focus tint #f7f4ec
fonts: Cloister Black (masthead) · Libre Caslon Text (serif display/italic deks) ·
       Georgia (numbers/totals) · Libre Franklin (labels/nav/eyebrows/buttons)
```
(Full type scale in `CLAUDE_CODE_PROMPT.md` §1.)

## Assets
- **Cloister Black** — already in the repo at `public/fonts/CloisterBlack.ttf` (loaded via `@font-face` in `src/index.css`). Keep using it for the masthead.
- **Libre Caslon Text** + **Libre Franklin** — add via Google Fonts `<link>` in `index.html`.
- `suburbs.svg`, the Vimeo video, and the React/MUI deps — all already in the repo.

## Files
- `Goodridge Colson Games.dc.html` — the HTML design reference (this bundle).
- Target repo files to restyle: `src/components/header_bar.tsx`, `src/App.tsx` (chrome/rules), `src/components/rummy.tsx`, `rummy_mobile.tsx`, `golf.tsx`, `mexican_train.tsx`, `suburb.tsx`, `nz.tsx`, `src/utils/scoreHelpers.ts` (add history helpers), `src/index.css` (fonts/resets), plus a new `src/styles/tokens.ts`.

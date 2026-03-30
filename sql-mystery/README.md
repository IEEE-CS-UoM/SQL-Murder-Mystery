# SQL Murder Mystery

An IEEE CS Open Week browser game where players solve a murder by writing real SQL against an in-memory SQLite database powered by `sql.js`.

## Setup

```bash
npm install
npm run setup
npm run dev
```

Open the Vite URL in your browser and start investigating.

## Features

- Three difficulty levels: easy, medium, hard
- In-browser SQLite database with seeded mystery data
- Countdown timer with hint system
- SQL editor, results grid, schema browser, query history
- Two-stage solution flow: killer first, mastermind second
- Local leaderboard stored in `localStorage`
- Sound effects via `use-sound` with Web Audio API fallback if MP3 files are missing

## Sound files

The app looks for optional audio files inside `public/sounds/`:

- `keyclick.mp3`
- `run-query.mp3`
- `success.mp3`
- `wrong.mp3`
- `victory.mp3`

If they are not present, the game generates procedural fallback tones automatically.

## WASM setup

`sql.js` needs `sql-wasm.wasm` in the public folder. The setup script copies it for you:

```bash
npm run setup
```

## Event deployment

```bash
npm run build
```

Then serve the `dist/` folder locally:

```bash
npx serve dist
```

Or:

```bash
python -m http.server 8080
```

Run the command from inside `dist/` if you use Python.

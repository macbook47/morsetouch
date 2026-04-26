# MorseTouch 🔴⬛

A mobile-first Vue 3 app for learning Morse code through touch.

## Features

- **TAP Mode** — Hold button short for dot (·), long for dash (—). See the decoded letter live.
- **TREE Mode** — Visual decision tree like the physical card. Tap any letter to hear & see its path.
- **QUIZ Mode** — Flashcard quiz. See a letter, tap the correct morse. Score + streak tracking.
- 🔊 Audio beeps for every dot and dash
- 📱 Optimized for mobile touch — no typing needed

## Tech Stack

- Vue 3 + Vite
- TailwindCSS (utility classes)
- Web Audio API (beeps)
- Vercel deployment

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Vite.

### Option 2: GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Settings are auto-detected:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy** ✓

## Project Structure

```
src/
  components/
    TapMode.vue     # Main tap-to-morse input
    QuizMode.vue    # Flashcard quiz
    TreeMode.vue    # Visual morse tree
  composables/
    useAudio.js     # Web Audio beeps
    useScore.js     # Score tracking
  data/
    morse.js        # Morse code table + tree builder
  App.vue           # Shell + navigation
  main.js
```

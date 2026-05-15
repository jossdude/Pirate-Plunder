# Pirate's Plunder - Board Game Randomizers

A simple, mobile-friendly pirate-themed website with two randomizers for board games:
- Random letter generator (A-L)
- Random number generator (1-18)

## Features

- 🏴‍☠️ Pirate-themed design
- 📱 Fully responsive for mobile devices
- 🎲 Single button triggers both randomizers simultaneously
- ✨ Smooth animations and visual feedback
- ⌨️ Keyboard support (Space or Enter to roll)

## Local Development

Simply open `index.html` in a web browser. No build process or dependencies required.

## Deployment

Live at https://plunder.joss.ing (and the canonical GitHub Pages URL https://jossdude.github.io/Pirate-Plunder/).

Hosted on **GitHub Pages**, served directly from the `main` branch root. Any push to `main` auto-rebuilds and redeploys in ~1 minute.

### Re-enabling Pages from scratch

If Pages ever gets disabled:
1. Repo Settings → Pages
2. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → Save

### Custom domain (`plunder.joss.ing`)

GitHub Pages is configured to serve the site from `plunder.joss.ing`. This requires:
- A `CNAME` file at the repo root containing `plunder.joss.ing` (committed by GitHub when the custom domain is set in Pages settings).
- A DNS `CNAME` record at the registrar:
  - Host: `plunder`
  - Target: `jossdude.github.io`
- **Enforce HTTPS** ticked in Pages settings (after DNS propagates).

## Files

- `index.html` - Main HTML structure
- `styles.css` - Pirate-themed styling and responsive design
- `script.js` - Randomizer logic and event handlers
- `README.md` - This file

## Usage

Click the "Roll the Dice!" button or press Space/Enter to generate:
- A random letter from A to L
- A random number from 1 to 18

Both values are generated simultaneously with each button press.

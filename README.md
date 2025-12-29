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

## Deployment to Railway

Railway offers free hosting for static sites. Here are the steps to deploy:

### Option 1: Deploy via GitHub (Recommended)

1. **Create a GitHub repository:**
   - Create a new repository on GitHub
   - Push all files (index.html, styles.css, script.js, README.md) to the repository

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign in with your GitHub account
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect it's a static site and deploy it

3. **Configure custom domain (optional):**
   - In your Railway project, go to Settings
   - Under "Domains", add your custom domain
   - Follow Railway's instructions to configure DNS records

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add custom domain:**
   - Use Railway dashboard to add your domain in project settings

### Railway Free Tier

Railway's free tier includes:
- $5 credit per month (more than enough for a static site)
- Automatic HTTPS
- Custom domain support
- Global CDN

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


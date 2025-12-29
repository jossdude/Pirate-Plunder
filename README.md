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

   **Important:** If your files are in a subdirectory (like `Pirate-Plunder/`):
   - Go to your service → **Settings** tab
   - Look for **"Root Directory"** or **"Working Directory"**
   - Set it to your subdirectory name (e.g., `Pirate-Plunder`)
   - Or move all files to the repository root before deploying

3. **Configure custom domain (optional):**
   - See detailed instructions in the "Custom Domain Setup" section below

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
   - See detailed instructions in the "Custom Domain Setup" section below

### Custom Domain Setup

To connect your custom domain to Railway:

1. **In Railway Dashboard:**
   - Go to your project on [railway.app](https://railway.app)
   - Click on your service/deployment
   - Go to the **Settings** tab
   - Scroll down to the **Domains** section
   - Click **"Add Custom Domain"** or **"Generate Domain"**
   - Enter your domain (e.g., `example.com` or `www.example.com`)
   - Railway will show you the DNS records you need to configure

2. **Configure DNS Records:**
   
   Railway will provide you with a **CNAME record** or **A record** to add:
   
   **For a subdomain (e.g., www.example.com):**
   - Type: `CNAME`
   - Name: `www` (or your subdomain)
   - Value: Railway will provide this (looks like `xxxxx.railway.app`)
   - TTL: `3600` (or default)
   
   **For the root domain (e.g., example.com):**
   - Railway may provide an A record with an IP address
   - Or you may need to use a CNAME flattening service
   - Some registrars support CNAME at root (ALIAS/ANAME records)
   
3. **Add DNS Records:**
   - Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Go to DNS Management / DNS Settings
   - Add the CNAME or A record Railway provided
   - Save the changes

4. **Wait for Propagation:**
   - DNS changes can take 5 minutes to 48 hours to propagate
   - Usually takes 15-30 minutes
   - Railway will automatically provision SSL/HTTPS once DNS is configured

5. **Verify:**
   - Check Railway dashboard - it will show "Valid" when DNS is configured correctly
   - Visit your domain in a browser to confirm it's working

**Note:** If you want both `example.com` and `www.example.com`:
- Add both domains in Railway
- Configure DNS for both (CNAME for www, A record or CNAME for root)

### Domain Forwarding (Alternative - No Railway Custom Domain Needed)

If you've reached Railway's custom domain limit, you can use **domain forwarding/redirect** from your domain registrar instead. This forwards your domain to Railway's default URL without using Railway's custom domain feature.

**Steps:**

1. **Get your Railway URL:**
   - In Railway dashboard, go to your service
   - Copy the default Railway URL (e.g., `your-project.railway.app`)

2. **Set up forwarding at your registrar:**

   **GoDaddy:**
   - Go to your domain → DNS Management
   - Scroll to "Forwarding" section
   - Click "Add" → "Domain"
   - Enter your domain
   - Forward to: `https://your-project.railway.app`
   - Forward type: "Permanent (301)" or "Temporary (302)"
   - Check "Forward only" (hides the Railway URL)
   - Save

   **Namecheap:**
   - Go to Domain List → Manage → Advanced DNS
   - Find "URL Redirect Record"
   - Host: `@` (for root) or `www` (for www subdomain)
   - Value: `https://your-project.railway.app`
   - Record type: "Unmasked" (shows Railway URL) or "Masked" (hides it)
   - Save

   **Cloudflare:**
   - Go to DNS → Records
   - Add a "Page Rule" or use "Workers" for forwarding
   - Or use "Redirect Rules" (available in some plans)
   - Forward `yourdomain.com/*` to `https://your-project.railway.app/$1`

   **Google Domains:**
   - Go to DNS → Synthetic records
   - Create "Subdomain forward"
   - Subdomain: `@` (root) or `www`
   - Destination URL: `https://your-project.railway.app`
   - Forward type: "Permanent redirect (301)"

   **Other Registrars:**
   - Look for "Domain Forwarding", "URL Redirect", or "Web Forwarding"
   - Set source: your domain
   - Set destination: `https://your-project.railway.app`
   - Choose redirect type: 301 (permanent) recommended

3. **Wait for propagation:**
   - Usually takes 15-60 minutes
   - Visit your domain to verify it forwards correctly

**Pros:**
- ✅ Works even if Railway custom domain limit is reached
- ✅ No DNS record configuration needed
- ✅ Easy to set up at registrar level

**Cons:**
- ⚠️ URL may show Railway domain in address bar (depending on forwarding type)
- ⚠️ Some registrars charge for forwarding features
- ⚠️ Masked forwarding may affect SEO
- ⚠️ SSL certificate will be from Railway, not your domain

**Tip:** Use "Permanent (301)" redirect type for better SEO, and "Unmasked" forwarding so users see the Railway URL (which is fine for most use cases).

### Troubleshooting Railway Deployment

If you see "Application failed to respond" errors:

1. **Check Root Directory:**
   - Go to your service → **Settings** tab
   - Look for **"Root Directory"** field
   - If your files are in a subdirectory, set it here (e.g., `Pirate-Plunder`)
   - If files are at repo root, leave it blank or set to `.`

2. **Check Environment Variables:**
   - Go to **Settings** → **Variables**
   - Make sure there's no conflicting `PORT` or `RAILWAY_START_COMMAND`
   - For static sites, Railway should handle this automatically

3. **Check Build/Deploy Logs:**
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Check for errors in the build logs
   - Look for messages about missing files

4. **Verify Files are Deployed:**
   - In deployment logs, check that `index.html` is found
   - Ensure all files (`index.html`, `styles.css`, `script.js`) are in the repo

5. **If Using Static Site Service:**
   - Railway's Caddy service should auto-detect `index.html`
   - No build command needed
   - Files should be at the root or in the configured root directory

6. **Re-deploy:**
   - After making changes, Railway should auto-redeploy
   - Or manually trigger: **Settings** → **Redeploy**

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


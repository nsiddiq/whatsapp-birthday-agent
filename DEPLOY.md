# Deploy Birthday Agent to the Cloud (Free)

## Option A: Render.com (Easiest, Free Tier)

### Steps:

1. **Push your code to GitHub**
   ```bash
   cd whatsapp-birthday-agent
   git init
   git add .
   git commit -m "Birthday Agent"
   ```
   Create a repo on GitHub and push to it.

2. **Sign up at [render.com](https://render.com)** (free, no credit card)

3. **Create a new Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Build Command:** `npm install && npm run --workspace=frontend build && cp -r frontend/dist backend/public`
     - **Start Command:** `node backend/server.js`
     - **Plan:** Free
   - Add a **Disk** (under "Advanced"):
     - Mount Path: `/app/backend/auth_session`
     - Size: 1 GB

4. **Deploy** — it builds and gives you a URL like `https://birthday-agent-xxxx.onrender.com`

5. **Open that URL on your phone** → Setup tab → Generate QR → Scan with WhatsApp

6. **Add to Home Screen** on your phone for app-like access

> ⚠️ Render free tier spins down after 15 min of inactivity. The agent will reconnect when it wakes up, but you'll miss messages during downtime. For 24/7 uptime, use Option B.

---

## Option B: Railway.app (Free $5 credit/month)

1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repo
4. Set:
   - **Build:** `npm install && npm run --workspace=frontend build && cp -r frontend/dist backend/public`
   - **Start:** `node backend/server.js`
5. Add a **Volume** mounted at `/app/backend/auth_session`
6. Deploy — get your URL

Railway doesn't spin down, so the agent runs 24/7 within the free credit.

---

## Option C: Fly.io (Free tier, always-on)

1. Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/
2. Run:
   ```bash
   cd whatsapp-birthday-agent
   fly launch
   fly volumes create agent_data --size 1
   fly deploy
   ```
3. Your app runs at `https://your-app.fly.dev`

---

## Option D: Oracle Cloud (Free forever, full VM)

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (free tier, needs credit card for verification only)
2. Create an "Always Free" ARM instance (4 CPU, 24GB RAM — seriously free)
3. SSH in and:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt install -y nodejs git
   git clone <your-repo-url>
   cd whatsapp-birthday-agent
   npm install
   npm run --workspace=frontend build
   cp -r frontend/dist backend/public
   
   # Install pm2 for process management
   sudo npm install -g pm2
   pm2 start backend/server.js --name birthday-agent
   pm2 save
   pm2 startup
   ```
4. Open port 3001 in the Oracle Cloud security list
5. Access at `http://<your-vm-ip>:3001`

This is truly free forever and runs 24/7 with no spin-down.

---

## After Deployment

Once deployed, you only need your phone:
- Open the URL in your phone browser
- Scan the QR code once
- Add to Home Screen
- Done — the agent runs in the cloud, your phone just views the dashboard

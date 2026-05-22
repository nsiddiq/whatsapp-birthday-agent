# 🎂 WhatsApp Birthday Agent

An event-driven WhatsApp Birthday Agent that automatically detects incoming birthday messages and replies with personalized greetings — powered by a mobile-first management dashboard.

## Architecture

```
whatsapp-birthday-agent/
├── backend/          # Node.js + Express + Baileys WhatsApp client
│   ├── server.js             # Express API + WhatsApp socket connection
│   ├── database.js           # SQLite schema, seeds, and queries
│   ├── birthday-listener.js  # Message interception + auto-reply logic
│   └── auth_session/         # WhatsApp session credentials (gitignored)
├── frontend/         # React + Vite + Tailwind mobile dashboard
│   └── src/
│       ├── pages/TheBrain.jsx       # View 1: Today's activity log
│       ├── pages/Roster.jsx         # View 2: Contact birthday roster
│       └── pages/TemplateBuilder.jsx # View 3: Greeting template editor
└── package.json      # Monorepo workspace config
```

## How It Works

1. **Backend** connects to your personal WhatsApp via QR code scan (headless, using Baileys).
2. The `messages.upsert` event listener scans ALL incoming messages in real-time.
3. If a message contains birthday keywords ("happy birthday", "hbd", "hbday"), the agent:
   - Captures the sender's JID and creates/updates their contact record
   - Saves today's date (MM-DD) as their birthday
   - Sends an automated greeting using the assigned template
   - Appends the AI disclosure signature
   - Logs the wish and marks the contact to prevent duplicate wishes this year

## Setup

### Prerequisites
- Node.js 18+
- A WhatsApp account on your phone

### Installation

```bash
cd whatsapp-birthday-agent
npm install
```

### Running

```bash
# Start both backend and frontend
npm run dev

# Or individually:
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:5173
```

### First Launch

1. Start the backend — a QR code will appear in the terminal.
2. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device.
3. Scan the QR code. The agent is now listening.
4. Open `http://localhost:5173` on your phone browser and "Add to Home Screen" for the app experience.

## Guardrails

- The agent will **never** wish the same person twice in the same calendar year.
- Every automated message includes the AI disclosure: `🤖 [This is Nasir's AI Agent Assistant]`
- Session credentials are stored locally in `backend/auth_session/` (gitignored).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | WhatsApp connection status |
| GET | `/api/contacts` | List all learned contacts |
| PUT | `/api/contacts/:id` | Update contact info/template |
| DELETE | `/api/contacts/:id` | Remove a contact |
| GET | `/api/templates` | List all greeting templates |
| POST | `/api/templates` | Create a new template |
| PUT | `/api/templates/:id` | Update a template |
| DELETE | `/api/templates/:id` | Delete a template |
| GET | `/api/wishes/today` | Today's automated wish log |

# CID Game

A multiplayer browser game built with Next.js and Cloudflare Workers using WebSockets and Durable Objects.

<img src="/assets/preview.jpeg" alt="Preview" style="height:100px;">


## Folders

- **`web/`** – Frontend (Next.js app)
- **`ws/`** – Backend (Cloudflare Worker using Durable Objects)

---

## Setup

### 1. `web/` – Next.js Frontend

```bash
cd web
pnpm install
````

Create a `.env` file and set the WebSocket URL:

```
NEXT_PUBLIC_WS_URL=wss://your-cloudflare-worker-url
```

Run in development:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm start
```

---

### 2. `ws/` – Cloudflare Worker

```bash
cd ws
pnpm install
```

Run locally for development:

```bash
pnpm dev
```

Deploy to Cloudflare:

```bash
pnpm run deploy
```

---

## Game Description

* The game is themed around **CID (Crime Investigation Department)**.
* Players are randomly assigned one of the following roles:

  * **CID** (main detective)
  * **Killer**
  * Other players are regular participants.


* The first player to join becomes the admin and gets access to the "Start Game" button.
* When the game is started, roles are shuffled and assigned.

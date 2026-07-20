# Agentic OS Starter Kit

A minimal, **runnable** agent + dashboard you can stand up in 60 seconds.
Built by Luke Kapapa (KAPAPA.AI) — the same architecture behind the custom
agents I build for clients, shrunk to a starter you can learn from and ship on.

## Run it

```bash
python3 server.py
```

Open http://localhost:8000 — you get a live chat dashboard wired to a local
agent endpoint (`/chat`).

## What's inside

- `server.py` — stdlib-only HTTP server (no pip installs). Serves the
  dashboard and a `/chat` API.
- `dashboard.html` — one-file chat UI (vanilla JS, no framework).
- `respond()` in `server.py` — the **agent-brain placeholder**. Right now it
  echoes; swap it for a real LLM call and the dashboard works unchanged.

## Make it smart

Replace `respond()` with a call to your model. Keep the `/chat` contract
(`{"message": ...}` → `{"reply": ...}`) and the UI keeps working:

- Hermes / Nous free tier (`tencent/hy3:free`)
- OpenAI / Anthropic
- a local model via llama.cpp

## License

Yours to build on. Go make something.

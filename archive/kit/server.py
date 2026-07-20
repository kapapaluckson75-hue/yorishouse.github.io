#!/usr/bin/env python3
"""Agentic OS Starter Kit — minimal runnable agent + dashboard server.

Stdlib-only so it runs with NO pip installs. This is a TEMPLATE: the
respond() function is a placeholder brain. Swap it for a real LLM call
(Hermes / Nous free tier, OpenAI, llama.cpp, ...) when you're ready.

Run:  python3 server.py
Open: http://localhost:8000
"""
import http.server
import json
import os
import socketserver

PORT = 8000
HERE = os.path.dirname(os.path.abspath(__file__))


def respond(message: str) -> str:
    """Placeholder agent brain. Replace with a real model call.

    Today it just echoes and proves the wiring is live. A buyer swaps this
    for an LLM call while keeping the /chat contract below unchanged.
    """
    msg = (message or "").strip()
    if not msg:
        return "Say something and I'll echo it back — this is where your agent's brain goes."
    return f"[agent received] {msg}  — wire me to an LLM to make me smart."


class Handler(http.server.BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        data = body.encode() if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ("/", "/index.html", "/dashboard.html"):
            with open(os.path.join(HERE, "dashboard.html"), "rb") as f:
                self._send(200, f.read(), "text/html")
        else:
            self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        if self.path == "/chat":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(raw or b"{}")
            except Exception:
                payload = {}
            reply = respond(payload.get("message", ""))
            self._send(200, json.dumps({"reply": reply}))
        else:
            self._send(404, json.dumps({"error": "not found"}))

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Agentic OS Starter Kit running at http://localhost:{PORT}")
        httpd.serve_forever()

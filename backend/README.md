# Smart City Services — backend

Flask API backing the AI chat and waste-classification screens (the rest of
the app talks to Firebase directly).

## Run locally

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # optionally add GEMINI_API_KEY
python app.py                 # http://localhost:5000
```

## Deploying so a real device can reach it

The Android emulator can reach your laptop at `10.0.2.2`, but a real phone
(or a release build) needs a public URL. Any of these work with zero code
changes — just deploy `backend/` and update `API_BASE_URL` in
`frontend/www/js/config.js`:

- **Render** — new Web Service, root directory `backend`, start command
  `gunicorn app:app`.
- **Railway** — new project from repo, root `backend`, same start command.
- **Google Cloud Run** — containerize with a one-line Dockerfile
  (`FROM python:3.12-slim`, copy, `pip install -r requirements.txt`, `CMD
  ["gunicorn","-b","0.0.0.0:8080","app:app"]`).

## Endpoints

| Method | Path                  | Purpose                              |
|--------|-----------------------|---------------------------------------|
| GET    | `/api/health`          | liveness check                        |
| GET    | `/api/weather?lat=&lon=` | current weather (Open-Meteo, free)  |
| POST   | `/api/chat`            | `{ message }` → `{ reply }`           |
| POST   | `/api/waste-classify`  | `{ image: dataURL }` → `{ category, confidence }` |

## Honest limitations to fix before production

- **Waste classification is a color heuristic, not a trained model.** It
  demonstrates the full upload → classify → recycling-tip flow, but treat
  the category it returns as illustrative, not accurate. Swap
  `_classify_heuristic` in `app.py` for a real model — either a small
  on-device TFLite model called from Kotlin/ML Kit (fastest, no network
  round-trip) or a server-side model loaded here with `onnxruntime` /
  `tflite-runtime`.
- **Chat is rule-based** for the topics the app promises, with Gemini as an
  optional fallback for anything else. It will not know live bus positions
  or real outage schedules unless you connect it to your actual transit/
  utility data sources — right now those answers are illustrative text.
- **No auth on these endpoints.** Anyone with the URL can call them. Add a
  check on Firebase ID tokens (`firebase-admin` Python SDK) before
  deploying somewhere public.

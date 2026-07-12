"""
Smart City Services — backend API (Flask)

Endpoints:
  GET  /api/health           liveness check
  GET  /api/weather          weather proxy (Open-Meteo, no key needed)
  POST /api/chat             natural-language city assistant
  POST /api/waste-classify   classifies an uploaded waste photo

Run locally:
  pip install -r requirements.txt
  cp .env.example .env        # then fill in whatever keys you have
  python app.py                # serves on http://localhost:5000

The frontend's js/config.js API_BASE_URL must point here. From the Android
emulator, "http://10.0.2.2:5000" reaches your host machine's localhost.
From a real device or production, deploy this (Render/Railway/Fly/Cloud Run)
and point API_BASE_URL at that public URL instead.
"""
import base64
import io
import json
import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Firebase Admin SDK (optional): used to verify ID tokens and access Firestore
try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth, firestore
except Exception:
    firebase_admin = None
    fb_auth = None
    firestore = None

app = Flask(__name__)
CORS(app)  # WebView / Capacitor origins vary, so keep this open for the demo

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
FIREBASE_SERVICE_ACCOUNT = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
FIREBASE_CREDENTIALS_JSON = os.environ.get("FIREBASE_CREDENTIALS_JSON", "")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")


def init_firebase_admin():
    """Initialize firebase_admin if available and not already initialized.

    Provide either `FIREBASE_SERVICE_ACCOUNT` (path to a service account JSON)
    or `FIREBASE_CREDENTIALS_JSON` (raw JSON string) in environment.
    """
    if firebase_admin is None:
        return False
    if firebase_admin._apps:
        return True
    try:
        if FIREBASE_SERVICE_ACCOUNT:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
        elif FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        else:
            cred = credentials.ApplicationDefault()

        options = {}
        if FIREBASE_PROJECT_ID:
            options["projectId"] = FIREBASE_PROJECT_ID
        firebase_admin.initialize_app(cred, options)
        return True
    except Exception:
        try:
            options = {}
            if FIREBASE_PROJECT_ID:
                options["projectId"] = FIREBASE_PROJECT_ID
            firebase_admin.initialize_app(options=options)
            return True
        except Exception:
            return False


def get_firestore_client():
    if not init_firebase_admin():
        raise RuntimeError("firebase-admin-not-initialized")
    if firestore is None:
        raise RuntimeError("firebase-firestore-unavailable")
    return firestore.client()


def _serialize_firestore_value(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _serialize_firestore_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_firestore_value(item) for item in value]
    return value


def verify_id_token_from_request(req):
    """Extract Bearer token from Authorization header or `idToken` in JSON body and verify it.
    Returns decoded token on success, or raises an Exception."""
    token = None
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        body = req.get_json(silent=True) or {}
        token = body.get("idToken")
    if not token:
        raise Exception("no-auth-token")
    if not init_firebase_admin():
        raise Exception("firebase-admin-not-initialized")
    decoded = fb_auth.verify_id_token(token)
    return decoded


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------
@app.get("/api/health")
def health():
    firebase_ready = init_firebase_admin()
    return jsonify({
        "status": "ok",
        "firebase": {
            "ready": firebase_ready,
            "configured": bool(FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS_JSON or FIREBASE_PROJECT_ID),
            "project_id": FIREBASE_PROJECT_ID or None,
        }
    })


@app.post("/api/verify-token")
def verify_token():
    """Simple helper endpoint to verify a Firebase ID token.

    Send Authorization: Bearer <idToken> header or JSON { idToken: '...' }.
    Returns decoded token (uid, email, etc.) on success.
    """
    try:
        decoded = verify_id_token_from_request(request)
        return jsonify({"ok": True, "token": decoded})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 401


@app.get("/api/firebase-status")
def firebase_status():
    try:
        db = get_firestore_client()
        doc = db.collection("users").limit(1).get()
        return jsonify({
            "ok": True,
            "ready": True,
            "project_id": FIREBASE_PROJECT_ID or None,
            "count": len(doc),
        })
    except Exception as e:
        return jsonify({
            "ok": False,
            "ready": False,
            "configured": bool(FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS_JSON or FIREBASE_PROJECT_ID),
            "project_id": FIREBASE_PROJECT_ID or None,
            "error": str(e),
        }), 503


@app.get("/api/firebase/<collection_name>")
def firebase_collection(collection_name: str):
    try:
        db = get_firestore_client()
        docs = db.collection(collection_name).limit(10).stream()
        items = []
        for doc in docs:
            payload = doc.to_dict() or {}
            items.append({"id": doc.id, **_serialize_firestore_value(payload)})
        return jsonify({"ok": True, "collection": collection_name, "items": items})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 503


# --------------------------------------------------------------------------
# Weather — proxies Open-Meteo (free, no API key) so the frontend never
# needs a weather key of its own. Swap this for a paid provider if you want
# richer data; keep the same {temp, description, icon} response shape.
# --------------------------------------------------------------------------
@app.get("/api/weather")
def weather():
    import urllib.request
    import json as _json

    lat = request.args.get("lat", "12.9716")   # default: sample city center
    lon = request.args.get("lon", "77.5946")

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&current=temperature_2m,weather_code"
        )
        with urllib.request.urlopen(url, timeout=6) as resp:
            data = _json.loads(resp.read())
        current = data.get("current", {})
        code = current.get("weather_code", 0)
        return jsonify({
            "temp": current.get("temperature_2m", 28),
            "description": _weather_code_to_text(code),
            "icon": _weather_code_to_icon(code),
        })
    except Exception:
        # Never break the dashboard just because the upstream API hiccuped.
        return jsonify({"temp": 28, "description": "Weather unavailable", "icon": "cloud-off"})


def _weather_code_to_text(code):
    if code == 0: return "Clear sky"
    if code in (1, 2, 3): return "Partly cloudy"
    if code in (45, 48): return "Foggy"
    if 51 <= code <= 67: return "Rainy"
    if 71 <= code <= 86: return "Snow"
    if code >= 95: return "Thunderstorms"
    return "Overcast"


def _weather_code_to_icon(code):
    if code == 0: return "sun"
    if code in (1, 2, 3): return "cloud-sun"
    if code in (45, 48): return "cloud-fog"
    if 51 <= code <= 67: return "cloud-rain"
    if 71 <= code <= 86: return "cloud-snow"
    if code >= 95: return "cloud-lightning"
    return "cloud"


# --------------------------------------------------------------------------
# Chat — rule-based intent matching covering the topics the app promises.
# If GEMINI_API_KEY is set, unmatched questions get routed to Gemini for a
# free-form answer; without a key, unmatched questions get an honest
# fallback instead of a hallucinated one.
# --------------------------------------------------------------------------
INTENTS = [
    (r"hospital|clinic|doctor", "The Nearby screen lists hospitals and clinics around you with distance and directions — tap the Hospitals tile on Home, or ask me for a specific area."),
    (r"bus|route \d+", "Check the Transport screen for live bus routes and ETAs. Route 12 is currently 4 minutes out from Market Square, for example."),
    (r"traffic|congestion|accident|road closed|closure", "The Traffic screen shows live congestion by road segment and flags accidents or closures, with an alternative-route button where relevant."),
    (r"garbage|waste.*(schedule|collection|pickup)|trash", "Waste collection typically runs Monday, Wednesday and Friday mornings for household waste — check the City News screen for your ward's exact schedule, and use the Waste Classifier to sort an item correctly."),
    (r"water supply|water timing|water schedule", "Water supply timings vary by ward — check City News for maintenance notices, or file a Water Supply complaint from Home if you're facing an outage."),
    (r"electricity|power cut|outage|complaint", "You can file an electricity complaint from the Report screen — pick the Electricity category, add your meter/location, and track status under Complaints."),
    (r"scheme|government scheme|subsidy|welfare", "Government schemes are posted under City News as they're announced. Tell me a category (housing, health, education) and I can point you to what's typically available."),
    (r"tourist|attraction|visit|sightseeing", "Popular spots nearby usually include the city parks, riverside promenade, and the old town district — check the Nearby screen and filter by points of interest."),
    (r"emergency|police|ambulance|fire|sos|help", "For any emergency, open the Emergency screen and tap SOS for one-tap calling plus live location sharing, or dial the specific service directly."),
]


@app.post("/api/chat")
def chat():
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"reply": "Ask me something about hospitals, transport, traffic, waste, water, electricity, schemes, tourism, or emergencies."})

    lower = message.lower()
    for pattern, reply in INTENTS:
        if re.search(pattern, lower):
            return jsonify({"reply": reply})

    if GEMINI_API_KEY:
        reply = _ask_gemini(message)
        if reply:
            return jsonify({"reply": reply})

    return jsonify({"reply": "I don't have a specific answer for that yet — try asking about hospitals, bus/metro timings, traffic, waste collection, water supply, electricity complaints, government schemes, tourist spots, or emergency services."})


def _ask_gemini(message: str):
    """Optional: only runs if GEMINI_API_KEY is set. Uses the REST endpoint
    directly so this file has no extra SDK dependency beyond `requests`."""
    import requests

    try:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        )
        payload = {
            "contents": [{
                "parts": [{
                    "text": (
                        "You are a helpful city-services assistant for a citizen app called "
                        "Smart City Services. Answer briefly (2-3 sentences), and if the "
                        "question needs live data you don't have (exact bus arrival, exact "
                        "outage time), say so honestly instead of inventing numbers.\n\n"
                        f"Citizen's question: {message}"
                    )
                }]
            }]
        }
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


# --------------------------------------------------------------------------
# Waste classification
#
# This ships a lightweight, dependency-free heuristic (dominant color +
# simple texture proxy) so the endpoint works out of the box — it is NOT a
# trained model and should not be presented as production-accurate. Swap
# `_classify_heuristic` for a real model (see backend/README.md) before
# relying on this for anything more than a demo:
#   - Easiest real path: run Google's ML Kit Image Labeling on-device in the
#     Android WebView via a Capacitor plugin, skip the network round-trip.
#   - Server-side path: load a small TFLite/ONNX waste-classification model
#     here with onnxruntime or tflite-runtime and replace this function's
#     body — the request/response contract below won't need to change.
# --------------------------------------------------------------------------
CATEGORIES = ["Plastic", "Metal", "Paper", "Organic Waste", "Glass", "Electronic Waste"]


@app.post("/api/waste-classify")
def waste_classify():
    body = request.get_json(silent=True) or {}
    image_data_url = body.get("image", "")
    if not image_data_url or "," not in image_data_url:
        return jsonify({"error": "no image provided"}), 400

    try:
        from PIL import Image

        header, b64data = image_data_url.split(",", 1)
        img_bytes = base64.b64decode(b64data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        category, confidence = _classify_heuristic(img)
        return jsonify({"category": category, "confidence": confidence})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _classify_heuristic(img):
    """Dominant-color heuristic — a stand-in for a real model. Good enough
    to demo the end-to-end flow; replace before treating results as real
    classification. See module docstring above."""
    small = img.resize((40, 40))
    pixels = list(small.getdata())
    r = sum(p[0] for p in pixels) / len(pixels)
    g = sum(p[1] for p in pixels) / len(pixels)
    b = sum(p[2] for p in pixels) / len(pixels)
    brightness = (r + g + b) / 3

    # Rough, explicitly-approximate rules — not a trained classifier.
    if brightness > 200 and abs(r - g) < 15 and abs(g - b) < 15:
        category = "Paper"
    elif b > r + 20 and b > g + 10:
        category = "Glass"
    elif brightness < 90:
        category = "Electronic Waste"
    elif g > r + 15 and g > b + 15:
        category = "Organic Waste"
    elif r > g + 20 and r > b + 20:
        category = "Plastic"
    else:
        category = "Metal"

    confidence = 0.55 + min(0.3, abs(brightness - 128) / 256)
    return category, round(confidence, 2)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)

# mechanic translator - manan puri
# flask backend, talks to ollama for ai analysis

import requests
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"

# tells the ai how to behave
SYSTEM_PROMPT = """You are an expert automotive mechanic and used car market analyst with 20+ years of experience.
You help everyday people understand if they are being charged fairly for car repairs or if a used car listing is priced honestly.
Be the 'friend who knows cars' — brutally honest, specific, and helpful. No fluff.
Always use these section headers with emojis:
📋 LINE ITEM BREAKDOWN — explain each charge in plain English, give realistic price ranges, label each as FAIR / HIGH / SUSPICIOUS
💰 OVERALL VERDICT — is the total fair, high, or a ripoff?
🚩 RED FLAGS — anything suspicious or unnecessary
✅ WHAT LOOKS LEGITIMATE — charges that are reasonable
🤝 NEGOTIATION TIPS — exactly what to say to get a better price"""


def ask_ollama(prompt: str) -> str:
    # send prompt to local llama model
    try:
        response = requests.post(OLLAMA_URL, json={
            "model":  OLLAMA_MODEL,
            "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
            "stream": False,
        }, timeout=120)
        response.raise_for_status()
        return response.json().get("response", "no response from model.")
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "can't connect to ollama. make sure it's running.\n"
            "open a terminal and run: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise RuntimeError("ollama took too long. try a shorter input.")
    except Exception as e:
        raise RuntimeError(f"ollama error: {str(e)}")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health")
def health():
    # check if ollama is alive
    try:
        r = requests.get("http://localhost:11434", timeout=3)
        ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False
    return jsonify({"ok": ollama_ok, "model": OLLAMA_MODEL})


@app.route("/api/analyze-quote", methods=["POST"])
def analyze_quote():
    data     = request.get_json()
    quote    = (data or {}).get("quote", "").strip()
    car      = (data or {}).get("car", "").strip()
    location = (data or {}).get("location", "").strip()

    if not quote:
        return jsonify({"error": "no quote provided."}), 400

    car_ctx = f" for a {car}" if car else ""
    loc_ctx = f" in {location}" if location else ""

    prompt = f"""analyze this mechanic quote{car_ctx}{loc_ctx}:

---
{quote}
---

use the section headers from your instructions. be specific with dollar ranges."""

    try:
        result = ask_ollama(prompt)
        return jsonify({"result": result})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/api/analyze-car", methods=["POST"])
def analyze_car():
    data  = request.get_json() or {}
    make  = data.get("make", "").strip()
    model = data.get("model", "").strip()
    price = data.get("askingPrice", "").strip()

    if not all([make, model, price]):
        return jsonify({"error": "make, model, and asking price are required."}), 400

    year      = data.get("year", "")
    mileage   = data.get("mileage", "unknown")
    condition = data.get("condition", "good")
    location  = data.get("location", "")
    extra     = data.get("extraInfo", "")

    loc_ctx   = f" in {location}" if location else ""
    extra_ctx = f"\nadditional details: {extra}" if extra else ""

    prompt = f"""evaluate this used car listing{loc_ctx}:

vehicle: {year} {make} {model}
mileage: {mileage} miles
asking price: {price}
condition: {condition}{extra_ctx}

use these sections:
💰 VERDICT — overpriced / fair / good deal (one clear sentence first)
📊 MARKET VALUE — realistic private party and dealer price range
✅ GREEN FLAGS — what looks good
🚩 RED FLAGS — what concerns you
🔍 WHAT TO CHECK — 3-5 things to inspect for this specific car
🤝 NEGOTIATION — exact counter-offer and what to say"""

    try:
        result = ask_ollama(prompt)
        return jsonify({"result": result})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503


if __name__ == "__main__":
    print("\n  mechanic translator is running!")
    print("  open your browser and go to: http://localhost:5000\n")
    app.run(debug=True, port=5000)

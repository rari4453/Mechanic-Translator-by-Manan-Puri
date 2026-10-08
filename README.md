# mechanic translator

an ai powered web app that tells you if your mechanic is overcharging you or if a used car is fairly priced.

built by manan puri

**stack:** python, flask, ollama (llama 3.2), html, css, javascript

---

## what it does

- **repair quote analyzer** — paste any mechanic invoice, get a plain english breakdown of every charge, typical price ranges, red flags, and negotiation tips
- **car deal evaluator** — enter a used car listing, get a verdict on the price, what to look out for, and an exact counter-offer to make

---

## setup (do this once)

**1. install ollama**

go to [ollama.com](https://ollama.com) and download it.

**2. pull the ai model**

```
ollama pull llama3.2
```

takes a few minutes, only need to do this once.

**3. install python packages**

```
pip install flask requests
```

---

## running the app

1. open ollama (make sure it's running in the background)
2. in your terminal, navigate to this folder and run:

```
python app.py
```

3. open your browser and go to:

```
http://localhost:5000
```

---

## project structure

```
mechanic-translator/
├── app.py              ← flask backend, run this
├── requirements.txt    ← python dependencies
├── templates/
│   └── index.html      ← frontend ui
└── static/
    ├── style.css       ← styles
    └── app.js          ← frontend logic
```

---

## how it works

1. `python app.py` starts a local server on port 5000
2. you submit a quote or car listing through the browser
3. flask sends it to ollama running on your machine
4. llama 3.2 analyzes it and returns a structured breakdown
5. nothing ever leaves your computer, completely free to run

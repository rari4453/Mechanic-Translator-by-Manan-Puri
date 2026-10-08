// mechanic translator - manan puri
// handles all frontend logic

'use strict';

// example invoices to test with
const EXAMPLES = [
  `Brake pad replacement (front) - $180\nBrake pad replacement (rear) - $180\nRotor resurfacing - $140\nLabor - $200\nTotal: $700`,
  `Transmission fluid flush - $380\nFilter replacement - $85\nLabor - $120\nTotal: $585`,
  `Oil change (synthetic) - $89\nAir filter - $45\nCabin filter - $55\nTire rotation - $40\nFuel injector cleaning - $180\nThrottle body cleaning - $150\nCoolant flush - $160\nLabor - $200\nTotal: $949`,
];

const $ = id => document.getElementById(id);

// check if ollama is running
async function checkStatus() {
  try {
    const res  = await fetch('/api/health');
    const data = await res.json();
    if (data.ok) {
      $('statusDot').className    = 'status-dot on';
      $('statusLabel').textContent = `${data.model} ready`;
    } else {
      throw new Error();
    }
  } catch {
    $('statusDot').className    = 'status-dot off';
    $('statusLabel').textContent = 'ollama offline';
  }
}

// switch between repair and car buying tabs
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
});

// fill in example quote when pill is clicked
document.querySelectorAll('.pill[data-example]').forEach(pill => {
  pill.addEventListener('click', () => {
    $('quoteText').value = EXAMPLES[+pill.dataset.example];
  });
});

// figure out if result is good deal, fair, or overpay
function classify(text) {
  const t = text.toLowerCase();
  if (/overpay|overpriced|too high|rip.?off|above (market|average)|inflated/.test(t)) return 'overpay';
  if (/good deal|below (market|average)|great deal|underpriced|steal/.test(t))         return 'good';
  if (/fair|reasonable|average|market rate|right in line/.test(t))                     return 'fair';
  return 'unknown';
}

const VERDICT_META = {
  overpay: ['⚠', 'you may be overpaying'],
  fair:    ['✓', 'fair market price'],
  good:    ['★', 'looks like a good deal'],
  unknown: ['?', 'review the details below'],
};

// show loading state
function showLoading(id, msg) {
  $(id).innerHTML = `<div class="result-card"><div class="result-hdr"><span>working</span></div><div class="loading"><div class="spinner"></div>${msg}</div></div>`;
}

// show error state
function showError(id, msg) {
  $(id).innerHTML = `<div class="result-card"><div class="result-hdr"><span>error</span></div><div class="error">⚠ ${msg}</div></div>`;
}

// render the ai result
function showResult(id, header, text) {
  const v             = classify(text);
  const [icon, label] = VERDICT_META[v];
  const safe          = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  $(id).innerHTML = `
    <div class="result-card">
      <div class="result-hdr"><span>${header}</span></div>
      <div class="verdict ${v}"><span class="verdict-icon">${icon}</span>${label}</div>
      <div class="result-body">${safe}</div>
    </div>`;
  $(id).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// analyze repair quote
$('analyzeBtn').addEventListener('click', async () => {
  const quote = $('quoteText').value.trim();
  if (!quote) { $('quoteText').focus(); return; }

  const btn = $('analyzeBtn');
  btn.disabled = true;
  showLoading('repairResult', 'analyzing your quote... this takes about 20-30 seconds');

  try {
    const res  = await fetch('/api/analyze-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote, car: $('carInfo').value.trim(), location: $('repairLoc').value.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showResult('repairResult', 'quote analysis', data.result);
  } catch (err) {
    showError('repairResult', err.message || 'something went wrong. is ollama running?');
  } finally {
    btn.disabled = false;
  }
});

// evaluate car deal
$('carBtn').addEventListener('click', async () => {
  const make  = $('carMake').value.trim();
  const model = $('carModel').value.trim();
  const price = $('askPrice').value.trim();

  if (!make || !model || !price) {
    alert('fill in at least make, model, and asking price.');
    return;
  }

  const btn = $('carBtn');
  btn.disabled = true;
  showLoading('carResult', 'evaluating the deal... this takes about 20-30 seconds');

  try {
    const res  = await fetch('/api/analyze-car', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: $('carYear').value.trim(), make, model,
        mileage: $('carMiles').value.trim(), askingPrice: price,
        condition: $('carCond').value, location: $('buyLoc').value.trim(),
        extraInfo: $('extraInfo').value.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showResult('carResult', 'deal analysis', data.result);
  } catch (err) {
    showError('carResult', err.message || 'something went wrong. is ollama running?');
  } finally {
    btn.disabled = false;
  }
});

// ctrl/cmd+enter to submit
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    const btn = document.querySelector('.panel.active .btn');
    if (btn && !btn.disabled) btn.click();
  }
});

// check status on load and every 15 seconds
checkStatus();
setInterval(checkStatus, 15000);

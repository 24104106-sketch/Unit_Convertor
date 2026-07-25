/* =========================================================
   Smart Unit Converter - script.js
   Handles: conversions, live updates, history, theme,
   copy-to-clipboard, validation, reset.
   ========================================================= */

'use strict';

/* ---------------------------------------------------------
   1. DATA: Categories, Units & Conversion Factors
   Each linear category converts through a "base unit".
   Temperature is handled separately (non-linear offsets).
   --------------------------------------------------------- */
const CATEGORIES = {
  length: {
    label: 'Length',
    base: 'm',
    units: {
      km: { label: 'Kilometer (km)', factor: 1000 },
      mile: { label: 'Mile (mi)', factor: 1609.344 },
      m: { label: 'Meter (m)', factor: 1 },
      ft: { label: 'Foot (ft)', factor: 0.3048 },
      cm: { label: 'Centimeter (cm)', factor: 0.01 },
      in: { label: 'Inch (in)', factor: 0.0254 }
    }
  },
  weight: {
    label: 'Weight',
    base: 'g',
    units: {
      kg: { label: 'Kilogram (kg)', factor: 1000 },
      lb: { label: 'Pound (lb)', factor: 453.59237 },
      g: { label: 'Gram (g)', factor: 1 },
      oz: { label: 'Ounce (oz)', factor: 28.349523125 }
    }
  },
  temperature: {
    label: 'Temperature',
    units: {
      c: { label: 'Celsius (°C)' },
      f: { label: 'Fahrenheit (°F)' },
      k: { label: 'Kelvin (K)' }
    }
  },
  time: {
    label: 'Time',
    base: 's',
    units: {
      s: { label: 'Second (s)', factor: 1 },
      min: { label: 'Minute (min)', factor: 60 },
      hr: { label: 'Hour (hr)', factor: 3600 }
    }
  },
  speed: {
    label: 'Speed',
    base: 'ms',
    units: {
      kmh: { label: 'Km/h', factor: 1 / 3.6 },
      ms: { label: 'm/s', factor: 1 }
    }
  },
  area: {
    label: 'Area',
    base: 'sqm',
    units: {
      sqm: { label: 'Square Meter (m²)', factor: 1 },
      sqft: { label: 'Square Foot (ft²)', factor: 0.09290304 }
    }
  },
  volume: {
    label: 'Volume',
    base: 'ml',
    units: {
      l: { label: 'Liter (L)', factor: 1000 },
      ml: { label: 'Milliliter (mL)', factor: 1 }
    }
  }
};

// Friendly short names used inside formula text
const SHORT_NAME = {
  km: 'Kilometers', mile: 'Miles', m: 'Meters', ft: 'Feet', cm: 'Centimeters', in: 'Inches',
  kg: 'Kilograms', lb: 'Pounds', g: 'Grams', oz: 'Ounces',
  c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin',
  s: 'Seconds', min: 'Minutes', hr: 'Hours',
  kmh: 'Km/h', ms: 'm/s',
  sqm: 'Square Meters', sqft: 'Square Feet',
  l: 'Liters', ml: 'Milliliters'
};

// Explicit temperature formulas (non-linear, shown to user)
const TEMP_FORMULAS = {
  'c-f': 'Fahrenheit = Celsius × 9/5 + 32',
  'f-c': 'Celsius = (Fahrenheit − 32) × 5/9',
  'c-k': 'Kelvin = Celsius + 273.15',
  'k-c': 'Celsius = Kelvin − 273.15',
  'f-k': 'Kelvin = (Fahrenheit − 32) × 5/9 + 273.15',
  'k-f': 'Fahrenheit = (Kelvin − 273.15) × 9/5 + 32',
  'c-c': 'Celsius = Celsius',
  'f-f': 'Fahrenheit = Fahrenheit',
  'k-k': 'Kelvin = Kelvin'
};

const HISTORY_KEY = 'suc_history';
const THEME_KEY = 'suc_theme';
const MAX_HISTORY = 10;

/* ---------------------------------------------------------
   2. STATE
   --------------------------------------------------------- */
let currentCategory = 'length';

/* ---------------------------------------------------------
   3. DOM REFERENCES
   --------------------------------------------------------- */
const tabsContainer = document.getElementById('categoryTabs');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const inputValue = document.getElementById('inputValue');
const errorMsg = document.getElementById('errorMsg');
const resultValue = document.getElementById('resultValue');
const formulaText = document.getElementById('formulaText');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');

/* ---------------------------------------------------------
   4. INITIALISATION
   --------------------------------------------------------- */
function init() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  populateUnitDropdowns(currentCategory);
  renderHistory();
  applySavedTheme();

  // Event listeners
  tabsContainer.addEventListener('click', onTabClick);
  inputValue.addEventListener('input', handleLiveConversion);
  fromUnitSelect.addEventListener('change', handleLiveConversion);
  toUnitSelect.addEventListener('change', handleLiveConversion);
  swapBtn.addEventListener('click', swapUnits);
  copyBtn.addEventListener('click', copyResult);
  resetBtn.addEventListener('click', resetForm);
  clearHistoryBtn.addEventListener('click', clearHistory);
  themeToggle.addEventListener('click', toggleTheme);
}

/* ---------------------------------------------------------
   5. CATEGORY TABS
   --------------------------------------------------------- */
function onTabClick(e) {
  const btn = e.target.closest('.tab');
  if (!btn) return;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  currentCategory = btn.dataset.category;
  populateUnitDropdowns(currentCategory);
  clearResult();
}

/* ---------------------------------------------------------
   6. POPULATE DROPDOWNS FOR SELECTED CATEGORY
   --------------------------------------------------------- */
function populateUnitDropdowns(categoryKey) {
  const units = CATEGORIES[categoryKey].units;
  const keys = Object.keys(units);

  fromUnitSelect.innerHTML = '';
  toUnitSelect.innerHTML = '';

  keys.forEach((key, index) => {
    const optionFrom = document.createElement('option');
    optionFrom.value = key;
    optionFrom.textContent = units[key].label;
    fromUnitSelect.appendChild(optionFrom);

    const optionTo = document.createElement('option');
    optionTo.value = key;
    optionTo.textContent = units[key].label;
    toUnitSelect.appendChild(optionTo);
  });

  // Default selection: first two different units
  fromUnitSelect.selectedIndex = 0;
  toUnitSelect.selectedIndex = keys.length > 1 ? 1 : 0;
}

/* ---------------------------------------------------------
   7. CORE CONVERSION LOGIC
   --------------------------------------------------------- */
function convertValue(categoryKey, fromKey, toKey, value) {
  if (categoryKey === 'temperature') {
    return convertTemperature(fromKey, toKey, value);
  }
  const units = CATEGORIES[categoryKey].units;
  const baseValue = value * units[fromKey].factor;
  return baseValue / units[toKey].factor;
}

function convertTemperature(fromKey, toKey, value) {
  // Step 1: convert input to Celsius
  let celsius;
  switch (fromKey) {
    case 'c': celsius = value; break;
    case 'f': celsius = (value - 32) * 5 / 9; break;
    case 'k': celsius = value - 273.15; break;
  }
  // Step 2: convert Celsius to target
  switch (toKey) {
    case 'c': return celsius;
    case 'f': return celsius * 9 / 5 + 32;
    case 'k': return celsius + 273.15;
  }
}

/* ---------------------------------------------------------
   8. FORMULA TEXT GENERATION
   --------------------------------------------------------- */
function getFormulaText(categoryKey, fromKey, toKey) {
  if (categoryKey === 'temperature') {
    return TEMP_FORMULAS[`${fromKey}-${toKey}`] || '';
  }
  const units = CATEGORIES[categoryKey].units;
  const factor = units[fromKey].factor / units[toKey].factor;
  const roundedFactor = roundSmart(factor);
  return `${SHORT_NAME[toKey]} = ${SHORT_NAME[fromKey]} × ${roundedFactor}`;
}

/* ---------------------------------------------------------
   9. LIVE CONVERSION HANDLER (with validation)
   --------------------------------------------------------- */
function handleLiveConversion() {
  const rawValue = inputValue.value.trim();
  const fromKey = fromUnitSelect.value;
  const toKey = toUnitSelect.value;

  formulaText.textContent = getFormulaText(currentCategory, fromKey, toKey);

  if (rawValue === '') {
    clearResult();
    return;
  }

  if (!isValidNumber(rawValue)) {
    showError('Please enter a valid decimal number.');
    resultValue.textContent = '—';
    return;
  }

  clearError();
  const numericValue = parseFloat(rawValue);
  const result = convertValue(currentCategory, fromKey, toKey, numericValue);
  const displayResult = roundSmart(result);

  resultValue.textContent = displayResult;
  // restart fade animation
  resultValue.style.animation = 'none';
  void resultValue.offsetWidth; // reflow trick
  resultValue.style.animation = null;

  saveToHistory(categoryLabelOf(currentCategory), numericValue, fromKey, toKey, displayResult);
}

/* ---------------------------------------------------------
   10. VALIDATION HELPERS
   --------------------------------------------------------- */
function isValidNumber(str) {
  // Accepts optional minus sign and decimal values, e.g. -12, 3.14, .5
  return /^-?\d*\.?\d+$/.test(str);
}

function showError(message) {
  errorMsg.textContent = message;
}

function clearError() {
  errorMsg.textContent = '';
}

/* ---------------------------------------------------------
   11. ROUNDING HELPER
   --------------------------------------------------------- */
function roundSmart(num) {
  if (!isFinite(num)) return '0';
  const rounded = Math.round(num * 1e6) / 1e6;
  // Remove unnecessary trailing zeros
  return parseFloat(rounded.toFixed(6)).toString();
}

/* ---------------------------------------------------------
   12. SWAP UNITS
   --------------------------------------------------------- */
function swapUnits() {
  const temp = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = temp;

  swapBtn.classList.add('spin');
  setTimeout(() => swapBtn.classList.remove('spin'), 300);

  handleLiveConversion();
}

/* ---------------------------------------------------------
   13. COPY RESULT TO CLIPBOARD
   --------------------------------------------------------- */
function copyResult() {
  const text = resultValue.textContent;
  if (!text || text === '—') {
    showToast('Nothing to copy yet');
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => showToast('Result copied to clipboard ✅'))
    .catch(() => showToast('Copy failed. Please try manually.'));
}

/* ---------------------------------------------------------
   14. RESET FORM
   --------------------------------------------------------- */
function resetForm() {
  inputValue.value = '';
  fromUnitSelect.selectedIndex = 0;
  toUnitSelect.selectedIndex = Object.keys(CATEGORIES[currentCategory].units).length > 1 ? 1 : 0;
  clearResult();
  showToast('Form reset');
}

function clearResult() {
  resultValue.textContent = '—';
  clearError();
  formulaText.textContent = getFormulaText(currentCategory, fromUnitSelect.value, toUnitSelect.value);
}

/* ---------------------------------------------------------
   15. CONVERSION HISTORY (Local Storage)
   --------------------------------------------------------- */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(categoryLabel, inputVal, fromKey, toKey, result) {
  const history = getHistory();

  const entry = {
    category: categoryLabel,
    from: SHORT_NAME[fromKey],
    to: SHORT_NAME[toKey],
    input: inputVal,
    result: result,
    time: new Date().toLocaleString()
  };

  history.unshift(entry);
  const trimmed = history.slice(0, MAX_HISTORY);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No conversions yet. Start converting above!</li>';
    return;
  }

  history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <strong>${item.input} ${item.from}</strong> → <strong>${item.result} ${item.to}</strong>
      <span class="history-time">${item.category} • ${item.time}</span>
    `;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast('History cleared');
}

function categoryLabelOf(key) {
  return CATEGORIES[key].label;
}

/* ---------------------------------------------------------
   16. THEME TOGGLE (Light / Dark) with Local Storage
   --------------------------------------------------------- */
function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.body.classList.add('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

/* ---------------------------------------------------------
   17. TOAST NOTIFICATION
   --------------------------------------------------------- */
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------
   18. BOOTSTRAP APP
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', init);

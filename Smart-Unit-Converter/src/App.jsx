import { useEffect, useState } from "react";
import "./App.css";

const units = {
  length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.344,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254
  },

  weight: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 0.000001,
    Pound: 0.453592,
    Ounce: 0.0283495
  },

  temperature: {
    Celsius: "C",
    Fahrenheit: "F",
    Kelvin: "K"
  },

  time: {
    Second: 1,
    Minute: 60,
    Hour: 3600,
    Day: 86400
  },

  speed: {
    "Meter/Second": 1,
    "Kilometer/Hour": 0.277778,
    "Mile/Hour": 0.44704
  },

  area: {
    "Square Meter": 1,
    "Square Kilometer": 1000000,
    "Square Foot": 0.092903,
    "Square Inch": 0.00064516
  },

  volume: {
    Liter: 1,
    Milliliter: 0.001,
    "Cubic Meter": 1000,
    Gallon: 3.78541
  }
};

function App() {
  const [category, setCategory] = useState("length");
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("Meter");
  const [toUnit, setToUnit] = useState("Kilometer");
  const [result, setResult] = useState("—");
  const [formula, setFormula] = useState("Select units to see the formula");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const currentUnits = units[category];

  useEffect(() => {
    const first = Object.keys(currentUnits)[0];
    const second = Object.keys(currentUnits)[1] || first;

    setFromUnit(first);
    setToUnit(second);
    setValue("");
    setResult("—");
    setFormula("Select units to see the formula");
  }, [category]);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  const convertTemperature = (value, from, to) => {
    let celsius;

    if (from === "Celsius") celsius = value;
    else if (from === "Fahrenheit") celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15;

    if (to === "Celsius") return celsius;
    if (to === "Fahrenheit") return celsius * 9 / 5 + 32;

    return celsius + 273.15;
  };

  const handleConvert = () => {
    if (value === "" || isNaN(value)) {
      setResult("Enter a valid number");
      return;
    }

    const num = Number(value);
    let converted;

    if (category === "temperature") {
      converted = convertTemperature(num, fromUnit, toUnit);
    } else {
      converted =
        (num * currentUnits[fromUnit]) / currentUnits[toUnit];
    }

    const formatted = Number(converted.toFixed(8));

    setResult(formatted);

    setFormula(`${value} ${fromUnit} → ${formatted} ${toUnit}`);

    const newHistory = {
      value,
      fromUnit,
      result: formatted,
      toUnit,
      category,
      time: new Date().toLocaleTimeString()
    };

    setHistory(prev => [newHistory, ...prev]);
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setResult("—");
  };

  const handleReset = () => {
    setValue("");
    setResult("—");
    setFormula("Select units to see the formula");
  };

  const copyResult = async () => {
    if (result !== "—") {
      await navigator.clipboard.writeText(String(result));
      alert("Result copied!");
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">🔄</span>
          <h1>Smart Unit Converter</h1>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Dark / Light Mode"
        >
          <span>☀️</span>
          <span>🌙</span>
        </button>
      </header>

      <main className="app-main">

        {/* Converter */}
        <section className="card converter-card">

          <div className="category-tabs">
            {Object.keys(units).map(item => (
              <button
                key={item}
                className={`tab ${category === item ? "active" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item === "length" && "📏"}
                {item === "weight" && "⚖️"}
                {item === "temperature" && "🌡️"}
                {item === "time" && "⏱️"}
                {item === "speed" && "🚀"}
                {item === "area" && "🟦"}
                {item === "volume" && "🧪"}

                {" " + item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="converter-form">

            <div className="field-group">
              <label>Value</label>

              <input
                type="text"
                inputMode="decimal"
                placeholder="Enter a number e.g. 12.5"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>

            <div className="unit-row">

              <div className="field-group">
                <label>From</label>

                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                >
                  {Object.keys(currentUnits).map(unit => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <button
                className="swap-btn"
                onClick={handleSwap}
              >
                ⇄
              </button>

              <div className="field-group">
                <label>To</label>

                <select
                  value={toUnit}
                  onChange={e => setToUnit(e.target.value)}
                >
                  {Object.keys(currentUnits).map(unit => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </div>

            </div>

            <button
              className="convert-btn"
              onClick={handleConvert}
            >
              Convert
            </button>

            <div className="result-box">

              <div className="result-label">
                Result
              </div>

              <div className="result-value">
                {result}
              </div>

              <button
                className="copy-btn"
                onClick={copyResult}
              >
                📋 Copy
              </button>

            </div>

            <div className="formula-box">
              <span className="formula-label">
                Formula:
              </span>

              <span>
                {formula}
              </span>
            </div>

            <div className="action-row">

              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                ↺ Reset
              </button>

            </div>

          </div>
        </section>

        {/* History */}
        <section className="card history-card">

          <div className="history-header">

            <h2>🕘 Conversion History</h2>

            <button
              className="btn-danger-outline"
              onClick={clearHistory}
            >
              🗑️ Clear
            </button>

          </div>

          <ul className="history-list">

            {history.length === 0 ? (
              <li className="history-empty">
                No conversions yet. Start converting above!
              </li>
            ) : (

              history.map((item, index) => (
                <li
                  className="history-item"
                  key={index}
                >
                  <strong>
                    {item.value} {item.fromUnit}
                  </strong>

                  {" → "}

                  <strong>
                    {item.result} {item.toUnit}
                  </strong>

                  <span className="history-time">
                    {item.category} • {item.time}
                  </span>
                </li>
              ))

            )}

          </ul>

        </section>

      </main>

      <footer className="app-footer">
        Smart Unit Converter • React + Vite
      </footer>
    </>
  );
}

export default App;
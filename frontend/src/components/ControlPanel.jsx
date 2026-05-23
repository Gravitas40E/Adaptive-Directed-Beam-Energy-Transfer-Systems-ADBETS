import { Activity, Crosshair, Move, Pause, Play, RadioTower, Route } from "lucide-react";

export function ControlPanel({
  settings,
  setSettings,
  running,
  setRunning,
  manualMode,
  setManualMode,
  metrics,
  apiStatus,
}) {
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <aside className="controls" aria-label="Simulation controls">
      <div className="brand">
        <RadioTower size={26} />
        <div>
          <h1>ADBETS</h1>
          <p>Adaptive phased-array energy focusing</p>
        </div>
      </div>

      <div className="toolbar">
        <button className="iconButton primary" onClick={() => setRunning(!running)} title={running ? "Pause" : "Play"}>
          {running ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          className={`iconButton ${manualMode ? "active" : ""}`}
          onClick={() => setManualMode(!manualMode)}
          title="Toggle manual receiver control"
        >
          {manualMode ? <Move size={18} /> : <Route size={18} />}
        </button>
        <div className={`status ${apiStatus === "live" ? "live" : "offline"}`}>
          <Activity size={15} />
          {apiStatus}
        </div>
      </div>

      <label className="segmented">
        <span>Mode</span>
        <div>
          <button className={settings.mode === "ideal" ? "selected" : ""} onClick={() => update("mode", "ideal")}>
            Analytical
          </button>
          <button className={settings.mode === "adaptive" ? "selected" : ""} onClick={() => update("mode", "adaptive")}>
            Feedback
          </button>
        </div>
      </label>

      <Slider label="Noise" value={settings.noise} max={0.4} step={0.01} onChange={(value) => update("noise", value)} />
      <Slider
        label="Interference"
        value={settings.interference}
        max={1}
        step={0.01}
        onChange={(value) => update("interference", value)}
      />
      <Slider
        label="Obstacle loss"
        value={settings.obstacle_strength}
        max={0.95}
        step={0.01}
        onChange={(value) => update("obstacle_strength", value)}
      />

      <div className="metrics">
        <Metric label="Received power" value={metrics?.received_power ?? "--"} />
        <Metric label="Gain" value={metrics ? `${metrics.gain_db} dB` : "--"} />
        <Metric label="Phase error" value={metrics?.tracking_error ?? "--"} />
        <Metric label="Tracking" value={metrics ? "ACTIVE" : "--"} />
      </div>

      <div className="hint">
        <Crosshair size={16} />
        {manualMode ? "Drag inside the field to steer the receiver." : "Receiver follows a generated path."}
      </div>
    </aside>
  );
}

function Slider({ label, value, max, step, onChange }) {
  return (
    <label className="slider">
      <span>
        {label}
        <strong>{value.toFixed(2)}</strong>
      </span>
      <input type="range" min="0" max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

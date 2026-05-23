import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { fetchSimulation } from "./api/client";
import { ControlPanel } from "./components/ControlPanel";
import { BeamCanvas } from "./visualizer/BeamCanvas";
import "./styles.css";

function App() {
  const [settings, setSettings] = useState({
    mode: "adaptive",
    noise: 0.06,
    interference: 0.2,
    obstacle_strength: 0.55,
  });
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [manualReceiver, setManualReceiver] = useState(null);
  const [apiStatus, setApiStatus] = useState("connecting");
  const timeRef = useRef(0);
  const settingsRef = useRef(settings);
  const manualRef = useRef({ manualMode, manualReceiver });

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    manualRef.current = { manualMode, manualReceiver };
  }, [manualMode, manualReceiver]);

  useEffect(() => {
    let cancelled = false;
    let last = performance.now();
    let busy = false;

    const tick = async (now) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      if (running) timeRef.current += dt;

      if (!busy) {
        busy = true;
        try {
          const manual = manualRef.current.manualMode ? manualRef.current.manualReceiver : null;
          const next = await fetchSimulation({
            ...settingsRef.current,
            time: timeRef.current,
            manual_receiver: manual,
          });
          if (!cancelled) {
            setState(next);
            setApiStatus("live");
          }
        } catch {
          if (!cancelled) setApiStatus("offline");
        } finally {
          busy = false;
        }
      }

      if (!cancelled) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [running]);

  return (
    <main className="shell">
      <ControlPanel
        settings={settings}
        setSettings={setSettings}
        running={running}
        setRunning={setRunning}
        manualMode={manualMode}
        setManualMode={setManualMode}
        metrics={state?.metrics}
        apiStatus={apiStatus}
      />
      <section className="visual">
        {state ? (
          <BeamCanvas state={state} manualMode={manualMode} onReceiverMove={setManualReceiver} />
        ) : (
          <div className="emptyState">Waiting for simulation backend...</div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);


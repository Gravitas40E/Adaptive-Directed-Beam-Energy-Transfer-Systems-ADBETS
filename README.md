# Adaptive Directed Beam Energy Transfer Systems (ADBETS)

Interactive phased-array beamforming simulator for focusing transmitted energy on a moving receiver in noisy, obstructed environments.

## What It Shows

- 8x8 antenna array with per-element phase control
- Wave superposition across a 2D field
- Moving receiver tracking
- Baseline ideal beam steering
- Adaptive phase optimization under noise, interference, and obstacles
- Real-time heatmap visualization with manual receiver control

<img width="1892" height="904" alt="image" src="https://github.com/user-attachments/assets/dd5ed57a-80e7-43ce-9ba2-4fc10b17b3ca" />
Stable beam lock with high convergence under near line-of-sight conditions.


<img width="1890" height="889" alt="image" src="https://github.com/user-attachments/assets/6146cf01-8baa-47aa-8955-a019a2dad6bf" />
Degraded beamforming under obstruction with active adaptive recovery.

## Project Layout

```text
beamforming-simulator/
├── backend/
│   ├── main.py
│   └── simulation/
│       ├── array_model.py
│       ├── environment.py
│       ├── optimizer.py
│       └── wave_propagation.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api/client.js
│       ├── components/ControlPanel.jsx
│       ├── visualizer/BeamCanvas.jsx
│       └── styles.css
└── docs/
    ├── architecture.md
    └── explanation.md
```

## Quick Start

### Instant Standalone Demo

Open this file directly in a browser:

```text
frontend/standalone.html
```

This version has no install step. It runs the beamforming math in the browser and is useful for demos when Python or Node packages are not installed.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## API

```http
POST /api/simulate
```

Request body:

```json
{
  "time": 0,
  "mode": "adaptive",
  "noise": 0.08,
  "interference": 0.25,
  "obstacle_strength": 0.6,
  "manual_receiver": null
}
```

The response includes antenna positions, receiver position, obstacle zones, a beam intensity heatmap, phase values, and received-power metrics.

## Research Angle

The simulator intentionally avoids overcomplicated electromagnetic modeling. It uses a narrowband scalar wave model:

```text
signal(point) = sum(amplitude / distance * exp(j * (k * distance + phase)))
power(point) = |signal(point)|^2
```

That keeps the project understandable while still demonstrating the core beamforming idea: phase shifts control constructive and destructive interference.

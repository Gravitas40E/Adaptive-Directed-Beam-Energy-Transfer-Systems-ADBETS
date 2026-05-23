from __future__ import annotations

from typing import Literal

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simulation.array_model import PhasedArray
from simulation.environment import Environment, Obstacle
from simulation.optimizer import adaptive_phases
from simulation.wave_propagation import field_power, receiver_power


class Point(BaseModel):
    x: float
    y: float


class SimulationRequest(BaseModel):
    time: float = 0.0
    mode: Literal["ideal", "adaptive"] = "adaptive"
    noise: float = Field(default=0.06, ge=0.0, le=0.4)
    interference: float = Field(default=0.2, ge=0.0, le=1.0)
    obstacle_strength: float = Field(default=0.55, ge=0.0, le=0.95)
    manual_receiver: Point | None = None


app = FastAPI(title="ADBETS Beamforming Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ARRAY = PhasedArray(size=8, spacing=0.38, wavelength=1.0)
WORLD = {"x_min": -6.0, "x_max": 6.0, "y_min": -2.0, "y_max": 10.0}


def moving_receiver(t: float) -> np.ndarray:
    x = 3.8 * np.sin(t * 0.55) + 0.7 * np.sin(t * 1.4)
    y = 6.2 + 2.4 * np.cos(t * 0.32)
    return np.array([x, y], dtype=float)


def build_environment(request: SimulationRequest) -> Environment:
    return Environment(
        obstacles=[
            Obstacle(x=-4.2, y=2.7, width=2.1, height=1.1, attenuation=request.obstacle_strength),
            Obstacle(x=1.45, y=4.15, width=1.55, height=2.25, attenuation=request.obstacle_strength * 0.82),
            Obstacle(x=-0.85, y=7.35, width=2.4, height=0.85, attenuation=request.obstacle_strength * 0.72),
        ],
        noise_level=request.noise,
        interference_level=request.interference,
        interference_sources=[
            np.array([-5.0, 8.5]),
            np.array([5.2, 3.2]),
        ],
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/simulate")
def simulate(request: SimulationRequest) -> dict:
    receiver = (
        np.array([request.manual_receiver.x, request.manual_receiver.y], dtype=float)
        if request.manual_receiver
        else moving_receiver(request.time)
    )
    env = build_environment(request)
    ideal = ARRAY.ideal_phases(receiver)

    if request.mode == "adaptive":
        phases = adaptive_phases(
            array=ARRAY,
            receiver=receiver,
            environment=env,
            initial_phases=ideal,
            time=request.time,
        )
    else:
        phases = ideal

    width = 96
    height = 96
    xs = np.linspace(WORLD["x_min"], WORLD["x_max"], width)
    ys = np.linspace(WORLD["y_min"], WORLD["y_max"], height)
    power = field_power(ARRAY, phases, xs, ys, env, time=request.time)
    normalized = power / max(float(power.max()), 1e-9)

    ideal_rx_power = receiver_power(ARRAY, ideal, receiver, env, request.time)
    actual_rx_power = receiver_power(ARRAY, phases, receiver, env, request.time)

    return {
        "world": WORLD,
        "grid": {
            "width": width,
            "height": height,
            "values": normalized.round(4).tolist(),
        },
        "receiver": {"x": float(receiver[0]), "y": float(receiver[1])},
        "antennas": [
            {"x": float(position[0]), "y": float(position[1]), "phase": float(phase)}
            for position, phase in zip(ARRAY.positions, phases)
        ],
        "obstacles": [obstacle.to_dict() for obstacle in env.obstacles],
        "metrics": {
            "received_power": round(float(actual_rx_power), 5),
            "ideal_power": round(float(ideal_rx_power), 5),
            "gain_db": round(float(10.0 * np.log10((actual_rx_power + 1e-9) / 1e-9)), 2),
            "tracking_error": round(float(np.mean(np.abs(np.angle(np.exp(1j * (phases - ideal)))))), 5),
        },
    }


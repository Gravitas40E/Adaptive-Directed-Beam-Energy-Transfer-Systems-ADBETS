from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np


@dataclass(frozen=True)
class Obstacle:
    x: float
    y: float
    width: float
    height: float
    attenuation: float

    def contains(self, points: np.ndarray) -> np.ndarray:
        return (
            (points[..., 0] >= self.x)
            & (points[..., 0] <= self.x + self.width)
            & (points[..., 1] >= self.y)
            & (points[..., 1] <= self.y + self.height)
        )

    def to_dict(self) -> dict[str, float]:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "attenuation": self.attenuation,
        }


@dataclass
class Environment:
    obstacles: list[Obstacle] = field(default_factory=list)
    noise_level: float = 0.0
    interference_level: float = 0.0
    interference_sources: list[np.ndarray] = field(default_factory=list)

    def path_attenuation(self, start: np.ndarray, end: np.ndarray) -> float:
        if not self.obstacles:
            return 1.0

        samples = np.linspace(start, end, 18)
        attenuation = 1.0
        for obstacle in self.obstacles:
            if np.any(obstacle.contains(samples)):
                attenuation *= max(0.02, 1.0 - obstacle.attenuation)
        return attenuation

    def point_attenuation(self, points: np.ndarray) -> np.ndarray:
        attenuation = np.ones(points.shape[:-1], dtype=float)
        for obstacle in self.obstacles:
            attenuation = np.where(
                obstacle.contains(points),
                attenuation * max(0.03, 1.0 - obstacle.attenuation),
                attenuation,
            )
        return attenuation


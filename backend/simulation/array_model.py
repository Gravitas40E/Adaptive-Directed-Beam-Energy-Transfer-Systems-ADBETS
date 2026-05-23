from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class PhasedArray:
    size: int = 8
    spacing: float = 0.38
    wavelength: float = 1.0
    amplitude: float = 1.0

    def __post_init__(self) -> None:
        coords = np.linspace(
            -(self.size - 1) * self.spacing / 2.0,
            (self.size - 1) * self.spacing / 2.0,
            self.size,
        )
        xv, yv = np.meshgrid(coords, np.zeros_like(coords))
        rows = []
        for row_index, y_offset in enumerate(coords):
            for x in coords:
                rows.append([x, y_offset * 0.18])
        object.__setattr__(self, "positions", np.array(rows, dtype=float))
        object.__setattr__(self, "wave_number", 2.0 * np.pi / self.wavelength)

    def ideal_phases(self, receiver: np.ndarray) -> np.ndarray:
        distances = np.linalg.norm(receiver - self.positions, axis=1)
        phases = -self.wave_number * distances
        return np.angle(np.exp(1j * phases))


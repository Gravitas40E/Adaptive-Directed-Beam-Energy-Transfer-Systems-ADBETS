from __future__ import annotations

import numpy as np

from simulation.array_model import PhasedArray
from simulation.environment import Environment
from simulation.wave_propagation import receiver_power


def adaptive_phases(
    array: PhasedArray,
    receiver: np.ndarray,
    environment: Environment,
    initial_phases: np.ndarray,
    time: float,
    iterations: int = 42,
) -> np.ndarray:
    rng = np.random.default_rng(int((time + receiver[0] * 13.0 + receiver[1] * 17.0) * 1000) % 2**32)
    phases = initial_phases.copy()
    best = receiver_power(array, phases, receiver, environment, time)

    step = 0.28 + environment.noise_level * 0.9 + environment.interference_level * 0.12
    for iteration in range(iterations):
        probe = phases.copy()
        changed = rng.choice(len(probe), size=max(4, len(probe) // 5), replace=False)
        probe[changed] += rng.normal(0.0, step, size=len(changed))
        probe = np.angle(np.exp(1j * probe))

        score = receiver_power(array, probe, receiver, environment, time)
        if score > best or rng.random() < 0.04 * (1.0 - iteration / iterations):
            phases = probe
            best = max(score, best)
        step *= 0.965

    return phases


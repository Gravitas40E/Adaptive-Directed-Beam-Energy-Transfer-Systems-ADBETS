from __future__ import annotations

import numpy as np

from simulation.array_model import PhasedArray
from simulation.environment import Environment


def _interference(points: np.ndarray, environment: Environment, wave_number: float, time: float) -> np.ndarray:
    if environment.interference_level <= 0.0 or not environment.interference_sources:
        return np.zeros(points.shape[:-1], dtype=complex)

    total = np.zeros(points.shape[:-1], dtype=complex)
    for index, source in enumerate(environment.interference_sources):
        distance = np.linalg.norm(points - source, axis=-1) + 0.08
        drift = time * (0.8 + index * 0.23)
        total += np.exp(1j * (wave_number * distance + drift)) / distance
    return total * environment.interference_level


def field_power(
    array: PhasedArray,
    phases: np.ndarray,
    xs: np.ndarray,
    ys: np.ndarray,
    environment: Environment,
    time: float = 0.0,
) -> np.ndarray:
    xv, yv = np.meshgrid(xs, ys)
    points = np.stack([xv, yv], axis=-1)
    field = np.zeros(points.shape[:-1], dtype=complex)

    point_attenuation = environment.point_attenuation(points)
    for position, phase in zip(array.positions, phases):
        distance = np.linalg.norm(points - position, axis=-1) + 0.08
        contribution = array.amplitude * np.exp(1j * (array.wave_number * distance + phase)) / distance
        field += contribution * point_attenuation

    field += _interference(points, environment, array.wave_number, time)

    if environment.noise_level > 0:
        rng = np.random.default_rng(int(time * 1000) % 2**32)
        noise = rng.normal(0, environment.noise_level, field.shape) + 1j * rng.normal(
            0, environment.noise_level, field.shape
        )
        field += noise

    return np.abs(field) ** 2


def receiver_power(
    array: PhasedArray,
    phases: np.ndarray,
    receiver: np.ndarray,
    environment: Environment,
    time: float = 0.0,
) -> float:
    field = 0.0j
    for position, phase in zip(array.positions, phases):
        distance = float(np.linalg.norm(receiver - position) + 0.08)
        attenuation = environment.path_attenuation(position, receiver)
        field += attenuation * array.amplitude * np.exp(1j * (array.wave_number * distance + phase)) / distance

    receiver_point = receiver.reshape(1, 2)
    field += _interference(receiver_point, environment, array.wave_number, time)[0]
    return float(np.abs(field) ** 2)


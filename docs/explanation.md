# Simulation Explanation

## Antenna Array

The transmitter is an 8x8 phased array. Each element has a fixed position, fixed amplitude, and controllable phase.

## Wave Superposition

For a point in the world, each antenna contributes a complex scalar wave:

```text
contribution = attenuation * amplitude / distance * exp(j * (k * distance + phase))
```

All contributions are summed. The displayed beam intensity is:

```text
power = abs(total_signal)^2
```

## Ideal Beam Steering

For a receiver position, the ideal baseline sets each element phase to cancel the propagation phase from that element to the receiver:

```text
phase_i = -k * distance(element_i, receiver)
```

This makes the waves arrive approximately in phase at the receiver.

## Adaptive Beamforming

Noise, interference, and obstacles reduce the usefulness of ideal steering. The adaptive mode starts with ideal steering, perturbs groups of antenna phases, measures receiver power, and keeps phase configurations that improve power. This is a simple stochastic optimizer, which is easy to explain and works well for an interactive demo.

## Obstacles

Obstacles are rectangular attenuation zones. If a signal path crosses an obstacle, that antenna contribution is reduced. This is not a full ray-tracing model, but it is enough to demonstrate why feedback-based optimization matters.


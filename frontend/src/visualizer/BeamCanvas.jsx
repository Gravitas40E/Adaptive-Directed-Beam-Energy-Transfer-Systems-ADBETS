import { useEffect, useRef } from "react";

const HEAT_COLORS = [
  [8, 19, 35],
  [14, 78, 105],
  [28, 139, 129],
  [242, 178, 66],
  [255, 246, 178],
];

export function BeamCanvas({ state, manualMode, onReceiverMove }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;

    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, rect.width, rect.height, state);
  }, [state]);

  const handlePointer = (event) => {
    if (!manualMode || !state) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    onReceiverMove(screenToWorld(x, y, rect.width, rect.height, state.world));
  };

  return (
    <div className="stage">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        onPointerMove={(event) => event.buttons === 1 && handlePointer(event)}
      />
      <div className="legend">
        <span>Low</span>
        <div />
        <span>High</span>
      </div>
    </div>
  );
}

function draw(ctx, width, height, state) {
  ctx.clearRect(0, 0, width, height);
  drawHeatmap(ctx, width, height, state);
  drawGrid(ctx, width, height);
  drawObstacles(ctx, width, height, state);
  drawAntennas(ctx, width, height, state);
  drawReceiver(ctx, width, height, state);
}

function drawHeatmap(ctx, width, height, state) {
  const { grid } = state;
  const cellW = width / grid.width;
  const cellH = height / grid.height;

  for (let row = 0; row < grid.height; row += 1) {
    for (let col = 0; col < grid.width; col += 1) {
      const value = Math.min(1, Math.max(0, grid.values[row][col]));
      const [r, g, b] = colorFor(value);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(col * cellW, row * cellH, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
    }
  }
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "rgba(238, 247, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawObstacles(ctx, width, height, state) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.46)";
  ctx.lineWidth = 1.5;
  state.obstacles.forEach((obstacle) => {
    const topLeft = worldToScreen({ x: obstacle.x, y: obstacle.y + obstacle.height }, width, height, state.world);
    const bottomRight = worldToScreen({ x: obstacle.x + obstacle.width, y: obstacle.y }, width, height, state.world);
    ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  });
}

function drawAntennas(ctx, width, height, state) {
  state.antennas.forEach((antenna) => {
    const point = worldToScreen(antenna, width, height, state.world);
    const wrapped = ((antenna.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const hue = 170 + (wrapped / (Math.PI * 2)) * 180;
    ctx.fillStyle = `hsl(${hue}, 85%, 62%)`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + Math.cos(wrapped) * 10, point.y + Math.sin(wrapped) * 10);
    ctx.stroke();
  });
}

function drawReceiver(ctx, width, height, state) {
  const receiver = worldToScreen(state.receiver, width, height, state.world);
  const pulse = 18 + Math.min(26, Math.log10((state.metrics?.received_power ?? 0) + 1) * 8);
  ctx.fillStyle = "rgba(255, 79, 123, 0.16)";
  ctx.beginPath();
  ctx.arc(receiver.x, receiver.y, pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(receiver.x, receiver.y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ff4f7b";
  ctx.beginPath();
  ctx.arc(receiver.x, receiver.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillText(`P = ${(state.metrics?.received_power ?? 0).toFixed(1)}`, receiver.x + 17, receiver.y - 14);
}

function colorFor(value) {
  const scaled = value * (HEAT_COLORS.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(index + 1, HEAT_COLORS.length - 1);
  const t = scaled - index;
  return HEAT_COLORS[index].map((channel, i) => Math.round(channel + (HEAT_COLORS[next][i] - channel) * t));
}

function worldToScreen(point, width, height, world) {
  return {
    x: ((point.x - world.x_min) / (world.x_max - world.x_min)) * width,
    y: height - ((point.y - world.y_min) / (world.y_max - world.y_min)) * height,
  };
}

function screenToWorld(x, y, width, height, world) {
  return {
    x: world.x_min + (x / width) * (world.x_max - world.x_min),
    y: world.y_min + ((height - y) / height) * (world.y_max - world.y_min),
  };
}

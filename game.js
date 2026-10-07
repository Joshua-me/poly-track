const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const overlayTitle = overlay.querySelector("h2");
const overlayBody = document.getElementById("overlayBody");
const trackName = document.getElementById("trackName");
const trackSelect = document.getElementById("trackSelect");
const resetButton = document.getElementById("resetButton");

const trackValue = document.getElementById("trackValue");
const speedValue = document.getElementById("speedValue");
const lapValue = document.getElementById("lapValue");
const timeValue = document.getElementById("timeValue");

const segmentLength = 24;
const drawDistance = 220;
const cameraHeight = 940;
const cameraDepth = 0.84;
const playerZ = 110;
const worldRoadWidth = 1820;

const keys = {
  left: false,
  right: false,
  accel: false,
  brake: false,
};

const trackBlueprints = [
  {
    name: "Starter Bend",
    laps: 2,
    scenery: "pine",
    palette: { skyTop: "#5fb1ff", skyMid: "#8fd0ff", skyGlow: "#d8f0ff" },
    checkpoints: [0.3, 0.58, 0.84],
    sections: [
      { length: 22, curve: 0.0, hill: 0 },
      { length: 28, curve: 0.16, hill: 12 },
      { length: 18, curve: -0.08, hill: 4 },
      { length: 24, curve: -0.2, hill: -8 },
      { length: 20, curve: 0.1, hill: -6 },
      { length: 24, curve: 0.0, hill: 0 },
    ],
  },
  {
    name: "Twin Arc",
    laps: 2,
    scenery: "pine",
    palette: { skyTop: "#58abfb", skyMid: "#87cfff", skyGlow: "#dff4ff" },
    checkpoints: [0.26, 0.52, 0.79],
    sections: [
      { length: 20, curve: 0.0, hill: 0 },
      { length: 34, curve: 0.26, hill: 18 },
      { length: 16, curve: 0.0, hill: 0 },
      { length: 32, curve: -0.3, hill: -12 },
      { length: 20, curve: 0.14, hill: 8 },
      { length: 20, curve: 0.0, hill: 0 },
    ],
  },
  {
    name: "Ridge Slalom",
    laps: 2,
    scenery: "rock",
    palette: { skyTop: "#4fa2f5", skyMid: "#82c8fb", skyGlow: "#ddf4ff" },
    checkpoints: [0.2, 0.48, 0.72, 0.9],
    sections: [
      { length: 18, curve: 0.0, hill: 0 },
      { length: 20, curve: 0.16, hill: 28 },
      { length: 18, curve: -0.22, hill: 10 },
      { length: 20, curve: 0.22, hill: -18 },
      { length: 18, curve: -0.2, hill: 14 },
      { length: 28, curve: 0.34, hill: 10 },
      { length: 18, curve: 0.0, hill: -8 },
    ],
  },
  {
    name: "Skyline Chicane",
    laps: 3,
    scenery: "tower",
    palette: { skyTop: "#13223c", skyMid: "#416886", skyGlow: "#ffb46a" },
    checkpoints: [0.18, 0.44, 0.68, 0.88],
    sections: [
      { length: 16, curve: 0.0, hill: 0 },
      { length: 14, curve: 0.42, hill: 0 },
      { length: 12, curve: -0.56, hill: 18 },
      { length: 24, curve: 0.52, hill: 24 },
      { length: 16, curve: -0.2, hill: -10 },
      { length: 26, curve: -0.48, hill: -28 },
      { length: 18, curve: 0.18, hill: 8 },
      { length: 16, curve: 0.0, hill: 0 },
    ],
  },
  {
    name: "Switchback Loop",
    laps: 3,
    scenery: "tower",
    palette: { skyTop: "#11203a", skyMid: "#487089", skyGlow: "#ffc475" },
    checkpoints: [0.16, 0.38, 0.62, 0.84],
    sections: [
      { length: 16, curve: 0.0, hill: 0 },
      { length: 26, curve: 0.58, hill: 20 },
      { length: 10, curve: -0.1, hill: 8 },
      { length: 24, curve: -0.62, hill: -24 },
      { length: 10, curve: 0.08, hill: 0 },
      { length: 22, curve: 0.44, hill: 26 },
      { length: 22, curve: -0.38, hill: -12 },
      { length: 16, curve: 0.0, hill: 0 },
    ],
  },
  {
    name: "Final Velocity",
    laps: 3,
    scenery: "mixed",
    palette: { skyTop: "#101e35", skyMid: "#4c7690", skyGlow: "#ffc16f" },
    checkpoints: [0.14, 0.32, 0.57, 0.8, 0.93],
    sections: [
      { length: 18, curve: 0.0, hill: 0 },
      { length: 34, curve: 0.3, hill: 30 },
      { length: 16, curve: -0.5, hill: 12 },
      { length: 20, curve: 0.58, hill: -28 },
      { length: 16, curve: -0.2, hill: -10 },
      { length: 30, curve: -0.6, hill: 26 },
      { length: 14, curve: 0.56, hill: 10 },
      { length: 20, curve: 0.12, hill: -8 },
      { length: 20, curve: 0.0, hill: 0 },
    ],
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function ease(value) {
  return 0.5 - Math.cos(value * Math.PI) * 0.5;
}

function buildTrack(definition) {
  const segments = [];
  let index = 0;

  for (const section of definition.sections) {
    for (let step = 0; step < section.length; step += 1) {
      const t = step / section.length;
      const curve = section.curve * ease(t);
      const hill = section.hill * ease(t);
      segments.push({
        index,
        curve,
        hill,
        palette: definition.palette,
      });
      index += 1;
    }
  }

  return {
    ...definition,
    segments,
    length: segments.length * segmentLength,
  };
}

const tracks = trackBlueprints.map(buildTrack);

for (const [index, track] of tracks.entries()) {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = `${index + 1}. ${track.name}`;
  trackSelect.appendChild(option);
}

const state = {
  running: false,
  finished: false,
  trackIndex: 0,
  lap: 1,
  elapsed: 0,
  speed: 0,
  position: 0,
  laneOffset: 0,
  steering: 0,
};

let checkpointIndex = 0;
let previousTimestamp = 0;

function getCurrentTrack() {
  return tracks[state.trackIndex];
}

function getSegment(track, n) {
  const total = track.segments.length;
  const index = ((n % total) + total) % total;
  return track.segments[index];
}

function project(worldX, worldY, worldZ, cameraX, cameraY) {
  const depth = Math.max(1, worldZ);
  const scale = cameraDepth / depth;

  return {
    x: Math.round((1 + scale * (worldX - cameraX)) * canvas.width * 0.5),
    y: Math.round((1 - scale * (worldY - cameraY)) * canvas.height * 0.5),
    scale,
  };
}

function setOverlayForTrack(track, title, body, buttonLabel) {
  overlayTitle.textContent = title;
  trackName.textContent = track.name;
  overlayBody.textContent = body;
  startButton.textContent = buttonLabel;
}

function syncHud() {
  const track = getCurrentTrack();
  trackValue.textContent = `${state.trackIndex + 1} / ${tracks.length}`;
  trackSelect.value = String(state.trackIndex);
  speedValue.textContent = Math.round(state.speed * 0.27);
  lapValue.textContent = `${state.lap} / ${track.laps}`;
  timeValue.textContent = `${state.elapsed.toFixed(1)}s`;
}

function resetRun() {
  state.running = true;
  state.finished = false;
  state.lap = 1;
  state.elapsed = 0;
  state.speed = 0;
  state.position = 0;
  state.laneOffset = 0;
  state.steering = 0;
  checkpointIndex = 0;
  overlay.classList.add("hidden");
  syncHud();
}

function showReadyOverlay() {
  const track = getCurrentTrack();
  state.running = false;
  state.finished = false;
  state.lap = 1;
  state.elapsed = 0;
  state.speed = 0;
  state.position = 0;
  state.laneOffset = 0;
  state.steering = 0;
  checkpointIndex = 0;
  overlay.classList.remove("hidden");
  setOverlayForTrack(
    track,
    "Race the neon circuit",
    "Steer with A/D or Left/Right. Accelerate with W/Up. Brake with S/Down.",
    "Start Run"
  );
  syncHud();
}

function advanceTrack() {
  if (state.trackIndex < tracks.length - 1) {
    state.trackIndex += 1;
  } else {
    state.trackIndex = 0;
  }

  showReadyOverlay();
}

function finishRun() {
  state.running = false;
  state.finished = true;
  overlay.classList.remove("hidden");

  const isFinalTrack = state.trackIndex === tracks.length - 1;
  const track = getCurrentTrack();
  setOverlayForTrack(
    track,
    isFinalTrack ? "Series complete" : "Track cleared",
    isFinalTrack
      ? `You cleared all six original starter tracks in ${state.elapsed.toFixed(1)}s on the finale.`
      : `Finished ${track.name} in ${state.elapsed.toFixed(1)}s. Continue to the next course.`,
    isFinalTrack ? "Restart Series" : "Next Track"
  );
}

function updateProgress(previousPosition, currentPosition) {
  const track = getCurrentTrack();
  const previousProgress = previousPosition / track.length;
  const currentProgress = currentPosition / track.length;

  if (
    checkpointIndex < track.checkpoints.length &&
    previousProgress < track.checkpoints[checkpointIndex] &&
    currentProgress >= track.checkpoints[checkpointIndex]
  ) {
    checkpointIndex += 1;
  }

  if (currentPosition < previousPosition) {
    if (checkpointIndex === track.checkpoints.length) {
      if (state.lap >= track.laps) {
        finishRun();
      } else {
        state.lap += 1;
        checkpointIndex = 0;
      }
    } else {
      checkpointIndex = 0;
      state.speed *= 0.82;
    }
  }
}

function updatePhysics(dt) {
  if (!state.running) {
    return;
  }

  const track = getCurrentTrack();
  const baseSegmentIndex = Math.floor(state.position / segmentLength);
  const currentSegment = getSegment(track, baseSegmentIndex);

  const targetSteer =
    (keys.left ? -1 : 0) +
    (keys.right ? 1 : 0);
  const steerResponse = keys.left || keys.right ? 8.2 : 5.2;
  state.steering = lerp(state.steering, targetSteer, clamp(dt * steerResponse, 0, 1));

  const trackTier = Math.min(state.trackIndex, 2);
  const throttleAccel = keys.accel ? 700 + trackTier * 20 : 0;
  const brakeForce = keys.brake ? 980 : 0;
  const coastDrag = state.speed * 0.5;
  state.speed += (throttleAccel - brakeForce - 78 - coastDrag) * dt;

  const curveInfluence = currentSegment.curve * Math.max(0.3, state.speed / 900);
  const steerGrip = lerp(0.72, 0.34, state.speed / 980);
  const laneMove = state.steering * state.speed * steerGrip * 0.00145;
  state.laneOffset += (laneMove - curveInfluence * 0.88) * dt * 60;

  const slip = Math.abs(state.steering) * Math.max(0, state.speed - 540) * 0.00055;
  state.speed -= slip * dt * 180;

  const edgeLimit = 1.16;
  const offRoad = Math.abs(state.laneOffset) > edgeLimit;
  if (offRoad) {
    const overshoot = Math.abs(state.laneOffset) - edgeLimit;
    state.speed -= (180 + overshoot * 380) * dt;
  }

  state.laneOffset = clamp(state.laneOffset, -1.45, 1.45);
  state.speed = clamp(state.speed, 0, 980);

  const previousPosition = state.position;
  state.position = (state.position + state.speed * dt) % track.length;
  state.elapsed += dt;

  updateProgress(previousPosition, state.position);
  syncHud();
}

function drawBackground(track) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, track.palette.skyTop);
  sky.addColorStop(0.52, track.palette.skyMid);
  sky.addColorStop(0.72, track.palette.skyGlow);
  sky.addColorStop(1, "#82c5ee");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCloudBands();

  const horizon = canvas.height * 0.43;
  drawMountainRange(horizon, 150, "#6fb67e", 0.1, 0.56);
  drawMountainRange(horizon + 28, 190, "#4d9268", 0.08, 0.72);
  ctx.fillStyle = "#53946f";
  ctx.fillRect(0, horizon + 46, canvas.width, canvas.height - (horizon + 46));
}

function drawCloudBands() {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";

  for (let i = 0; i < 8; i += 1) {
    const y = 72 + i * 30;
    ctx.lineWidth = 18 - i * 1.4;
    ctx.beginPath();
    for (let x = -40; x <= canvas.width + 40; x += 36) {
      const wave = Math.sin((x * 0.006) + i * 0.7) * (14 + i * 1.8);
      if (x === -40) {
        ctx.moveTo(x, y + wave);
      } else {
        ctx.lineTo(x, y + wave);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawMountainRange(baseY, maxHeight, color, jaggedness, seed) {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);

  for (let x = 0; x <= canvas.width + 40; x += 40) {
    const sample = x / canvas.width;
    const noise =
      Math.sin((sample + seed) * 10) * 0.55 +
      Math.sin((sample + seed * 1.2) * 23) * jaggedness +
      Math.sin((sample + seed * 2.2) * 37) * jaggedness * 0.7;
    ctx.lineTo(x, baseY - noise * maxHeight);
  }

  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawScenery(track) {
  const horizon = canvas.height * 0.44;

  for (let i = 0; i < 24; i += 1) {
    const ratio = i / 23;
    const x = ratio * canvas.width;
    const offset = Math.sin(ratio * 12 + state.position * 0.0032) * 48;
    const y = horizon + 22 + Math.sin(ratio * 9) * 14;
    const size = 24 + (i % 4) * 7;

    if (track.scenery === "pine") {
      drawTree(x + offset, y, size);
    } else if (track.scenery === "rock") {
      drawRock(x + offset, y + 8, size * 1.1);
    } else if (track.scenery === "tower") {
      drawTower(x + offset, y + 4, size * 1.1);
    } else {
      if (i % 2 === 0) {
        drawTree(x + offset, y, size);
      } else {
        drawTower(x + offset, y + 4, size);
      }
    }
  }
}

function drawTree(x, y, size) {
  ctx.fillStyle = "#315d47";
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.65, y + size * 0.3);
  ctx.lineTo(x + size * 0.65, y + size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7dc488";
  ctx.beginPath();
  ctx.moveTo(x, y - size * 1.35);
  ctx.lineTo(x - size * 0.95, y - size * 0.05);
  ctx.lineTo(x + size * 0.9, y - size * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawRock(x, y, size) {
  ctx.fillStyle = "#4b7056";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.9, y + size * 0.35);
  ctx.lineTo(x - size * 0.45, y - size * 0.55);
  ctx.lineTo(x + size * 0.2, y - size * 0.7);
  ctx.lineTo(x + size * 0.92, y + size * 0.1);
  ctx.lineTo(x + size * 0.35, y + size * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawTower(x, y, size) {
  ctx.fillStyle = "#56646f";
  ctx.fillRect(x - size * 0.18, y - size * 1.3, size * 0.36, size * 1.45);
  ctx.fillStyle = "#d8e9f1";
  ctx.fillRect(x - size * 0.28, y - size * 1.42, size * 0.56, size * 0.15);
}

function drawRoad(track) {
  const baseSegmentIndex = Math.floor(state.position / segmentLength);
  const basePercent = (state.position % segmentLength) / segmentLength;
  const cameraX = state.laneOffset * 760;
  const cameraY = cameraHeight + getSegment(track, baseSegmentIndex).hill * 4;

  let x = 0;
  let dx = 0;
  let maxY = canvas.height;

  for (let n = 0; n < drawDistance; n += 1) {
    const segment = getSegment(track, baseSegmentIndex + n);
    const nextSegment = getSegment(track, baseSegmentIndex + n + 1);

    const z1 = n * segmentLength - basePercent * segmentLength + playerZ;
    const z2 = (n + 1) * segmentLength - basePercent * segmentLength + playerZ;

    const y1 = segment.hill * 4;
    const y2 = nextSegment.hill * 4;

    const p1 = project(x * worldRoadWidth, y1, z1, cameraX, cameraY);
    const p2 = project((x + dx) * worldRoadWidth, y2, z2, cameraX, cameraY);

    x += dx;
    dx += nextSegment.curve * 0.0048;

    if (p2.y >= maxY || p2.y <= 0) {
      continue;
    }

    const roadHalf1 = p1.scale * worldRoadWidth * 0.9;
    const roadHalf2 = p2.scale * worldRoadWidth * 0.9;
    const rumbleHalf1 = roadHalf1 * 1.1;
    const rumbleHalf2 = roadHalf2 * 1.1;
    const barrierHalf1 = roadHalf1 * 1.18;
    const barrierHalf2 = roadHalf2 * 1.18;

    const stripe = segment.index % 2 === 0;
    fillBand(
      0,
      p2.y,
      canvas.width,
      p1.y,
      stripe ? "#558d68" : "#4f8965"
    );
    drawQuad(p1, p2, barrierHalf1, barrierHalf2, "#111111");
    drawRumbleStrip(p1, p2, roadHalf1, roadHalf2, rumbleHalf1, rumbleHalf2, segment.index);
    drawQuad(p1, p2, roadHalf1, roadHalf2, "#728397");
    drawLaneMarkers(p1, p2, roadHalf1, roadHalf2, segment.index);

    if (segment.index < 3) {
      drawStartStripe(p1, p2, roadHalf1, roadHalf2, segment.index);
    }

    if (segment.index % 18 === 0) {
      drawGate(p1, p2, roadHalf1, roadHalf2);
    }

    maxY = p2.y;
  }
}

function fillBand(x1, y1, x2, y2, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
}

function drawQuad(p1, p2, half1, half2, color) {
  ctx.beginPath();
  ctx.moveTo(p1.x - half1, p1.y);
  ctx.lineTo(p1.x + half1, p1.y);
  ctx.lineTo(p2.x + half2, p2.y);
  ctx.lineTo(p2.x - half2, p2.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLaneMarkers(p1, p2, roadHalf1, roadHalf2, segmentIndex) {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, p2.scale * 22);
  ctx.beginPath();
  ctx.moveTo(p1.x - roadHalf1, p1.y);
  ctx.lineTo(p2.x - roadHalf2, p2.y);
  ctx.moveTo(p1.x + roadHalf1, p1.y);
  ctx.lineTo(p2.x + roadHalf2, p2.y);
  if (segmentIndex % 5 === 0) {
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }
  ctx.stroke();
}

function drawRumbleStrip(p1, p2, roadHalf1, roadHalf2, rumbleHalf1, rumbleHalf2, segmentIndex) {
  const color = segmentIndex % 2 === 0 ? "#f45d32" : "#ffffff";

  ctx.beginPath();
  ctx.moveTo(p1.x - rumbleHalf1, p1.y);
  ctx.lineTo(p1.x - roadHalf1, p1.y);
  ctx.lineTo(p2.x - roadHalf2, p2.y);
  ctx.lineTo(p2.x - rumbleHalf2, p2.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(p1.x + roadHalf1, p1.y);
  ctx.lineTo(p1.x + rumbleHalf1, p1.y);
  ctx.lineTo(p2.x + rumbleHalf2, p2.y);
  ctx.lineTo(p2.x + roadHalf2, p2.y);
  ctx.closePath();
  ctx.fill();
}

function drawGate(p1, p2, roadHalf1, roadHalf2) {
  const gateWidth = lerp(roadHalf2 * 0.95, roadHalf1 * 0.95, 0.5);
  const gateX = lerp(p2.x, p1.x, 0.5);
  const gateY = lerp(p2.y, p1.y, 0.45);
  const lineWidth = Math.max(2, roadHalf2 * 0.08);

  ctx.strokeStyle = "#f39a28";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(gateX - gateWidth, gateY);
  ctx.lineTo(gateX + gateWidth, gateY);
  ctx.stroke();
}

function drawStartStripe(p1, p2, roadHalf1, roadHalf2, segmentIndex) {
  const color = segmentIndex === 1 ? "#eb8d27" : "#f39a28";
  const inner1 = roadHalf1 * 0.94;
  const inner2 = roadHalf2 * 0.94;
  ctx.beginPath();
  ctx.moveTo(p1.x - inner1, p1.y);
  ctx.lineTo(p1.x + inner1, p1.y);
  ctx.lineTo(p2.x + inner2, p2.y);
  ctx.lineTo(p2.x - inner2, p2.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPlayerCar() {
  const centerX = canvas.width * 0.5 + state.steering * 18;
  const baseY = canvas.height * 0.83;
  const tilt = clamp(-state.steering * 8 - state.laneOffset * 4, -12, 12);

  ctx.save();
  ctx.translate(centerX + 12, baseY + 16);
  ctx.scale(1.0, 0.44);
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, baseY);
  ctx.rotate((tilt * Math.PI) / 180);

  ctx.fillStyle = "#d6d2ca";
  ctx.beginPath();
  ctx.moveTo(-68, 28);
  ctx.lineTo(-40, -4);
  ctx.lineTo(-18, -34);
  ctx.lineTo(16, -34);
  ctx.lineTo(40, -4);
  ctx.lineTo(68, 28);
  ctx.lineTo(36, 44);
  ctx.lineTo(-36, 44);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f3f4f4";
  ctx.beginPath();
  ctx.moveTo(-16, -22);
  ctx.lineTo(0, -36);
  ctx.lineTo(16, -22);
  ctx.lineTo(12, 10);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#bff6ff";
  ctx.fillRect(-18, 4, 36, 8);

  ctx.fillStyle = "#1a1716";
  ctx.fillRect(-72, 18, 22, 14);
  ctx.fillRect(50, 18, 22, 14);
  ctx.fillRect(-66, 28, 12, 30);
  ctx.fillRect(54, 28, 12, 30);

  ctx.restore();
}

function drawTrackUi(track) {
  const progress = state.position / track.length;
  const nextCheckpoint = track.checkpoints[checkpointIndex] ?? 1;
  const checkpointDelta = ((nextCheckpoint - progress + 1) % 1) * 100;

  drawTopButton(26, 22, "Exit");
  drawTopButton(118, 22, "Watch");

  drawHudBadge(34, canvas.height - 42, 92, `${state.lap}/${track.laps}`, "LAP");
  drawHudBadge(canvas.width * 0.5 - 216, canvas.height - 42, 160, "--:--.---", "Record");
  drawHudBadge(canvas.width * 0.5 - 32, canvas.height - 42, 160, state.elapsed.toFixed(3), "Current");
  drawHudBadge(canvas.width * 0.5 + 152, canvas.height - 42, 166, `-${checkpointDelta.toFixed(3)}`, "Difference", "#6cff6f");
  drawHudBadge(canvas.width - 140, canvas.height - 42, 106, `${Math.round(state.speed * 0.27)}`, "", "#f4f6ff", "km/h");

  ctx.fillStyle = "#f2f7ff";
  ctx.font = "700 18px Trebuchet MS";
  ctx.fillText(track.name, 36, 42);
  ctx.font = "600 15px Trebuchet MS";
  ctx.fillText(`Checkpoint ${checkpointDelta.toFixed(0)}%`, 36, 64);

  if (!state.running && !state.finished) {
    ctx.font = "700 24px Trebuchet MS";
    ctx.fillText("Press Start to race", 36, 96);
  }
}

function drawTopButton(x, y, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(86, 0);
  ctx.lineTo(82, 32);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fillStyle = "#313d84";
  ctx.fill();
  ctx.strokeStyle = "#253165";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f2f5ff";
  ctx.font = "700 15px Trebuchet MS";
  ctx.fillText(label, 20, 21);
  ctx.restore();
}

function drawHudBadge(x, y, width, value, label = "", valueColor = "#f4f6ff", suffix = "") {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width - 10, 28);
  ctx.lineTo(-10, 28);
  ctx.closePath();
  ctx.fillStyle = "#3f4f9f";
  ctx.fill();
  ctx.strokeStyle = "#2b3260";
  ctx.lineWidth = 3;
  ctx.stroke();
  if (label) {
    ctx.fillStyle = "#e7ebff";
    ctx.font = "700 12px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(label, width * 0.5 - 4, -4);
  }
  ctx.fillStyle = valueColor;
  ctx.font = "700 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(String(value), width * 0.5 - 4, 20);
  if (suffix) {
    ctx.fillStyle = "#e7ebff";
    ctx.font = "700 11px Trebuchet MS";
    ctx.fillText(suffix, width - 22, 20);
  }
  ctx.restore();
  ctx.textAlign = "left";
}

function render() {
  const track = getCurrentTrack();
  drawBackground(track);
  drawScenery(track);
  drawRoad(track);
  drawPlayerCar();
  drawTrackUi(track);
}

function frame(timestamp) {
  if (!previousTimestamp) {
    previousTimestamp = timestamp;
  }

  const dt = Math.min((timestamp - previousTimestamp) / 1000, 0.032);
  previousTimestamp = timestamp;

  updatePhysics(dt);
  render();
  requestAnimationFrame(frame);
}

function setKey(event, pressed) {
  switch (event.key.toLowerCase()) {
    case "a":
    case "arrowleft":
      keys.left = pressed;
      break;
    case "d":
    case "arrowright":
      keys.right = pressed;
      break;
    case "w":
    case "arrowup":
      keys.accel = pressed;
      break;
    case "s":
    case "arrowdown":
      keys.brake = pressed;
      break;
    default:
      return;
  }

  event.preventDefault();
}

window.addEventListener("keydown", (event) => setKey(event, true));
window.addEventListener("keyup", (event) => setKey(event, false));

startButton.addEventListener("click", () => {
  if (state.finished) {
    advanceTrack();
    return;
  }
  resetRun();
});

trackSelect.addEventListener("change", (event) => {
  state.trackIndex = Number(event.target.value);
  showReadyOverlay();
});

resetButton.addEventListener("click", () => {
  showReadyOverlay();
});

showReadyOverlay();
render();
requestAnimationFrame(frame);

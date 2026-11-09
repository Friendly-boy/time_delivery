"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusText = document.querySelector("#status");

const CELL_SIZE = 64;
const COLS = 9;
const ROWS = 7;

const START = { x: 1, y: 3 };
const SWITCH = { x: 2, y: 2 };
const DOOR = { x: 4, y: 3 };
const PACKAGE = { x: 6, y: 3 };
const GOAL = { x: 7, y: 3 };

const walls = new Set();

// 맵의 테두리 벽
for (let x = 0; x < COLS; x++) {
  walls.add(`${x},0`);
  walls.add(`${x},${ROWS - 1}`);
}

for (let y = 0; y < ROWS; y++) {
  walls.add(`0,${y}`);
  walls.add(`${COLS - 1},${y}`);
}

// 가운데 벽. 문이 있는 칸은 벽으로 막지 않습니다.
for (const y of [1, 2, 4, 5]) {
  walls.add(`4,${y}`);
}

let player;
let recordedPath;
let echo;
let echoIndex;
let mode;
let hasPackage;
let won;
let echoTimer;

function startNewGame() {
  stopEchoTimer();

  player = { ...START };
  recordedPath = [];
  echo = null;
  echoIndex = 0;
  mode = "record";
  hasPackage = false;
  won = false;

  draw();
}

function samePosition(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function isDoorOpen() {
  return mode === "replay" && samePosition(echo, SWITCH);
}

function stopEchoTimer() {
  if (echoTimer !== null) {
    clearInterval(echoTimer);
    echoTimer = null;
  }
}

function movePlayer(dx, dy) {
  if (won) return;

  const next = {
    x: player.x + dx,
    y: player.y + dy
  };

  if (walls.has(`${next.x},${next.y}`)) return;

  if (samePosition(next, DOOR) && !isDoorOpen()) {
    setStatus("문이 닫혀 있어요. 잔상이 스위치를 밟을 때까지 기다리세요.");
    return;
  }

  player = next;

  if (mode === "record") {
    recordedPath.push({ ...player });
  }

  if (samePosition(player, PACKAGE)) {
    hasPackage = true;
  }

  if (hasPackage && samePosition(player, GOAL)) {
    won = true;
    stopEchoTimer();
  }

  draw();
}

function rewindTime() {
  if (won) {
    startNewGame();
    return;
  }

  if (mode === "record") {
    if (!samePosition(player, SWITCH)) {
      setStatus("먼저 스위치 위에 서세요. 시작점에서 위, 오른쪽으로 이동하면 됩니다.");
      return;
    }

    if (recordedPath.length === 0) {
      setStatus("스위치까지 걸어간 뒤 시간을 되감으세요.");
      return;
    }

    mode = "replay";
  }

  // 플레이어와 잔상을 시작 위치로 돌립니다.
  stopEchoTimer();
  player = { ...START };
  echo = null;
  echoIndex = 0;
  hasPackage = false;

  draw();
  setStatus("잔상이 과거의 길을 따라가고 있어요. 문이 열리면 배달하세요.");

  // 잔상이 기록된 길을 재생합니다.
  echoTimer = setInterval(() => {
    if (echoIndex < recordedPath.length) {
      echo = { ...recordedPath[echoIndex] };
      echoIndex++;
      draw();

      if (samePosition(echo, SWITCH)) {
        setStatus("잔상이 스위치를 밟았어요! 이제 열린 문을 지나갈 수 있습니다.");
      }
    } else {
      stopEchoTimer();
    }
  }, 350);
}

function setStatus(message) {
  statusText.textContent = message;
}

function drawCell(x, y, color, border = "#34495e") {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawText(text, x, y, options = {}) {
  ctx.fillStyle = options.color ?? "#ffffff";
  ctx.font = options.font ?? "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 바닥
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      drawCell(x, y, "#263746");
    }
  }

  // 벽
  for (const wall of walls) {
    const [x, y] = wall.split(",").map(Number);
    drawCell(x, y, "#111820", "#111820");
  }

  // 스위치
  ctx.fillStyle = samePosition(echo, SWITCH) ? "#f1c40f" : "#8e7d32";
  ctx.beginPath();
  ctx.arc(
    SWITCH.x * CELL_SIZE + CELL_SIZE / 2,
    SWITCH.y * CELL_SIZE + CELL_SIZE / 2,
    21,
    0,
    Math.PI * 2
  );
  ctx.fill();

  drawText(
    "스위치",
    SWITCH.x * CELL_SIZE + CELL_SIZE / 2,
    SWITCH.y * CELL_SIZE + CELL_SIZE / 2,
    { color: "#17202a", font: "bold 11px system-ui, sans-serif" }
  );

  // 문
  ctx.fillStyle = isDoorOpen() ? "#2ecc71" : "#c0392b";
  ctx.fillRect(
    DOOR.x * CELL_SIZE + 8,
    DOOR.y * CELL_SIZE + 4,
    CELL_SIZE - 16,
    CELL_SIZE - 8
  );

  drawText(
    isDoorOpen() ? "열림" : "문",
    DOOR.x * CELL_SIZE + CELL_SIZE / 2,
    DOOR.y * CELL_SIZE + CELL_SIZE / 2,
    { font: "bold 13px system-ui, sans-serif" }
  );

  // 배달 목표와 소포
  drawText("🏁", GOAL.x * CELL_SIZE + 32, GOAL.y * CELL_SIZE + 34, {
    font: "30px system-ui, sans-serif"
  });

  if (!hasPackage) {
    drawText("📦", PACKAGE.x * CELL_SIZE + 32, PACKAGE.y * CELL_SIZE + 34, {
      font: "30px system-ui, sans-serif"
    });
  }

  // 잔상
  if (echo) {
    ctx.fillStyle = "rgba(77, 185, 225, 0.88)";
    ctx.beginPath();
    ctx.arc(
      echo.x * CELL_SIZE + CELL_SIZE / 2,
      echo.y * CELL_SIZE + CELL_SIZE / 2,
      21,
      0,
      Math.PI * 2
    );
    ctx.fill();

    drawText("잔상", echo.x * CELL_SIZE + 32, echo.y * CELL_SIZE + 32, {
      font: "bold 11px system-ui, sans-serif"
    });
  }

  // 플레이어
  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath();
  ctx.arc(
    player.x * CELL_SIZE + CELL_SIZE / 2,
    player.y * CELL_SIZE + CELL_SIZE / 2,
    22,
    0,
    Math.PI * 2
  );
  ctx.fill();

  drawText("나", player.x * CELL_SIZE + 32, player.y * CELL_SIZE + 32, {
    color: "#17202a",
    font: "bold 13px system-ui, sans-serif"
  });

  if (won) {
    setStatus("배달 성공! 축하합니다! R을 누르면 처음부터 다시 할 수 있어요.");
  }
}

// 키보드 조작
document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  const moves = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0]
  };

  if (moves[key]) {
    event.preventDefault();
    movePlayer(...moves[key]);
  } else if (key === "r") {
    rewindTime();
  }
});

// 화면 버튼 조작
document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    movePlayer(dx, dy);
  });
});

document.querySelector("#rewind-button").addEventListener("click", rewindTime);
document.querySelector("#reset-button").addEventListener("click", startNewGame);

startNewGame();

import "./styles.css";
import * as PIXI from "pixi.js";
import cubismCoreUrl from "live2dcubismcore/live2dcubismcore.min.js?url";
import { initI18n, pickSpeechLine, t } from "./i18n.js";

window.PIXI = PIXI;

const MODELS = {
  "2d": new URL("kuromi/kuromi.model3.json", document.baseURI).href,
  "3d": new URL("kuromi-3d/kuromi-3d.model3.json", document.baseURI).href
};

const PARAMS = {
  angleX: "ParamAngleX",
  angleY: "ParamAngleY",
  angleZ: "ParamAngleZ",
  bodyX: "ParamBodyAngleX",
  bodyY: "ParamBodyAngleY",
  breath: "ParamBreath",
  mouthOpen: "ParamMouthOpenY",
  mouthForm: "ParamMouthForm",
  cheek: "ParamCheek"
};

const canvas = document.querySelector("#stage");
const speech = document.querySelector("#speech");
const desktopApi = window.kuromiDesktopPet;

const log = (level, message) => desktopApi?.log?.(level, String(message));

window.addEventListener("error", (event) => log("error", event.error?.stack || event.message));
window.addEventListener("unhandledrejection", (event) =>
  log("error", event.reason?.stack || event.reason)
);

let model;
let selectedModel = "2d";
let speakingUntil = 0;
let cursorTarget = { x: 0, y: 0 };
let smoothed = { x: 0, y: 0 };
let dragState = null;
let mouseIgnored = true;
let Live2DModelClass;
let modelLoadToken = 0;

const app = new PIXI.Application({
  view: canvas,
  width: window.innerWidth,
  height: window.innerHeight,
  autoDensity: true,
  antialias: true,
  backgroundAlpha: 0,
  preserveDrawingBuffer: true,
  resolution: window.devicePixelRatio || 1
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function setParameter(id, value, weight = 1) {
  const coreModel = model?.internalModel?.coreModel;

  if (coreModel?.setParameterValueById) {
    coreModel.setParameterValueById(id, value, weight);
  }
}

function normalizeModel(value) {
  return value === "3d" ? "3d" : "2d";
}

function say(text = pickSpeechLine(), duration = 4200) {
  speech.textContent = text;
  speech.classList.add("visible");
  speakingUntil = performance.now() + duration;

  window.clearTimeout(say.hideTimer);
  say.hideTimer = window.setTimeout(() => {
    speech.classList.remove("visible");
  }, duration);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(t("errors.loadScript", { src })));
    document.head.appendChild(script);
  });
}

function scheduleRandomLine() {
  window.setTimeout(() => {
    say();
    scheduleRandomLine();
  }, 60000);
}

async function updateCursorTarget() {
  if (!desktopApi?.getCursorPosition) {
    return;
  }

  const cursor = await desktopApi.getCursorPosition();
  const windowLeft = window.screenX;
  const windowTop = window.screenY;

  const next = {
    x: (cursor.x - windowLeft) / window.innerWidth - 0.5,
    y: (cursor.y - windowTop) / window.innerHeight - 0.5
  };

  cursorTarget = Number.isFinite(next.x) && Number.isFinite(next.y) ? next : { x: 0, y: 0 };
}

function resize() {
  app.renderer.resize(window.innerWidth, window.innerHeight);

  if (!model) {
    return;
  }

  const scale =
    Math.min(window.innerWidth / model.internalModel.width, window.innerHeight / model.internalModel.height) *
    0.92;
  model.scale.set(scale);
  model.anchor.set(0.5, 0.5);
  model.position.set(window.innerWidth / 2, window.innerHeight * 0.5);
}

async function mountModel(modelKey) {
  const nextModel = normalizeModel(modelKey);
  const modelPath = MODELS[nextModel];

  if (!Live2DModelClass || !modelPath) {
    return;
  }

  const loadToken = ++modelLoadToken;

  const previousModel = model;
  selectedModel = nextModel;
  model = undefined;

  if (previousModel) {
    app.stage.removeChild(previousModel);
    previousModel.destroy();
  }

  const nextInstance = await Live2DModelClass.from(modelPath, { autoInteract: false });

  if (loadToken !== modelLoadToken) {
    nextInstance.destroy();
    return;
  }

  model = nextInstance;
  app.stage.addChild(model);
  resize();
  log("info", `model loaded: ${selectedModel}`);
}

const pixelBuffer = new Uint8Array(4);

// Pixel-perfect hit test against the rendered frame so the window only grabs the
// mouse where the model is actually drawn (everywhere else stays click-through).
function isOverModel(clientX, clientY) {
  const gl = app.renderer.gl;

  if (!gl) {
    return false;
  }

  const res = app.renderer.resolution;
  const px = Math.floor(clientX * res);
  const py = Math.floor(gl.drawingBufferHeight - clientY * res);

  if (px < 0 || py < 0 || px >= gl.drawingBufferWidth || py >= gl.drawingBufferHeight) {
    return false;
  }

  gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
  return pixelBuffer[3] > 16;
}

function setMouseIgnored(ignore) {
  if (ignore === mouseIgnored) {
    return;
  }

  mouseIgnored = ignore;
  desktopApi?.setIgnoreMouse?.(ignore);
}

function updatePassthrough(clientX, clientY) {
  if (dragState) {
    setMouseIgnored(false);
    return;
  }

  const target = document.elementFromPoint(clientX, clientY);
  const overSpeech = speech.classList.contains("visible") && speech.contains(target);

  setMouseIgnored(!(overSpeech || isOverModel(clientX, clientY)));
}

async function boot() {
  await initI18n();
  await loadScript(cubismCoreUrl);
  const { Live2DModel } = await import("pixi-live2d-display/cubism4");
  Live2DModelClass = Live2DModel;

  selectedModel = normalizeModel(await desktopApi?.getModel?.());
  await mountModel(selectedModel);

  say(t("speech.welcome"), 5200);
  scheduleRandomLine();

  window.setInterval(updateCursorTarget, 33);
  desktopApi?.onModelChanged?.((nextModel) => {
    mountModel(nextModel).catch((error) => {
      log("error", error?.stack || error);
    });
  });
}

app.ticker.add(() => {
  if (!model) {
    return;
  }

  const seconds = performance.now() / 1000;

  smoothed.x = lerp(smoothed.x, clamp(cursorTarget.x, -1, 1), 0.08);
  smoothed.y = lerp(smoothed.y, clamp(cursorTarget.y, -1, 1), 0.08);

  const angleX = clamp(smoothed.x * 36, -30, 30);
  const angleY = clamp(-smoothed.y * 28, -24, 24);
  const breath = 0.5 + Math.sin(seconds * 2.1) * 0.35;
  const talking = performance.now() < speakingUntil;
  const mouth = talking ? 0.35 + Math.abs(Math.sin(seconds * 12)) * 1.15 : 0;
  const cheek = talking ? 0.18 + Math.sin(seconds * 4) * 0.08 : 0;

  setParameter(PARAMS.angleX, angleX);
  setParameter(PARAMS.angleY, angleY);
  setParameter(PARAMS.angleZ, clamp(-angleX * 0.18, -8, 8));
  setParameter(PARAMS.bodyX, clamp(angleX * 0.32, -10, 10));
  setParameter(PARAMS.bodyY, clamp(angleY * 0.26, -10, 10));
  setParameter(PARAMS.breath, clamp(breath, 0, 1));
  setParameter(PARAMS.mouthForm, talking ? 0.7 : 0.15);
  setParameter(PARAMS.mouthOpen, clamp(mouth, 0, 1.7));
  setParameter(PARAMS.cheek, clamp(cheek, 0, 1));
});

window.addEventListener("resize", resize);

window.addEventListener("mousemove", (event) => {
  updatePassthrough(event.clientX, event.clientY);
});

window.addEventListener("pointerdown", async (event) => {
  if (event.button !== 0 || !desktopApi?.getWindowPosition) {
    return;
  }

  if (!isOverModel(event.clientX, event.clientY)) {
    return;
  }

  // Mark the press synchronously so a very fast click is still detected as a tap
  // before the async window-position lookup resolves.
  dragState = {
    pointerId: event.pointerId,
    moved: false,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    windowX: 0,
    windowY: 0
  };

  const [windowX, windowY] = await desktopApi.getWindowPosition();

  if (dragState?.pointerId === event.pointerId) {
    dragState.windowX = windowX;
    dragState.windowY = windowY;
  }
});

window.addEventListener("pointermove", (event) => {
  if (!dragState || !desktopApi?.setWindowPosition) {
    return;
  }

  const dx = event.screenX - dragState.startScreenX;
  const dy = event.screenY - dragState.startScreenY;

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    dragState.moved = true;
  }

  desktopApi.setWindowPosition({
    x: dragState.windowX + dx,
    y: dragState.windowY + dy
  });
});

function endDrag(event) {
  if (dragState?.pointerId !== event.pointerId) {
    return;
  }

  const wasTap = !dragState.moved;
  dragState = null;

  // A press that didn't turn into a drag counts as a tap: say a line.
  if (wasTap) {
    say();
    setParameter(PARAMS.cheek, 0.8);
  }

  // Re-evaluate passthrough at the release point.
  updatePassthrough(event.clientX, event.clientY);
}

window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

boot().catch((error) => {
  log("error", error?.stack || error);
});

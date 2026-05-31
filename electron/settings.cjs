const fs = require("node:fs");
const path = require("node:path");

function getSettingsPath(app) {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings(app) {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(app), "utf8"));
  } catch {
    return {};
  }
}

function writeSettings(app, settings) {
  const filePath = getSettingsPath(app);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function readLocale(app) {
  return readSettings(app).locale ?? null;
}

function writeLocale(app, locale) {
  const settings = readSettings(app);
  settings.locale = locale;
  writeSettings(app, settings);
}

module.exports = {
  readLocale,
  writeLocale
};

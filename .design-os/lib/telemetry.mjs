/**
 * Optional anonymous telemetry for Adonay Design OS CLI.
 *
 * Default: OFF. This module no-ops unless both are set:
 *   DESIGN_OS_TELEMETRY=1
 *   DESIGN_OS_TELEMETRY_URL=<your ingest endpoint>
 *
 * No vendor ingest URL is shipped. --no-telemetry always disables.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir, platform } from 'os';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const TELEMETRY_TIMEOUT_MS = 2000;

function getConfigDir() {
  const home = homedir();
  if (platform() === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'design-os');
  }
  return join(home, '.config', 'design-os');
}

function getTelemetryConfigPath() {
  return join(getConfigDir(), 'telemetry.json');
}

function readConfig() {
  try {
    const configPath = getTelemetryConfigPath();
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

function writeConfig(config) {
  try {
    const configPath = getTelemetryConfigPath();
    const configDir = dirname(configPath);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch {
    // Ignore write errors - telemetry is best-effort
  }
}

/**
 * Telemetry is off unless explicitly opted in with a URL.
 * @param {{ args?: string[] }} options
 * @returns {boolean}
 */
export function isTelemetryEnabled({ args = [] } = {}) {
  if (args.includes('--no-telemetry')) return false;
  const envValue = process.env.DESIGN_OS_TELEMETRY;
  if (envValue !== '1' && envValue !== 'true') return false;
  if (!process.env.DESIGN_OS_TELEMETRY_URL) return false;
  return true;
}

export function getAnonId() {
  const config = readConfig();
  if (config.anon_id) return config.anon_id;
  const anonId = randomUUID();
  writeConfig({
    ...config,
    anon_id: anonId,
    nudges: config.nudges || {}
  });
  return anonId;
}

export async function track(event, props = {}, { args = [] } = {}) {
  try {
    if (!isTelemetryEnabled({ args })) return;

    const telemetryUrl = process.env.DESIGN_OS_TELEMETRY_URL;
    if (!telemetryUrl) return;

    const anonId = getAnonId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);

    try {
      await fetch(telemetryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId, event, props }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Silently ignore all errors - telemetry must never break CLI
  }
}

export function getCommonProps(version) {
  return {
    version,
    node: process.version,
    platform: platform()
  };
}

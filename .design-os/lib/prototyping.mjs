import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { findWorkspaceRoot, getContextPath } from './files.mjs';

/**
 * Parse projects/<slug>/context/prototyping.md YAML-like key: value lines.
 * @param {string} slug
 * @returns {Record<string, string>|null}
 */
export function getPrototypingConfig(slug) {
  const path = join(getContextPath(slug), 'prototyping.md');
  if (!existsSync(path)) return null;

  const config = {};
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([a-z_]+):\s*(.+)$/i);
    if (match) {
      config[match[1].toLowerCase()] = match[2].trim();
    }
  }
  return Object.keys(config).length ? config : null;
}

export function isProtoBranchesEnabled(slug) {
  const cfg = getPrototypingConfig(slug);
  return cfg?.proto_branches === 'enabled';
}

export function getDefaultPort(slug) {
  const cfg = getPrototypingConfig(slug);
  const port = parseInt(cfg?.default_port || '3030', 10);
  return Number.isFinite(port) ? port : 3030;
}

export function getPrototypePath(slug, feature) {
  return join(findWorkspaceRoot(), 'projects', slug, 'prototypes', feature);
}

export function getOptionsPath(slug, feature) {
  return join(getPrototypePath(slug, feature), 'OPTIONS.md');
}

export function branchName(slug, feature, option) {
  return `proto/${slug}/${feature}/${option}`;
}

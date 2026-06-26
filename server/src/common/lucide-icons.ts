import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ICON_DIR = join(process.cwd(), 'node_modules/lucide-static/icons');
let NAMES: string[] | null = null;
const innerCache = new Map<string, string | null>();

/** 全量 lucide 图标名（缓存）。 */
export function listIconNames(): string[] {
  if (!NAMES) {
    try {
      NAMES = readdirSync(ICON_DIR)
        .filter((f) => f.endsWith('.svg'))
        .map((f) => f.replace(/\.svg$/, ''))
        .sort();
    } catch {
      NAMES = [];
    }
  }
  return NAMES;
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '');
}

/** 提取 SVG 内部节点（path/circle…），供小程序生成 data-URI 渲染。 */
export function iconInner(name?: string | null): string | null {
  if (!name) return null;
  if (innerCache.has(name)) return innerCache.get(name)!;
  let inner: string | null = null;
  try {
    const svg = readFileSync(join(ICON_DIR, `${safeName(name)}.svg`), 'utf8');
    const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (m) {
      inner = m[1]
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {
    inner = null;
  }
  innerCache.set(name, inner);
  return inner;
}

/** 完整 SVG（替换描边色），供后台预览。 */
export function iconSvg(name: string, color = '#666'): string {
  const svg = readFileSync(join(ICON_DIR, `${safeName(name)}.svg`), 'utf8');
  return svg.replace(/stroke="currentColor"/g, `stroke="${color}"`);
}

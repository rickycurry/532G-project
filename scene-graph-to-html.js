// scenegraph-to-html.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import * as vega from 'vega';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : dflt;
};
const bg = opt('--bg', '#D6D6D6');     // page background; the chart text is white
const pad = Number(opt('--pad', 5));
const [input, outDir = 'charts-html'] = args;
if (!input) {
  console.error('Usage: node scenegraph-to-html.mjs <file-or-dir> [outDir] [--bg color] [--pad px]');
  process.exit(1);
}

// Conservative bounds estimate: group offsets accumulate, text size is approximated.
function measure(mark, ox, oy, b) {
  const ext = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x);
    b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
  };
  for (const item of mark.items ?? []) {
    if (mark.marktype === 'group') {
      const gx = ox + (item.x ?? 0), gy = oy + (item.y ?? 0);
      ext(gx, gy);
      ext(gx + (item.width ?? 0), gy + (item.height ?? 0));
      (item.items ?? []).forEach(m => measure(m, gx, gy, b));
    } else if (mark.marktype === 'text') {
      const x = ox + (item.x ?? 0), y = oy + (item.y ?? 0);
      const fs = item.fontSize ?? 11;
      const lines = Array.isArray(item.text) ? item.text : [String(item.text ?? '')];
      const w = Math.max(...lines.map(l => l.length)) * fs * 0.6;
      const h = lines.length * fs * 1.2;
      if (item.angle) {            // rotated: be generous in both directions
        ext(x - h, y - w / 2); ext(x + h, y + w / 2);
      } else {
        const left = item.align === 'center' ? x - w / 2 : item.align === 'right' ? x - w : x;
        const top = item.baseline === 'middle' ? y - h / 2 : item.baseline === 'bottom' ? y - h : y;
        ext(left, top); ext(left + w, top + h);
      }
    } else {
      const x = ox + (item.x ?? 0), y = oy + (item.y ?? 0);
      ext(x, y);
      ext(x + (item.width ?? 0), y + (item.height ?? 0));
      if (item.x2 != null) ext(ox + item.x2, y);
      if (item.y2 != null) ext(x, oy + item.y2);
    }
  }
}

function toSVG(json) {
  const root = json.scenegraph ?? json;           // tolerate a wrapper object
  const scene = vega.sceneFromJSON(JSON.stringify(root));
  const b = { x0: 0, y0: 0, x1: 0, y1: 0 };
  measure(root, 0, 0, b);
  const w = Math.ceil(b.x1 - b.x0 + 2 * pad);
  const h = Math.ceil(b.y1 - b.y0 + 2 * pad);
  return new vega.SVGStringRenderer(vega.loader())
    .initialize(null, w, h, [pad - b.x0, pad - b.y0])
    .render(scene)
    .svg();
}

const page = (title, svg) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title>
<style>body { background: ${bg}; margin: 1rem; }</style></head>
<body>
${svg}
</body>
</html>
`;

const isDir = (await fs.stat(input)).isDirectory();
const files = isDir
  ? (await fs.readdir(input)).filter(f => f.endsWith('.json')).map(f => path.join(input, f))
  : [input];

await fs.mkdir(outDir, { recursive: true });
for (const file of files) {
  try {
    const svg = toSVG(JSON.parse(await fs.readFile(file, 'utf8')));
    const name = path.basename(file, '.json') + '.html';
    await fs.writeFile(path.join(outDir, name), page(name, svg));
    console.log(`ok    ${file} -> ${path.join(outDir, name)}`);
  } catch (err) {
    console.error(`FAIL  ${file}: ${err.message}`);
  }
}
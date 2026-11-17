#!/usr/bin/env node
/* Tiny static server for the preview page (audio seeking needs HTTP range support).
 *   node tools/serve.mjs [--port 8899] [--host 127.0.0.1]
 * Then open http://127.0.0.1:8899/engine/a3.html
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, cliArg as arg, handleHelp } from './kit_env.mjs';

handleHelp(`
serve.mjs -- static file server for engine previews
  node tools/serve.mjs [--port 8899] [--host 127.0.0.1]`);

const port = Number(arg('port', '8899'));
const host = arg('host', '127.0.0.1');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.lrc': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.resolve(ROOT, '.' + (rel === '/' ? '/engine/a3.html' : rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = fs.statSync(file).size;
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    if (start >= size || end >= size || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end();
    }
    res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}` });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': size, 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`preview: http://${host}:${port}/engine/a3.html`);
  console.log('Ctrl+C to stop.');
});

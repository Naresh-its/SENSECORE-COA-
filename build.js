import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssOrder = ['variables.css', 'base.css', 'glass.css', 'components.css', 'layout.css', 'pages.css'];
const cssContent = cssOrder.map(f => fs.readFileSync(path.join(__dirname, 'css', f), 'utf8')).join('\n\n');
fs.writeFileSync(path.join(__dirname, 'style.css'), cssContent, 'utf8');

const bundle = fs.readFileSync(path.join(__dirname, 'app.bundle.js'), 'utf8');
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const styleRegex = /<style[\s\S]*?<\/style>/;
if (styleRegex.test(html)) {
  html = html.replace(styleRegex, `<style id="inlined-style">\n${cssContent}\n</style>`);
}

const scriptRegex = /<script id="inlined-bundle">[\s\S]*?<\/script>/;
if (scriptRegex.test(html)) {
  html = html.replace(scriptRegex, `<script id="inlined-bundle">\n${bundle}\n</script>`);
}

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('Successfully synchronized style.css and index.html');

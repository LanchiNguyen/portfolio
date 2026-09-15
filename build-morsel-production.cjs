// Compile with the checked-in Babel version; no package download is needed.
const fs = require('node:fs');
const path = require('node:path');
const Babel = require('./morsel-proto/vendor/babel.min.js');
const root = path.join(__dirname, 'morsel-proto');
const output = path.join(__dirname, '_site/morsel-proto');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script type="text\/babel" src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (scripts.length !== 15) throw new Error('Morsel script inventory changed; review the bundle order.');
const source = ['v3/app/data.js', ...scripts].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n;\n');
const bundle = Babel.transform(source, {filename:'morsel-app.jsx', sourceType:'script', presets:['react'], comments:false, compact:true, minified:true}).code;
fs.writeFileSync(path.join(output, 'app.bundle.js'), bundle);
for (const file of ['react.production.min.js','react-dom.production.min.js']) {
  fs.copyFileSync(path.join(__dirname, 'tenet-proto/vendor', file), path.join(output, 'vendor', file));
}
const built = html.replace(/<script src="vendor\/react.development.js">[\s\S]*?<\/body>/,
  '<script defer src="vendor/react.production.min.js"></script>\n<script defer src="vendor/react-dom.production.min.js"></script>\n<script defer src="app.bundle.js"></script>\n</body>');
if (built === html || /text\/babel|react\.development|react-dom\.development/.test(built)) throw new Error('Development scripts remain in Morsel entry.');
fs.writeFileSync(path.join(output, 'index.html'), built);
for (const file of ['babel.min.js','react.development.js','react-dom.development.js']) fs.rmSync(path.join(output,'vendor',file), {force:true});
console.log('Morsel production bundle:', Buffer.byteLength(bundle), 'bytes');

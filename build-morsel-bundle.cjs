// Precompile the canonical Morsel v3 JSX with the same Babel build the page pins.
const fs=require('fs');
const path=require('path');
global.window = global; global.self = global; // UMD shim
const mod = require(process.env.S+'/cdn/pkg-babel/package/babel.min.js');
const Babel = global.Babel || global.window.Babel || mod;
const P='v2/morsel-proto';
// script order exactly as in the canonical index.html
const html=fs.readFileSync(P+'/index.html','utf8');
const order=[...html.matchAll(/<script type="text\/babel" src="([^"]+)"><\/script>/g)].map(m=>m[1]);
let dataJs=fs.readFileSync(P+'/v3/app/data.js','utf8');
// vendor the photos: u() resolves canonical IDs from an inlined map instead of a remote host
const U_RE=/function u\(id, w\) \{[\s\S]*?\n\}/;
if(!U_RE.test(dataJs)) throw new Error('u() not found in data.js');
dataJs=dataJs.replace(U_RE,'function u(id, w) {\n  return (typeof __MORSEL_PHOTOS !== "undefined" && __MORSEL_PHOTOS[id]) || "";\n}');
let bundle='/* canonical Morsel v3 — data.js + Babel-precompiled JSX, source order preserved */\n'+dataJs+'\n';
for(const rel of order){
  const src=fs.readFileSync(path.join(P,rel),'utf8');
  const out=Babel.transform(src,{filename:rel,presets:['react']}).code;
  bundle+='\n/* == '+rel+' == */\n'+out+'\n';
}
fs.writeFileSync(process.env.S+'/morsel-bundle.js',bundle);
console.log('order:',order.join(', '));
console.log('bundle KB:',Math.round(bundle.length/1024));

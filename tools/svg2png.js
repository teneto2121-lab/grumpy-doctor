// Rasterize an SVG to a transparent PNG at a given width:  node tools/svg2png.js in.svg out.png 1600
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const [inp, out, w] = [path.resolve(process.argv[2]), process.argv[3], +(process.argv[4] || 1600)];
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: w, height: 100}});
  await p.goto('file://' + inp);
  const h = await p.evaluate(w => { const s = document.querySelector('svg'); const vb = s.viewBox.baseVal; const h = Math.round(w * vb.height / vb.width);
    s.setAttribute('width', w); s.setAttribute('height', h); document.documentElement.style.background = 'transparent'; return h; }, w);
  await p.setViewportSize({width: w, height: h});
  await p.screenshot({path: out, omitBackground: true}); await b.close(); console.log('wrote', out, w + 'x' + h);
})();

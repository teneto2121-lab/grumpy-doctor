// Render an episode to MP4.
//
// Usage:  node tools/render.js episodes/<episode-folder>              -> <folder>/<folder>.mp4
//         node tools/render.js episodes/<episode-folder> stills 3 12.5 -> preview JPGs at those seconds
//
// Needs Playwright (Chromium) and ffmpeg.
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), {execFileSync} = require('child_process');

const ep = path.resolve(process.argv[2]);
const mode = process.argv[3] || 'full';
let FPS = 30;
const WORKERS = Math.max(1, Math.min(6, require('os').cpus().length - 2));  // parallel browser tabs
const words = JSON.parse(fs.readFileSync(path.join(ep, 'words.json')));
const env = JSON.parse(fs.readFileSync(path.join(ep, 'env.json')));
let DUR = Math.ceil((words[words.length - 1].e + 0.9) * 10) / 10;
const rd = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null;
const vis = rd(path.join(ep, 'visemes.json')) || [];
// signature outro line ("Next patient!"), made once by tools/voice.py --outro
const outro = rd(path.join(__dirname, '..', 'engine', 'voice', 'next_patient.json')) || {env: [], vis: [], len: 1.9};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
  await p.goto('file://' + path.join(ep, 'scene.html'));
  await p.evaluate(() => document.fonts.ready);
  const pauses = rd(path.join(ep, 'pauses.json')) || [];
  await p.evaluate(ps => { window.PAUSES = ps; }, pauses);
  const args = [words, env, DUR, vis, outro.env, outro.vis, outro.len];
  await p.evaluate(a => setup(...a), args);
  const tail = await p.evaluate(() => window.outroLen ? window.outroLen() : 0);
  if (tail) { DUR = Math.ceil((words[words.length - 1].e + 0.25 + tail) * 10) / 10; args[2] = DUR; await p.evaluate(a => setup(...a), args); }
  // remember the first frame so the outro can dissolve back into it (seamless loop)
  await p.evaluate(() => { render(0); const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; c.getContext('2d').drawImage(document.getElementById('c'), 0, 0); window.__firstFrame = c; });

  if (mode === 'stills') {
    for (const t of process.argv.slice(4).map(Number)) {
      await p.evaluate(t => render(t), t);
      await p.screenshot({path: path.join(ep, `still_${t}.jpg`), type: 'jpeg', quality: 80});
    }
  } else {
    const dir = path.join(ep, 'frames');
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    FPS = await p.evaluate(() => window.OUT_FPS || 30);  // set window.OUT_FPS=60 in scene.html for smoother motion
    const N = Math.round(DUR * FPS);
    const pages = [p];
    for (let w = 1; w < WORKERS; w++) {
      const q = await b.newPage({viewport: {width: 1080, height: 1920}});
      q.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
      await q.goto('file://' + path.join(ep, 'scene.html'));
      await q.evaluate(() => document.fonts.ready);
      await q.evaluate(ps => { window.PAUSES = ps; }, pauses);
      await q.evaluate(a => setup(...a), args);
      await q.evaluate(() => { render(0); const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; c.getContext('2d').drawImage(document.getElementById('c'), 0, 0); window.__firstFrame = c; });
      pages.push(q);
    }
    let done = 0;
    await Promise.all(pages.map(async (q, w) => {
      for (let i = w; i < N; i += pages.length) {
        await q.evaluate(t => render(t), i / FPS);
        await q.screenshot({path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95});
        if (++done % 300 === 0) console.log(`frame ${done}/${N}`);
      }
    }));
    // sound effects: mix window.SFX cues under the voice
    let audio = path.join(ep, 'voice.wav');
    const sfx = await p.evaluate(() => window.SFX || []);
    if (sfx.length) {
      fs.writeFileSync(path.join(ep, 'sfx.json'), JSON.stringify(sfx));
      execFileSync('python3', [path.join(__dirname, 'mix.py'), ep], {stdio: 'inherit'});
      audio = path.join(ep, 'mix.wav');
    }
    const out = path.join(ep, path.basename(ep) + '.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'),
      '-i', audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
      '-maxrate', '14M', '-bufsize', '28M', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-shortest', '-movflags', '+faststart', out]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log('wrote', out, `(${DUR}s)`);
  }
  await b.close();
})();

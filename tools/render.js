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
const FPS = 30;
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
    const N = Math.round(DUR * FPS);
    for (let i = 0; i < N; i++) {
      await p.evaluate(t => render(t), i / FPS);
      await p.screenshot({path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92});
      if (i % 150 === 0) console.log(`frame ${i}/${N}`);
    }
    // sound effects: mix window.SFX cues under the voice
    let audio = path.join(ep, 'voice.wav');
    const sfx = await p.evaluate(() => window.SFX || []);
    if (sfx.length) {
      fs.writeFileSync(path.join(ep, 'sfx.json'), JSON.stringify(sfx));
      execFileSync('python3', [path.join(__dirname, 'mix.py'), ep], {stdio: 'inherit'});
      audio = path.join(ep, 'mix.wav');
    }
    const out = path.join(ep, path.basename(ep) + '.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'),
      '-i', audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-shortest', '-movflags', '+faststart', out]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log('wrote', out, `(${DUR}s)`);
  }
  await b.close();
})();

// Render the 3D look test:  node render3d.js [stills t1 t2 ...]
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), {execFileSync, spawn} = require('child_process');
const here = __dirname, FPS = 30;
const words = JSON.parse(fs.readFileSync(path.join(here, 'voice/words.json')));
const env = JSON.parse(fs.readFileSync(path.join(here, 'voice/env.json')));
const DUR = Math.ceil((words[words.length - 1].e + 0.7) * 10) / 10;
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], {cwd: here, stdio: 'ignore'});
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', e => console.error('PAGE ERROR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto('http://127.0.0.1:8765/demo.html');
  await p.waitForFunction(() => window.ready === true, null, {timeout: 30000});
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(([w, e]) => setup(w, e), [words, env]);
  if (process.argv[2] === 'stills') {
    for (const t of process.argv.slice(3).map(Number)) { await p.evaluate(t => renderFrame(t), t); await p.screenshot({path: path.join(here, `still_${t}.jpg`), type: 'jpeg', quality: 85}); }
  } else {
    const dir = path.join(here, 'frames'); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir);
    const N = Math.round(DUR * FPS);
    for (let i = 0; i < N; i++) { await p.evaluate(t => renderFrame(t), i / FPS); await p.screenshot({path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92}); if (i % 60 === 0) console.log(`frame ${i}/${N}`); }
    // voice + a few effects
    const sfx = path.join(here, '..', '..', 'engine', 'sfx');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-i', path.join(here, 'voice/voice.wav'),
      '-i', path.join(sfx, 'whoosh.wav'), '-i', path.join(sfx, 'whoosh.wav'), '-i', path.join(sfx, 'stamp.wav'), '-i', path.join(sfx, 'steam.wav'), '-i', path.join(sfx, 'pop.wav'),
      '-filter_complex', '[2]adelay=1550|1550,volume=0.5[a2];[3]adelay=5800|5800,volume=0.4[a3];[4]adelay=5850|5850,volume=0.5[a4];[5]adelay=5950|5950,volume=0.35[a5];[6]adelay=8500|8500,volume=0.4[a6];[1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0[a]',
      '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(here, '3d-look-test.mp4')]);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log('wrote 3d-look-test.mp4', DUR + 's');
  }
  await b.close(); srv.kill();
})();

# Render the 3D shots on your Mac (M3 GPU)

Your MacBook's graphics chip renders these Blender shots many times faster than the cloud machine.

## One-time setup (5 minutes)
1. Install Blender (free): https://www.blender.org/download/ — choose **macOS Apple Silicon**, drag it to Applications.
2. Get the project: in Terminal,
   ```
   cd ~/Documents && git clone https://github.com/teneto2121-lab/grumpy-doctor.git
   ```
3. Get the skull model (public domain, NIH 3D entry 849): open https://3d.nih.gov/entries/849 , download the **GLB** file,
   and save it as `grumpy-doctor/experiments/3d-skull/model/skull.glb`.

## Render the test shot
```
cd ~/Documents/grumpy-doctor/experiments/3d-skull
GPU=1 /Applications/Blender.app/Contents/MacOS/Blender -b --python shot.py -- frames x 48 100
```
- `48` = samples (quality), `100` = full 1080x1920 resolution. On the M3 you can afford full resolution and more samples.
- Frames land in `frames/`. Turn them into a video:
```
ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p skull-3d.mp4
```
(If you don't have ffmpeg: `brew install ffmpeg`, or upload the `frames` folder and Claude will assemble it.)

## Easiest option: let Claude do it on your Mac
Open **Claude Code in the Claude desktop app**, pick the `grumpy-doctor` folder, and say:
"Follow experiments/3d-skull/HANDOVER-MAC.md and render the 3D test shot on the GPU."

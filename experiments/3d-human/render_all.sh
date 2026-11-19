#!/bin/bash
# Render every ep23 shot, then encode to VP9 webm for the scene engine.
cd "$(dirname "$0")"; OUT=../../assets/footage
for m in bed_phone desk_day xray desk_tired desk_nod wide_shadow desk_stare bed_sleep; do
  [ -f $OUT/3d-$m.webm ] && continue
  rm -rf frames/$m
  /Applications/Blender.app/Contents/MacOS/Blender -b --python room.py -- $m frames x 80 > log_$m.txt 2>&1
  ffmpeg -v error -y -framerate 30 -i frames/$m/f%04d.png -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 26 -row-mt 1 $OUT/3d-$m.webm && echo "done $m $(date +%T)"
done
echo ALLDONE

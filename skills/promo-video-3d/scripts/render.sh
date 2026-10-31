#!/usr/bin/env bash
# Renderiza el video en horizontal, vertical y cuadrado, con motion blur y la música.
# Uso: bash render.sh <video.html> <audio> <nombre> [formatos="horizontal vertical cuadrado"]
#   → <nombre>-horizontal.mp4 (1920×1080), <nombre>-vertical.mp4 (1080×1920), <nombre>-cuadrado.mp4 (1080×1080)
# Cada formato graba 30 fps × 4 submuestras y ffmpeg las promedia (tmix): obturador de 180°.
set -euo pipefail
HTML="$1"; AUDIO="$2"; NAME="$3"; FORMATS="${4:-horizontal vertical cuadrado}"
DUR="${DUR:-30}"; DIR="$(cd "$(dirname "$0")" && pwd)"; FR="$(mktemp -d)"
declare -A SIZE=([horizontal]="1920 1080" [vertical]="1080 1920" [cuadrado]="1080 1080")
for f in $FORMATS; do
  set -- ${SIZE[$f]}
  rm -rf "$FR"/*; echo "▶ $f ($1×$2)"
  VW=$1 VH=$2 DUR=$DUR node "$DIR/rec.mjs" "$HTML" "$FR" all 4
  ffmpeg -v error -y -framerate 120 -i "$FR/%05d.jpg" -i "$AUDIO" -t "$DUR" \
    -vf "tmix=frames=4,select='not(mod(n+1\,4))',setpts=N/30/TB,format=yuv420p" -r 30 \
    -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 192k -af "afade=t=out:st=$((DUR-2)):d=2" -shortest -movflags +faststart "$NAME-$f.mp4"
  echo "✓ $NAME-$f.mp4"
done
rm -rf "$FR"

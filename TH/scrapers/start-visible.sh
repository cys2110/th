#!/bin/sh
set -eu

Xvfb "$DISPLAY" -screen 0 1440x900x24 >/tmp/xvfb.log 2>&1 &
sleep 1
fluxbox >/tmp/fluxbox.log 2>&1 &
x11vnc -display "$DISPLAY" -forever -shared -nopw >/tmp/x11vnc.log 2>&1 &

if command -v novnc_proxy >/dev/null 2>&1; then
    novnc_proxy --listen 0.0.0.0:6080 --vnc 127.0.0.1:5900 >/tmp/novnc.log 2>&1 &
else
    websockify --web=/usr/share/novnc 0.0.0.0:6080 127.0.0.1:5900 >/tmp/novnc.log 2>&1 &
fi

exec flask --app main run --host=0.0.0.0 --port=5001

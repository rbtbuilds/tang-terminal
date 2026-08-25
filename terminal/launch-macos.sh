#!/bin/zsh
set -eu

SCRIPT_DIR=${0:A:h}
PORT=8787
URL="http://127.0.0.1:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/tang-terminal.log"

if [[ -f "${SCRIPT_DIR}/.tang-terminal.env" ]]; then
  set -a
  source "${SCRIPT_DIR}/.tang-terminal.env"
  set +a
fi

if ! curl --silent --fail "${URL}/index.html" >/dev/null 2>&1; then
  /usr/bin/env python3 "${SCRIPT_DIR}/local-server.py" --port "${PORT}" >"${LOG_FILE}" 2>&1 &
  SERVER_PID=$!
  for attempt in {1..30}; do
    curl --silent --fail "${URL}/index.html" >/dev/null 2>&1 && break
    kill -0 "${SERVER_PID}" >/dev/null 2>&1 || {
      echo "TANG Terminal could not start. See ${LOG_FILE}"
      exit 1
    }
    sleep 0.15
  done
fi

open "${URL}"
echo "TANG Terminal opened at ${URL}"

#!/bin/zsh
set -eu

SCRIPT_DIR=${0:A:h}
SHORTCUT="$HOME/Desktop/TANG Terminal.command"

{
  echo '#!/bin/zsh'
  printf 'exec %q\n' "${SCRIPT_DIR}/launch-macos.sh"
} > "${SHORTCUT}"
chmod +x "${SCRIPT_DIR}/launch-macos.sh" "${SCRIPT_DIR}/local-server.py" "${SHORTCUT}"
echo "Installed desktop shortcut: ${SHORTCUT}"
echo "Double-click it to open TANG Terminal in your default browser."
read "?Press Return to finish."

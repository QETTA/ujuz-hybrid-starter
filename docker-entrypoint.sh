#!/bin/sh
set -e

case "${APP_NAME}" in
  api)            exec node apps/api/dist/index.js ;;
  worker-alerts)  exec node apps/worker-alerts/dist/index.js ;;
  worker-ai)      exec node apps/worker-ai/dist/index.js ;;
  *)              echo "Unknown APP_NAME: ${APP_NAME}" && exit 1 ;;
esac

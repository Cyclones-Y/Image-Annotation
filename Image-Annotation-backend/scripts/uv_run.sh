set -e

ENV_NAME="${1:-dev}"
VENV="${2:-.venv}"

"$VENV/bin/python" app.py --env="$ENV_NAME"


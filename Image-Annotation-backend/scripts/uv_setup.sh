set -e

DB="${1:-mysql}"
VENV="${2:-.venv}"

uv venv "$VENV"

if [ "$DB" = "pg" ]; then
  uv pip install -r requirements-pg.txt -p "$VENV"
else
  uv pip install -r requirements.txt -p "$VENV"
fi


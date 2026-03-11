param(
  [ValidateSet('mysql', 'pg')]
  [string]$Db = 'mysql',
  [string]$Venv = '.venv'
)

uv venv $Venv

if ($Db -eq 'pg') {
  uv pip install -r requirements-pg.txt -p $Venv
} else {
  uv pip install -r requirements.txt -p $Venv
}


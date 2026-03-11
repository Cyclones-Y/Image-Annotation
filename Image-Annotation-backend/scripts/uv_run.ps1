param(
  [string]$Env = 'dev',
  [string]$Venv = '.venv'
)

& "$Venv\\Scripts\\python.exe" app.py --env=$Env


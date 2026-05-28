Set-Location $PSScriptRoot\..
python -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload

$target = Join-Path $PSScriptRoot "src\app\wasil-quran-passage.tsx"
if (Test-Path $target) {
  Remove-Item $target -Force
  Write-Host "Route temporaire supprimée : $target"
} else {
  Write-Host "Aucune route temporaire à supprimer."
}

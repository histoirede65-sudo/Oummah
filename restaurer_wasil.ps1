$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Get-Location

Copy-Item -Force "$root\src\app\(tabs)\dalil.tsx" "$project\src\app\(tabs)\dalil.tsx"
Copy-Item -Force "$root\src\supabase\functions\wasil\index.ts" "$project\src\supabase\functions\wasil\index.ts"

$paths = @(
  "$project\src\app\wasil\quran-passage.tsx",
  "$project\src\app\wasil-quran-passage.tsx",
  "$project\src\supabase\functions\wasil\engine"
)
foreach ($path in $paths) {
  if (Test-Path $path) { Remove-Item -Recurse -Force $path }
}
Write-Host "Wasil restaure. Redepoyez la fonction Supabase wasil puis lancez npx expo start -c."

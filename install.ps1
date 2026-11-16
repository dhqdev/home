# Instalador da Casa 3D - Windows (PowerShell)
#   irm https://raw.githubusercontent.com/dhqdev/home/main/install.ps1 | iex
#
# Baixa a versao mais recente, cria a pasta "Casa 3D" na Area de Trabalho,
# um atalho "Casa 3D" (com icone) e abre a casa no navegador.
# Rodar de novo atualiza para a versao mais recente.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = 'dhqdev/home'
$Branch = if ($env:CASA3D_BRANCH) { $env:CASA3D_BRANCH } else { 'main' }
$Name = 'Casa 3D'
$Url = "https://codeload.github.com/$Repo/zip/refs/heads/$Branch"

function Say($t) { Write-Host "==> $t" -ForegroundColor Yellow }

$Desk = [Environment]::GetFolderPath('Desktop')
if (-not $Desk -or -not (Test-Path $Desk)) { $Desk = Join-Path $env:USERPROFILE 'Desktop' }
New-Item -ItemType Directory -Force -Path $Desk | Out-Null
$Dest = Join-Path $Desk $Name

$Tmp = Join-Path ([IO.Path]::GetTempPath()) ("casa3d_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
try {
  Say "Baixando a Casa 3D ($Repo@$Branch)..."
  $Zip = Join-Path $Tmp 'casa.zip'
  Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing
  Expand-Archive -Path $Zip -DestinationPath (Join-Path $Tmp 'x') -Force
  $Src = Get-ChildItem (Join-Path $Tmp 'x') -Directory | Select-Object -First 1
  if (-not (Test-Path (Join-Path $Src.FullName 'dist\index.html'))) { throw 'O pacote baixado nao contem dist\index.html.' }

  if (Test-Path $Dest) {
    if (Test-Path (Join-Path $Dest '.casa3d')) { Remove-Item -Recurse -Force $Dest }
    else { throw "Ja existe uma pasta '$Dest' que nao foi criada por este instalador. Renomeie-a e rode de novo." }
  }
  Move-Item $Src.FullName $Dest
  New-Item -ItemType File -Path (Join-Path $Dest '.casa3d') -Force | Out-Null
  $App = Join-Path $Dest 'dist\index.html'

  # atalho na Area de Trabalho
  $Lnk = Join-Path $Desk "$Name.lnk"
  $Shell = New-Object -ComObject WScript.Shell
  $S = $Shell.CreateShortcut($Lnk)
  $S.TargetPath = $App
  $S.WorkingDirectory = Join-Path $Dest 'dist'
  $S.IconLocation = (Join-Path $Dest 'assets\icone.ico') + ',0'
  $S.Description = 'Passeio virtual 3D da casa'
  $S.Save()

  Say "Pronto! Instalado em: $Dest"
  Say "Atalho criado: $Lnk"
  if (-not $env:CASA3D_NO_OPEN) { Start-Process $App }
}
finally {
  Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}

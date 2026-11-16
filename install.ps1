# Instalador da Casa 3D - Windows (PowerShell)
#   irm https://raw.githubusercontent.com/dhqdev/home/main/install.ps1 | iex
#
# Baixa a versao mais recente, o programa que abre a casa numa janela propria
# (Electron, ~100 MB, so na primeira vez) e cria a pasta "Casa 3D" e o atalho
# "Casa 3D" na Area de Trabalho. Ele NAO abre nada sozinho: a casa so abre pelo
# atalho, e o programa fecha por completo quando voce fecha a janela.
# Rodar de novo atualiza (ou use o botao "Buscar atualizacoes" do menu).

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = 'dhqdev/home'
$Branch = if ($env:CASA3D_BRANCH) { $env:CASA3D_BRANCH } else { 'main' }
$Name = 'Casa 3D'
$Url = "https://codeload.github.com/$Repo/zip/refs/heads/$Branch"
$ElectronVersion = '33.2.1'
$Arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } elseif ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'ia32' }
$Tag = "$ElectronVersion-$Arch"

function Say($t) { Write-Host "==> $t" -ForegroundColor Yellow }
function Warn($t) { Write-Host "!! $t" -ForegroundColor Red }

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

  # substitui a instalacao antiga, guardando o programa ja baixado
  $Keep = Join-Path $Tmp 'keep'
  New-Item -ItemType Directory -Force -Path $Keep | Out-Null
  if (Test-Path $Dest) {
    if (-not (Test-Path (Join-Path $Dest '.casa3d'))) { throw "Ja existe uma pasta '$Dest' que nao foi criada por este instalador. Renomeie-a e rode de novo." }
    $Ver = Join-Path $Dest 'runtime\.electron-version'
    if ((Test-Path $Ver) -and ((Get-Content $Ver -Raw).Trim() -eq $Tag)) { Move-Item (Join-Path $Dest 'runtime') (Join-Path $Keep 'runtime') }
    Remove-Item -Recurse -Force $Dest
  }
  Move-Item $Src.FullName $Dest
  New-Item -ItemType File -Path (Join-Path $Dest '.casa3d') -Force | Out-Null

  # programa (janela propria)
  $Runtime = Join-Path $Dest 'runtime'
  $Exe = Join-Path $Runtime "$Name.exe"
  $AppOk = $false
  try {
    if (Test-Path (Join-Path $Keep 'runtime')) {
      Move-Item (Join-Path $Keep 'runtime') $Runtime
    } else {
      Say 'Baixando o programa que abre a casa (so na primeira vez, ~100 MB)...'
      $EZip = Join-Path $Tmp 'electron.zip'
      Invoke-WebRequest -Uri "https://github.com/electron/electron/releases/download/v$ElectronVersion/electron-v$ElectronVersion-win32-$Arch.zip" -OutFile $EZip -UseBasicParsing
      Expand-Archive -Path $EZip -DestinationPath $Runtime -Force
      Rename-Item (Join-Path $Runtime 'electron.exe') "$Name.exe"
      Set-Content -Path (Join-Path $Runtime '.electron-version') -Value $Tag
    }
    if (Test-Path $Exe) { $AppOk = $true }
  } catch {
    Warn "Nao consegui baixar o programa ($($_.Exception.Message)). A casa vai abrir no navegador."
  }

  # atalhos (Area de Trabalho e menu Iniciar)
  $Shell = New-Object -ComObject WScript.Shell
  $Old = Join-Path $Desk "$Name.lnk"
  $StartMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
  foreach ($Lnk in @($Old, (Join-Path $StartMenu "$Name.lnk"))) {
    try {
      $S = $Shell.CreateShortcut($Lnk)
      if ($AppOk) {
        $S.TargetPath = $Exe
        $S.Arguments = '"' + (Join-Path $Dest 'app') + '"'
        $S.WorkingDirectory = $Dest
      } else {
        $S.TargetPath = Join-Path $Dest 'dist\index.html'
        $S.Arguments = ''
        $S.WorkingDirectory = Join-Path $Dest 'dist'
      }
      $S.IconLocation = (Join-Path $Dest 'assets\icone.ico') + ',0'
      $S.Description = 'Passeio virtual 3D da casa'
      $S.Save()
    } catch { }
  }

  Say "Pronto! Instalado em: $Dest"
  Say "Para abrir, de dois cliques no atalho '$Name' da Area de Trabalho."
  if ($AppOk) { Say 'Ao fechar a janela, o programa fecha por completo. Atualizacoes: menu (Esc) > Buscar atualizacoes.' }
}
finally {
  Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}

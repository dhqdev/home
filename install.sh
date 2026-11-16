#!/usr/bin/env bash
# Instalador da Casa 3D — macOS e Linux
#   curl -fsSL https://raw.githubusercontent.com/dhqdev/home/main/install.sh | bash
#
# O que ele faz:
#   1. instala o que faltar para baixar e descompactar (curl, tar, unzip);
#   2. baixa a versão mais recente do repositório dhqdev/home;
#   3. baixa o programa que abre a casa numa janela própria (Electron, ~100 MB, só na 1ª vez);
#   4. cria a pasta "Casa 3D" e o atalho "Casa 3D" na sua Área de Trabalho.
# Ele NÃO abre nada sozinho: a casa só abre quando você der dois cliques no atalho,
# e o programa fecha por completo quando você fecha a janela.
# Rodar de novo atualiza para a versão mais recente (ou use o botão "Buscar atualizações" do menu).
set -euo pipefail

REPO="dhqdev/home"
BRANCH="${CASA3D_BRANCH:-main}"
NAME="Casa 3D"
URL="${CASA3D_URL:-https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}}"
ELECTRON_VERSION="33.2.1"

say() { printf '\033[1;33m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;31m!!\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31mErro:\033[0m %s\n' "$*" >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }

OS="$(uname -s)"
case "$(uname -m)" in
  x86_64 | amd64) ARCH="x64" ;;
  aarch64 | arm64) ARCH="arm64" ;;
  armv7l) ARCH="armv7l" ;;
  *) ARCH="" ;;
esac

# ---------- instalar pacotes (Linux) ----------
SUDO=""
if [ "$(id -u)" -ne 0 ] && has sudo; then SUDO="sudo"; fi
APT_UPDATED=""
pkg_install() {
  if has apt-get; then
    [ -n "$APT_UPDATED" ] || { $SUDO apt-get update -y >/dev/null 2>&1 || true; APT_UPDATED=1; }
    $SUDO apt-get install -y "$@"
  elif has dnf; then $SUDO dnf install -y "$@"
  elif has yum; then $SUDO yum install -y "$@"
  elif has pacman; then $SUDO pacman -Sy --noconfirm "$@"
  elif has zypper; then $SUDO zypper --non-interactive install "$@"
  elif has apk; then $SUDO apk add "$@"
  else return 1
  fi
}

if ! has tar; then
  say "Instalando tar..."
  [ "$OS" = "Linux" ] && pkg_install tar || die "instale o 'tar' e rode de novo."
fi
if ! has curl && ! has wget; then
  say "Instalando curl..."
  [ "$OS" = "Linux" ] && pkg_install curl || die "instale o 'curl' e rode de novo."
fi
if [ "$OS" = "Linux" ] && ! has unzip && ! has python3; then
  say "Instalando unzip..."
  pkg_install unzip || warn "não consegui instalar o unzip."
fi

fetch() { # fetch URL ARQUIVO
  if has curl; then curl -fL --retry 3 --progress-bar -o "$2" "$1"
  else wget -q --show-progress -O "$2" "$1"; fi
}
unzip_to() { # unzip_to ARQUIVO PASTA
  mkdir -p "$2"
  if [ "$OS" = "Darwin" ]; then ditto -x -k "$1" "$2"
  elif has unzip; then unzip -q -o "$1" -d "$2"
  else python3 - "$1" "$2" <<'PY'
import sys, zipfile, os
z = zipfile.ZipFile(sys.argv[1])
for i in z.infolist():
    z.extract(i, sys.argv[2])
    mode = (i.external_attr >> 16) & 0o777
    if mode: os.chmod(os.path.join(sys.argv[2], i.filename), mode)
PY
  fi
}

# ---------- Área de Trabalho ----------
DESK=""
if [ "$OS" = "Darwin" ]; then
  DESK="$HOME/Desktop"
else
  if has xdg-user-dir; then DESK="$(xdg-user-dir DESKTOP 2>/dev/null || true)"; fi
  if [ -z "$DESK" ] || [ "$DESK" = "$HOME" ] || [ ! -d "$DESK" ]; then
    for d in "$HOME/Área de Trabalho" "$HOME/Área de trabalho" "$HOME/Desktop" "$HOME/Escritorio"; do
      if [ -d "$d" ]; then DESK="$d"; break; fi
    done
  fi
  [ -n "$DESK" ] || DESK="$HOME/Desktop"
fi
mkdir -p "$DESK"
DEST="$DESK/$NAME"
MACAPP="$NAME.app"

# ---------- download da casa ----------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
say "Baixando a Casa 3D ($REPO@$BRANCH)..."
fetch "$URL" "$TMP/casa.tar.gz"
mkdir -p "$TMP/x"
tar -xzf "$TMP/casa.tar.gz" -C "$TMP/x"
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -f "$SRC/dist/index.html" ] || die "o pacote baixado não contém dist/index.html."

# ---------- substituir a instalação antiga (guardando o programa já baixado) ----------
KEEP="$TMP/keep"
mkdir -p "$KEEP"
if [ -e "$DEST" ]; then
  [ -f "$DEST/.casa3d" ] || die "já existe uma pasta \"$DEST\" que não foi criada por este instalador. Renomeie-a e rode de novo."
  if [ "$(cat "$DEST/runtime/.electron-version" 2>/dev/null || true)" = "$ELECTRON_VERSION-$ARCH" ]; then
    mv "$DEST/runtime" "$KEEP/runtime"
  fi
  if [ "$(cat "$DEST/$MACAPP/.electron-version" 2>/dev/null || true)" = "$ELECTRON_VERSION-$ARCH" ]; then
    mv "$DEST/$MACAPP" "$KEEP/$MACAPP"
  fi
  rm -rf "$DEST"
fi
mv "$SRC" "$DEST"
touch "$DEST/.casa3d"
rm -f "$DESK/$NAME.html" # atalho antigo (versão 1)

# ---------- programa (janela própria) ----------
EZIP="electron-v${ELECTRON_VERSION}-$([ "$OS" = "Darwin" ] && echo darwin || echo linux)-${ARCH}.zip"
EURL="https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/${EZIP}"
APP_OK=""

install_runtime_linux() {
  if [ -d "$KEEP/runtime" ]; then
    mv "$KEEP/runtime" "$DEST/runtime"
  else
    say "Baixando o programa que abre a casa (só na primeira vez, ~100 MB)..."
    fetch "$EURL" "$TMP/electron.zip" || return 1
    unzip_to "$TMP/electron.zip" "$DEST/runtime" || return 1
    echo "$ELECTRON_VERSION-$ARCH" > "$DEST/runtime/.electron-version"
  fi
  chmod +x "$DEST/runtime/electron"
  # bibliotecas que o programa precisa (já vêm em quase todo Linux com interface gráfica)
  if has ldd && ldd "$DEST/runtime/electron" 2>/dev/null | grep -q "not found"; then
    say "Instalando bibliotecas que faltam..."
    if has apt-get; then
      pkg_install libnss3 libgbm1 libgtk-3-0 libxss1 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxshmfence1 >/dev/null 2>&1 || true
      pkg_install libasound2t64 >/dev/null 2>&1 || pkg_install libasound2 >/dev/null 2>&1 || true
    elif has dnf; then pkg_install nss mesa-libgbm gtk3 libXScrnSaver alsa-lib >/dev/null 2>&1 || true
    elif has pacman; then pkg_install nss mesa gtk3 libxss alsa-lib >/dev/null 2>&1 || true
    elif has zypper; then pkg_install mozilla-nss libgbm1 gtk3 alsa >/dev/null 2>&1 || true
    fi
  fi
  return 0
}

install_runtime_mac() {
  local A="$DEST/$MACAPP"
  if [ -d "$KEEP/$MACAPP" ]; then
    mv "$KEEP/$MACAPP" "$A"
  else
    say "Baixando o programa que abre a casa (só na primeira vez, ~100 MB)..."
    fetch "$EURL" "$TMP/electron.zip" || return 1
    unzip_to "$TMP/electron.zip" "$TMP/e" || return 1
    mv "$TMP/e/Electron.app" "$A" || return 1
    echo "$ELECTRON_VERSION-$ARCH" > "$A/.electron-version"
    local PL="$A/Contents/Info.plist"
    /usr/libexec/PlistBuddy -c "Set :CFBundleName $NAME" "$PL" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $NAME" "$PL" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $NAME" "$PL" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.dhqdev.casa3d" "$PL" 2>/dev/null || true
    # ícone da casa
    if has sips && has iconutil; then
      local IS="$TMP/icone.iconset"
      mkdir -p "$IS"
      for s in 16 32 128 256 512; do
        sips -z $s $s "$DEST/assets/icone.png" --out "$IS/icon_${s}x${s}.png" >/dev/null 2>&1 || true
        sips -z $((s * 2)) $((s * 2)) "$DEST/assets/icone.png" --out "$IS/icon_${s}x${s}@2x.png" >/dev/null 2>&1 || true
      done
      iconutil -c icns "$IS" -o "$A/Contents/Resources/electron.icns" 2>/dev/null || true
    fi
  fi
  # o código do programa vai dentro do .app (o Electron abre Resources/app sozinho)
  rm -rf "$A/Contents/Resources/app"
  cp -R "$DEST/app" "$A/Contents/Resources/app"
  xattr -cr "$A" 2>/dev/null || true
  codesign --force --deep --sign - "$A" >/dev/null 2>&1 || true
  return 0
}

if [ -z "$ARCH" ]; then
  warn "processador não suportado pelo programa; a casa vai abrir no navegador."
elif [ "$OS" = "Darwin" ]; then
  install_runtime_mac && APP_OK=1 || warn "não consegui baixar o programa; a casa vai abrir no navegador."
else
  install_runtime_linux && APP_OK=1 || warn "não consegui baixar o programa; a casa vai abrir no navegador."
fi

# ---------- atalho na Área de Trabalho ----------
if [ "$OS" = "Darwin" ]; then
  if [ -n "$APP_OK" ]; then
    LINK="$DESK/$MACAPP"
    rm -rf "$LINK"
    ln -s "$DEST/$MACAPP" "$LINK"
    mkdir -p "$HOME/Applications" && rm -rf "$HOME/Applications/$MACAPP" && ln -s "$DEST/$MACAPP" "$HOME/Applications/$MACAPP" || true
  else
    LINK="$DESK/$NAME.html"
    ln -sf "$DEST/dist/index.html" "$LINK"
  fi
else
  LINK="$DESK/$NAME.desktop"
  if [ -n "$APP_OK" ]; then
    EXEC="\"$DEST/runtime/electron\" --no-sandbox \"$DEST/app\""
  else
    EXEC="xdg-open \"$DEST/dist/index.html\""
  fi
  cat > "$LINK" <<EOF
[Desktop Entry]
Type=Application
Name=$NAME
Comment=Passeio virtual 3D da casa
Exec=$EXEC
Path=$DEST
Icon=$DEST/assets/icone.png
Terminal=false
Categories=Graphics;
EOF
  chmod +x "$LINK"
  has gio && gio set "$LINK" metadata::trusted true 2>/dev/null || true
  mkdir -p "$HOME/.local/share/applications"
  cp "$LINK" "$HOME/.local/share/applications/casa-3d.desktop" 2>/dev/null || true
fi

say "Pronto! Instalado em: $DEST"
say "Para abrir, dê dois cliques no atalho \"$NAME\" da Área de Trabalho."
[ -n "$APP_OK" ] && say "Ao fechar a janela, o programa fecha por completo. Atualizações: menu (Esc) > Buscar atualizações."
exit 0

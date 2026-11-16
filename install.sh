#!/usr/bin/env bash
# Instalador da Casa 3D — macOS e Linux
#   curl -fsSL https://raw.githubusercontent.com/dhqdev/home/main/install.sh | bash
#
# O que ele faz:
#   1. instala o que faltar para baixar (curl/tar) e um navegador, se não houver nenhum;
#   2. baixa a versão mais recente do repositório dhqdev/home;
#   3. cria a pasta "Casa 3D" na sua Área de Trabalho + um atalho "Casa 3D";
#   4. abre a casa no navegador.
# Rodar de novo atualiza para a versão mais recente.
set -euo pipefail

REPO="dhqdev/home"
BRANCH="${CASA3D_BRANCH:-main}"
NAME="Casa 3D"
URL="${CASA3D_URL:-https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}}"

say() { printf '\033[1;33m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mErro:\033[0m %s\n' "$*" >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }

OS="$(uname -s)"

# ---------- instalar pacotes (Linux) ----------
SUDO=""
if [ "$(id -u)" -ne 0 ] && has sudo; then SUDO="sudo"; fi
pkg_install() {
  if has apt-get; then $SUDO apt-get update -y && $SUDO apt-get install -y "$@"
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

# ---------- navegador ----------
if [ "$OS" = "Linux" ]; then
  found=""
  for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser firefox; do
    if has "$b"; then found="$b"; break; fi
  done
  if [ -z "$found" ] && [ -z "$(xdg-settings get default-web-browser 2>/dev/null || true)" ]; then
    say "Nenhum navegador encontrado. Instalando o Firefox..."
    pkg_install firefox || pkg_install firefox-esr || say "Não consegui instalar um navegador automaticamente; instale o Chrome ou o Firefox."
  fi
fi

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

# ---------- download ----------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
say "Baixando a Casa 3D ($REPO@$BRANCH)..."
if has curl; then curl -fsSL --retry 3 -o "$TMP/casa.tar.gz" "$URL"
else wget -q -O "$TMP/casa.tar.gz" "$URL"; fi
mkdir -p "$TMP/x"
tar -xzf "$TMP/casa.tar.gz" -C "$TMP/x"
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -f "$SRC/dist/index.html" ] || die "o pacote baixado não contém dist/index.html."

# ---------- instalar na Área de Trabalho ----------
if [ -e "$DEST" ]; then
  if [ -f "$DEST/.casa3d" ]; then
    rm -rf "$DEST"
  else
    die "já existe uma pasta \"$DEST\" que não foi criada por este instalador. Renomeie-a e rode de novo."
  fi
fi
mv "$SRC" "$DEST"
touch "$DEST/.casa3d"
APP="$DEST/dist/index.html"

# ---------- atalho ----------
if [ "$OS" = "Darwin" ]; then
  LINK="$DESK/$NAME.html"
  rm -f "$LINK"
  ln -s "$APP" "$LINK"
else
  LINK="$DESK/$NAME.desktop"
  cat > "$LINK" <<EOF
[Desktop Entry]
Type=Application
Name=$NAME
Comment=Passeio virtual 3D da casa
Exec=xdg-open "$APP"
Icon=$DEST/assets/icone.png
Terminal=false
Categories=Graphics;
EOF
  chmod +x "$LINK"
  has gio && gio set "$LINK" metadata::trusted true 2>/dev/null || true
  # também no menu de aplicativos
  mkdir -p "$HOME/.local/share/applications"
  cp "$LINK" "$HOME/.local/share/applications/casa-3d.desktop" 2>/dev/null || true
fi

say "Pronto! Instalado em: $DEST"
say "Atalho criado: $LINK"

# ---------- abrir ----------
if [ -z "${CASA3D_NO_OPEN:-}" ]; then
  if [ "$OS" = "Darwin" ]; then open "$APP"
  elif has xdg-open; then (xdg-open "$APP" >/dev/null 2>&1 &) || true
  fi
fi

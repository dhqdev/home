// Casa 3D — programa de desktop (Electron).
// Abre a casa numa janela própria; fechar a janela encerra o programa por completo.
// O botão "Buscar atualizações" do menu baixa a versão mais nova do GitHub e reinicia.
const { app, BrowserWindow, ipcMain, Menu, net, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFile } = require('node:child_process');

const REPO = 'dhqdev/home';
const BRANCH = 'main';

// pasta de instalação: a primeira acima deste arquivo que tem o marcador .casa3d (ou dist/index.html)
function findRoot() {
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, '.casa3d')) || fs.existsSync(path.join(d, 'dist', 'index.html'))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return path.resolve(__dirname, '..');
}
const ROOT = findRoot();

function localVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}
const newer = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};

// melhor desempenho gráfico e música tocando sem precisar de clique
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.setName('Casa 3D');

// uma janela só: abrir o atalho de novo traz a janela existente para a frente
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win = null;
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  function createWindow() {
    const icon = path.join(ROOT, 'assets', 'icone.png');
    win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      show: false,
      title: 'Casa 43 — Passeio Virtual 3D',
      backgroundColor: '#0d0d0f',
      autoHideMenuBar: true,
      icon: fs.existsSync(icon) ? icon : undefined,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    win.once('ready-to-show', () => {
      win.maximize();
      win.show();
    });
    // F11 = tela cheia
    win.webContents.on('before-input-event', (e, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') {
        win.setFullScreen(!win.isFullScreen());
        e.preventDefault();
      }
    });
    // links externos abrem no navegador
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    win.on('closed', () => (win = null));
    win.loadFile(path.join(ROOT, 'dist', 'index.html'));
    // autoteste (usado só no desenvolvimento): CASA3D_SELFTEST=arquivo.jpg
    if (process.env.CASA3D_SELFTEST) {
      setTimeout(async () => {
        const img = await win.webContents.capturePage();
        fs.writeFileSync(process.env.CASA3D_SELFTEST, img.toJPEG(80));
        console.log('SELFTEST', await win.webContents.executeJavaScript('JSON.stringify({app: !!window.casaApp, menu: !document.getElementById("menu").classList.contains("hidden"), version: document.getElementById("version").textContent})'));
        app.quit();
      }, +(process.env.CASA3D_SELFTEST_WAIT || 25000));
    }
  }

  app.whenReady().then(() => {
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
    } else {
      Menu.setApplicationMenu(null);
    }
    createWindow();
  });

  // fechou a janela = fecha o programa (inclusive no macOS)
  app.on('window-all-closed', () => app.quit());

  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:fullscreen', () => win && win.setFullScreen(!win.isFullScreen()));

  // ---------------- atualizações ----------------
  async function latestVersion() {
    const res = await net.fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/package.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('GitHub respondeu ' + res.status);
    return (await res.json()).version;
  }

  ipcMain.handle('update:check', async () => {
    const current = localVersion();
    const latest = await latestVersion();
    return { current, latest, available: newer(latest, current) };
  });

  const run = (cmd, args) =>
    new Promise((resolve, reject) => execFile(cmd, args, { windowsHide: true }, (err, _o, se) => (err ? reject(new Error(se || err.message)) : resolve())));

  ipcMain.handle('update:apply', async (event) => {
    const say = (t) => !event.sender.isDestroyed() && event.sender.send('update:progress', t);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'casa3d-'));
    try {
      say('Baixando a versão nova...');
      const res = await net.fetch(`https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}?t=${Date.now()}`);
      if (!res.ok) throw new Error('download falhou (' + res.status + ')');
      const chunks = [];
      let got = 0;
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
        got += value.length;
        say(`Baixando a versão nova... ${(got / 1048576).toFixed(1)} MB`);
      }
      const file = path.join(tmp, 'casa.tar.gz');
      fs.writeFileSync(file, Buffer.concat(chunks));
      say('Instalando...');
      const out = path.join(tmp, 'x');
      fs.mkdirSync(out);
      await run(process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar', ['-xzf', file, '-C', out]);
      const src = path.join(out, fs.readdirSync(out)[0]);
      if (!fs.existsSync(path.join(src, 'dist', 'index.html'))) throw new Error('pacote incompleto');
      for (const name of ['dist', 'assets', 'app', 'package.json', 'README.md', 'install.sh', 'install.ps1']) {
        const from = path.join(src, name);
        if (fs.existsSync(from)) fs.cpSync(from, path.join(ROOT, name), { recursive: true, force: true });
      }
      // este programa pode estar rodando de dentro do runtime (resources/app): atualiza essa cópia também
      if (path.resolve(__dirname) !== path.resolve(ROOT, 'app')) fs.cpSync(path.join(src, 'app'), __dirname, { recursive: true, force: true });
      say('Atualizado! Reiniciando...');
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 900);
      return true;
    } finally {
      setTimeout(() => fs.rmSync(tmp, { recursive: true, force: true }), 500);
    }
  });
}

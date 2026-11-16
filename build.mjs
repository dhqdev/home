// Gera dist/index.html: um único arquivo HTML com todo o código embutido.
// Assim a casa abre direto no navegador (duplo clique), sem servidor nem instalação.
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');

const inline = {
  name: 'inline-html',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) return;
      const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
      const tpl = readFileSync('src/index.html', 'utf8');
      const html = tpl.replace('<!--BUNDLE-->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
      mkdirSync('dist', { recursive: true });
      writeFileSync('dist/index.html', html);
      console.log(`dist/index.html gerado (${(html.length / 1024).toFixed(0)} KB)`);
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: !watch,
  format: 'iife',
  target: 'es2020',
  write: false,
  outfile: 'dist/bundle.js',
  plugins: [inline],
  legalComments: 'none',
});

if (watch) {
  await ctx.watch();
  console.log('Observando alterações em src/ ... abra dist/index.html no navegador.');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}

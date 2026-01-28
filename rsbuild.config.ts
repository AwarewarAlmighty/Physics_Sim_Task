import process from 'node:process';
import path from 'node:path';
import { defineConfig, rspack } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginEslint } from "@rsbuild/plugin-eslint";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_PATH = path.resolve(process.cwd(), 'src');

export default defineConfig(({ env }) => ({
  output: {
    distPath: {
      root: 'build',
    },
  },
  server: {
    port: 8000,
  },
  dev: {
    progressBar: false,
  },
  resolve: {
    alias: {
      '@elice/extcontent-apis': path.join(SRC_PATH, 'elice', 'apis'),
      '@elice/extcontent-utils': path.join(SRC_PATH, 'elice', 'utils'),
    },
  },
  tools: {
    rspack: {
      plugins: [
        new rspack.DefinePlugin({
          'process.env.REACT_APP_ELICE_EXTERNAL_CONTENT_API': JSON.stringify(
            process.env.REACT_APP_ELICE_EXTERNAL_CONTENT_API
          ),
        }),
      ],
    },
  },
  plugins: [
    pluginReact(),
    pluginSvgr({
      mixedImport: true,
      svgrOptions: {
        svgo: false,
        exportType: 'named',
      },
    }),
    pluginEslint({
      enable: false,
      eslintPluginOptions: {
        cwd: __dirname,
        fix: env !== 'production',
        configType: 'eslintrc',
      }
    }),
  ],
  html: {
    template: './public/index.html',
  },
}));

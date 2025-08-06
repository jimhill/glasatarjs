#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

// Build the library bundle
async function build() {
  console.log('Building library bundle...');
  
  // Generate TypeScript declarations first
  console.log('Generating TypeScript declarations...');
  const { execSync } = await import('child_process');
  execSync('tsc -p tsconfig.lib.json', { stdio: 'inherit' });

  // Bundle the main library (overwrites the tsc output)
  console.log('Bundling main library...');
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2015',
    outfile: 'dist/index.js',
    external: ['react', 'react-dom'],
    sourcemap: true,
    minify: false, // Keep readable for debugging
  });

  // Bundle the core library (no React)
  console.log('Bundling core library...');
  await esbuild.build({
    entryPoints: ['src/lib/index.ts'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2015',
    outfile: 'core.js',
    sourcemap: true,
    minify: false,
  });

  console.log('Build complete!');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
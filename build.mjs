#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, rmSync } from 'fs';

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

  // Clean up unbundled JavaScript files (keep only .d.ts files and bundled files)
  console.log('Cleaning up unbundled JavaScript files...');
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Helper function to recursively remove .js and .js.map files but keep .d.ts files
    function cleanDirectory(dirPath) {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          cleanDirectory(itemPath);
          // Remove empty directories after cleaning
          try {
            const remaining = fs.readdirSync(itemPath);
            if (remaining.length === 0) {
              fs.rmdirSync(itemPath);
              console.log(`Removed empty directory ${itemPath}`);
            }
          } catch (error) {
            // Directory might not be empty, ignore
          }
        } else if (item.endsWith('.js') || item.endsWith('.js.map')) {
          fs.unlinkSync(itemPath);
          console.log(`Removed ${itemPath}`);
        }
      }
    }
    
    // Clean lib and components directories but preserve .d.ts files
    cleanDirectory('dist/lib');
    cleanDirectory('dist/components');
    
    // Remove individual .js files in root dist but keep the bundled index.js
    const distFiles = fs.readdirSync('dist');
    for (const file of distFiles) {
      if (file.endsWith('.js') && file !== 'index.js') {
        fs.unlinkSync(path.join('dist', file));
        console.log(`Removed ${file}`);
      }
      if (file.endsWith('.js.map') && file !== 'index.js.map') {
        fs.unlinkSync(path.join('dist', file));
        console.log(`Removed ${file}`);
      }
    }
    
    console.log('Cleaned up unbundled JavaScript files while preserving TypeScript declarations');
  } catch (error) {
    console.log('Error cleaning up files:', error.message);
  }

  console.log('Build complete!');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
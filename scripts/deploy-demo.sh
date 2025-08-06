#!/bin/bash

# Build the demo
echo "Building demo..."
npm run build:demo

# Create a temporary directory for gh-pages
echo "Preparing for deployment..."
mkdir -p gh-pages-temp
cp -r dist-demo/* gh-pages-temp/

# Initialize git in the temp directory
cd gh-pages-temp
git init
git add -A
git commit -m "Deploy demo to GitHub Pages"

# Push to gh-pages branch
echo "Deploying to GitHub Pages..."
git push -f https://github.com/jimhill/speech-visualiser.git main:gh-pages

# Clean up
cd ..
rm -rf gh-pages-temp

echo "Demo deployed successfully!"
echo "Visit https://jimhill.github.io/speech-visualiser/ to see the demo"
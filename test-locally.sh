#!/bin/bash

echo "=== Testing Glasatar Package Locally ==="
echo ""

# Step 1: Build the library
echo "Step 1: Building library..."
npm run build:lib
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Library built successfully"
echo ""

# Step 2: Pack the library (creates a tarball like npm would)
echo "Step 2: Creating package tarball..."
npm pack
if [ $? -ne 0 ]; then
    echo "❌ Pack failed"
    exit 1
fi
TARBALL=$(ls -t *.tgz | head -1)
echo "✅ Created $TARBALL"
echo ""

# Step 3: Install in test app
echo "Step 3: Installing in test app..."
cd test-package
npm uninstall @jimhill/glasatarjs 2>/dev/null
npm install ../$TARBALL
if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    cd ..
    rm $TARBALL
    exit 1
fi
cd ..
echo "✅ Package installed in test app"
echo ""

# Step 4: Clean up tarball
rm $TARBALL
echo "✅ Cleaned up tarball"
echo ""

echo "=== Setup Complete ==="
echo ""
echo "To test the package:"
echo "  1. cd test-package"
echo "  2. npm run dev"
echo "  3. Open http://localhost:3000/test-glasatar"
echo ""
echo "This simulates exactly how the package will work when installed from npm."
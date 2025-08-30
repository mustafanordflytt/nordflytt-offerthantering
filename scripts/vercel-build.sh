#!/bin/bash
# Vercel build script with error handling

echo "Starting Vercel build..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean previous builds
echo "Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund

# Build the application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
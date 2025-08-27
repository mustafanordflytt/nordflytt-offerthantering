#!/bin/bash

echo "🧹 Rensar all cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

echo "📦 Rensar paketcache..."
npm cache clean --force

echo "🔄 Startar om servern..."
npm run dev
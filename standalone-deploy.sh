#!/bin/bash

# Standalone deployment script for Nordflytt API
echo "🚀 Nordflytt API Standalone Deployment"
echo "====================================="
echo ""

# Step 1: Update next.config.js for standalone
echo "📝 Updating next.config.js for standalone output..."
cat > next.config.standalone.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
      'date-fns'
    ],
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Skip problematic pages during build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  webpack: (config, { isServer }) => {
    // Fix for missing modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    // Ignore problematic files
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader'
    });
    
    return config;
  },
};

export default nextConfig;
EOF

# Backup original config
cp next.config.js next.config.js.backup

# Use standalone config
cp next.config.standalone.js next.config.js

# Step 2: Build with standalone output
echo ""
echo "🔨 Building standalone application..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Restoring original config..."
    cp next.config.js.backup next.config.js
    exit 1
fi

# Step 3: Prepare standalone deployment
echo ""
echo "📦 Preparing standalone deployment..."

# Create deployment directory
mkdir -p standalone-deploy
cp -r .next/standalone/* standalone-deploy/
cp -r .next/static standalone-deploy/.next/
cp -r public standalone-deploy/

# Copy environment file
cp .env.production standalone-deploy/

# Create start script
cat > standalone-deploy/start.sh << 'EOF'
#!/bin/bash
PORT=3000 NODE_ENV=production node server.js
EOF
chmod +x standalone-deploy/start.sh

# Restore original config
cp next.config.js.backup next.config.js

echo ""
echo "✅ Standalone build complete!"
echo ""
echo "📋 Deployment Instructions:"
echo "=========================="
echo ""
echo "1. Upload the 'standalone-deploy' folder to your server"
echo "2. On the server, run:"
echo "   cd standalone-deploy"
echo "   npm install"
echo "   ./start.sh"
echo ""
echo "3. Configure nginx/Apache to proxy to port 3000"
echo ""
echo "The standalone build is in: ./standalone-deploy/"
echo "Size: $(du -sh standalone-deploy | cut -f1)"
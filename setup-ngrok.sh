#!/bin/bash

# Setup ngrok for HTTPS testing
echo "🔧 Setting up ngrok for HTTPS testing..."

# Check if ngrok is already installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is already installed"
else
    echo "📥 Downloading ngrok..."
    
    # Download ngrok for macOS
    curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip -o ngrok.zip
    
    # Extract ngrok
    unzip -o ngrok.zip
    
    # Make it executable
    chmod +x ngrok
    
    # Clean up
    rm ngrok.zip
    
    echo "✅ ngrok downloaded successfully"
fi

# Create ngrok configuration
cat > ngrok.yml << EOF
version: "2"
authtoken: # Add your authtoken here if you have one
tunnels:
  nordflytt:
    proto: http
    addr: 3000
    schemes:
      - https
    host_header: "localhost:3000"
EOF

echo "📝 Created ngrok.yml configuration"
echo ""
echo "🚀 To start ngrok tunnel:"
echo "   ./ngrok http 3000"
echo ""
echo "📱 This will provide an HTTPS URL for testing camera functionality"
echo ""
echo "Next steps:"
echo "1. Start your Next.js app: npm run dev"
echo "2. In another terminal: ./ngrok http 3000"
echo "3. Use the HTTPS URL provided by ngrok to test camera"
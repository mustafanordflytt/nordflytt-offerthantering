#!/bin/bash

# Script to generate security keys for production

echo "🔐 Generating Security Keys for Nordflytt Production"
echo "===================================================="

# Function to generate random hex string
generate_key() {
    openssl rand -hex 32
}

# Generate keys
JWT_SECRET=$(generate_key)
INTERNAL_API_KEY=$(generate_key)
ENCRYPTION_KEY=$(generate_key)
PARTNER_API_KEY=$(generate_key)
MOBILE_APP_KEY=$(generate_key)
PERSONAL_NUMBER_SALT=$(generate_key)

# Create .env.production file
cat > .env.production << EOF
# Security Keys (Generated on $(date))
JWT_SECRET=$JWT_SECRET
INTERNAL_API_KEY=$INTERNAL_API_KEY
ENCRYPTION_KEY=$ENCRYPTION_KEY
PARTNER_API_KEY=$PARTNER_API_KEY
MOBILE_APP_KEY=$MOBILE_APP_KEY
PERSONAL_NUMBER_SALT=$PERSONAL_NUMBER_SALT

# Add other production environment variables below
EOF

echo "✅ Security keys generated successfully!"
echo ""
echo "📋 Keys have been saved to .env.production"
echo ""
echo "⚠️  IMPORTANT: "
echo "   1. Keep .env.production secure and never commit it to git"
echo "   2. Add these keys to your deployment platform (Vercel/Netlify/etc)"
echo "   3. Backup these keys securely"
echo ""
echo "🚀 To use in Vercel:"
echo "   vercel secrets add jwt-secret '$JWT_SECRET'"
echo "   vercel secrets add internal-api-key '$INTERNAL_API_KEY'"
echo "   vercel secrets add encryption-key '$ENCRYPTION_KEY'"
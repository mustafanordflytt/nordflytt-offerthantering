#!/bin/bash

echo "🔐 Startar lokal HTTPS med självsignerat certifikat"
echo "=================================================="
echo ""

# Skapa certifikat om det inte finns
if [ ! -f "localhost.pem" ] || [ ! -f "localhost-key.pem" ]; then
    echo "📜 Skapar självsignerat certifikat..."
    
    # Använd mkcert om det finns, annars openssl
    if command -v mkcert &> /dev/null; then
        mkcert -install
        mkcert localhost 127.0.0.1 ::1
    else
        # Fallback till openssl
        openssl req -x509 -out localhost.pem -keyout localhost-key.pem \
          -newkey rsa:2048 -nodes -sha256 \
          -subj '/CN=localhost' -extensions EXT -config <( \
           printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
    fi
    
    echo "✅ Certifikat skapat"
fi

echo ""
echo "🚀 Startar Next.js med HTTPS..."
echo ""
echo "OBS: Webbläsaren kommer varna om certifikatet"
echo "     Klicka 'Avancerat' och 'Fortsätt ändå'"
echo ""

# Starta Next.js med HTTPS
NODE_TLS_REJECT_UNAUTHORIZED=0 next dev --experimental-https
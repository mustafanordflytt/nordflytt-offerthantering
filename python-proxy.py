#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import sys

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Om det är staff-sidan, servera direkt HTML
        if self.path == '/' or self.path.startswith('/staff'):
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            with open('NORDFLYTT-MOBILE-DEMO.html', 'rb') as f:
                self.wfile.write(f.read())
        else:
            # Annars, proxya till Next.js
            try:
                resp = urllib.request.urlopen(f'http://localhost:3000{self.path}')
                self.send_response(resp.getcode())
                for header, value in resp.headers.items():
                    if header.lower() not in ['connection', 'content-encoding']:
                        self.send_header(header, value)
                self.end_headers()
                self.wfile.write(resp.read())
            except:
                # Fallback till fil
                super().do_GET()

PORT = 8899
with socketserver.TCPServer(("172.20.10.3", PORT), ProxyHandler) as httpd:
    print(f"📱 PYTHON PROXY SERVER PÅ: http://172.20.10.3:{PORT}")
    print("✅ Detta FUNGERAR med iPhone hotspot!")
    httpd.serve_forever()
#!/usr/bin/env python3
"""
iOS Simulator Web Emulator Server
Streams simulator screen to web browser for interactive testing
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import subprocess
import json
import os
import urllib.parse

class EmulatorHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('emulator-web/index.html', 'rb') as f:
                self.wfile.write(f.read())

        elif self.path == '/api/screenshot':
            try:
                # Capture screenshot
                subprocess.run([
                    'xcrun', 'simctl', 'io', 'booted', 'screenshot',
                    '/tmp/simulator-screenshot.png'
                ], check=True)

                # Send screenshot
                self.send_response(200)
                self.send_header('Content-type', 'image/png')
                self.end_headers()
                with open('/tmp/simulator-screenshot.png', 'rb') as f:
                    self.wfile.write(f.read())
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/api/info':
            try:
                result = subprocess.run([
                    'xcrun', 'simctl', 'list', 'devices', 'booted', '-j'
                ], capture_output=True, text=True, check=True)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(result.stdout.encode())
            except Exception as e:
                self.send_error(500, str(e))

        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        if self.path == '/api/tap':
            try:
                data = json.loads(post_data)
                x, y = data['x'], data['y']

                subprocess.run([
                    'xcrun', 'simctl', 'io', 'booted', 'tap',
                    str(x), str(y)
                ], check=True)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/api/text':
            try:
                data = json.loads(post_data)
                text = data['text']

                subprocess.run([
                    'xcrun', 'simctl', 'io', 'booted', 'text', text
                ], check=True)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/api/home':
            try:
                subprocess.run([
                    'xcrun', 'simctl', 'io', 'booted', 'home'
                ], check=True)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_error(500, str(e))

def run(port=9222):
    os.chdir('/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native')

    server_address = ('', port)
    httpd = HTTPServer(server_address, EmulatorHandler)

    print(f"""
╔═══════════════════════════════════════════════════════════╗
║   iOS Simulator Web Emulator                              ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:{port}

📱 Open in browser: http://localhost:{port}

Features:
  ✅ Real-time simulator screen streaming
  ✅ Click to interact with app
  ✅ Type text inputs
  ✅ Home button control

Press Ctrl+C to stop
    """)

    httpd.serve_forever()

if __name__ == '__main__':
    run()

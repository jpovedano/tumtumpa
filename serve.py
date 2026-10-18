import http.server
import socketserver
import webbrowser
import os
import mimetypes
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

stdout_reconfigure = getattr(sys.stdout, "reconfigure", None)
if callable(stdout_reconfigure):
    stdout_reconfigure(encoding="utf-8", errors="replace")

# Ensure correct MIME types for audio and music files
mimetypes.add_type("application/vnd.recordare.musicxml+xml", ".musicxml")
mimetypes.add_type("application/vnd.recordare.musicxml", ".mxl")
mimetypes.add_type("application/xml", ".xml")
mimetypes.add_type("audio/x-soundfont", ".sf2")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/otf", ".otf")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Allow cross-origin requests for workers and soundfonts
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"\n=======================================================")
        print(f"🥁 DrumScore Practice Player is running!")
        print(f"👉 Local URL: {url}")
        print(f"Press Ctrl+C to stop the server.")
        print(f"=======================================================\n")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

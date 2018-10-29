#!/usr/bin/env python
"""
Very simple HTTP server in python.

Usage::
    ./dummy-web-server.py [<port>]
"""
from __future__ import division
import sys

if sys.version_info[0] < 3:
    # python 2 import
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
else:
    # python 3 import
    from http.server import BaseHTTPRequestHandler, HTTPServer

import rpi_backlight as bl


def get_brightness():
    return bl.get_actual_brightness()


def set_brightness(new_value):
    if new_value < 50:
        new_value = 50
    elif new_value > 255:
        new_value = 255

    current_value = get_brightness()
    diff = abs(current_value - new_value)
    duration = diff / 50
    if duration < 0.2:
        duration = 0

    bl.set_brightness(new_value, smooth=True, duration=duration)

    return get_brightness()


class BaseServer(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'text')
        self.end_headers()

    def do_GET(self):
        self._set_headers()
        self.wfile.write(str(get_brightness()).encode('utf-8'))

    def do_HEAD(self):
        self._set_headers()
        
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).strip()

        try:
            new_value = int(post_data)
            brightness = set_brightness(new_value)
            self._set_headers(200)
            self.wfile.write(str(brightness).encode('utf-8'))
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(str(e).encode('utf-8'))


def run(server_class=HTTPServer, handler_class=BaseServer, port=80):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print('HTTP server running on port %s' % port)
    httpd.serve_forever()


if __name__ == "__main__":
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()

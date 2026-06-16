"""
中文语音交互2D横版打怪小游戏 V2：本地运行服务器

运行方法：
1. 用 VS Code 打开本文件所在文件夹
2. 终端运行：python server.py
3. 浏览器打开：http://localhost:8000

注意：
- 麦克风权限通常要求 localhost 或 https 环境。
- 推荐 Chrome / Edge。
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import webbrowser

HOST = "localhost"
PORT = 8000

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

if __name__ == "__main__":
    url = f"http://{HOST}:{PORT}"
    print("=" * 60)
    print("中文语音交互2D横版打怪小游戏 V2 已启动")
    print(f"请打开：{url}")
    print("关闭服务器：终端按 Ctrl + C")
    print("=" * 60)
    webbrowser.open(url)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()

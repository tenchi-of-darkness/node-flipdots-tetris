import http from "node:http";
import fs from "node:fs";

http
	.createServer((req, res) => {
		if (req.url === "/view") {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
      <html><body style="margin:0;background:#fff;display:flex;justify-content:center;align-items:center">
        <img id="frame" src="/frame.png" style="image-rendering:pixelated;">
        <script>
          function updateFrame(time) {
            document.getElementById('frame').src = '/frame.png?t=' + time;
            requestAnimationFrame(updateFrame);
          }
          requestAnimationFrame(updateFrame);
        </script>
      </body></html>
    `);
		} else if (req.url.startsWith("/frame.png")) {
			res.writeHead(200, { "Content-Type": "image/png" });
			res.end(fs.readFileSync("./output/frame.png"));
		}
	})
	.listen(3000);

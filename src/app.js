import http from "http";
import url from "url";
import { startStreaming } from "./utills.js";

const PORT = +process.env.PORT;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (pathname === "/proxy/random" && method === "POST") {
    try {
      const datasetType = Math.floor(Math.random() * 2);

      res.writeHead(200);
      res.end();
      startStreaming();
    } catch (error) {
      console.error("Error getting random files:", error);
      const errorResponse = {
        success: false,
        error: "Internal server error",
      };
      res.writeHead(500);
      res.end(JSON.stringify(errorResponse, null, 2));
    }
  } else {
    const notFoundResponse = {
      success: false,
      error: "Not found",
    };
    res.writeHead(404);
    res.end(JSON.stringify(notFoundResponse, null, 2));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Access the random endpoint at: http://localhost:${PORT}/proxy/random`
  );
});

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5177);

const sampleMatches = [
  {
    group: "A组",
    round: "第五轮",
    datetime: "2026年7月1日 19:35",
    stage: "小组赛斯诺克赛段",
    event: "混合团体",
    homeTeam: "莫干山康溪",
    awayTeam: "山西华舰",
    homePlayers: ["石汉青", "谢圣杰", "齐劲锋", "索菲亚·别尔坚科"],
    awayPlayers: ["杨蒙", "陈飞龙", "马海龙", "蔡伟"],
    homeScores: ["59", "39", "0", "31", "64"],
    awayScores: ["6", "50", "109", "69", "30"],
  },
  {
    group: "A组",
    round: "第五轮",
    datetime: "2026年7月1日 19:35",
    stage: "小组赛斯诺克赛段",
    event: "混合团体",
    homeTeam: "小熊猫",
    awayTeam: "圣森台球",
    homePlayers: ["邱炮谋", "白云鹏", "孙源泽", "莫甜甜"],
    awayPlayers: ["刘子铃", "胡佳运", "杨佳欣", "肖扬"],
    homeScores: ["62", "9", "19", "61", "78"],
    awayScores: ["48", "78", "59", "58", "0"],
  },
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/extract") {
    await readRequestBody(request);
    sendJson(response, { matches: sampleMatches, warnings: [] });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end();
    return;
  }

  const requestPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
  const filePath = path.normalize(path.join(root, requestPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end();
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CBL tool running at http://localhost:${port}/`);
});

function sendJson(response, payload) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5177);
const extractProvider = (process.env.CBL_EXTRACT_PROVIDER || "mock").toLowerCase();
const extractModel = process.env.CBL_EXTRACT_MODEL || "";
const extractToken = process.env.CBL_EXTRACT_TOKEN || "";
const extractBaseUrl = process.env.CBL_EXTRACT_BASE_URL || defaultBaseUrl(extractProvider);

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
    try {
      const body = await readRequestBody(request);
      const images = parseMultipartImages(request.headers["content-type"], body);
      const payload = await extractMatches(images);
      sendJson(response, payload);
    } catch (error) {
      console.error(error);
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ matches: sampleMatches, warnings: ["识别失败，已返回示例数据"] }));
    }
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

async function extractMatches(images) {
  if (extractProvider === "mock" || !extractToken || !extractModel || !images.length) {
    return { matches: sampleMatches, warnings: mockWarnings(images) };
  }

  if (["openrouter", "siliconflow", "openai", "compatible"].includes(extractProvider)) {
    return extractWithOpenAICompatible(images);
  }

  return {
    matches: sampleMatches,
    warnings: [`未知识别服务：${extractProvider}`],
  };
}

async function extractWithOpenAICompatible(images) {
  const endpoint = `${extractBaseUrl.replace(/\/$/, "")}/chat/completions`;
  const content = [
    {
      type: "text",
      text: extractionPrompt(),
    },
    ...images.map((image) => ({
      type: "image_url",
      image_url: {
        url: `data:${image.contentType};base64,${image.buffer.toString("base64")}`,
      },
    })),
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${extractToken}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/guoguo2503/cbl-team-results-generator",
      "X-Title": "CBL Team Results Generator",
    },
    body: JSON.stringify({
      model: extractModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`extract request failed: ${response.status} ${raw.slice(0, 400)}`);
  }

  const payload = JSON.parse(raw);
  const text = payload.choices?.[0]?.message?.content || "";
  const parsed = parseJsonPayload(text);
  return {
    matches: normalizeMatches(parsed.matches || parsed),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  };
}

function extractionPrompt() {
  return [
    "你是 CBL 团体赛果表识别助手。请从图片里的中文表格识别所有团体比赛记录，并只返回 JSON。",
    "返回格式必须是：{\"matches\":[...],\"warnings\":[]}",
    "每个 match 字段：group, round, datetime, stage, event, homeTeam, awayTeam, homePlayers, awayPlayers, homeScores, awayScores。",
    "homePlayers 和 awayPlayers 固定 4 个名字；homeScores 和 awayScores 固定 5 个字符串。",
    "如果图片只包含球员名单没有比分，比分数组填空字符串。",
    "第五局默认主队 1 号球员对客队 2 号球员；如果表格写了具体第五局，以表格为准。",
    "不要解释，不要 Markdown，不要代码块，只返回合法 JSON。",
  ].join("\n");
}

function normalizeMatches(value) {
  const list = Array.isArray(value) ? value : [];
  return list.map((match) => ({
    group: stringValue(match.group),
    round: stringValue(match.round),
    datetime: stringValue(match.datetime),
    stage: stringValue(match.stage || "小组赛斯诺克赛段"),
    event: stringValue(match.event || "混合团体"),
    homeTeam: stringValue(match.homeTeam),
    awayTeam: stringValue(match.awayTeam),
    homePlayers: normalizeArray(match.homePlayers, 4),
    awayPlayers: normalizeArray(match.awayPlayers, 4),
    homeScores: normalizeArray(match.homeScores, 5),
    awayScores: normalizeArray(match.awayScores, 5),
  }));
}

function normalizeArray(value, length) {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length }, (_, index) => stringValue(source[index]));
}

function stringValue(value) {
  return value == null ? "" : String(value).trim();
}

function parseJsonPayload(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("extract response did not contain JSON");
    return JSON.parse(match[0]);
  }
}

function parseMultipartImages(contentType, body) {
  const boundary = multipartBoundary(contentType);
  if (!boundary) return [];

  const parts = splitBuffer(body, Buffer.from(`--${boundary}`));
  const images = [];
  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const headers = part.slice(0, headerEnd).toString("utf8");
    if (!headers.includes('name="images"')) continue;

    const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
    const filenameMatch = headers.match(/filename="([^"]*)"/i);
    let buffer = part.slice(headerEnd + 4);
    if (buffer.slice(0, 2).toString() === "\r\n") buffer = buffer.slice(2);
    if (buffer.slice(-2).toString() === "\r\n") buffer = buffer.slice(0, -2);
    if (!buffer.length) continue;

    images.push({
      filename: filenameMatch ? filenameMatch[1] : "image",
      contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "image/png",
      buffer,
    });
  }
  return images;
}

function multipartBoundary(contentType = "") {
  const match = String(contentType).match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? match[1] || match[2] : "";
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);
  while (index !== -1) {
    if (index > start) parts.push(buffer.slice(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  if (start < buffer.length) parts.push(buffer.slice(start));
  return parts.filter((part) => !part.includes(Buffer.from("--\r\n")));
}

function defaultBaseUrl(provider) {
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (provider === "siliconflow") return "https://api.siliconflow.cn/v1";
  if (provider === "openai") return "https://api.openai.com/v1";
  return "";
}

function mockWarnings(images) {
  if (extractProvider !== "mock" && (!extractToken || !extractModel)) {
    return ["识别服务未配置完整，已使用示例数据"];
  }
  if (!images.length) return ["未收到图片，已使用示例数据"];
  return ["当前为示例识别结果"];
}

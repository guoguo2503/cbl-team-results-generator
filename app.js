const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1920;

const psdTemplate = new Image();
let psdTemplateReady = false;
psdTemplate.onload = () => {
  psdTemplateReady = true;
  renderPreviews();
};
psdTemplate.src = "assets/psd-base-artboard-1.png";

const teamLogoImages = new Map();
const knownTeamLogos = new Map([
  ["莫干山康溪", "assets/team-logos/莫干山康溪.png"],
  ["山西华舰", "assets/team-logos/山西华舰.png"],
  ["小熊猫", "assets/team-logos/小熊猫.png"],
  ["圣森台球", "assets/team-logos/圣森台球.png"],
]);

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
  {
    group: "B组",
    round: "第五轮",
    datetime: "2026年7月1日 19:35",
    stage: "小组赛斯诺克赛段",
    event: "混合团体",
    homeTeam: "上海久狮",
    awayTeam: "上饶灵山星牌",
    homePlayers: ["张驰", "姚东成", "徐嘉锐", "李碧涵"],
    awayPlayers: ["刘韦壹路", "陈文", "张超", "黎亨"],
    homeScores: ["", "", "", "", ""],
    awayScores: ["", "", "", "", ""],
  },
  {
    group: "B组",
    round: "第五轮",
    datetime: "2026年7月1日 19:35",
    stage: "小组赛斯诺克赛段",
    event: "混合团体",
    homeTeam: "浙江久鼎",
    awayTeam: "恺畅",
    homePlayers: ["樊明彤", "徐健豪", "周金豪", "刘林昊"],
    awayPlayers: ["董子豪", "曹泽裔", "韩芳", "梁小龙"],
    homeScores: ["", "", "", "", ""],
    awayScores: ["", "", "", "", ""],
  },
];

const blankMatch = {
  group: "A组",
  round: "第六轮",
  datetime: "2026年7月1日 19:35",
  stage: "小组赛斯诺克赛段",
  event: "混合团体",
  homeTeam: "主队名称",
  awayTeam: "客队名称",
  homePlayers: ["1号球员", "2号球员", "3号球员", "4号球员"],
  awayPlayers: ["1号球员", "2号球员", "3号球员", "4号球员"],
  homeScores: ["", "", "", "", ""],
  awayScores: ["", "", "", "", ""],
};

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const fileStrip = document.querySelector("#fileStrip");
const mockButton = document.querySelector("#mockButton");
const blankButton = document.querySelector("#blankButton");
const matchList = document.querySelector("#matchList");
const previewList = document.querySelector("#previewList");
const matchCount = document.querySelector("#matchCount");
const statusText = document.querySelector("#statusText");
const downloadAllButton = document.querySelector("#downloadAllButton");
const matchTemplate = document.querySelector("#matchTemplate");

let matches = [];

function cloneMatch(match) {
  return {
    ...match,
    homePlayers: [...match.homePlayers],
    awayPlayers: [...match.awayPlayers],
    homeScores: [...(match.homeScores || ["", "", "", "", ""])],
    awayScores: [...(match.awayScores || ["", "", "", "", ""])],
  };
}

function setMatches(nextMatches, status = "已更新") {
  matches = nextMatches.map(cloneMatch);
  statusText.textContent = status;
  renderEditor();
  renderPreviews();
}

function renderEditor() {
  matchList.innerHTML = "";
  matchCount.textContent = `${matches.length} 场`;

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "等待上传或载入示例";
    matchList.append(empty);
    return;
  }

  matches.forEach((match, index) => {
    const node = matchTemplate.content.firstElementChild.cloneNode(true);
    node.querySelectorAll("[data-field]").forEach((input) => {
      const field = input.dataset.field;
      input.value = match[field] || "";
      input.addEventListener("input", () => {
        matches[index][field] = input.value;
        renderPreviews();
      });
    });

    node.querySelector(".remove-match").addEventListener("click", () => {
      matches.splice(index, 1);
      renderEditor();
      renderPreviews();
    });

    fillPlayers(node.querySelector('[data-side="home"]'), match.homePlayers, index, "homePlayers");
    fillPlayers(node.querySelector('[data-side="away"]'), match.awayPlayers, index, "awayPlayers");
    fillScores(node.querySelector("[data-score-editor]"), match, index);
    matchList.append(node);
  });
}

function fillPlayers(container, players, matchIndex, side) {
  container.innerHTML = "";
  for (let i = 0; i < 4; i += 1) {
    const row = document.createElement("div");
    row.className = "player-row";
    const label = document.createElement("span");
    label.textContent = `${i + 1}号`;
    const input = document.createElement("input");
    input.className = "field";
    input.value = players[i] || "";
    input.addEventListener("input", () => {
      matches[matchIndex][side][i] = input.value;
      renderPreviews();
    });
    row.append(label, input);
    container.append(row);
  }
}

function fillScores(container, match, matchIndex) {
  container.innerHTML = "";
  const rounds = ["第一局", "第二局", "第三局", "第四局", "第五局"];
  rounds.forEach((round, index) => {
    const row = document.createElement("div");
    row.className = "score-row";
    const roundLabel = document.createElement("span");
    roundLabel.textContent = round;

    const homeName = document.createElement("span");
    homeName.textContent = index === 4 ? match.homePlayers[0] || "" : match.homePlayers[index] || "";
    const awayName = document.createElement("span");
    awayName.textContent = index === 4 ? match.awayPlayers[1] || "" : match.awayPlayers[index] || "";

    const homeScore = document.createElement("input");
    homeScore.className = "field";
    homeScore.value = match.homeScores[index] || "";
    homeScore.addEventListener("input", () => {
      matches[matchIndex].homeScores[index] = homeScore.value;
      renderPreviews();
    });

    const awayScore = document.createElement("input");
    awayScore.className = "field";
    awayScore.value = match.awayScores[index] || "";
    awayScore.addEventListener("input", () => {
      matches[matchIndex].awayScores[index] = awayScore.value;
      renderPreviews();
    });

    row.append(roundLabel, homeName, homeScore, awayScore, awayName);
    container.append(row);
  });
}

function renderPreviews() {
  previewList.innerHTML = "";

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "暂无预览";
    previewList.append(empty);
    return;
  }

  matches.forEach((match, index) => {
    const card = document.createElement("div");
    card.className = "preview-card";

    const title = document.createElement("div");
    title.className = "preview-title";
    title.innerHTML = `<span>${safeText(match.homeTeam)} VS ${safeText(match.awayTeam)}</span>`;

    const canvas = document.createElement("canvas");
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    drawPoster(canvas, match);

    const actions = document.createElement("div");
    actions.className = "preview-actions";
    const button = document.createElement("button");
    button.className = "primary-action";
    button.type = "button";
    button.textContent = "下载";
    button.addEventListener("click", () => downloadCanvas(canvas, fileNameFor(match, index)));
    actions.append(button);

    card.append(title, canvas, actions);
    previewList.append(card);
  });
}

function drawPoster(canvas, match) {
  const ctx = canvas.getContext("2d");
  if (psdTemplateReady) {
    ctx.drawImage(psdTemplate, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  } else {
    drawBackground(ctx, POSTER_WIDTH, POSTER_HEIGHT);
  }
  drawPsdResultOverlay(ctx, match);
}

function drawPsdResultOverlay(ctx, match) {
  const homeColor = colorFor(match.homeTeam);
  const awayColor = colorFor(match.awayTeam);
  const score = calculateMatchScore(match);

  drawCenteredText(ctx, "比赛结果", 540, 430, 78, 680, "#fff", 900);
  drawCenteredText(ctx, match.stage || "小组赛斯诺克赛段", 540, 522, 41, 760, "#fff", 900);
  drawCenteredText(ctx, `${match.round}${match.group} · ${match.event || "混合团体"}`, 540, 625, 43, 790, "#fff", 900);

  drawPsdTeamCard(ctx, 0, 751, 348, 212, match.homeTeam, homeColor, "left");
  drawPsdTeamCard(ctx, 732, 752, 347, 211, match.awayTeam, awayColor, "right");
  drawPsdScore(ctx, score.home, score.away);
  drawPsdTeamNameBar(ctx, match.homeTeam, match.awayTeam);
  drawPsdRows(ctx, match);
}

function drawPsdTeamCard(ctx, x, y, width, height, teamName, colors, side) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, x, y, width, height, 14, colors.primary);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(x + width * 0.46, y, width * 0.54, height);
  ctx.globalAlpha = 1;
  ctx.restore();

  const logo = getTeamLogo(teamName);
  const logoSize = side === "left" ? 220 : 190;
  const logoX = side === "left" ? x + 26 : x + width - logoSize - 24;
  const logoY = y + (height - logoSize) / 2;
  if (logo?.complete && logo.naturalWidth) {
    fitImage(ctx, logo, logoX, logoY, logoSize, logoSize);
  } else {
    drawTeamMark(ctx, side === "left" ? x + 125 : x + width - 124, y + height / 2, teamName, colors);
  }
}

function drawPsdScore(ctx, homeScore, awayScore) {
  drawCenteredText(ctx, `${homeScore}:${awayScore}`, 540, 945, 176, 420, "#f3dfae", 900, "normal");
}

function drawPsdTeamNameBar(ctx, homeTeam, awayTeam) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 10;
  roundedRect(ctx, 227, 1002, 626, 80, 0, "rgba(89, 0, 25, 0.72)");
  ctx.restore();
  drawFittedText(ctx, homeTeam, 500, 1062, 45, 250, "#fff", 900, "italic", "right");
  drawCenteredText(ctx, "VS", 540, 1062, 42, 80, "#fff", 900, "italic");
  drawFittedText(ctx, awayTeam, 580, 1062, 45, 250, "#fff", 900, "italic", "left");
}

function drawPsdRows(ctx, match) {
  const rows = makeRows(match);
  rows.forEach((row, index) => {
    const y = 1198 + index * 125;
    drawFittedText(ctx, row.homeName, 76, y, 38, 230, "#fff", 900, "italic", "left");
    drawFrameScore(ctx, row.homeScore, 300, y - 32, Number(row.homeScore) >= Number(row.awayScore));
    drawFrameScore(ctx, row.awayScore, 590, y - 32, Number(row.awayScore) > Number(row.homeScore));
    drawFittedText(ctx, row.awayName, 990, y, 38, 230, "#fff", 900, "italic", "right");
  });
}

function drawFrameScore(ctx, score, x, y, isWinner) {
  const value = `${score ?? ""}`;
  if (isWinner && value !== "") {
    roundedRect(ctx, x - 40, y - 5, 80, 44, 6, "#fff");
    drawCenteredText(ctx, value, x, y + 31, 42, 76, "#731129", 900, "italic");
  } else {
    drawCenteredText(ctx, value, x, y + 31, 42, 76, "#fff", 900, "italic");
  }
}

function drawBackground(ctx, w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#540017");
  gradient.addColorStop(0.45, "#9d1644");
  gradient.addColorStop(1, "#3a0010");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#f05b8d";
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(1080, 0);
  ctx.lineTo(540, 780);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(540, 780);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, 1270, w, 190);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 300px Arial";
  ctx.fillText("2026", -6, 250);
  ctx.fillText("CBL", 570, 1320);
  ctx.restore();
}

function drawHeader(ctx, match) {
  drawLogoBlock(ctx, 226, 98, 276, 172);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 43px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("中国台球俱乐部", 545, 128);
  ctx.fillText("职业联赛", 545, 178);
  ctx.font = "800 19px Arial, sans-serif";
  ctx.fillText("CHINA BILLIARD SPORTS CLUBS", 546, 226);
  ctx.fillText("PROFESSIONAL LEAGUE", 546, 250);

  drawCenteredText(ctx, "混合团体(表演赛)", 540, 423, 90, 940, "#fff", 900);
  drawCenteredText(ctx, "对阵名单", 540, 535, 70, 760, "#fff", 900);
  drawCenteredText(ctx, `${match.group}${match.round}`, 540, 640, 72, 760, "#fff", 900);
  drawCenteredText(ctx, match.datetime, 540, 719, 34, 720, "#fff", 900, "italic");
}

function drawLogoBlock(ctx, x, y, width, height) {
  roundedRect(ctx, x, y, width, height, 13, "#d90a2a");
  roundedRect(ctx, x, y + height * 0.48, width, height * 0.52, 0, "#c2a15b");
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  roundStroke(ctx, x, y, width, height, 13);
  ctx.fillStyle = "#fff";
  ctx.font = "italic 900 82px Arial, sans-serif";
  ctx.fillText("CBL", x + 44, y + 126);
  ctx.beginPath();
  ctx.arc(x + 238, y + 81, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawTeamBanner(ctx, match, homeColor, awayColor) {
  roundedRect(ctx, 70, 733, 940, 634, 8, "rgba(229, 65, 125, 0.78)");
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, 116, 832, 428, 218, 2, homeColor.primary);
  roundedRect(ctx, 544, 832, 420, 218, 2, awayColor.primary);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "italic 900 34px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(match.stage || "斯诺克赛段", 540, 794);

  drawTeamMark(ctx, 210, 940, match.homeTeam, homeColor);
  drawTeamMark(ctx, 870, 940, match.awayTeam, awayColor);

  drawFittedText(ctx, match.homeTeam, 490, 962, 43, 230, "#fff", 900, "italic", "right");
  drawFittedText(ctx, match.awayTeam, 590, 962, 43, 230, "#fff", 900, "italic", "left");
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  drawCenteredText(ctx, "VS", 540, 962, 44, 82, "#fff", 900, "italic");
  ctx.restore();
}

function drawTeamMark(ctx, x, y, teamName, colors) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.26)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 74, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, 62, 0, Math.PI * 2);
  ctx.fillStyle = colors.secondary;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();

  const initials = Array.from(teamName || "队").slice(0, 2).join("");
  drawCenteredText(ctx, initials, x, y + 13, initials.length > 1 ? 28 : 38, 90, "#fff", 900);
}

function drawLineup(ctx, match) {
  const rows = makeRows(match);
  const startY = 1092;
  const rowH = 48;
  const leftX = 116;
  const rightX = 574;

  rows.forEach((row, index) => {
    const y = startY + index * 57;
    drawRowSide(ctx, leftX, y, row.round, row.homeOrder, row.homeName, "left");
    drawCenteredText(ctx, "VS", 540, y + 34, 25, 60, "#fff", 900, "italic");
    drawRowSide(ctx, rightX, y, row.round, row.awayOrder, row.awayName, "right");
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(116, y + rowH + 10);
    ctx.lineTo(964, y + rowH + 10);
    ctx.stroke();
  });

  drawCenteredText(ctx, "备注（第五局由主队1号球员对阵客队2号球员）", 540, 1418, 28, 820, "#fff", 900);
}

function drawRowSide(ctx, x, y, round, order, name, align) {
  const isLeft = align === "left";
  if (isLeft) {
    roundedRect(ctx, x, y, 84, 42, 0, "rgba(255,255,255,0.88)");
    roundedRect(ctx, x + 88, y, 142, 42, 0, "rgba(255,255,255,0.78)");
    roundedRect(ctx, x + 230, y, 184, 42, 0, "rgba(95,0,26,0.58)");
    drawCenteredText(ctx, round, x + 42, y + 29, 24, 78, "#5b0a22", 900);
    drawCenteredText(ctx, order, x + 159, y + 29, 25, 126, "#5b0a22", 900);
    drawCenteredText(ctx, name, x + 322, y + 31, 31, 170, "#fff", 900, "italic");
    return;
  }

  roundedRect(ctx, x, y, 184, 42, 0, "rgba(95,0,26,0.58)");
  roundedRect(ctx, x + 184, y, 142, 42, 0, "rgba(255,255,255,0.78)");
  roundedRect(ctx, x + 330, y, 84, 42, 0, "rgba(255,255,255,0.88)");
  drawCenteredText(ctx, name, x + 92, y + 31, 31, 170, "#fff", 900, "italic");
  drawCenteredText(ctx, order, x + 255, y + 29, 25, 126, "#5b0a22", 900);
  drawCenteredText(ctx, round, x + 372, y + 29, 24, 78, "#5b0a22", 900);
}

function drawFooter(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  const y = 1501;
  const labels = ["官方合作伙伴", "官方媒体合作伙伴", "官方供应商", "官方媒体平台"];
  labels.forEach((label, index) => {
    const x = 34 + index * 264;
    ctx.font = "900 10px 'PingFang SC', sans-serif";
    ctx.fillText(label, x, y - 18);
    ctx.fillRect(x, y - 10, 210, 2);
    roundedRect(ctx, x, y + 4, 76, 32, 4, "#fff");
    roundedRect(ctx, x + 90, y + 4, 76, 32, 4, "#fff");
  });
  ctx.restore();
}

function makeRows(match) {
  const rounds = ["第一局", "第二局", "第三局", "第四局", "第五局"];
  const homeOrders = ["1号球员", "2号球员", "3号球员", "4号球员", "1号球员"];
  const awayOrders = ["1号球员", "2号球员", "3号球员", "4号球员", "2号球员"];
  return rounds.map((round, index) => ({
    round,
    homeOrder: homeOrders[index],
    awayOrder: awayOrders[index],
    homeName: index === 4 ? match.homePlayers[0] : match.homePlayers[index],
    awayName: index === 4 ? match.awayPlayers[1] : match.awayPlayers[index],
    homeScore: (match.homeScores || [])[index] || "",
    awayScore: (match.awayScores || [])[index] || "",
  }));
}

function calculateMatchScore(match) {
  const rows = makeRows(match);
  return rows.reduce(
    (total, row) => {
      const home = Number(row.homeScore);
      const away = Number(row.awayScore);
      if (Number.isFinite(home) && Number.isFinite(away) && row.homeScore !== "" && row.awayScore !== "") {
        if (home > away) total.home += 1;
        if (away > home) total.away += 1;
      }
      return total;
    },
    { home: 0, away: 0 },
  );
}

function drawCenteredText(ctx, text, x, y, maxSize, maxWidth, color, weight = 800, style = "normal") {
  drawFittedText(ctx, text, x, y, maxSize, maxWidth, color, weight, style, "center");
}

function drawFittedText(ctx, text, x, y, maxSize, maxWidth, color, weight = 800, style = "normal", align = "center") {
  const value = `${text || ""}`;
  let size = maxSize;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  do {
    ctx.font = `${style} ${weight} ${size}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    if (ctx.measureText(value).width <= maxWidth || size <= 14) break;
    size -= 2;
  } while (size > 12);
  ctx.fillText(value, x, y);
}

function roundedRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  if (radius <= 0) {
    ctx.rect(x, y, width, height);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundStroke(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.stroke();
}

function colorFor(seed) {
  const palette = [
    ["#1768a9", "#0a345b"],
    ["#e46f24", "#7a2f0f"],
    ["#d7a528", "#76550d"],
    ["#2e8d51", "#12492a"],
    ["#d73545", "#78101b"],
    ["#215d9a", "#0d3157"],
  ];
  const code = Array.from(seed || "team").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [primary, secondary] = palette[code % palette.length];
  return { primary, secondary };
}

function getTeamLogo(teamName) {
  if (!knownTeamLogos.has(teamName)) return null;
  if (teamLogoImages.has(teamName)) return teamLogoImages.get(teamName);
  const img = new Image();
  img.onload = renderPreviews;
  img.src = knownTeamLogos.get(teamName);
  teamLogoImages.set(teamName, img);
  return img;
}

function fitImage(ctx, img, x, y, width, height) {
  const ratio = Math.min(width / img.naturalWidth, height / img.naturalHeight);
  const drawW = img.naturalWidth * ratio;
  const drawH = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
}

function safeText(value) {
  return `${value || ""}`.replace(/[<>&]/g, "");
}

function fileNameFor(match, index) {
  const base = `${match.group}${match.round}-${match.homeTeam}-vs-${match.awayTeam}`.replace(/[\\/:*?"<>|]/g, "-");
  return `${base || `团体赛果-${index + 1}`}.png`;
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function downloadLongPoster() {
  if (!matches.length) return;
  const gap = 0;
  const longCanvas = document.createElement("canvas");
  longCanvas.width = 1080;
  longCanvas.height = matches.length * POSTER_HEIGHT + Math.max(0, matches.length - 1) * gap;
  const ctx = longCanvas.getContext("2d");

  matches.forEach((match, index) => {
    const poster = document.createElement("canvas");
    poster.width = POSTER_WIDTH;
    poster.height = POSTER_HEIGHT;
    drawPoster(poster, match);
    ctx.drawImage(poster, 0, index * (POSTER_HEIGHT + gap));
  });

  downloadCanvas(longCanvas, `团体赛果长图-${matches.length}场.png`);
}

function handleFiles(files) {
  const list = Array.from(files || []);
  fileStrip.innerHTML = "";
  list.forEach((file) => {
    const chip = document.createElement("div");
    chip.className = "file-chip";
    const img = document.createElement("img");
    img.alt = "";
    img.src = URL.createObjectURL(file);
    const name = document.createElement("span");
    name.textContent = file.name;
    chip.append(img, name);
    fileStrip.append(chip);
  });

  if (!list.length) return;
  const next = [];
  list.forEach((file) => {
    if (file.name.includes("原始表1")) {
      next.push(sampleMatches[2], sampleMatches[3]);
    } else if (file.name.includes("原始表2")) {
      next.push(sampleMatches[1], sampleMatches[0]);
    } else {
      next.push(blankMatch);
    }
  });
  setMatches(next, "已生成校对表");
}

fileInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  handleFiles(event.dataTransfer.files);
});

mockButton.addEventListener("click", () => {
  setMatches(sampleMatches, "示例已载入");
});

blankButton.addEventListener("click", () => {
  setMatches([...matches, blankMatch], "已新增");
});

downloadAllButton.addEventListener("click", () => {
  downloadLongPoster();
});

setMatches(sampleMatches.slice(0, 2), "示例已载入");

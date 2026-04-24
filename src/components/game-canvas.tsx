"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game";

type GameCanvasProps = {
  game: GameState | null;
};

export function GameCanvas({ game }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      drawScene(context, rect.width, rect.height, game);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [game]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="konoffice battle scene" />;
}

function drawScene(context: CanvasRenderingContext2D, width: number, height: number, game: GameState | null) {
  context.clearRect(0, 0, width, height);
  drawOfficeDungeon(context, width, height);
  drawProps(context, width, height);

  if (!game) {
    drawHero(context, width * 0.5 - 70, height * 0.62, 1.15);
    drawSticker(context, width * 0.5, height * 0.2, "survive the office");
    return;
  }

  const enemyX = width * 0.67;
  const enemyY = height * 0.56;
  drawHero(context, width * 0.28, height * 0.58, 1);
  drawEnemy(context, enemyX, enemyY, game.enemy.type, game.enemy.currentHp / game.enemy.maxHp);
  drawSpeechCard(
    context,
    width * 0.5,
    height * 0.18,
    game.run.floors[game.encounterIndex]?.name ?? game.run.runTitle,
  );
  drawBattleBars(context, width * 0.28, height * 0.79, "You", game.playerHp, game.maxPlayerHp, "#1e9eaa");
  drawBattleBars(context, enemyX, height * 0.79, game.enemy.name, game.enemy.currentHp, game.enemy.maxHp, "#b63f45");

  if (game.enemy.revealed) {
    drawWeakness(context, enemyX, enemyY - 155, game.enemy.weaknessIntent);
  }
}

function drawOfficeDungeon(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#bda692";
  context.fillRect(0, 0, width, height * 0.62);

  context.strokeStyle = "rgba(43,32,29,0.12)";
  context.lineWidth = 3;
  for (let x = 40; x < width; x += 90) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 25, height * 0.62);
    context.stroke();
  }

  const floorTop = height * 0.62;
  context.fillStyle = "#8d694f";
  context.fillRect(0, floorTop, width, height - floorTop);
  context.strokeStyle = "#2b201d";
  context.lineWidth = 2;
  for (let y = floorTop; y < height; y += 44) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + 16);
    context.stroke();
  }
  for (let x = -80; x < width; x += 86) {
    context.beginPath();
    context.moveTo(x, floorTop);
    context.lineTo(x + 150, height);
    context.stroke();
  }

  context.fillStyle = "rgba(255,241,214,0.55)";
  context.fillRect(width * 0.17, floorTop + 20, width * 0.66, 122);
  context.strokeStyle = "#2b201d";
  context.strokeRect(width * 0.17, floorTop + 20, width * 0.66, 122);
}

function drawProps(context: CanvasRenderingContext2D, width: number, height: number) {
  drawFishbowl(context, width * 0.82, height * 0.46);
  drawBriefcase(context, width * 0.12, height * 0.55);
  drawPendant(context, width * 0.25, 70);
  drawPendant(context, width * 0.5, 52);
  drawPendant(context, width * 0.75, 75);
}

function drawHero(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  drawShadow(context, 15, 123, 130, 24);

  context.fillStyle = "#f5dfbd";
  roundedRect(context, -38, 0, 106, 128, 30);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = "#b63f45";
  context.beginPath();
  context.moveTo(-86, 6);
  context.bezierCurveTo(-64, -80, 76, -92, 105, 8);
  context.bezierCurveTo(67, 34, -40, 33, -86, 6);
  context.fill();
  context.stroke();

  context.fillStyle = "#fff1d6";
  drawCapSpot(context, -40, -30, 16, 10);
  drawCapSpot(context, 15, -48, 19, 12);
  drawCapSpot(context, 62, -18, 13, 10);

  context.fillStyle = "#2b201d";
  context.beginPath();
  context.arc(-5, 52, 5, 0, Math.PI * 2);
  context.arc(34, 52, 5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(15, 62, 9, 0.1, Math.PI - 0.1);
  context.stroke();

  context.fillStyle = "#6f8470";
  roundedRect(context, -56, 80, 148, 58, 6);
  context.fill();
  context.stroke();

  context.fillStyle = "#c7c9ca";
  roundedRect(context, -28, 75, 88, 54, 6);
  context.fill();
  context.stroke();
  context.fillStyle = "#2b201d";
  context.fillRect(11, 97, 10, 6);
  context.restore();
}

function drawEnemy(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: GameState["enemy"]["type"],
  hpRatio: number,
) {
  if (type === "meetingHydra") {
    drawMeetingHydra(context, x, y, hpRatio);
    return;
  }
  if (type === "vpOfAmbiguity") {
    drawVp(context, x, y, hpRatio);
    return;
  }
  if (type === "calendarLeech") {
    drawCalendarLeech(context, x, y, hpRatio);
    return;
  }
  if (type === "deckGoblin") {
    drawDeckGoblin(context, x, y, hpRatio);
    return;
  }
  if (type === "passiveAggressiveMushroom") {
    drawPassiveMushroom(context, x, y, hpRatio);
    return;
  }
  drawScopeSlime(context, x, y, hpRatio);
}

function drawScopeSlime(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawShadow(context, 0, 103, 150, 24);
  context.fillStyle = "#7aa36e";
  context.beginPath();
  context.ellipse(0, 45, 78, 72, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();
  drawFace(context, -18, 38);
  context.fillStyle = "#fff1d6";
  drawSticky(context, -60, 5, "+1 ask");
  drawSticky(context, 15, -20, "quick");
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawMeetingHydra(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawShadow(context, 0, 112, 170, 24);
  context.strokeStyle = "#2b201d";
  context.lineWidth = 12;
  [-50, 0, 50].forEach((offset) => {
    context.beginPath();
    context.moveTo(offset * 0.45, 72);
    context.quadraticCurveTo(offset, -10, offset, -36);
    context.stroke();
  });
  [-50, 0, 50].forEach((offset, index) => {
    context.fillStyle = index === 1 ? "#b63f45" : "#ca6863";
    roundedRect(context, offset - 38, -75, 76, 66, 24);
    context.fill();
    context.strokeStyle = "#2b201d";
    context.lineWidth = 4;
    context.stroke();
    drawFace(context, offset - 14, -48);
  });
  context.fillStyle = "#6f8470";
  roundedRect(context, -72, 40, 144, 88, 30);
  context.fill();
  context.stroke();
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawVp(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawShadow(context, 0, 122, 178, 28);
  const gradient = context.createLinearGradient(-80, -90, 90, 130);
  gradient.addColorStop(0, "#f0e5d3");
  gradient.addColorStop(1, "#9cb8bd");
  context.fillStyle = gradient;
  roundedRect(context, -78, -62, 156, 190, 44);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#2b201d";
  context.fillRect(-52, -25, 104, 6);
  context.fillRect(-52, 10, 104, 6);
  context.fillRect(-52, 45, 104, 6);
  context.fillStyle = "#1e9eaa";
  roundedRect(context, -54, -103, 108, 38, 6);
  context.fill();
  context.stroke();
  context.fillStyle = "white";
  context.font = "900 14px sans-serif";
  context.textAlign = "center";
  context.fillText("Q?", 0, -79);
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawCalendarLeech(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawShadow(context, 0, 98, 130, 22);
  context.fillStyle = "#78a9b1";
  roundedRect(context, -62, -42, 124, 140, 22);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#b63f45";
  context.fillRect(-62, -42, 124, 28);
  drawFace(context, -16, 28);
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawDeckGoblin(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawShadow(context, 0, 102, 132, 23);
  context.fillStyle = "#8f715c";
  roundedRect(context, -52, -22, 104, 122, 28);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();
  drawFace(context, -15, 24);
  context.fillStyle = "#fff1d6";
  roundedRect(context, -84, -70, 70, 52, 4);
  context.fill();
  context.stroke();
  context.fillStyle = "#1e9eaa";
  context.fillRect(-72, -40, 45, 8);
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawPassiveMushroom(context: CanvasRenderingContext2D, x: number, y: number, hpRatio: number) {
  context.save();
  context.translate(x, y);
  drawHero(context, -54, -20, 0.72);
  context.fillStyle = "#fff1d6";
  roundedRect(context, 0, -70, 120, 50, 10);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#2b201d";
  context.font = "800 12px sans-serif";
  context.fillText("per my last", 15, -42);
  drawHpSheen(context, hpRatio);
  context.restore();
}

function drawFishbowl(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#6a4d39";
  context.fillRect(-64, 55, 128, 12);
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.strokeRect(-64, 55, 128, 12);
  context.fillStyle = "#8fd2e3";
  context.beginPath();
  context.ellipse(0, 12, 54, 38, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(255,255,255,0.35)";
  context.beginPath();
  context.ellipse(-18, 0, 18, 10, -0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBriefcase(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#b68a54";
  roundedRect(context, -44, -10, 88, 60, 6);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 4;
  context.stroke();
  context.strokeRect(-18, -26, 36, 18);
  context.fillStyle = "#fff1d6";
  context.fillRect(-6, 16, 12, 10);
  context.restore();
}

function drawPendant(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#2b201d";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -80);
  context.lineTo(0, 0);
  context.stroke();
  context.fillStyle = "#75b8a3";
  context.beginPath();
  context.arc(0, 0, 10, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawBattleBars(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  current: number,
  max: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#fff1d6";
  roundedRect(context, -82, -20, 164, 46, 6);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#2b201d";
  context.font = "900 12px sans-serif";
  context.textAlign = "center";
  context.fillText(label, 0, -4);
  context.fillStyle = "#d5c1a8";
  context.fillRect(-62, 7, 124, 10);
  context.fillStyle = color;
  context.fillRect(-62, 7, 124 * Math.max(0, current / max), 10);
  context.restore();
}

function drawSticker(context: CanvasRenderingContext2D, x: number, y: number, text: string) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#1e9eaa";
  roundedRect(context, -150, -22, 300, 44, 5);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "white";
  context.font = "900 20px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 0, 1);
  context.restore();
}

function drawSpeechCard(context: CanvasRenderingContext2D, x: number, y: number, text: string) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#1e9eaa";
  roundedRect(context, -185, -24, 370, 48, 5);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "white";
  context.font = "900 18px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(fitText(text, 32), 0, 1);
  context.restore();
}

function drawWeakness(context: CanvasRenderingContext2D, x: number, y: number, intent: string) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#fff1d6";
  roundedRect(context, -70, -18, 140, 36, 999);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#2b201d";
  context.font = "900 13px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`Weak: ${intent}`, 0, 1);
  context.restore();
}

function drawSticky(context: CanvasRenderingContext2D, x: number, y: number, text: string) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.08);
  context.fillRect(0, 0, 54, 34);
  context.strokeStyle = "#2b201d";
  context.lineWidth = 2;
  context.strokeRect(0, 0, 54, 34);
  context.fillStyle = "#2b201d";
  context.font = "800 10px sans-serif";
  context.fillText(text, 7, 20);
  context.restore();
}

function drawFace(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "#2b201d";
  context.beginPath();
  context.arc(x, y, 5, 0, Math.PI * 2);
  context.arc(x + 32, y, 5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#2b201d";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(x + 16, y + 10, 8, 0.1, Math.PI - 0.1);
  context.stroke();
}

function drawCapSpot(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.beginPath();
  context.ellipse(x, y, width, height, -0.3, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawShadow(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.fillStyle = "rgba(43,32,29,0.18)";
  context.beginPath();
  context.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.fill();
}

function drawHpSheen(context: CanvasRenderingContext2D, hpRatio: number) {
  context.globalAlpha = 0.1 + hpRatio * 0.12;
  context.fillStyle = "white";
  context.beginPath();
  context.ellipse(-22, -12, 28, 16, -0.4, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function fitText(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

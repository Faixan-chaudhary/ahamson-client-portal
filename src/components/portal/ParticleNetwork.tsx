import { useEffect, useRef } from "react";
import { GOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GOLD_RGB = (() => {
  const n = parseInt(GOLD.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
})();

const PERSPECTIVE = 880;

interface Particle {
  baseX: number;
  baseY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  phase: number;
  rotation: number;
  rotSpeed: number;
}

interface ProjectedNode {
  p: Particle;
  x: number;
  y: number;
  scale: number;
  z: number;
  index: number;
}

function goldAlpha(a: number) {
  return `rgba(${GOLD_RGB.r}, ${GOLD_RGB.g}, ${GOLD_RGB.b}, ${Math.min(1, Math.max(0, a))})`;
}

function randomVelocity(zNorm: number) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (0.68 + Math.random() * 0.75) * (0.72 + zNorm * 0.55);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

function makeParticle(x: number, y: number): Particle {
  const z = 120 + Math.random() * 420;
  const zNorm = (z - 120) / 420;
  const { vx, vy } = randomVelocity(zNorm);
  return {
    baseX: x,
    baseY: y,
    z,
    vx,
    vy,
    vz: (Math.random() - 0.5) * 0.42,
    size: 2.6 + Math.random() * 2,
    opacity: 0.46 + Math.random() * 0.36,
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.0085,
  };
}

/** Full-panel grid + corner/edge anchors so no empty corners. */
function createEvenParticles(w: number, h: number, count: number): Particle[] {
  if (w < 16 || h < 16 || count <= 0) return [];

  const pad = 12;
  const usableW = Math.max(1, w - pad * 2);
  const usableH = Math.max(1, h - pad * 2);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * (w / Math.max(h, 1)))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const out: Particle[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (out.length >= count) break;
      out.push(makeParticle(
        pad + (c + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.82,
        pad + (r + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.82,
      ));
    }
  }

  const edgePad = 18;
  const anchors = [
    [edgePad, edgePad],
    [w - edgePad, edgePad],
    [edgePad, h - edgePad],
    [w - edgePad, h - edgePad],
    [w * 0.5, edgePad],
    [w * 0.5, h - edgePad],
    [edgePad, h * 0.5],
    [w - edgePad, h * 0.5],
    [w * 0.22, edgePad + 8],
    [w * 0.78, edgePad + 8],
    [w * 0.22, h - edgePad - 8],
    [w * 0.78, h - edgePad - 8],
  ];

  for (const [ax, ay] of anchors) {
    out.push(makeParticle(
      ax + (Math.random() - 0.5) * 20,
      ay + (Math.random() - 0.5) * 20,
    ));
  }

  return out;
}

/** Only particles within this radius (px) react to the cursor. */
const CURSOR_INFLUENCE_RADIUS = 150;

function projectParticle(p: Particle): { x: number; y: number; scale: number; z: number } {
  const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
  return { x: p.baseX, y: p.baseY, scale, z: p.z };
}

function traceHexagonPath(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = radius * Math.cos(angle);
    const py = radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawModernHexNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  alpha: number,
  time: number,
  phase: number,
  nearMouse: number,
  scale: number,
) {
  const pulse = 0.9 + 0.1 * Math.sin(time * 0.022 + phase);
  const r = radius * pulse * scale;
  const boost = 1 + nearMouse * 0.18;
  const a = Math.min(1, alpha * boost);

  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = goldAlpha(a * 0.38);
  ctx.shadowBlur = 6 * a * scale * (1 + nearMouse * 0.35);

  ctx.rotate(rotation);
  traceHexagonPath(ctx, r);
  ctx.strokeStyle = goldAlpha(a * 0.78);
  ctx.lineWidth = (0.5 + nearMouse * 0.08) * scale;
  ctx.stroke();

  ctx.rotate(Math.PI / 6 + rotation * 0.35);
  traceHexagonPath(ctx, r * 0.58);
  ctx.strokeStyle = goldAlpha(a * 0.34);
  ctx.lineWidth = 0.28 * scale;
  ctx.stroke();

  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(0, 0, (0.85 + r * 0.07) * scale, 0, Math.PI * 2);
  ctx.fillStyle = goldAlpha(a * 0.82);
  ctx.fill();

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55);
  glow.addColorStop(0, goldAlpha(a * 0.14));
  glow.addColorStop(1, goldAlpha(0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  a: ProjectedNode,
  b: ProjectedNode,
  dist: number,
  maxDist: number,
  time: number,
) {
  const zFade = 1 - Math.abs(a.z - b.z) / 500;
  const fade = (1 - dist / maxDist) * Math.max(0.35, zFade);
  const depthFade = ((a.scale + b.scale) * 0.5);
  const wave = 0.85 + 0.15 * Math.sin(time * 0.028 + a.p.phase + b.p.phase);
  const alpha = Math.min(0.52, fade * depthFade * wave * 0.44);

  const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  grad.addColorStop(0, goldAlpha(alpha * 0.85));
  grad.addColorStop(0.5, goldAlpha(alpha));
  grad.addColorStop(1, goldAlpha(alpha * 0.85));

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = goldAlpha(alpha * 0.22);
  ctx.lineWidth = 1.1 * depthFade;
  ctx.shadowColor = goldAlpha(alpha * 0.28);
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = grad;
  ctx.lineWidth = 0.52 * depthFade;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 2; i++) {
    const t = (time * 0.011 + a.p.phase + i * 0.5) % 1;
    ctx.beginPath();
    ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.75 * depthFade, 0, Math.PI * 2);
    ctx.fillStyle = goldAlpha(alpha * 1.1);
    ctx.fill();
  }
}

function buildNeighborLinks(nodes: ProjectedNode[], maxDist: number, maxPerNode = 3) {
  const pairs = new Set<string>();
  const links: [ProjectedNode, ProjectedNode, number][] = [];

  for (let i = 0; i < nodes.length; i++) {
    const neighbors = nodes
      .map((n, j) => {
        if (i === j) return null;
        const dist = Math.hypot(nodes[i].x - n.x, nodes[i].y - n.y);
        return dist < maxDist ? { node: n, dist } : null;
      })
      .filter((n): n is { node: ProjectedNode; dist: number } => n !== null)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, maxPerNode);

    for (const { node, dist } of neighbors) {
      const a = nodes[i].index;
      const b = node.index;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      links.push([nodes[i], node, dist]);
    }
  }

  return links;
}

function applySoftSeparation(particles: Particle[]) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = b.baseX - a.baseX;
      const dy = b.baseY - a.baseY;
      const dist = Math.hypot(dx, dy);
      const minDist = 55;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) * 0.018;
        const nx = dx / dist;
        const ny = dy / dist;
        a.baseX -= nx * push;
        a.baseY -= ny * push;
        b.baseX += nx * push;
        b.baseY += ny * push;
      }
    }
  }
}

function updateParticleMotion(
  p: Particle,
  width: number,
  height: number,
  fleeMouseX: number,
  fleeMouseY: number,
  mouseSpeed: number,
  reducedMotion: boolean,
) {
  const zNorm = (p.z - 120) / 420;
  const scale = PERSPECTIVE / (PERSPECTIVE + p.z);

  if (!reducedMotion && Math.random() < 0.014) {
    const vel = randomVelocity(zNorm);
    p.vx = vel.vx;
    p.vy = vel.vy;
  }

  p.z += p.vz * (reducedMotion ? 0.2 : 1);
  if (p.z < 100) { p.z = 100; p.vz = Math.abs(p.vz); }
  if (p.z > 540) { p.z = 540; p.vz = -Math.abs(p.vz); }

  const minSpeed = 0.46 * (0.7 + zNorm * 0.5);
  let maxSpeed = 1.58 * (0.7 + zNorm * 0.5);
  let nearMouse = 0;

  if (!reducedMotion) {
    const mdx = p.baseX - fleeMouseX;
    const mdy = p.baseY - fleeMouseY;
    const mdist = Math.hypot(mdx, mdy);

    if (mdist < CURSOR_INFLUENCE_RADIUS && mdist > 0) {
      const proximity = (CURSOR_INFLUENCE_RADIUS - mdist) / CURSOR_INFLUENCE_RADIUS;
      nearMouse = proximity;
      const nx = mdx / mdist;
      const ny = mdy / mdist;
      const scare = 1 + Math.min(mouseSpeed * 0.15, 4);
      const depthBoost = 0.7 + scale * 0.8;

      if (mdist < 70) {
        const burst = (2.6 + proximity * 5) * depthBoost * scare;
        p.vx = nx * burst;
        p.vy = ny * burst;
        p.baseX += nx * (18 + mouseSpeed) * proximity * depthBoost;
        p.baseY += ny * (18 + mouseSpeed) * proximity * depthBoost;
        p.vz += proximity * 0.6;
        maxSpeed = 6.5 * depthBoost;
      } else {
        const fleeSpeed = (1.6 + proximity * 4.5) * depthBoost * scare;
        p.vx = p.vx * 0.12 + nx * fleeSpeed;
        p.vy = p.vy * 0.12 + ny * fleeSpeed;
        p.baseX += nx * proximity * (16 + mouseSpeed * 0.8) * depthBoost * scare;
        p.baseY += ny * proximity * (16 + mouseSpeed * 0.8) * depthBoost * scare;
        maxSpeed = 5 * depthBoost;
      }
    }
  }

  let speed = Math.hypot(p.vx, p.vy);
  if (nearMouse < 0.08 && speed < minSpeed) {
    const angle = Math.random() * Math.PI * 2;
    p.vx = Math.cos(angle) * minSpeed;
    p.vy = Math.sin(angle) * minSpeed;
  } else if (speed > maxSpeed) {
    p.vx = (p.vx / speed) * maxSpeed;
    p.vy = (p.vy / speed) * maxSpeed;
  }

  if (nearMouse < 0.08) {
    p.vx *= 0.9992;
    p.vy *= 0.9992;
  }

  const motionScale = reducedMotion ? 0.35 : 1;
  p.baseX += p.vx * motionScale;
  p.baseY += p.vy * motionScale;
  p.rotation += p.rotSpeed * motionScale * (1 + nearMouse * 0.8);

  const pad = 10;
  if (p.baseX < pad) { p.baseX = pad; p.vx = Math.abs(p.vx) * 1.2; }
  if (p.baseX > width - pad) { p.baseX = width - pad; p.vx = -Math.abs(p.vx) * 1.2; }
  if (p.baseY < pad) { p.baseY = pad; p.vy = Math.abs(p.vy) * 1.2; }
  if (p.baseY > height - pad) { p.baseY = height - pad; p.vy = -Math.abs(p.vy) * 1.2; }

  return nearMouse;
}

export function ParticleNetwork({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let initialized = false;

    let targetMouseX = 0;
    let targetMouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseSpeed = 0;

    const linkDist = 210;

    function resizeCanvas() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      targetMouseX = width / 2;
      targetMouseY = height / 2;
      lastMouseX = width / 2;
      lastMouseY = height / 2;
    }

    function initParticles() {
      if (width < 16 || height < 16) {
        particles = [];
        initialized = false;
        return;
      }

      const count = Math.min(62, Math.max(32, Math.floor((width * height) / 12500)));
      particles = createEvenParticles(width, height, count);
      initialized = true;
    }

    function project(p: Particle) {
      return projectParticle(p);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    }

    function onMouseLeave() {
      targetMouseX = width / 2;
      targetMouseY = height / 2;
    }

    function step() {
      time += 1;

      if (width < 16 || height < 16 || particles.length === 0) {
        frameRef.current = requestAnimationFrame(step);
        return;
      }

      mouseSpeed += (Math.hypot(targetMouseX - lastMouseX, targetMouseY - lastMouseY) - mouseSpeed) * 0.35;
      lastMouseX = targetMouseX;
      lastMouseY = targetMouseY;

      ctx!.clearRect(0, 0, width, height);

      const nearMap = new Map<Particle, number>();

      for (const p of particles) {
        nearMap.set(
          p,
          updateParticleMotion(p, width, height, targetMouseX, targetMouseY, mouseSpeed, reducedMotion),
        );
      }

      applySoftSeparation(particles);

      const nodes: ProjectedNode[] = particles.map((p, index) => ({
        p,
        index,
        ...project(p),
      }));

      nodes.sort((a, b) => b.z - a.z);

      const links = buildNeighborLinks(nodes, linkDist, 3);

      for (const [a, b, dist] of links) {
        drawConnection(ctx!, a, b, dist, linkDist, time);
      }

      for (const node of [...nodes].sort((a, b) => a.z - b.z)) {
        const { p, x, y, scale } = node;
        const alpha = p.opacity * (0.48 + scale * 0.48);
        const near = nearMap.get(p) ?? 0;
        drawModernHexNode(ctx!, x, y, p.size, p.rotation, alpha, time, p.phase, near, scale);
      }

      frameRef.current = requestAnimationFrame(step);
    }

    resizeCanvas();
    initParticles();
    frameRef.current = requestAnimationFrame(step);

    parent.addEventListener("mousemove", onMouseMove, { capture: true });
    parent.addEventListener("mouseleave", onMouseLeave, { capture: true });

    const observer = new ResizeObserver(() => {
      resizeCanvas();
      if (!initialized) initParticles();
    });
    observer.observe(parent);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      parent.removeEventListener("mousemove", onMouseMove, { capture: true });
      parent.removeEventListener("mouseleave", onMouseLeave, { capture: true });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
      aria-hidden
    />
  );
}

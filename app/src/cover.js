// Vice Cover Lab — cover renderer.
// Draws a multi-panel GTA-style poster cover onto a canvas: a neon sunset
// sky, a low sun, three diagonal photo panels, halftone dots, grain and a
// big bold outlined caption. No network, no external assets, no game
// studio logos, artwork or fonts.

export const LAYOUTS = {
  square: { id: 'square', label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { id: 'portrait', label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { id: 'wide', label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

export const GRADES = {
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    skyTop: '#2b1055',
    skyMid: '#ff2e88',
    skyBottom: '#ff9a3d',
    sun: '#ffd166',
    sunGlow: 'rgba(255, 209, 102, 0.55)',
    titleFill: '#ffffff',
    titleStroke: '#ff2e88',
    titleShadow: '#2b1055',
    accent: '#00e5ff',
    band: 'rgba(43, 16, 85, 0.88)',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    skyTop: '#05081f',
    skyMid: '#3b0f66',
    skyBottom: '#ff2e88',
    sun: '#00e5ff',
    sunGlow: 'rgba(0, 229, 255, 0.5)',
    titleFill: '#ffffff',
    titleStroke: '#00e5ff',
    titleShadow: '#ff2e88',
    accent: '#ffd166',
    band: 'rgba(5, 8, 31, 0.88)',
  },
  noir: {
    id: 'noir',
    label: 'Noir Gold',
    skyTop: '#0d0d0f',
    skyMid: '#3a2b12',
    skyBottom: '#e8a33d',
    sun: '#f5d76e',
    sunGlow: 'rgba(245, 215, 110, 0.45)',
    titleFill: '#fff7e0',
    titleStroke: '#0d0d0f',
    titleShadow: '#e8a33d',
    accent: '#e8a33d',
    band: 'rgba(13, 13, 15, 0.88)',
  },
};

// Panel polygons, in fractions of the cover width/height. Each panel is a
// quadrilateral with one slanted edge, so the three photos stack like a
// poster collage with white gutters between them.
export function panelPolygons(layout) {
  const wide = layout.width > layout.height;
  if (wide) {
    return [
      // Big left panel, slanted right edge.
      [[0.0, 0.0], [0.44, 0.0], [0.38, 1.0], [0.0, 1.0]],
      // Top right panel.
      [[0.46, 0.0], [1.0, 0.0], [1.0, 0.52], [0.40, 0.60]],
      // Bottom right panel.
      [[0.42, 0.64], [1.0, 0.56], [1.0, 1.0], [0.38, 1.0]],
    ];
  }
  return [
    // Big top-left panel, slanted bottom edge.
    [[0.0, 0.0], [1.0, 0.0], [1.0, 0.40], [0.0, 0.50]],
    // Middle-left panel.
    [[0.0, 0.53], [0.60, 0.44], [0.56, 0.74], [0.0, 0.82]],
    // Bottom-right panel.
    [[0.62, 0.46], [1.0, 0.43], [1.0, 1.0], [0.58, 1.0]],
  ];
}

// A tiny deterministic random generator, seeded from the caption, so the
// grain and halftone look the same on every export of the same cover.
export function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return function nextRandom() {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822519);
    seed = Math.imul(seed ^ (seed >>> 13), 3266489917);
    seed ^= seed >>> 16;
    return (seed >>> 0) / 4294967296;
  };
}

function polygonPath(ctx, width, height, polygon) {
  ctx.beginPath();
  polygon.forEach(([fx, fy], i) => {
    const x = fx * width;
    const y = fy * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function polygonBounds(width, height, polygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [fx, fy] of polygon) {
    minX = Math.min(minX, fx * width);
    minY = Math.min(minY, fy * height);
    maxX = Math.max(maxX, fx * width);
    maxY = Math.max(maxY, fy * height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Draw one photo cover-filling a panel box, with a zoom factor and a pan
// offset (both -1..1, relative to the free space left by the crop).
function drawPhotoInPanel(ctx, image, box, zoom, panX, panY) {
  const scale = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight) * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const freeX = drawWidth - box.width;
  const freeY = drawHeight - box.height;
  const dx = box.x - (freeX * (panX * 0.5 + 0.5));
  const dy = box.y - (freeY * (panY * 0.5 + 0.5));
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}

function drawSky(ctx, width, height, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.45, grade.skyMid);
  sky.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Low sun with a soft glow, half sunk behind the panels.
  const sunX = width * 0.72;
  const sunY = height * 0.30;
  const sunR = Math.min(width, height) * 0.16;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, grade.sunGlow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Sun stripes: horizontal cuts through the lower half of the sun.
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade.skyMid;
  for (let i = 0; i < 5; i++) {
    const stripeY = sunY + sunR * (0.05 + i * 0.16);
    ctx.fillRect(sunX - sunR, stripeY, sunR * 2, sunR * 0.045);
  }
  ctx.restore();
}

function drawHalftone(ctx, width, height, random, color) {
  const dotGap = Math.max(10, Math.round(width / 72));
  const baseY = height * 0.78;
  ctx.fillStyle = color;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 46; col++) {
      const radius = dotGap * 0.16 * (1 + row * 0.35) * (0.7 + random() * 0.6);
      const x = width * 0.04 + col * dotGap + (row % 2 ? dotGap / 2 : 0);
      const y = baseY + row * dotGap * 0.9;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGrain(ctx, width, height, random) {
  const count = Math.round((width * height) / 2600);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height;
    const size = 1 + random() * 2.2;
    ctx.fillRect(x, y, size, size);
  }
}

function drawVignette(ctx, width, height) {
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

// Split a caption into at most two lines that fit the given width.
function splitCaptionLines(ctx, caption, maxWidth) {
  const words = caption.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['VICE CITY'];
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === 1 && current === word && lines[0]) {
      // Keep at most two lines: stop growing once the second line is set.
    }
  }
  if (current) lines.push(current);
  if (lines.length > 2) {
    // Merge the tail into the second line; it overflows a little rather
    // than spilling to a third line.
    const merged = lines.slice(1).join(' ');
    return [lines[0], merged];
  }
  return lines;
}

function drawTitle(ctx, width, height, grade, caption, subcaption) {
  const bandHeight = height * 0.235;
  const bandY = height - bandHeight;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, width, bandHeight);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, width, Math.max(4, height * 0.006));

  const margin = width * 0.045;
  const maxWidth = width - margin * 2;
  const titleSize = Math.min(height * 0.105, (width * 0.62) / Math.max(4, caption.trim().length * 0.42));
  ctx.font = `900 ${Math.round(titleSize)}px "Arial Black", Arial, Helvetica, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  try {
    ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`;
  } catch {
    // letterSpacing is optional; older engines simply ignore it.
  }
  const lines = splitCaptionLines(ctx, caption.toUpperCase(), maxWidth);
  const lineHeight = titleSize * 0.98;
  const titleTop = bandY + bandHeight * 0.30 + titleSize * 0.5;
  ctx.save();
  ctx.translate(0, 0);
  ctx.rotate(-0.012);
  lines.forEach((line, i) => {
    const y = titleTop + i * lineHeight;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, titleSize * 0.14);
    ctx.strokeStyle = grade.titleStroke;
    ctx.strokeText(line, margin, y);
    ctx.shadowColor = grade.titleShadow;
    ctx.shadowBlur = Math.round(titleSize * 0.18);
    ctx.shadowOffsetX = Math.round(titleSize * 0.05);
    ctx.shadowOffsetY = Math.round(titleSize * 0.06);
    ctx.fillStyle = grade.titleFill;
    ctx.fillText(line, margin, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });
  ctx.restore();

  if (subcaption && subcaption.trim()) {
    const subSize = Math.round(Math.min(height * 0.028, width * 0.028));
    ctx.font = `700 ${subSize}px Arial, Helvetica, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`;
    } catch {
      // Optional, see above.
    }
    ctx.fillStyle = grade.accent;
    ctx.fillText(subcaption.trim().toUpperCase(), margin, bandY + bandHeight * 0.155);
  }

  // Small maker mark, bottom right of the band.
  const markSize = Math.round(Math.min(height * 0.02, width * 0.02));
  ctx.font = `700 ${markSize}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  const mark = 'VICE COVER LAB';
  ctx.fillText(mark, width - margin - ctx.measureText(mark).width, height - margin * 0.55);
}

// Render a full cover. `state` carries the layout, grade, caption,
// subcaption and one photo slot per panel: { image, zoom, panX, panY }.
// Panels without a photo get a gradient placeholder so the cover never
// renders half-empty.
export function drawCover(canvas, state) {
  const layout = state.layout;
  const grade = state.grade;
  const width = layout.width;
  const height = layout.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const random = seededRandom(`${state.caption}|${state.subcaption}|${grade.id}`);

  drawSky(ctx, width, height, grade);

  const polygons = panelPolygons(layout);
  const gutter = Math.max(8, Math.round(width * 0.012));
  polygons.forEach((polygon, index) => {
    const slot = state.panels[index];
    const box = polygonBounds(width, height, polygon);
    ctx.save();
    polygonPath(ctx, width, height, polygon);
    ctx.clip();
    if (slot && slot.image) {
      drawPhotoInPanel(ctx, slot.image, box, slot.zoom || 1, slot.panX || 0, slot.panY || 0);
      // Warm photo tint so every photo sits in the same sunset world.
      ctx.fillStyle = grade.id === 'neon' ? 'rgba(255, 46, 136, 0.10)' : 'rgba(255, 120, 40, 0.10)';
      ctx.fillRect(box.x, box.y, box.width, box.height);
    } else {
      const placeholder = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
      placeholder.addColorStop(0, grade.skyMid);
      placeholder.addColorStop(1, grade.skyTop);
      ctx.fillStyle = placeholder;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = `700 ${Math.round(Math.min(width, height) * 0.028)}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', box.x + box.width / 2, box.y + box.height / 2);
      ctx.textAlign = 'left';
    }
    // Inner shade at the bottom of each panel, for depth.
    const shade = ctx.createLinearGradient(0, box.y + box.height * 0.55, 0, box.y + box.height);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.restore();

    // White poster gutter around the panel.
    ctx.save();
    polygonPath(ctx, width, height, polygon);
    ctx.lineJoin = 'round';
    ctx.lineWidth = gutter;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  });

  drawHalftone(ctx, width, height, random, 'rgba(255, 255, 255, 0.55)');
  drawGrain(ctx, width, height, random);
  drawVignette(ctx, width, height);
  drawTitle(ctx, width, height, grade, state.caption, state.subcaption);
}

// Hit-test a point (in cover pixels) against the panels; returns the panel
// index or -1. Used by the editor so a click on the preview picks a panel.
export function panelAtPoint(layout, x, y) {
  const polygons = panelPolygons(layout);
  for (let i = 0; i < polygons.length; i++) {
    let inside = false;
    const polygon = polygons[i];
    for (let a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
      const [ax, ay] = [polygon[a][0] * layout.width, polygon[a][1] * layout.height];
      const [bx, by] = [polygon[b][0] * layout.width, polygon[b][1] * layout.height];
      if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) {
        inside = !inside;
      }
    }
    if (inside) return i;
  }
  return -1;
}

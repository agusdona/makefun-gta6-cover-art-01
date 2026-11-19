// Vice Cover Lab — screenshot mode.
// Reads the page query (?shot=cover or ?shot=editor, plus photo, caption,
// grade and layout) so a headless browser can capture the cover and the
// editor exactly as the app renders them. Sets window.__shotReady once the
// cover has painted, after two animation frames.

import { LAYOUTS, GRADES, drawCover } from './cover.js';

export function readShotQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot') || '',
    photo: params.get('photo') || '',
    caption: params.get('caption') || '',
    subcaption: params.get('subcaption') || '',
    grade: params.get('grade') || '',
    layout: params.get('layout') || '',
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

function markShotReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

// Render a full-bleed cover into the page's cover canvas and hide the
// editor chrome. `photo` is the sample name (pier / boulevard) or ''.
export async function renderCoverShot(query) {
  const layout = LAYOUTS[query.layout] || LAYOUTS.square;
  const grade = GRADES[query.grade] || GRADES.sunset;
  const caption = query.caption || 'Sunset Heist';
  const subcaption = query.subcaption || 'Vice City Nights';
  const canvas = document.getElementById('coverCanvas');
  document.body.classList.add('shot-cover');
  document.body.classList.remove('shot-editor');
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;
  canvas.style.maxWidth = '100vw';
  canvas.style.maxHeight = '100vh';

  let image = null;
  if (query.photo) {
    try {
      image = await loadImage(`samples/${query.photo}.jpg`);
    } catch {
      image = null;
    }
  }
  const panels = [0, 1, 2].map((index) => ({
    image,
    zoom: index === 0 ? 1.05 : 1.25,
    panX: index === 1 ? 0.25 : 0,
    panY: index === 2 ? -0.2 : 0,
  }));
  drawCover(canvas, { layout, grade, caption, subcaption, panels });
  markShotReady();
}

// Load the requested sample photo into the editor and render the preview,
// so the editor screenshot shows a photo already in place.
export async function renderEditorShot(query, applyPhoto) {
  document.body.classList.add('shot-editor');
  document.body.classList.remove('shot-cover');
  if (query.photo) {
    try {
      const image = await loadImage(`samples/${query.photo}.jpg`);
      applyPhoto(query.photo, image, true);
    } catch {
      // The editor still renders with its placeholder panels.
    }
  }
  if (query.caption) {
    const captionInput = document.getElementById('captionInput');
    if (captionInput) {
      captionInput.value = query.caption;
      captionInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  markShotReady();
}

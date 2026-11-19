// Vice Cover Lab — editor.
// Wires the controls (photo library, caption, layout, grade, per-panel
// crop) to a live cover preview and a one-click PNG export. Everything runs
// offline; photos are read on the user's own machine and never uploaded.

import { LAYOUTS, GRADES, drawCover, panelAtPoint } from './cover.js';
import { readShotQuery, renderCoverShot, renderEditorShot } from './shots.js';

const DEFAULT_CAPTION = 'Sunset Heist';
const DEFAULT_SUBCAPTION = 'Vice City Nights';

const state = {
  layout: LAYOUTS.square,
  grade: GRADES.sunset,
  caption: DEFAULT_CAPTION,
  subcaption: DEFAULT_SUBCAPTION,
  library: [],
  panels: [
    { photoIndex: -1, zoom: 1.05, panX: 0, panY: 0 },
    { photoIndex: -1, zoom: 1.25, panX: 0.25, panY: 0 },
    { photoIndex: -1, zoom: 1.25, panX: 0, panY: -0.2 },
  ],
  selectedPanel: 0,
};

function $(id) {
  return document.getElementById(id);
}

function panelSlots() {
  return state.panels.map((slot) => {
    const photo = state.library[slot.photoIndex];
    return photo
      ? { image: photo.image, zoom: slot.zoom, panX: slot.panX, panY: slot.panY }
      : { image: null, zoom: 1, panX: 0, panY: 0 };
  });
}

function renderPreview() {
  const canvas = $('coverCanvas');
  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    panels: panelSlots(),
  });
  const sizeLabel = $('sizeLabel');
  if (sizeLabel) {
    sizeLabel.textContent = `${state.layout.width} x ${state.layout.height} PNG`;
  }
}

function refreshPanelControls() {
  const slot = state.panels[state.selectedPanel];
  $('zoomSlider').value = String(slot.zoom);
  $('panXSlider').value = String(slot.panX);
  $('panYSlider').value = String(slot.panY);
  $('panelName').textContent = `Panel ${state.selectedPanel + 1} of 3`;
  document.querySelectorAll('[data-panel]').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.panel) === state.selectedPanel);
  });
}

function refreshLibraryButtons() {
  const list = $('photoList');
  list.innerHTML = '';
  state.library.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-thumb';
    button.title = `Use ${photo.name} in panel ${state.selectedPanel + 1}`;
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = photo.name;
    button.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = photo.name;
    button.appendChild(label);
    button.addEventListener('click', () => {
      state.panels[state.selectedPanel].photoIndex = index;
      renderPreview();
      refreshLibraryButtons();
    });
    const inUse = state.panels.some((slot) => slot.photoIndex === index);
    button.classList.toggle('in-use', inUse);
    list.appendChild(button);
  });
}

function addPhoto(name, src, image) {
  const existing = state.library.findIndex((photo) => photo.name === name);
  if (existing !== -1) {
    state.library[existing] = { name, src, image };
    return existing;
  }
  state.library.push({ name, src, image });
  return state.library.length - 1;
}

function applySamplePhoto(name, image, replaceAll = false) {
  const index = addPhoto(name, `samples/${name}.jpg`, image);
  state.panels.forEach((slot) => {
    if (replaceAll || slot.photoIndex === -1) slot.photoIndex = index;
  });
  renderPreview();
  refreshLibraryButtons();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ src: String(reader.result), image });
      image.onerror = () => reject(new Error('could not read that image'));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

function loadSample(name) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load samples/${name}.jpg`));
    image.src = `samples/${name}.jpg`;
  });
}

function selectPanel(index) {
  state.selectedPanel = index;
  refreshPanelControls();
  renderPreview();
}

function exportCoverPng() {
  const canvas = document.createElement('canvas');
  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    panels: panelSlots(),
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${state.layout.id}-${state.layout.width}x${state.layout.height}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function wireControls() {
  $('photoInput').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const { src, image } = await loadImageFile(file);
      const index = addPhoto(file.name, src, image);
      state.panels[state.selectedPanel].photoIndex = index;
      renderPreview();
      refreshLibraryButtons();
    } catch {
      // A bad file simply leaves the current photo in place.
    }
    event.target.value = '';
  });

  $('samplePierBtn').addEventListener('click', async () => {
    try {
      applySamplePhoto('pier', await loadSample('pier'));
    } catch {
      // Sample missing: the placeholder panels stay.
    }
  });
  $('sampleBoulevardBtn').addEventListener('click', async () => {
    try {
      applySamplePhoto('boulevard', await loadSample('boulevard'));
    } catch {
      // Sample missing: the placeholder panels stay.
    }
  });

  $('captionInput').addEventListener('input', (event) => {
    state.caption = event.target.value || DEFAULT_CAPTION;
    renderPreview();
  });
  $('subcaptionInput').addEventListener('input', (event) => {
    state.subcaption = event.target.value;
    renderPreview();
  });

  document.querySelectorAll('[data-layout]').forEach((button) => {
    button.addEventListener('click', () => {
      state.layout = LAYOUTS[button.dataset.layout] || LAYOUTS.square;
      document.querySelectorAll('[data-layout]').forEach((other) => {
        other.classList.toggle('active', other === button);
      });
      renderPreview();
    });
  });

  document.querySelectorAll('[data-grade]').forEach((button) => {
    button.addEventListener('click', () => {
      state.grade = GRADES[button.dataset.grade] || GRADES.sunset;
      document.querySelectorAll('[data-grade]').forEach((other) => {
        other.classList.toggle('active', other === button);
      });
      renderPreview();
    });
  });

  document.querySelectorAll('[data-panel]').forEach((button) => {
    button.addEventListener('click', () => selectPanel(Number(button.dataset.panel)));
  });

  $('zoomSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].zoom = Number(event.target.value);
    renderPreview();
  });
  $('panXSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].panX = Number(event.target.value);
    renderPreview();
  });
  $('panYSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].panY = Number(event.target.value);
    renderPreview();
  });

  $('coverCanvas').addEventListener('click', (event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * state.layout.width;
    const y = ((event.clientY - rect.top) / rect.height) * state.layout.height;
    const panel = panelAtPoint(state.layout, x, y);
    if (panel !== -1) selectPanel(panel);
  });

  $('exportBtn').addEventListener('click', exportCoverPng);
}

async function init() {
  wireControls();
  refreshPanelControls();
  const query = readShotQuery();
  if (query.shot === 'cover') {
    await renderCoverShot(query);
    return;
  }
  // Default photo so the first paint already looks like a poster.
  try {
    applySamplePhoto('pier', await loadSample('pier'));
  } catch {
    renderPreview();
  }
  refreshLibraryButtons();
  if (query.shot === 'editor') {
    await renderEditorShot(query, applySamplePhoto);
    if (query.grade && GRADES[query.grade]) {
      state.grade = GRADES[query.grade];
      document.querySelectorAll('[data-grade]').forEach((button) => {
        button.classList.toggle('active', button.dataset.grade === query.grade);
      });
    }
    if (query.layout && LAYOUTS[query.layout]) {
      state.layout = LAYOUTS[query.layout];
      document.querySelectorAll('[data-layout]').forEach((button) => {
        button.classList.toggle('active', button.dataset.layout === query.layout);
      });
    }
    renderPreview();
  }
}

init();

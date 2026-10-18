/**
 * DrumScore Practice Player
 * Built with AlphaTab and Web Audio API
 */

// DOM Elements
const wrapper = document.getElementById('alphaTabWrapper');
const viewport = document.getElementById('alphaTabViewport');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const scoreSelect = document.getElementById('scoreSelect');
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const dropZone = document.getElementById('dropZone');

// Controls
const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const btnStop = document.getElementById('btnStop');
const btnCountIn = document.getElementById('btnCountIn');
const btnMetronome = document.getElementById('btnMetronome');
const btnLoop = document.getElementById('btnLoop');
const speedSlider = document.getElementById('speedSlider');
const tempoDisplay = document.getElementById('tempoDisplay');
const presetBtns = document.querySelectorAll('.btn-preset');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const zoomLevel = document.getElementById('zoomLevel');
const volumeSlider = document.getElementById('volumeSlider');

// Status
const scoreTitleDisplay = document.getElementById('scoreTitleDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const barDisplay = document.getElementById('barDisplay');

// Player State
let baseBpm = 110;
let currentSpeed = 1.0;
let isCountIn = false;
let isMetronome = false;
let isLoop = true;
let currentZoom = 1.0;

// Detect file:// protocol
const isFileProtocol = window.location.protocol === 'file:';

// Initialize AlphaTab
const settings = {
  core: {
    file: isFileProtocol ? null : scoreSelect.value,
    fontDirectory: './lib/font/',
    useWorkers: !isFileProtocol,
    tracks: 'all',
    logLevel: 1
  },
  display: {
    staveProfile: 'Score', // standard music score clef (no guitar tabs)
    scale: 1.0,
    layoutMode: 'Page'
  },
  player: {
    enablePlayer: true,
    soundFont: './soundfont/sonivox.sf2',
    scrollElement: viewport,
    scrollMode: 'Continuous'
  }
};

let api = null;

try {
  api = new alphaTab.AlphaTabApi(wrapper, settings);
  if (isFileProtocol) {
    loadingText.innerHTML = `
      <div style="max-width: 480px; text-align: center; line-height: 1.5;">
        <p style="font-size: 1.15rem; margin-bottom: 8px;">⚠️ <strong>file:// Protocol Detected</strong></p>
        <p style="font-size: 0.88rem; color: #a0aec0; margin-bottom: 14px;">Web browsers block background XML file access on <code>file://</code> URLs for security.</p>
        <p style="font-size: 0.95rem;">👉 Run <code>python serve.py</code> for the full experience, or click <strong style="color:var(--accent-cyan);">📂 Open MusicXML</strong> above to load a score.</p>
      </div>
    `;
  }
} catch (err) {
  console.error("AlphaTab initialization error:", err);
  loadingText.innerText = "Error initializing AlphaTab. Please check console.";
}

// Format Seconds to MM:SS
function formatTime(millis) {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Update Tempo UI
function updateTempoUI() {
  const effectiveBpm = Math.round(baseBpm * currentSpeed);
  tempoDisplay.innerText = `${Math.round(currentSpeed * 100)}% · ${effectiveBpm} BPM`;
  speedSlider.value = currentSpeed;
  
  presetBtns.forEach(btn => {
    const val = parseFloat(btn.dataset.speed);
    btn.classList.toggle('active', Math.abs(val - currentSpeed) < 0.01);
  });
}

function updatePlaybackAvailability() {
  const ready = Boolean(api && api.isReadyForPlayback);
  btnPlayPause.disabled = !ready;
  if (api) {
    api.isLooping = isLoop;
  }
  if (ready) {
    loadingOverlay.classList.add('hidden');
  }
}

function hideLoadingOverlay() {
  loadingOverlay.classList.add('hidden');
}

function subscribeAlphaTabEvent(eventSource, handler) {
  if (eventSource && typeof eventSource.on === 'function') {
    eventSource.on(handler);
  }
}

// Hook AlphaTab Events
if (api) {
  // SoundFont and Engine Ready
  subscribeAlphaTabEvent(api.soundFontLoaded, () => {
    updatePlaybackAvailability();
  });

  subscribeAlphaTabEvent(api.playerReady, () => {
    updatePlaybackAvailability();
  });

  wrapper.addEventListener('alphaTab.playerReady', () => {
    updatePlaybackAvailability();
  });

  // Global Error Handler
  subscribeAlphaTabEvent(api.error, (err) => {
    console.error("AlphaTab error:", err);
    loadingOverlay.classList.remove('hidden');
    loadingText.innerText = "Error loading score: " + (err.message || err);
  });

  // Playback State Changed
  subscribeAlphaTabEvent(api.playerStateChanged, (args) => {
    // 0 = Paused/Stopped, 1 = Playing
    const isPlaying = (args.state === 1);
    if (isPlaying) {
      playIcon.innerText = "⏸ Pause";
      btnPlayPause.classList.add('active');
    } else {
      playIcon.innerText = "▶ Play";
      btnPlayPause.classList.remove('active');
    }
  });

  // Cursor and Position Changed
  subscribeAlphaTabEvent(api.playerPositionChanged, (args) => {
    const curTime = formatTime(args.currentTime);
    const endTime = formatTime(args.endTime);
    timeDisplay.innerText = `${curTime} / ${endTime}`;

    // Highlight current bar
    if (api.cursor && api.cursor.currentBeat && api.cursor.currentBeat.voice) {
      const bar = api.cursor.currentBeat.voice.bar.index + 1;
      barDisplay.innerText = `Bar ${bar}`;
    }
  });

  // Score Loaded
  subscribeAlphaTabEvent(api.scoreLoaded, (score) => {
    hideLoadingOverlay();
    updatePlaybackAvailability();
    scoreTitleDisplay.innerText = score.title || "Drum Groove";
    
    // Read tempo
    if (score.tempo && score.tempo > 0) {
      baseBpm = score.tempo;
    } else {
      baseBpm = 110;
    }
    updateTempoUI();
  });

  subscribeAlphaTabEvent(api.renderStarted, () => {
    loadingOverlay.classList.remove('hidden');
    loadingText.innerText = "Rendering Score...";
  });

  subscribeAlphaTabEvent(api.renderFinished, () => {
    hideLoadingOverlay();
    updatePlaybackAvailability();
  });
}

// Load a score from URL or ArrayBuffer
function loadScore(data) {
  loadingOverlay.classList.remove('hidden');
  loadingText.innerText = "Loading Score...";
  btnPlayPause.disabled = true;
  if (api) {
    api.load(data);
  }
}

// Event Listeners for UI Controls
btnPlayPause.addEventListener('click', () => {
  if (api) {
    if (!api.isReadyForPlayback) {
      loadingOverlay.classList.remove('hidden');
      loadingText.innerText = 'Preparing playback...';
      updatePlaybackAvailability();
      return;
    }
    api.playPause();
  }
});

btnStop.addEventListener('click', () => {
  if (api) {
    api.stop();
    playIcon.innerText = "▶ Play";
    btnPlayPause.classList.remove('active');
  }
});

// Speed Slider
speedSlider.addEventListener('input', (e) => {
  currentSpeed = parseFloat(e.target.value);
  if (api) {
    api.playbackSpeed = currentSpeed;
  }
  updateTempoUI();
});

// Preset Buttons (50%, 75%, 100%, 125%)
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentSpeed = parseFloat(btn.dataset.speed);
    if (api) {
      api.playbackSpeed = currentSpeed;
    }
    updateTempoUI();
  });
});

// Metronome Toggle
btnMetronome.addEventListener('click', () => {
  isMetronome = !isMetronome;
  btnMetronome.classList.toggle('active', isMetronome);
  if (api) {
    api.metronomeVolume = isMetronome ? 0.9 : 0.0;
  }
});

// Count-In Toggle
btnCountIn.addEventListener('click', () => {
  isCountIn = !isCountIn;
  btnCountIn.classList.toggle('active', isCountIn);
  if (api) {
    api.countInVolume = isCountIn ? 1.0 : 0.0;
  }
});

// Loop Toggle
btnLoop.addEventListener('click', () => {
  isLoop = !isLoop;
  btnLoop.classList.toggle('active', isLoop);
  if (api) {
    api.isLooping = isLoop;
  }
});

// Volume Slider
volumeSlider.addEventListener('input', (e) => {
  const vol = parseFloat(e.target.value);
  if (api) {
    api.masterVolume = vol;
  }
});

// Zoom In & Out
btnZoomIn.addEventListener('click', () => {
  if (currentZoom < 2.0) {
    currentZoom = Math.min(2.0, currentZoom + 0.15);
    applyZoom();
  }
});

btnZoomOut.addEventListener('click', () => {
  if (currentZoom > 0.5) {
    currentZoom = Math.max(0.5, currentZoom - 0.15);
    applyZoom();
  }
});

function applyZoom() {
  zoomLevel.innerText = `${Math.round(currentZoom * 100)}%`;
  if (api) {
    api.settings.display.scale = currentZoom;
    api.updateSettings();
    api.render();
  }
}

// Built-in Score Selector
scoreSelect.addEventListener('change', () => {
  const url = scoreSelect.value;
  loadScore(url);
});

// Custom File Upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    scoreTitleDisplay.innerText = file.name.replace(/\.[^/.]+$/, "");
    loadScore(arrayBuffer);
  };
  reader.readAsArrayBuffer(file);
});

// Drag & Drop
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('active');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('active');
  }, false);
});

dropArea.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    scoreTitleDisplay.innerText = file.name.replace(/\.[^/.]+$/, "");
    loadScore(arrayBuffer);
  };
  reader.readAsArrayBuffer(file);
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // Prevent spacebar page scrolling
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.key === 'Escape') {
    btnStop.click();
  } else if (e.key === 'm' || e.key === 'M') {
    btnMetronome.click();
  } else if (e.key === 'l' || e.key === 'L') {
    btnLoop.click();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentSpeed = Math.min(1.6, currentSpeed + 0.05);
    if (api) api.playbackSpeed = currentSpeed;
    updateTempoUI();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentSpeed = Math.max(0.4, currentSpeed - 0.05);
    if (api) api.playbackSpeed = currentSpeed;
    updateTempoUI();
  }
});

updatePlaybackAvailability();

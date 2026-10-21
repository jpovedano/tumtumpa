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
const btnDrumMute = document.getElementById('btnDrumMute');
const drumMuteLabel = document.getElementById('drumMuteLabel');
const btnLoop = document.getElementById('btnLoop');
const speedSlider = document.getElementById('speedSlider');
const tempoDisplay = document.getElementById('tempoDisplay');
const bpmInput = document.getElementById('bpmInput');
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
let drumTracks = [];
let areDrumsMuted = false;
let isLoop = true;
let currentZoom = 1.0;

// Detect file:// protocol
const isFileProtocol = window.location.protocol === 'file:';

// Initialize AlphaTab
const settings = {
  core: {
    file: null,
    fontDirectory: './lib/font/',
    useWorkers: !isFileProtocol,
    tracks: 'all',
    logLevel: 1
  },
  display: {
    staveProfile: 'Score', // standard music score clef (no guitar tabs)
    scale: 1.0,
    layoutMode: 'Page',
    resources: {
      secondaryGlyphColor: '#000000'
    }
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
  bpmInput.min = Math.ceil(baseBpm * Number(speedSlider.min));
  bpmInput.max = Math.floor(baseBpm * Number(speedSlider.max));
  bpmInput.value = effectiveBpm;
  bpmInput.setCustomValidity('');
  bpmInput.title = `Enter a whole-number tempo from ${bpmInput.min} to ${bpmInput.max} BPM`;
  
  presetBtns.forEach(btn => {
    const val = parseFloat(btn.dataset.speed);
    btn.classList.toggle('active', Math.abs(val - currentSpeed) < 0.01);
  });
}

function setPlaybackSpeed(speed) {
  currentSpeed = Math.min(Number(speedSlider.max), Math.max(Number(speedSlider.min), speed));
  if (api) {
    api.playbackSpeed = currentSpeed;
  }
  updateTempoUI();
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

function syncScoreBackgroundHeight() {
  const surface = wrapper.querySelector('.at-surface');
  if (!surface) {
    wrapper.style.minHeight = '';
    return;
  }

  let maxBottom = 0;
  Array.from(surface.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.classList.contains('at-cursors')) {
      return;
    }

    const childBottom = child.offsetTop + child.offsetHeight;
    if (childBottom > maxBottom) {
      maxBottom = childBottom;
    }
  });

  const computedStyle = window.getComputedStyle(wrapper);
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const minHeight = maxBottom > 0 ? maxBottom + paddingTop + paddingBottom : 0;

  wrapper.style.minHeight = minHeight > 0 ? `${Math.ceil(minHeight)}px` : '';
}

const percussionMidiByName = new Map([
  ['bass drum 2', 35],
  ['acoustic bass drum', 35],
  ['bass drum', 36],
  ['bass drum 1', 36],
  ['side stick', 37],
  ['cross-stick', 37],
  ['cross stick', 37],
  ['snare', 38],
  ['acoustic snare', 38],
  ['electric snare', 40],
  ['floor tom', 41],
  ['low floor tom', 41],
  ['closed hi-hat', 42],
  ['closed hi hat', 42],
  ['high floor tom', 43],
  ['pedal hi-hat', 44],
  ['pedal hi hat', 44],
  ['low tom', 45],
  ['open hi-hat', 46],
  ['open hi hat', 46],
  ['mid tom', 47],
  ['mid tom 1', 47],
  ['mid tom 2', 47],
  ['high tom', 50],
  ['crash cymbal', 49],
  ['crash cymbal 1', 49],
  ['ride cymbal', 51],
  ['ride cymbal 1', 51],
  ['china cymbal', 52],
  ['ride bell', 53],
  ['splash cymbal', 55],
  ['crash cymbal 2', 57]
]);

const xmlParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function normalizeInstrumentName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getExpectedMidiUnpitched(instrumentName) {
  const normalizedName = normalizeInstrumentName(instrumentName);
  if (percussionMidiByName.has(normalizedName)) {
    return percussionMidiByName.get(normalizedName);
  }

  for (const [knownName, midiNote] of percussionMidiByName.entries()) {
    if (normalizedName.includes(knownName)) {
      return midiNote;
    }
  }

  return null;
}

function looksLikeMusicXml(text) {
  return /^\s*(<\?xml|<!DOCTYPE\s+score-partwise|<score-partwise|<score-timewise)/i.test(text);
}

function normalizeMusicXmlText(xmlText) {
  if (!looksLikeMusicXml(xmlText)) {
    return { data: xmlText, changed: false };
  }

  const parsed = xmlParser.parseFromString(xmlText, 'application/xml');
  if (parsed.querySelector('parsererror')) {
    return { data: xmlText, changed: false };
  }

  const scorePartElements = parsed.querySelectorAll('score-part');
  if (!scorePartElements.length) {
    return { data: xmlText, changed: false };
  }

  let changed = false;
  scorePartElements.forEach((scorePart) => {
    const instrumentNamesById = new Map();
    scorePart.querySelectorAll('score-instrument').forEach((instrument) => {
      const instrumentId = instrument.getAttribute('id');
      const instrumentName = instrument.querySelector('instrument-name')?.textContent?.trim();
      if (instrumentId && instrumentName) {
        instrumentNamesById.set(instrumentId, instrumentName);
      }
    });

    scorePart.querySelectorAll('midi-instrument').forEach((midiInstrument) => {
      const instrumentId = midiInstrument.getAttribute('id');
      const instrumentName = instrumentId ? instrumentNamesById.get(instrumentId) : null;
      if (!instrumentName) {
        return;
      }

      const expectedMidiUnpitched = getExpectedMidiUnpitched(instrumentName);
      const midiUnpitched = midiInstrument.querySelector('midi-unpitched');
      if (expectedMidiUnpitched === null || !midiUnpitched) {
        return;
      }

      const currentValue = Number.parseInt(midiUnpitched.textContent ?? '', 10);
      if (currentValue !== expectedMidiUnpitched) {
        midiUnpitched.textContent = String(expectedMidiUnpitched);
        changed = true;
      }
    });
  });

  if (!changed) {
    return { data: xmlText, changed: false };
  }

  const scoreStart = xmlText.search(/<score-(partwise|timewise)\b/i);
  const xmlPrefix = scoreStart > 0 ? xmlText.slice(0, scoreStart) : '';
  const serialized = xmlSerializer.serializeToString(parsed);
  return {
    data: `${xmlPrefix}${serialized}`,
    changed: true
  };
}

function normalizeMusicXmlBytes(data) {
  try {
    const xmlText = textDecoder.decode(data);
    if (!looksLikeMusicXml(xmlText)) {
      return { data, changed: false };
    }

    const normalized = normalizeMusicXmlText(xmlText);
    if (!normalized.changed) {
      return { data, changed: false };
    }

    return {
      data: textEncoder.encode(normalized.data),
      changed: true
    };
  } catch {
    return { data, changed: false };
  }
}

function isMusicXmlFileName(fileName) {
  return /\.(musicxml|xml)(\?.*)?$/i.test(fileName);
}

async function prepareScoreData(data, sourceName = '') {
  if (typeof data === 'string') {
    if (!isMusicXmlFileName(data)) {
      return data;
    }

    const response = await fetch(data);
    if (!response.ok) {
      throw new Error(`Failed to fetch score: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const normalized = normalizeMusicXmlText(xmlText);
    return textEncoder.encode(normalized.data);
  }

  if (data instanceof ArrayBuffer) {
    return normalizeMusicXmlBytes(new Uint8Array(data)).data;
  }

  if (data instanceof Uint8Array) {
    return normalizeMusicXmlBytes(data).data;
  }

  if (sourceName && isMusicXmlFileName(sourceName)) {
    return normalizeMusicXmlBytes(new Uint8Array(data)).data;
  }

  return data;
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
    drumTracks = score.tracks.filter(track => track.isPercussion);
    areDrumsMuted = false;
    if (drumTracks.length) {
      api.changeTrackMute(drumTracks, false);
    }
    btnDrumMute.disabled = drumTracks.length === 0;
    btnDrumMute.title = drumTracks.length ? 'Mute percussion tracks in the loaded score' : 'No percussion tracks in the loaded score';
    btnDrumMute.classList.remove('active');
    btnDrumMute.setAttribute('aria-pressed', 'false');
    drumMuteLabel.innerText = '🥁 Mute Drums';
    
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
    requestAnimationFrame(syncScoreBackgroundHeight);
  });
}

// Load a score from URL or ArrayBuffer
async function loadScore(data, sourceName = '') {
  loadingOverlay.classList.remove('hidden');
  loadingText.innerText = "Loading Score...";
  btnPlayPause.disabled = true;
  if (!api) {
    return;
  }

  try {
    const preparedData = await prepareScoreData(data, sourceName);
    api.load(preparedData);
  } catch (err) {
    console.error('Score loading error:', err);
    loadingText.innerText = 'Error loading score: ' + (err.message || err);
    loadingOverlay.classList.remove('hidden');
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
  setPlaybackSpeed(Number(e.target.value));
});

bpmInput.addEventListener('input', () => {
  bpmInput.setCustomValidity('');
});

bpmInput.addEventListener('change', () => {
  if (!bpmInput.checkValidity()) {
    bpmInput.reportValidity();
    return;
  }
  setPlaybackSpeed(bpmInput.valueAsNumber / baseBpm);
});

bpmInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    bpmInput.dispatchEvent(new Event('change'));
  } else if (e.key === 'Escape') {
    updateTempoUI();
    bpmInput.blur();
  }
});

// Preset Buttons (50%, 75%, 100%, 125%)
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setPlaybackSpeed(Number(btn.dataset.speed));
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

// Drum Track Mute Toggle
btnDrumMute.addEventListener('click', () => {
  if (!api || drumTracks.length === 0) {
    return;
  }

  areDrumsMuted = !areDrumsMuted;
  api.changeTrackMute(drumTracks, areDrumsMuted);
  btnDrumMute.classList.toggle('active', areDrumsMuted);
  btnDrumMute.setAttribute('aria-pressed', String(areDrumsMuted));
  drumMuteLabel.innerText = areDrumsMuted ? '🔇 Unmute Drums' : '🥁 Mute Drums';
  btnDrumMute.title = areDrumsMuted ? 'Unmute percussion tracks in the loaded score' : 'Mute percussion tracks in the loaded score';
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
    requestAnimationFrame(syncScoreBackgroundHeight);
  }
}

// Built-in Score Selector
scoreSelect.addEventListener('change', () => {
  const url = scoreSelect.value;
  loadScore(url, url);
});

// Custom File Upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    scoreTitleDisplay.innerText = file.name.replace(/\.[^/.]+$/, "");
    loadScore(arrayBuffer, file.name);
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
    loadScore(arrayBuffer, file.name);
  };
  reader.readAsArrayBuffer(file);
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.isContentEditable)) {
    return;
  }

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
    setPlaybackSpeed(currentSpeed + 0.01);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setPlaybackSpeed(currentSpeed - 0.01);
  }
});

window.addEventListener('resize', () => {
  requestAnimationFrame(syncScoreBackgroundHeight);
});

updateTempoUI();
updatePlaybackAvailability();

if (!isFileProtocol) {
  loadScore(scoreSelect.value, scoreSelect.value);
}

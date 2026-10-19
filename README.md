# 🥁 Tumtumpa — Interactive Drum Practice Player

An interactive web application designed for learning drums using **MusicXML** files. It renders full drum score sheets with real-time cursor tracking, General MIDI drum playback via Web Audio / SoundFont, dynamic tempo scaling, practice looping, and auto-scrolling.

---

## 🌟 Key Features

- **🎼 MusicXML Drum Rendering:** Displays standard 5-line percussion clef notation with proper drum noteheads (cross notehead for hi-hat, ride, and cymbals; standard noteheads for kick, snare, and toms).
- **🔊 Realistic MIDI Drum Playback:** Built-in General MIDI SoundFont synthesizer (Channel 10 percussion mapping) directly in the browser via Web Audio API.
- **⚡ Dynamic Tempo & Speed Control:**
  - Adjust playback speed from **40% to 160%** with smooth audio playback.
  - Wider, fine-grained slider with **0.1%** steps for precise adjustment.
  - Type an exact whole-number **BPM** and press **Enter** or leave the field to apply it. The allowed range follows the score's tempo (40–160%); invalid entries show a validation message. Press **Esc** in the field to cancel an edit.
  - Quick-preset buttons: **50%**, **75%**, **100%**, **125%**.
  - Real-time BPM calculation.
- **📜 Synchronized Auto-Scroll & Cursor:** Follows playback bar-by-bar, automatically scrolling the viewport so you never lose your place while drumming.
- **🔁 Practice Looper:** Enable looping to repeat grooves or difficult measures indefinitely.
- **🔔 Count-In & Click Track:**
  - 1-bar count-in before playback begins so you can pick up your sticks in time.
  - Dedicated metronome toggle with independent volume control.
- **📂 Custom Score Loading:**
  - Dropdown with pre-loaded drum exercises.
  - **Drag and Drop** or click **"Open MusicXML"** to load any `.musicxml`, `.xml`, `.mxl`, or Guitar Pro file.
- **📱 Mobile & Tablet Ready (PWA):**
  - Responsive dark-mode layout designed to sit on a drum kit's music stand.
  - Touch-friendly controls and full-screen PWA support.

---

## 🚀 How to Open and Run

### 1. Opening as a new Antigravity Project
1. In Antigravity (or VS Code), go to **File** → **Open Folder...**
2. Select `C:\Users\javier\Desktop\drum-trainer`
3. Antigravity will load this repository as an isolated workspace.

### 2. Starting the App (1-Click)
Open a terminal in the project directory and run:

```bash
python serve.py
```

This will automatically launch `http://localhost:8080` in your default web browser.

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause playback |
| `Esc` | Stop and rewind to measure 1 |
| `M` | Toggle Metronome (Click track) |
| `L` | Toggle Loop Mode |
| `↑` | Increase tempo (+1%) |
| `↓` | Decrease tempo (-1%) |

---

## 🎼 Using with MuseScore Studio 4

Since you have **MuseScore Studio 4** installed:
1. Open or create your drum groove or transcription in MuseScore.
2. Go to **File** → **Export...**
3. In the format dropdown, select **MusicXML File (*.musicxml)** or **Compressed MusicXML File (*.mxl)**.
4. Save the file, then drag and drop it directly onto the DrumScore web app!

---

## 📱 Porting to Mobile (iOS & Android)

### Method A: Instant Progressive Web App (PWA)
1. Serve the app over your local Wi-Fi or deploy it to any free static host (GitHub Pages, Vercel, Netlify).
2. Open Safari (iOS/iPad) or Chrome (Android) on your tablet/phone.
3. Tap **Share** (iOS) or **Menu (⋮)** (Android) → **"Add to Home Screen"**.
4. The app will launch full-screen like a native app with touch controls.

### Method B: Native App with Ionic Capacitor
To build a standalone `.apk` or `.ipa` app with zero changes:
```bash
# Initialize Capacitor
npm init @capacitor/app

# Add Android and iOS platforms
npm install @capacitor/core @capacitor/cli
npx cap add android
npx cap add ios
npx cap copy
npx cap open android
```

<div align="center">
  <img width="1200" height="400" alt="Aether Music Studio Banner" src="https://raw.githubusercontent.com/LoL0nny/Aether-Studio-2/refs/heads/main/app-icon.svg" />
  <h1>Aether Music Studio</h1>
  <p>AI-Powered Music Generation Desktop Application</p>
  <p>
    <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/Framework-Tauri%202.0-purple?style=flat-square" alt="Framework" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## ✨ Features

### Music Generation
- **Quick Mode** - Describe your song in plain text and let AI create it
- **Custom Mode** - Write your own lyrics with full control
- **Model Selection** - Choose from multiple AI models (v3.5, v4.0, v4.5, v4.5+, v5)
- **Audio Reference** - Upload audio files to influence generation

### Creative Controls
- **Voice Gender** - Select male, female, or any voice
- **BPM Control** - Set tempo from 60-200 BPM
- **Temperature** - Adjust creativity level (precise to creative)
- **Instrumental Mode** - Generate music without vocals

### Style Library
- **Preset Styles** - Pop, Rock, EDM, Jazz, Lo-fi, Classical, Hip-hop, R&B, Country, Metal, Acoustic, Electronic
- **Custom Styles** - Save and manage your own style presets

### Playback & Export
- **Full Playback** - Play, pause, and seek through generated songs
- **Version Toggle** - Switch between generated variations
- **Remix** - Regenerate with the same prompt for new results
- **Extend** - Continue your song beyond the initial generation
- **Download** - Export songs as MP3 files

### Customization
- **Theme Editor** - Customize primary color, accent color, background, and border radius
- **Bifrost Server** - Connect to your own Bifrost inference server
- **Udio API** - Direct integration with udioapi.pro

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Rust** (for building Tauri)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LoL0nny/Aether-Studio.git
   cd Aether-Studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API**
   
   **Option A: Udio API**
   - Get an API key from [udioapi.pro](https://udioapi.pro)
   - Open Settings and enter your API key under the Udio tab

   **Option B: Bifrost Server**
   - Run your own Bifrost inference server
   - Enter your server URL and API key in Settings under the Bifrost tab

4. **Run the app**
   ```bash
   npm run dev
   ```

### Building for Production

```bash
# Build web assets
npm run build

# Build desktop app (Windows)
npm run tauri:build
```

The executable will be located at:
- `src-tauri/target/release/aether-music-studio.exe` (standalone)
- `src-tauri/target/release/bundle/nsis/Aether Music Studio_0.0.0_x64-setup.exe` (installer)

---

## 🎨 Theme Customization

Access the Theme tab in Settings to personalize your app:

| Setting | Description |
|---------|-------------|
| Primary Color | Main brand color (buttons, accents) |
| Accent Color | Secondary highlight color |
| Background | App background color |
| Border Radius | Rounded corners (square to pill) |

---

## 📁 Project Structure

```
aether-music-studio/
├── src/
│   ├── App.tsx              # Main application component
│   ├── index.tsx            # React entry point
│   ├── index.html           # HTML template
│   └── index.css            # Global styles
├── src-tauri/               # Tauri desktop app
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   └── lib.rs          # Rust application
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri configuration
│   └── capabilities/        # App permissions
├── components/               # React components
│   ├── SettingsModal.tsx    # Settings configuration
│   ├── Waveform.tsx        # Audio visualization
│   └── MixerTrack.tsx      # Audio mixer
├── services/                # API integrations
│   ├── llmService.ts        # Music generation API
│   └── settingsService.ts   # Configuration storage
├── package.json             # Node dependencies
└── vite.config.ts           # Build configuration
```

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Desktop | Tauri 2.0 |
| Icons | Lucide React |
| Build | Vite 6 |
| Music API | Udio API / Bifrost |

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🙏 Acknowledgments

- [udioapi.pro](https://udioapi.pro) - Music generation API
- [Bifrost](https://getbifrost.ai) - AI Gateway
- [Tauri](https://tauri.app) - Cross-platform desktop framework

---

<div align="center">
  <p>Made with 🎵 by <a href="https://github.com/LoL0nny">Lonny</a></p>
</div>

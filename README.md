# ZedSet

A web-based settings editor for [Zed Editor](https://zed.dev).

[![GitHub](https://img.shields.io/badge/GitHub-paulp--o/zedset-181717?style=flat&logo=github)](https://github.com/paulp-o/zedset)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00?style=flat&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/paulp.o)

## 🚀 Quick Start

### Online Usage

Visit [zedset.paulp-o.dev](https://zedset.paulp-o.dev) for immediate access.

Alternately, you can clone and run the app yourself.

## ✨ Features

### Core Functionality

- **🎨 Visual Settings Editor** - Intuitive GUI for Zed Editor configuration
- **📁 Import/Export** - Load config files from Zed or paste directly
- **🔍 Real-time Search** - Find settings by name, path, or description instantly
- **📤 Smart Export** - Generate minimal JSON containing only your changes
- **🔗 URL Sharing** - Share your configuration via URL for easy collaboration
- **✨ Live Validation** - Real-time field validation with helpful error messages
- **🌳 Tree Navigation** - Browse settings by category (Appearance, Editor, Terminal, etc.)
- **🔄 Reset Controls** - Reset individual fields, sections, or all settings
- **📋 Copy to Clipboard** - Export settings directly to your clipboard

### Privacy & Performance

- **🔒 Privacy-First** - All processing happens in your browser, no data sent to servers
- **⚡ Fast & Stateless** - No account required, no data persistence

### Self-Hosting

```bash
# Clone the repository
git clone https://github.com/paulp-o/zedset.git
cd zedset

# Install dependencies
pnpm install

# Build for production
pnpm build

# Serve the dist/ directory with any static server
```

## 🏗️ Architecture

### Data Pipeline

```
Live Defaults ← Zed GitHub Repository
       ↓
   JSONC Parsing → Extract defaults + descriptions
       ↓
  JSON Schema → Field validation + widget hints
       ↓
   UI Metadata → Grouping + ordering + overrides
       ↓
Visual Editor → Interactive controls + real-time updates
       ↓
   Delta Export → Minimal JSON with only changes
```

### Key Data Objects

- **Defaults**: Live-fetched default settings from Zed's official repository
- **User**: Your custom settings (imported or edited)
- **Effective**: Merged view of defaults + your changes (what you see)
- **Delta**: Only the differences from defaults (what gets exported)

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm preview          # Preview production build

# Quality Assurance
pnpm check           # Type checking
pnpm lint            # Lint and format code
pnpm format          # Auto-format code

# Testing
pnpm test:unit       # Run unit tests
pnpm test:e2e        # Run end-to-end tests
pnpm test            # Run all tests

# Build
pnpm build           # Production build
```

### Live Data Sources

- **Default Settings**: `https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/assets/settings/default.json`

### Development Setup

```bash
# Fork and clone
git clone https://github.com/paulp-o/zedset.git
cd zedset

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

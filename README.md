# Memento

<div align="center">
  <img src="resources/icon.png" alt="Memento Logo" width="128" height="128" />
  <h3>Modern YouTube Video Downloader</h3>
  <p>Built with Tauri, React, HeroUI, and yt-dlp.</p>
</div>

---

## About

Memento is a sleek and powerful desktop application designed to make downloading YouTube videos simple and efficient. Built with Tauri v2 and Rust for a lightweight, fast native experience, combined with the beautiful UI components of HeroUI and the robust downloading capabilities of `yt-dlp`.

Whether you need to archive content for offline viewing, save educational materials, or keep a personal collection of your favorite creators, Memento provides a seamless experience across macOS, Windows, and Linux.

## Features

-   **Modern & Clean UI**: Designed with HeroUI and Tailwind CSS for a polished, responsive look using the "Emerald Archive" theme.
-   **Cross-Platform**: Native support for macOS, Windows, and Linux.
-   **High-Quality Downloads**: Leveraging `yt-dlp` for reliable video extraction.
-   **Queue Management**: Track your download progress in real-time.
-   **Smart URL Detection**: Automatically validates YouTube links.
-   **Auto-Update yt-dlp**: Checks for the latest yt-dlp version on startup and updates automatically.
-   **Lightweight**: ~15MB bundle size thanks to Tauri (vs ~150MB with Electron).

## Installation

Download the latest release for your operating system from the [Releases](https://github.com/gufao/memento/releases) page.

-   **macOS**: Download `.dmg`
-   **Windows**: Download `.msi` or `.exe`
-   **Linux**: Download `.AppImage` or `.deb`

## Development

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [Rust](https://rustup.rs/) (latest stable)
-   npm

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/gufao/memento.git
    cd memento
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Binaries**:
    Ensure `yt-dlp` and `ffmpeg` binaries are present in `resources/binaries/<platform>/`
    (`mac`, `win`, or `linux`).

4.  Run in development mode:
    ```bash
    npm run dev
    ```

## Build

To create production builds for your platform:

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Technologies

-   [Tauri v2](https://v2.tauri.app/) — lightweight native app framework
-   [React](https://reactjs.org/)
-   [HeroUI](https://heroui.com/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## License

MIT

## Troubleshooting

### macOS: "App is damaged and can't be opened"

This occurs because the app is not signed with an Apple Developer Certificate. To fix it:

1.  Move `Memento.app` to your `/Applications` folder.
2.  Open Terminal and run:
    ```bash
    sudo xattr -cr /Applications/Memento.app
    ```

# Memento

<div align="center">
  <img src="resources/icon.png" alt="Memento Logo" width="128" height="128" />
  <h3>Modern YouTube Video Downloader</h3>
  <p>Built with Electron, React, HeroUI, and yt-dlp.</p>
</div>

---

## About

Memento is a sleek and powerful desktop application designed to make downloading YouTube videos simple and efficient. Built on a modern tech stack, it combines the performance of Electron with the beautiful UI components of HeroUI and the robust downloading capabilities of `yt-dlp`.

Whether you need to archive content for offline viewing, save educational materials, or keep a personal collection of your favorite creators, Memento provides a seamless experience across macOS, Windows, and Linux.

## Features

-   **Modern & Clean UI**: Designed with HeroUI and Tailwind CSS for a polished, responsive look using the "Emerald Archive" theme.
-   **Cross-Platform**: Native support for macOS, Windows, and Linux.
-   **High-Quality Downloads**: Leveraging `yt-dlp` for reliable video extraction.
-   **Queue Management**: Track your download progress in real-time.
-   **Smart URL Detection**: automatically validates YouTube links.

## Installation

Download the latest release for your operating system from the [Releases](https://github.com/gufao/memento/releases) page.

-   **macOS**: Download `.dmg`
-   **Windows**: Download `.exe`
-   **Linux**: Download `.AppImage`

## Development

### Prerequisites

-   Node.js (v18 or higher)
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
    Ensure `yt-dlp` and `ffmpeg` binaries are present in `resources/binaries/<platform>/`.
    *(Note: The repository structure assumes these exist. You might need to download them manually if building from source without the resources folder)*

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

-   [Electron](https://www.electronjs.org/)
-   [React](https://reactjs.org/)
-   [HeroUI](https://heroui.com/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## License

MIT
# Memento

YouTube video downloader built with Electron, React, HeroUI, and yt-dlp.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  **Binaries**:
    You need to place `yt-dlp` and `ffmpeg` binaries in `resources/binaries/<platform>/`.
    -   Windows: `resources/binaries/win/yt-dlp.exe`, `ffmpeg.exe`
    -   macOS: `resources/binaries/mac/yt-dlp`, `ffmpeg`
    -   Linux: `resources/binaries/linux/yt-dlp`, `ffmpeg`

    *Note: The current implementation includes a mock downloader for demonstration purposes. To use the real downloader, uncomment the code in `src/main/ipc/download.ts` and implement the `ytdlp.ts` service.*

3.  Run in development mode:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

## Features Implemented

-   Modern UI with HeroUI & Tailwind CSS
-   Emerald Archive Theme (Dark/Light mode support)
-   URL Input with validation
-   Download Queue UI
-   Electron IPC structure (Main <-> Renderer)

use regex::Regex;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

/// Get the directory containing bundled (read-only) binaries
pub fn get_bundled_binary_dir(app: &AppHandle) -> PathBuf {
    // In production, binaries are in the resource dir
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("failed to resolve resource dir");
    let prod_path = resource_dir.join("binaries");

    if prod_path.exists() {
        return prod_path;
    }

    // In dev mode, fall back to project's resources/binaries/<platform>/
    let platform = if cfg!(target_os = "macos") {
        "mac"
    } else if cfg!(target_os = "windows") {
        "win"
    } else {
        "linux"
    };

    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("resources")
        .join("binaries")
        .join(platform)
}

/// Get the full path to a bundled binary (ffmpeg, ffprobe, etc.)
pub fn get_bundled_binary_path(app: &AppHandle, name: &str) -> PathBuf {
    let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
    get_bundled_binary_dir(app).join(format!("{name}{ext}"))
}

/// Get binary dir — for yt-dlp, prefer the managed (updatable) copy;
/// for other binaries (ffmpeg), use bundled.
pub fn get_binary_dir(app: &AppHandle) -> PathBuf {
    // Return the bundled dir (used for ffmpeg location)
    get_bundled_binary_dir(app)
}

/// Get the path to yt-dlp — prefers managed (auto-updated) copy
pub fn get_binary_path(app: &AppHandle, name: &str) -> PathBuf {
    // For yt-dlp, prefer the managed copy in app data dir
    if name == "yt-dlp" {
        let managed = crate::updater::get_managed_ytdlp_path(app);
        if managed.exists() {
            return managed;
        }
    }

    // Fall back to bundled
    get_bundled_binary_path(app, name)
}

/// Get video info via yt-dlp --dump-json
pub async fn get_info(
    ytdlp_path: &Path,
    url: &str,
) -> Result<serde_json::Value, String> {
    let output = Command::new(ytdlp_path)
        .args(["--dump-json", url])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to spawn yt-dlp: {e}"))?;

    if output.status.success() {
        let data = String::from_utf8_lossy(&output.stdout);
        let parsed: serde_json::Value =
            serde_json::from_str(&data).map_err(|e| format!("Failed to parse video info: {e}"))?;

        Ok(serde_json::json!({
            "title": parsed.get("title"),
            "thumbnail": parsed.get("thumbnail"),
            "duration": parsed.get("duration"),
            "formats": parsed.get("formats"),
        }))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

/// Download a video with progress callbacks
pub async fn download<F>(
    ytdlp_path: &Path,
    ffmpeg_dir: &Path,
    url: &str,
    format: &Option<String>,
    on_progress: F,
) -> Result<String, String>
where
    F: Fn(f64, String) + Send + 'static,
{
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Downloads"));

    let template = downloads_dir
        .join("%(title)s.%(ext)s")
        .to_string_lossy()
        .to_string();

    let default_format = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best".to_string();
    let fmt = format.as_deref().unwrap_or(&default_format);

    let mut args = vec![
        url.to_string(),
        "-f".to_string(),
        fmt.to_string(),
        "-o".to_string(),
        template,
        "--newline".to_string(),
    ];

    // Add ffmpeg location
    if ffmpeg_dir.exists() {
        args.push("--ffmpeg-location".to_string());
        args.push(ffmpeg_dir.to_string_lossy().to_string());
    }

    let mut child = Command::new(ytdlp_path)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {e}"))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let mut reader = BufReader::new(stdout).lines();

    // Spawn stderr reader in background
    let stderr_handle = tokio::spawn(async move {
        let mut err_reader = BufReader::new(stderr).lines();
        let mut stderr_output = String::new();
        while let Ok(Some(line)) = err_reader.next_line().await {
            eprintln!("[yt-dlp stderr] {line}");
            stderr_output.push_str(&line);
            stderr_output.push('\n');
        }
        stderr_output
    });

    let progress_re = Regex::new(r"(\d+\.?\d*)%").unwrap();
    let mut output_filename = String::new();
    let mut video_title = String::new();

    while let Ok(Some(line)) = reader.next_line().await {
        // Capture title from destination
        if line.contains("[download] Destination:") {
            if let Some(parts) = line.split(": ").nth(1) {
                let file_name = Path::new(parts.trim())
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                if let Some(dot_pos) = file_name.rfind('.') {
                    video_title = file_name[..dot_pos].to_string();
                }
                output_filename = parts.trim().to_string();
            }
        }

        // Parse progress percentage
        if line.contains("[download]") && line.contains('%') {
            if let Some(caps) = progress_re.captures(&line) {
                if let Ok(pct) = caps[1].parse::<f64>() {
                    on_progress(pct, video_title.clone());
                }
            }
        }

        // Capture merged filename
        if line.contains("[Merger] Merging formats into") {
            if let Some(parts) = line.split("into ").nth(1) {
                let mut candidate = parts.trim().to_string();
                if candidate.starts_with('"') && candidate.ends_with('"') {
                    candidate = candidate[1..candidate.len() - 1].to_string();
                }
                output_filename = candidate;
            }
        }

        // Handle "already downloaded"
        if line.contains("has already been downloaded") {
            if let Some(parts) = line.split("] ").nth(1) {
                if let Some(name) = parts.split(" has").next() {
                    output_filename = name.trim().to_string();
                }
            }
            on_progress(100.0, video_title.clone());
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for yt-dlp: {e}"))?;

    let stderr_output = stderr_handle.await.unwrap_or_default();

    if status.success() {
        if output_filename.is_empty() {
            Ok("Download complete".to_string())
        } else {
            Ok(output_filename)
        }
    } else {
        let code = status.code().unwrap_or(-1);
        eprintln!("[yt-dlp] Process exited with code {code}");
        Err(format!(
            "Process exited with code {code}: {stderr_output}"
        ))
    }
}

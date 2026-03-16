use std::path::{Path, PathBuf};
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::io::AsyncWriteExt;

/// Get the writable directory where we store the managed yt-dlp binary.
/// This is in the app's local data dir so it persists and is writable.
pub fn get_managed_bin_dir(app: &AppHandle) -> PathBuf {
    let data_dir = app
        .path()
        .app_local_data_dir()
        .expect("failed to resolve app local data dir");
    data_dir.join("bin")
}

/// Get the path to the managed yt-dlp binary
pub fn get_managed_ytdlp_path(app: &AppHandle) -> PathBuf {
    let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
    get_managed_bin_dir(app).join(format!("yt-dlp{ext}"))
}

/// Get current yt-dlp version string
pub async fn get_current_version(ytdlp_path: &Path) -> Option<String> {
    if !ytdlp_path.exists() {
        return None;
    }
    let output = tokio::process::Command::new(ytdlp_path)
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .await
        .ok()?;

    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    }
}

/// Determine the correct GitHub release asset name for this platform
fn get_asset_name() -> &'static str {
    if cfg!(target_os = "macos") {
        "yt-dlp_macos"
    } else if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else {
        "yt-dlp_linux"
    }
}

/// Check for the latest yt-dlp version on GitHub and return (tag, download_url)
pub async fn check_latest_version() -> Result<(String, String), String> {
    let client = reqwest::Client::builder()
        .user_agent("Memento/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let resp: serde_json::Value = client
        .get("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch releases: {e}"))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse release JSON: {e}"))?;

    let tag = resp["tag_name"]
        .as_str()
        .ok_or("No tag_name in release")?
        .to_string();

    let asset_name = get_asset_name();
    let download_url = resp["assets"]
        .as_array()
        .ok_or("No assets in release")?
        .iter()
        .find(|a| a["name"].as_str() == Some(asset_name))
        .and_then(|a| a["browser_download_url"].as_str())
        .ok_or_else(|| format!("Asset '{asset_name}' not found in release"))?
        .to_string();

    Ok((tag, download_url))
}

/// Download a binary from URL and save to the given path
pub async fn download_binary(url: &str, dest: &Path) -> Result<(), String> {
    // Ensure parent dir exists
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create bin dir: {e}"))?;
    }

    let client = reqwest::Client::builder()
        .user_agent("Memento/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to download: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Download failed with status: {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    // Write to temp file first, then rename (atomic-ish)
    let tmp = dest.with_extension("tmp");
    let mut file = tokio::fs::File::create(&tmp)
        .await
        .map_err(|e| format!("Failed to create temp file: {e}"))?;

    file.write_all(&bytes)
        .await
        .map_err(|e| format!("Failed to write binary: {e}"))?;

    file.flush()
        .await
        .map_err(|e| format!("Failed to flush: {e}"))?;

    // Set executable permission on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        tokio::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))
            .await
            .map_err(|e| format!("Failed to set permissions: {e}"))?;
    }

    // Rename temp -> final
    tokio::fs::rename(&tmp, dest)
        .await
        .map_err(|e| format!("Failed to rename binary: {e}"))?;

    println!("[updater] Binary saved to: {}", dest.display());
    Ok(())
}

/// Ensure yt-dlp exists in the managed dir. If not, copy from bundled resources.
pub async fn ensure_ytdlp(app: &AppHandle) -> Result<PathBuf, String> {
    let managed_path = get_managed_ytdlp_path(app);

    if managed_path.exists() {
        return Ok(managed_path);
    }

    println!("[updater] No managed yt-dlp found, copying from bundled resources...");

    // Copy from bundled resources
    let bundled = crate::ytdlp::get_bundled_binary_path(app, "yt-dlp");
    if bundled.exists() {
        if let Some(parent) = managed_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create bin dir: {e}"))?;
        }
        tokio::fs::copy(&bundled, &managed_path)
            .await
            .map_err(|e| format!("Failed to copy bundled yt-dlp: {e}"))?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            tokio::fs::set_permissions(&managed_path, std::fs::Permissions::from_mode(0o755))
                .await
                .map_err(|e| format!("Failed to set permissions: {e}"))?;
        }

        println!("[updater] Copied bundled yt-dlp to managed dir");
        Ok(managed_path)
    } else {
        Err("No bundled yt-dlp found and no managed copy exists".to_string())
    }
}

/// Check and update yt-dlp if a newer version is available.
/// Returns (current_version, latest_version, was_updated).
pub async fn check_and_update(app: &AppHandle) -> Result<(String, String, bool), String> {
    let managed_path = ensure_ytdlp(app).await?;
    let current = get_current_version(&managed_path)
        .await
        .unwrap_or_else(|| "unknown".to_string());

    println!("[updater] Current yt-dlp version: {current}");

    let (latest_tag, download_url) = check_latest_version().await?;
    // Tag is like "2026.03.13" — same format as version output
    let latest = latest_tag.trim().to_string();

    println!("[updater] Latest yt-dlp version: {latest}");

    if current == latest {
        println!("[updater] yt-dlp is up to date");
        return Ok((current, latest, false));
    }

    println!("[updater] Updating yt-dlp from {current} to {latest}...");
    download_binary(&download_url, &managed_path).await?;

    let new_version = get_current_version(&managed_path)
        .await
        .unwrap_or_else(|| latest.clone());

    println!("[updater] yt-dlp updated to {new_version}");
    Ok((current, new_version, true))
}

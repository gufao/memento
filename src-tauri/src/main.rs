// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod updater;
mod ytdlp;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[derive(Clone, Serialize)]
struct DownloadProgress {
    id: String,
    progress: f64,
    title: String,
    url: String,
}

#[derive(Clone, Serialize)]
struct DownloadComplete {
    id: String,
    #[serde(rename = "filePath")]
    file_path: String,
}

#[derive(Clone, Serialize)]
struct DownloadError {
    id: String,
    error: String,
}

#[derive(Deserialize)]
struct DownloadOptions {
    format: Option<String>,
}

#[tauri::command]
async fn download_start(
    app: AppHandle,
    url: String,
    options: DownloadOptions,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let id_clone = id.clone();
    let url_clone = url.clone();

    println!("[download_start] Starting download for: {url}");

    // Send initial progress immediately
    let _ = app.emit(
        "download:progress",
        DownloadProgress {
            id: id.clone(),
            progress: 0.0,
            title: "Fetching info...".to_string(),
            url: url.clone(),
        },
    );

    // Resolve binary paths
    let binary_dir = ytdlp::get_binary_dir(&app);
    let ytdlp_path = ytdlp::get_binary_path(&app, "yt-dlp");
    let ffmpeg_dir = binary_dir.clone();

    // Spawn download in background
    tauri::async_runtime::spawn(async move {
        match ytdlp::download(&ytdlp_path, &ffmpeg_dir, &url_clone, &options.format, {
            let app = app.clone();
            let id = id_clone.clone();
            let url = url_clone.clone();
            move |progress, title| {
                let _ = app.emit(
                    "download:progress",
                    DownloadProgress {
                        id: id.clone(),
                        progress,
                        title: title.clone(),
                        url: url.clone(),
                    },
                );
            }
        })
        .await
        {
            Ok(file_path) => {
                let _ = app.emit(
                    "download:complete",
                    DownloadComplete {
                        id: id_clone,
                        file_path,
                    },
                );
            }
            Err(e) => {
                eprintln!("[download_start] Error: {e}");
                let _ = app.emit(
                    "download:error",
                    DownloadError {
                        id: id_clone,
                        error: e,
                    },
                );
            }
        }
    });

    Ok(id)
}

#[tauri::command]
async fn video_info(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let ytdlp_path = ytdlp::get_binary_path(&app, "yt-dlp");
    ytdlp::get_info(&ytdlp_path, &url).await
}

#[tauri::command]
async fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        if let Some(parent) = std::path::Path::new(&path).parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn settings_get(
    app: AppHandle,
    key: String,
) -> Result<Option<serde_json::Value>, String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    Ok(store.get(&key))
}

#[tauri::command]
async fn settings_set(
    app: AppHandle,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(key, value);
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
async fn settings_get_all(
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut map = serde_json::Map::new();
    for (k, v) in store.entries() {
        map.insert(k.clone(), v.clone());
    }
    Ok(serde_json::Value::Object(map))
}

/// Manually trigger yt-dlp update check from frontend
#[tauri::command]
async fn ytdlp_check_update(
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let (current, latest, updated) = updater::check_and_update(&app).await?;
    Ok(serde_json::json!({
        "current": current,
        "latest": latest,
        "updated": updated,
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // Auto-update yt-dlp in background on startup
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                println!("[startup] Checking yt-dlp for updates...");
                // First ensure we have a managed copy
                if let Err(e) = updater::ensure_ytdlp(&handle).await {
                    eprintln!("[startup] Failed to ensure yt-dlp: {e}");
                    return;
                }
                // Then check for updates
                match updater::check_and_update(&handle).await {
                    Ok((current, latest, updated)) => {
                        if updated {
                            println!("[startup] yt-dlp updated: {current} -> {latest}");
                            let _ = handle.emit("ytdlp:updated", serde_json::json!({
                                "from": current,
                                "to": latest,
                            }));
                        } else {
                            println!("[startup] yt-dlp is up to date ({current})");
                        }
                    }
                    Err(e) => {
                        eprintln!("[startup] yt-dlp update check failed: {e}");
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_start,
            video_info,
            show_in_folder,
            settings_get,
            settings_set,
            settings_get_all,
            ytdlp_check_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

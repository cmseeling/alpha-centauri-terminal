// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::BTreeMap,
    ffi::OsString,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    },
};

use tauri::{
    async_runtime::{Mutex, RwLock},
    AppHandle, Runtime,
};

use portable_pty::{native_pty_system, Child, ChildKiller, CommandBuilder, PtyPair, PtySize};

struct Session {
    pair: Mutex<PtyPair>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    child_killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
    writer: Mutex<Box<dyn std::io::Write + Send>>,
    reader: Mutex<Box<dyn std::io::Read + Send>>,
}

#[derive(Default)]
struct AppState {
    session_id: AtomicU32,
    sessions: RwLock<BTreeMap<PtyHandler, Arc<Session>>>,
}

type PtyHandler = u32;

#[tauri::command]
async fn create_session<R: Runtime>(
    args: Vec<String>,
    cols: u16,
    rows: u16,
    current_working_directory: Option<String>,
    env: BTreeMap<String, String>,

    state: tauri::State<'_, AppState>,
    _app_handle: AppHandle<R>,
) -> Result<PtyHandler, String> {
    let pty_system = native_pty_system();
    // Create PTY, get the writer and reader
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    // todo: launch shell from use configuration either here or from UI
    #[cfg(target_os = "windows")]
    let mut cmd = CommandBuilder::new("powershell.exe");

    #[cfg(not(target_os = "windows"))]
    let mut cmd = CommandBuilder::new("bash");
    cmd.args(args);
    if let Some(current_working_directory) = current_working_directory {
        cmd.cwd(OsString::from(current_working_directory));
    }
    for (k, v) in env.iter() {
        cmd.env(OsString::from(k), OsString::from(v));
    }
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let child_killer = child.clone_killer();
    let handler = state.session_id.fetch_add(1, Ordering::Relaxed);

    let pair = Arc::new(Session {
        pair: Mutex::new(pair),
        child: Mutex::new(child),
        child_killer: Mutex::new(child_killer),
        writer: Mutex::new(writer),
        reader: Mutex::new(reader),
    });
    state.sessions.write().await.insert(handler, pair);
    Ok(handler)
}

#[tauri::command]
async fn write_to_session(
    pid: PtyHandler,
    data: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or("Unavaliable pid")?
        .clone();
    session
        .writer
        .lock()
        .await
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn read_from_session(pid: PtyHandler, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or("Unavaliable pid")?
        .clone();
    let mut buf = [0u8; 1024];
    let n = session
        .reader
        .lock()
        .await
        .read(&mut buf)
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&buf[..n]).to_string())
}

#[tauri::command]
async fn resize(
    pid: PtyHandler,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or("Unavaliable pid")?
        .clone();
    session
        .pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn end_session(pid: PtyHandler, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or("Unavaliable pid")?
        .clone();
    session
        .child_killer
        .lock()
        .await
        .kill()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_exit_status(pid: PtyHandler, state: tauri::State<'_, AppState>) -> Result<u32, String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or("Unavaliable pid")?
        .clone();
    let exitstatus = session
        .child
        .lock()
        .await
        .wait()
        .map_err(|e| e.to_string())?
        .exit_code();
    Ok(exitstatus)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_to_session,
            read_from_session,
            resize,
            end_session,
            get_exit_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

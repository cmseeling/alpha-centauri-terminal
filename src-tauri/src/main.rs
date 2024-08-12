// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::{BTreeMap, HashMap}, ffi::OsString, sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    }
};

use tauri::{
    async_runtime::{Mutex, RwLock},
    AppHandle, Manager, Runtime,
};

use portable_pty::{native_pty_system, Child, CommandBuilder, PtyPair, PtySize};

use serde::Serialize;

use dir::home_dir;

mod configuration {
    mod user_configuration;
    pub use user_configuration::*;
}

struct Session {
    pair: Mutex<PtyPair>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    writer: Mutex<Box<dyn std::io::Write + Send>>,
    reader: Mutex<Box<dyn std::io::Read + Send>>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NotificationEvent {
    // Level: 1 = info, 2 = warn, 3 = error
    level: u16,
    message: String,
    details: String,
}

#[derive(Default)]
struct AppState {
    last_session_id: AtomicU32,
    sessions: RwLock<BTreeMap<PtyHandler, Arc<Session>>>,
    user_configuration: RwLock<configuration::UserConfig>,
    startup_notifications: RwLock<Vec<NotificationEvent>>,
}

type PtyHandler = u32;

fn emit_error_notification<R: Runtime>(
    log_message: String,
    level: u16,
    friendly_message: String,
    details: String,
    app_handle: AppHandle<R>,
) {
    #[cfg(debug_assertions)]
    println!("{}", log_message);
    let notification = NotificationEvent {
        level: level,
        message: friendly_message,
        details: details,
    };
    app_handle
        .emit_all("notification-event", notification)
        .unwrap();
}

#[tauri::command]
async fn get_startup_notifications(
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    for notification in state.startup_notifications.read().await.iter() {
        app_handle
            .emit_all("notification-event", notification)
            .unwrap();
    }
    state.startup_notifications.write().await.clear();

    Ok(())
}

#[tauri::command]
async fn create_session<R: Runtime>(
    args: Option<Vec<String>>,
    cols: Option<u16>,
    rows: Option<u16>,
    current_working_directory: Option<String>,
    env: Option<HashMap<String, String>>,

    state: tauri::State<'_, AppState>,
    app_handle: AppHandle<R>,
) -> Result<PtyHandler, String> {
    let user_config = state.user_configuration.read().await;

    let args = args.unwrap_or(user_config.shell.args.clone());
    let cols = cols.unwrap_or(user_config.window.size.width);
    let rows = rows.unwrap_or(user_config.window.size.height);
    let env = env.unwrap_or(user_config.shell.env.clone());

    let pty_system = native_pty_system();
    // Create PTY, get the writer and reader
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| {
            emit_error_notification(
                format!("Error on pty_system.openpty: {:?}", e),
                3,
                String::from("There was an error creating the shell session."),
                format!("{:?}", e),
                app_handle.clone(),
            );
            e.to_string()
        })?;
    let writer = pair.master.take_writer().map_err(|e| {
        emit_error_notification(
            format!("Error on pair.master.take_writer: {:?}", e),
            3,
            String::from("There was an error creating the shell session."),
            format!("{:?}", e),
            app_handle.clone(),
        );
        e.to_string()
    })?;
    let reader = pair.master.try_clone_reader().map_err(|e| {
        emit_error_notification(
            format!("Error on pair.master.try_clone_reader: {:?}", e),
            3,
            String::from("There was an error creating the shell session."),
            format!("{:?}", e),
            app_handle.clone(),
        );
        e.to_string()
    })?;

    #[cfg(debug_assertions)]
    println!("Launching shell from {}", &user_config.shell.program);

    let mut cmd;
    if user_config.shell.program.is_empty() {
        cmd = CommandBuilder::new_default_prog();
    }
    else {
        cmd = CommandBuilder::new(&user_config.shell.program);
    }
    
    cmd.args(args);
    if let Some(current_working_directory) = current_working_directory {
        cmd.cwd(OsString::from(current_working_directory));
    }
    for (k, v) in env.iter() {
        cmd.env(OsString::from(k), OsString::from(v));
    }
    let child = pair.slave.spawn_command(cmd).map_err(|e| {
        emit_error_notification(
            format!("Error on pair.slave.spawn_command: {:?}", e),
            3,
            String::from("There was an error creating the shell session."),
            format!("{:?}", e),
            app_handle,
        );
        e.to_string()
    })?;
    let handler = state.last_session_id.fetch_add(1, Ordering::Relaxed);

    let pair = Arc::new(Session {
        pair: Mutex::new(pair),
        child: Mutex::new(child),
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
    app_handle: AppHandle,
) -> Result<(), String> {
    println!("Received {}", &data);
    match state.sessions.read().await.get(&pid) {
        Some(session) => session
            .clone()
            .writer
            .lock()
            .await
            .write_all(data.as_bytes())
            .map_err(|e| {
                emit_error_notification(
                    format!(
                        "Error on session.clone().writer.lock().await.write_all: {:?}",
                        e
                    ),
                    3,
                    String::from("There was an error writing to the shell session."),
                    format!("{:?}", e),
                    app_handle,
                );
                e.to_string()
            }),
        None => {
            emit_error_notification(
                format!(
                    "Error on state.sessions.read().await.get - session with pid={:?} not found",
                    pid
                ),
                3,
                String::from("There was an error writing to the shell session."),
                format!("Session not found for pid {:?}", pid),
                app_handle,
            );
            Err(String::from("Unavailable pid"))
        }
    }
}

#[tauri::command]
async fn read_from_session(
    pid: PtyHandler,
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        // using the ok_or call here because the match some/none wasn't refreshing terminal for some reason
        // todo: look into why match some/none was failing
        .ok_or("Unavaliable pid")?
        .clone();
    let mut buf = [0u8; 1024];
    let n = session.reader.lock().await.read(&mut buf).map_err(|e| {
        emit_error_notification(
            format!("Error on session.reader.lock().await.read: {:?}", e),
            3,
            String::from("There was an error reading from the shell session."),
            format!("{:?}", e),
            app_handle,
        );
        e.to_string()
    })?;
    Ok(String::from_utf8_lossy(&buf[..n]).to_string())
}

// #[tauri::command]
// async fn get_current_directory(pid: PtyHandler, state: tauri::State<'_, AppState>, app_handle: AppHandle,) -> Result<String, String> {
//     match state.sessions.read().await.get(&pid) {
//         Some(session) => {
//             let child = session
//                 .child
//                 .lock()
//                 .await;
//             child.
//             Ok(String::from("ok"))
//         },
//         None => {
//             emit_error_notification(
//                 format!(
//                     "Error on state.sessions.read().await.get - session with pid={:?} not found",
//                     pid
//                 ),
//                 3,
//                 String::from("There was an error writing to the shell session."),
//                 format!("Session not found for pid {:?}", pid),
//                 app_handle,
//             );
//             Err(String::from("Unavailable pid"))
//         }
//     }
// }

#[tauri::command]
async fn resize(
    pid: PtyHandler,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    match state.sessions.read().await.get(&pid) {
        Some(session) => session
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
            .map_err(|e| {
                emit_error_notification(
                    format!("Error on session.pair.lock().await.master.resize: {:?}", e),
                    3,
                    String::from("There was an error resizing the shell session."),
                    format!("{:?}", e),
                    app_handle,
                );
                e.to_string()
            }),
        None => {
            emit_error_notification(
                format!(
                    "Error on state.sessions.read().await.get - session with pid={:?} not found",
                    pid
                ),
                3,
                String::from("There was an error resizing the shell session."),
                format!("Session not found for pid {:?}", pid),
                app_handle,
            );
            Err(String::from("Unavailable pid"))
        }
    }
}

#[tauri::command]
async fn end_session(
    pid: PtyHandler,
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    println!("ending session for pid: {:?}", pid);
    match state.sessions.read().await.get(&pid) {
        Some(session) => session.child.lock().await.kill().map_err(|e| {
            emit_error_notification(
                format!("Error on session.child.lock().await.kill(): {:?}", e),
                3,
                String::from("There was an error ending the shell session."),
                format!("{:?}", e),
                app_handle,
            );
            e.to_string()
        }),
        None => {
            emit_error_notification(
                format!(
                    "Error on state.sessions.read().await.get - session with pid={:?} not found",
                    pid
                ),
                3,
                String::from("There was an error ending the shell session."),
                format!("Session not found for pid {:?}", pid),
                app_handle,
            );
            Err(String::from("Unavailable pid"))
        }
    }
}

#[tauri::command]
async fn get_exit_status(
    pid: PtyHandler,
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<u32, String> {
    match state.sessions.read().await.get(&pid) {
        Some(session) => {
            let exit_status_result = session.clone().child.lock().await.wait().map_err(|e| {
                emit_error_notification(
                    format!(
                        "Error on session.clone().child.lock().await.wait(): {:?}",
                        e
                    ),
                    3,
                    String::from("There was an error getting the shell session exit code."),
                    format!("{:?}", e),
                    app_handle.clone(),
                );
                e.to_string()
            });
            match exit_status_result {
                Ok(exit_status) => Ok(exit_status.exit_code()),
                Err(e) => {
                    emit_error_notification(
                        format!(
                            "Error on session.clone().child.lock().await.wait(): {:?}",
                            e
                        ),
                        3,
                        String::from("There was an error getting the shell session exit code."),
                        format!("{:?}", e),
                        app_handle,
                    );
                    Err(e)
                }
            }
        }
        None => {
            emit_error_notification(
                format!(
                    "Error on state.sessions.read().await.get - session with pid={:?} not found",
                    pid
                ),
                3,
                String::from("There was an error getting the shell session exit code."),
                format!("Session not found for pid {:?}", pid),
                app_handle,
            );
            Err(String::from("Unavailable pid"))
        }
    }
}

#[tauri::command]
async fn get_user_config(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    Ok(state.user_configuration.read().await.to_string())
}

fn main() {
    #[cfg(debug_assertions)]
    println!("Attempting to retrieve user config file");
    let home_path = home_dir().unwrap();

    #[cfg(target_os = "windows")]
    let config_file_path = format!(
        "{}\\.alphacentauri.config.json",
        home_path.to_str().unwrap()
    );

    #[cfg(not(target_os = "windows"))]
    let config_file_path = format!("{}/.alphacentauri.config.json", home_path.to_str().unwrap());

    let mut notification_event = None;
    let user_config = match configuration::get_user_configuration(&config_file_path) {
        Ok(user_config) => {
            // let mut state_user_config = state.user_configuration.write().await;
            // *state_user_config = user_config;
            #[cfg(debug_assertions)]
            println!("Successfully retrieved user config");
            user_config
        }
        Err(e) => {
            println!("There was a problem getting the user config: {:?}", e);
            notification_event = Some(NotificationEvent {
                level: 2,
                message: String::from("There was an error getting your configuration settings."),
                details: format!("{}", e),
            });
            configuration::generate_default_user_config()
        }
    };

    let state = AppState {
        last_session_id: AtomicU32::default(),
        sessions: RwLock::default(),
        user_configuration: RwLock::new(user_config),
        startup_notifications: match notification_event {
            Some(event) => RwLock::new(Vec::from([event])),
            None => RwLock::default(),
        },
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_to_session,
            read_from_session,
            resize,
            end_session,
            get_exit_status,
            get_startup_notifications,
            get_user_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

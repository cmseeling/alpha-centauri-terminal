// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::{BTreeMap, HashMap},
    ffi::OsString,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    },
};

use tauri::{
    async_runtime::{Mutex, RwLock},
    AppHandle, Manager, Runtime,
};

use portable_pty::{native_pty_system, Child, CommandBuilder, PtyPair, PtySize};

use serde::Serialize;

use dir::home_dir;

mod usr_conf;

struct Session {
    pair: Mutex<PtyPair>,
    child: Mutex<Box<dyn Child + Send + Sync>>,
    writer: Mutex<Box<dyn std::io::Write + Send>>,
    reader: Mutex<Box<dyn std::io::Read + Send>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemInfo {
    system: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NotificationEvent {
    // Level: 1 = info, 2 = warn, 3 = error
    level: u16,
    message: String,
    details: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellStatus {
    has_exited: bool,
    exit_code: Option<u32>,
}

#[derive(Default)]
struct AppState {
    last_session_id: AtomicU32,
    sessions: RwLock<BTreeMap<PtyHandler, Arc<Session>>>,
    user_configuration: RwLock<usr_conf::UserConfigFS>,
    startup_notifications: RwLock<Vec<NotificationEvent>>,
}

type PtyHandler = u32;

fn emit_error_notification<R: Runtime>(
    log_message: String,
    friendly_message: String,
    details: String,
    app_handle: AppHandle<R>,
) {
    #[cfg(debug_assertions)]
    println!("{}", log_message);
    let notification = NotificationEvent {
        level: 3,
        message: friendly_message,
        details: details,
    };
    app_handle
        .emit_all("notification-event", notification)
        .unwrap();
}

macro_rules! errfmt {
    ($line:literal, $err:tt) => {
        format!("Error on {}: {:?}", $line, $err)
    };
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
    let msg = "There was an error creating the shell session.";

    let user_config = state.user_configuration.read().await;

    let args = args.unwrap_or(user_config.shell.args.clone());
    let cols = cols.unwrap_or(200);
    let rows = rows.unwrap_or(100);
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
                errfmt!("pty_system.openpty", e),
                String::from(msg),
                format!("{:?}", e),
                app_handle.clone(),
            );
            e.to_string()
        })?;
    let writer = pair.master.take_writer().map_err(|e| {
        emit_error_notification(
            errfmt!("pair.master.take_writer", e),
            String::from(msg),
            format!("{:?}", e),
            app_handle.clone(),
        );
        e.to_string()
    })?;
    let reader = pair.master.try_clone_reader().map_err(|e| {
        emit_error_notification(
            errfmt!("pair.master.try_clone_reader", e),
            String::from(msg),
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
    } else {
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
            errfmt!("pair.slave.spawn_command", e),
            String::from(msg),
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
    #[cfg(debug_assertions)]
    println!("Received {} - {:#04X?}", &data, &*data.as_bytes());

    let msg = "There was an error writing to the shell session.";

    match state.sessions.read().await.get(&pid) {
        Some(session) => session
            .clone()
            .writer
            .lock()
            .await
            .write_all(data.as_bytes())
            .map_err(|e| {
                emit_error_notification(
                    errfmt!("session.clone().writer.lock().await.write_all", e),
                    String::from(msg),
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
                String::from(msg),
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
        .ok_or("Unavaliable pid")?
        .clone();
    let mut buf = [0u8; 1024];
    let n = session.reader.lock().await.read(&mut buf).map_err(|e| {
        emit_error_notification(
            errfmt!("session.reader.lock().await.read", e),
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
    let msg = "There was an error resizing the shell session.";
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
                    errfmt!("session.pair.lock().await.master.resize", e),
                    String::from(msg),
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
                String::from(msg),
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
    #[cfg(debug_assertions)]
    println!("ending session for pid: {:?}", pid);

    let msg = "There was an error ending the shell session.";

    match state.sessions.read().await.get(&pid) {
        Some(session) => session.child.lock().await.kill().map_err(|e| {
            emit_error_notification(
                errfmt!("session.child.lock().await.kill", e),
                String::from(msg),
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
                String::from(msg),
                format!("Session not found for pid {:?}", pid),
                app_handle,
            );
            Err(String::from("Unavailable pid"))
        }
    }
}

#[tauri::command]
async fn wait_for_exit(pid: PtyHandler, state: tauri::State<'_, AppState>, app_handle: AppHandle) -> Result<u32, String> {
    #[cfg(debug_assertions)]
    println!("getting exit status for pid: {:?}", pid);

    let msg = "There was an error waiting for the shell session to exit";

    // explicit match syntax was causing a bug so using ok_or_else error handling here, maybe refactor other commands to use the same
    let session = state
        .sessions
        .read()
        .await
        .get(&pid)
        .ok_or_else(|| {
            emit_error_notification(
                format!(
                    "Error on state.sessions.read().await.get - session with pid={:?} not found",
                    pid
                ),
                String::from(msg),
                format!("Session not found for pid {:?}", pid),
                app_handle.clone(),
            );
            "Unavaliable pid"
        })?
        .clone();
    let exitstatus = session
        .child
        .lock()
        .await
        .wait()
        .map_err(|e| {
            emit_error_notification(
                errfmt!("session.clone().child.lock().await.wait()", e),
                String::from(msg),
                format!("{:?}", e),
                app_handle.clone(),
            );
            e.to_string()
        })?
        .exit_code();
    Ok(exitstatus)
}

#[tauri::command]
async fn check_exit_status(
    pid: PtyHandler,
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let msg = "There was an error getting the shell session exit code.";

    if let Some(session) = state.sessions.read().await.get(&pid) {
        let exit_status_result = session.child.lock().await.try_wait().map_err(|e| {
            emit_error_notification(
                errfmt!("session.child.lock().await.try_wait", e),
                String::from(msg),
                format!("{:?}", e),
                app_handle.clone(),
            );
            e.to_string()
        });
        match exit_status_result {
            Ok(exit_status) => {
                let status_result: ShellStatus = match exit_status {
                    Some(exit_status) => ShellStatus {
                        has_exited: true,
                        exit_code: Some(exit_status.exit_code()),
                    },
                    None => ShellStatus {
                        has_exited: false,
                        exit_code: None,
                    },
                };
                let json = serde_json::to_string(&status_result).map_err(|e| {
                    emit_error_notification(
                        errfmt!("serde_json::to_string", e),
                        String::from(msg),
                        format!("{:?}", e),
                        app_handle,
                    );
                    e.to_string()
                })?;
                Ok(json)
            }
            Err(e) => {
                emit_error_notification(
                    errfmt!("session.clone().child.lock().await.wait()", e),
                    String::from(msg),
                    format!("{:?}", e),
                    app_handle,
                );
                Err(e)
            }
        }
    } else {
        emit_error_notification(
            format!(
                "Error on state.sessions.read().await.get - session with pid={:?} not found",
                pid
            ),
            String::from(msg),
            format!("Session not found for pid {:?}", pid),
            app_handle,
        );
        Err(String::from("Unavailable pid"))
    }
}

#[tauri::command]
async fn get_user_config(
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let state_config = state.user_configuration.read().await;
    let config = usr_conf::UserConfigJS {
        window: state_config.window.clone(),
        shell: state_config.shell.clone(),
        keymaps: usr_conf::key_map_to_vector(state_config.keymaps.clone()),
    };

    serde_json::to_string(&config).map_err(|e| {
        emit_error_notification(
            errfmt!("serde_json::to_string", e),
            String::from("There was an error getting the user configuration file."),
            format!("{:?}", e),
            app_handle,
        );
        e.to_string()
    })
}

#[tauri::command]
async fn get_system_info(app_handle: AppHandle) -> Result<String, String> {
    let system = "unix";

    #[cfg(target_os = "windows")]
    let system = "windows";

    #[cfg(target_os = "macos")]
    let system = "macos";

    let system_info = SystemInfo {
        system: String::from(system),
    };
    serde_json::to_string(&system_info).map_err(|e| {
        emit_error_notification(
            errfmt!("serde_json::to_string", e),
            String::from("There was an error getting the user configuration file."),
            format!("{:?}", e),
            app_handle,
        );
        e.to_string()
    })
}

fn setup<'a>(app: &'a mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let mut arg_path: Option<String> = None;
    let mut save_default_config = true;
    match app.get_cli_matches() {
        Ok(matches) => {
            #[cfg(debug_assertions)]
            println!("Found input args: {:?}", matches);
            if matches.args.contains_key("configFile") {
                matches.args.get("configFile").map(|arg| match &arg.value {
                    serde_json::Value::String(config_file) => {
                        arg_path = Some(config_file.to_string());
                        save_default_config = false;
                    }
                    _ => {}
                });
            }
        }
        Err(_) => {}
    }

    let config_file_path = arg_path.or_else(|| {
        #[cfg(debug_assertions)]
        println!("Attempting to retrieve user config file");
        let home_path = home_dir().unwrap();

        #[cfg(target_os = "windows")]
        let default_path = Some(format!(
            "{}\\.alphacentauri.config.json",
            home_path.to_str().unwrap()
        ));

        #[cfg(not(target_os = "windows"))]
        let default_path = Some(format!(
            "{}/.alphacentauri.config.json",
            home_path.to_str().unwrap()
        ));

        default_path
    });

    let mut notification_event = None;
    let user_config =
        match usr_conf::get_user_configuration(&config_file_path.unwrap(), save_default_config) {
            Ok(user_config) => user_config,
            Err(e) => {
                println!("There was a problem getting the user config: {:?}", e);
                notification_event = Some(NotificationEvent {
                    level: 2,
                    message: String::from(
                        "There was an error getting your configuration settings.",
                    ),
                    details: format!("{}", e),
                });
                usr_conf::generate_default_user_config()
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

    app.manage(state);

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(setup)
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_to_session,
            read_from_session,
            resize,
            end_session,
            wait_for_exit,
            check_exit_status,
            get_startup_notifications,
            get_user_config,
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

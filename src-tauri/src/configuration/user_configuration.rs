use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fmt, fs};

use super::keymap::Mappings;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UserConfig {
    // pub window: Window,
    pub shell: Shell,
    pub keymaps: HashMap<String, String>,
}

impl fmt::Display for UserConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match serde_json::to_string_pretty(self) {
            Ok(json) => write!(f, "{}", json),
            Err(e) => write!(f, "{:?}", e),
        }
    }
}

pub fn serialize_user_config_with_keymap(
    config: UserConfig,
) -> core::result::Result<String, serde_json::Error> {
    // let window = serde_json::to_string(&config.window)?;
    let shell = serde_json::to_string(&config.shell)?;
    let mappings = Mappings::from(config.keymaps);
    let keymaps = serde_json::to_string(&mappings.mapped_commands)?;
    Ok(format!(
        "{{\"shell\": {}, \"keymaps\": {}}}",
        shell, keymaps
    ))
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct Shell {
    pub program: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub bell: bool,
}

// #[derive(Debug, Serialize, Deserialize, Default, Clone)]
// pub struct Window {
//     pub size: Dimensions,
// }

// #[derive(Debug, Serialize, Deserialize, Default, Clone)]
// pub struct Dimensions {
//     pub height: u16,
//     pub width: u16,
// }

pub fn generate_default_user_config() -> UserConfig {
    UserConfig {
        // window: Window {
        //     size: Dimensions {
        //         height: 390,
        //         width: 540,
        //     },
        // },
        shell: Shell {
            program: String::default(),

            args: Vec::default(),

            env: HashMap::default(),

            bell: true,
        },
        keymaps: HashMap::from([
            (String::from("edit:copy"), String::from("ctrl+shift+c")),
            (String::from("edit:paste"), String::from("ctrl+shift+v")),
            (String::from("edit:cut"), String::from("ctrl+shift+x")),
            (String::from("edit:undo"), String::from("ctrl+shift+z")),
            (String::from("edit:redo"), String::from("ctrl+shift+y")),
            (String::from("edit:interrupt"), String::from("ctrl+c")),
            (String::from("window:new_tab"), String::from("ctrl+shift+t")),
            (String::from("window:next_tab"), String::from("ctrl+shift+ArrowRight")),
            (String::from("window:prev_tab"), String::from("ctrl+shift+ArrowLeft")),
            (String::from("window:split_right"), String::from("ctrl+shift+d")),
            (String::from("window:split_down"), String::from("ctrl+shift+e")),
        ]),
    }
}

#[derive(Debug, Clone)]
pub enum UserConfigError {
    Read(String),
    Write(String),
    Parse(String),
}

impl fmt::Display for UserConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match &self {
              UserConfigError::Read(e) => write!(f, "<div class='friendly-error-message'>Unable to load User Configuration file.</div><div class='raw-error ml-4 mt-2'>{}</div>", e),
              UserConfigError::Write(e) => write!(f, "<div class='friendly-error-message'>Unable to save User Configuration file.</div><div class='raw-error ml-4 mt-2'>{}</div>", e),
              UserConfigError::Parse(e) => write!(f, "<div class='friendly-error-message'>User Configuration file found, but could not be parsed.</div><div class='raw-error ml-4 mt-2'>{}</div>", e),
          }
    }
}

pub type Result<T> = std::result::Result<T, UserConfigError>;

pub fn save_user_configuration(file_loc: &str, config: &UserConfig) -> Result<()> {
    match serde_json::to_string_pretty(&config) {
        Ok(json) => match fs::write(file_loc, json) {
            Ok(_) => Ok(()),
            Err(e) => Err(UserConfigError::Write(format!("{:?}", e))),
        },
        Err(e) => Err(UserConfigError::Write(format!("{:?}", e))),
    }
}

pub fn get_user_configuration(file_loc: &str) -> Result<UserConfig> {
    match fs::metadata(file_loc) {
        Ok(_) => {
            #[cfg(debug_assertions)]
            println!("Configuration file at {} found.", file_loc);

            match fs::read_to_string(file_loc) {
                Ok(json) => match serde_json::from_str(&json) {
                    Ok(config) => Ok(config),
                    Err(e) => Err(UserConfigError::Parse(format!("{:?}", e))),
                },
                Err(e) => Err(UserConfigError::Read(format!("{:?}", e))),
            }
        }
        Err(_) => {
            #[cfg(debug_assertions)]
            println!(
                "Configuration file not found at {}, generating default file.",
                file_loc
            );

            let default_config = generate_default_user_config();
            match save_user_configuration(file_loc, &default_config) {
                Ok(_) => Ok(default_config),
                Err(e) => Err(e),
            }
        }
    }
}

use serde::{Deserialize, Serialize};
use core::fmt;
use std::{collections::HashMap, fs, io};
use dirs::home_dir;

mod UserConfiguration {
  #[derive(Debug, Serialize, Deserialize, Default)]
  pub struct UserConfig {
      pub window: Window,
      pub shell: Shell,
      pub keymaps: HashMap<String, String>,
  }

  #[derive(Debug, Serialize, Deserialize, Default)]
  pub struct Shell {
      pub program: String,
      pub args: Vec<String>,
      pub env: Vec<String>,
      pub bell: bool,
  }

  #[derive(Debug, Serialize, Deserialize, Default)]
  pub struct Window {
      pub size: Dimensions,
  }

  #[derive(Debug, Serialize, Deserialize, Default)]
  pub struct Dimensions {
      pub height: i32,
      pub width: i32,
  }

  #[derive(Debug, Clone)]
  pub enum UserConfigError {
      Read,
      Write,
      Parse,
  }

  impl fmt::Display for UserConfigError {
      fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
          match &self {
              UserConfigError::Read => write!(f, "Unable to load User Configuration file."),
              UserConfigError::Write => write!(f, "Unable to save User Configuration file."),
              UserConfigError::Parse => write!(f, "User Configuration file found, but could not be parsed."),
          }
      }
  }

  pub type Result<T> = std::result::Result<T, UserConfigError>;

  pub fn save_user_configuration(file_loc: &str, config: UserConfig) -> Result<()> {
      match serde_json::to_string_pretty(&config) {
          Ok(json) => {
              match fs::write(file_loc, json) {
                  Ok(_) => Ok(()),
                  Err(_) => Err(UserConfigError::Write)
              }
          },
          Err(_) => Err(UserConfigError::Write)
      }
  }

  pub fn generate_default(file_loc: &str) -> Result<()> {
      let config: UserConfig = UserConfig {
          window: Window {
              size: Dimensions {
                  height: 390,
                  width: 540,
              },
          },
          shell: Shell {
              #[cfg(target_os = "windows")]
              program: String::from("powershell.exe"),

              #[cfg(not(target_os = "windows"))]
              program: String::from("bash"),

              args: Vec::from([String::from("--login")]),

              env: Vec::from([]),

              bell: true,
          },
          keymaps: HashMap::from([
              (String::from("edit:copy"), String::from("ctrl+shift+c")),
              (String::from("edit:paste"), String::from("ctrl+shift+v")),
          ]),
      };

      save_user_configuration(file_loc, config)
  }

  pub fn get_user_configuration(file_loc: &str) -> Result<UserConfig> {
      match fs::read_to_string(file_loc) {
          Ok(json) =>match serde_json::from_str(&json) {
                  Ok(config) => Ok(config),
                  Err(_) => Err(UserConfigError::Parse)
              },
          Err(_) => Err(UserConfigError::Read)
      }
  }
}

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fmt, fs};

#[derive(Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UserConfigFS {
    pub shell: Shell,
    pub keymaps: HashMap<String, String>,
}

impl fmt::Display for UserConfigFS {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match serde_json::to_string_pretty(self) {
            Ok(json) => write!(f, "{}", json),
            Err(e) => write!(f, "{:?}", e),
        }
    }
}

#[derive(Debug, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserConfigJS {
    pub shell: Shell,
    pub keymaps: Vec<KeyCommandMap>,
}

pub fn key_map_to_vector(h_map: HashMap<String, String>) -> Vec<KeyCommandMap> {
    h_map
        .into_iter()
        .map(|(key, value)| KeyCommandMap {
            command_name: key,
            key_combo: value,
        })
        .collect()
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct KeyCommandMap {
    command_name: String,
    key_combo: String,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Shell {
    pub program: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub bell: bool,
}

// #[derive(Debug, Serialize, Deserialize, Default, Clone, PartialEq)]
// #[serde(rename_all = "camelCase")]
// pub struct Window {

// }

pub fn generate_default_user_config() -> UserConfigFS {
    UserConfigFS {
        shell: Shell {
            program: String::default(),
            args: Vec::default(),
            env: HashMap::default(),
            bell: true,
        },
        keymaps: HashMap::from([
            (String::from("edit:copy"), String::from("ctrl+shift+c")),
            (String::from("edit:paste"), String::from("ctrl+shift+v")),
            (
                String::from("edit:select_all"),
                String::from("ctrl+shift+a"),
            ),
            (String::from("edit:interrupt"), String::from("ctrl+c")),
            (String::from("window:new_tab"), String::from("ctrl+shift+t")),
            (
                String::from("window:next_tab"),
                String::from("ctrl+shift+ArrowRight"),
            ),
            (
                String::from("window:prev_tab"),
                String::from("ctrl+shift+ArrowLeft"),
            ),
            (
                String::from("window:split_right"),
                String::from("ctrl+shift+d"),
            ),
            (
                String::from("window:split_down"),
                String::from("ctrl+shift+e"),
            ),
        ]),
    }
}

#[derive(Debug, Clone, PartialEq)]
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

pub fn save_user_configuration(file_loc: &str, config: &UserConfigFS) -> Result<()> {
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| UserConfigError::Write(format!("{:?}", e)))?;
    fs::write(file_loc, json).map_err(|e| UserConfigError::Write(format!("{:?}", e)))
}

pub fn get_user_configuration(file_loc: &str, save_default_config: bool) -> Result<UserConfigFS> {
    match fs::metadata(file_loc) {
        Ok(_) => {
            #[cfg(debug_assertions)]
            println!("Configuration file at {} found.", file_loc);

            let json = fs::read_to_string(file_loc)
                .map_err(|e| UserConfigError::Read(format!("{:?}", e)))?;
            serde_json::from_str(&json).map_err(|e| UserConfigError::Parse(format!("{:?}", e)))
        }
        Err(_) => {
            #[cfg(debug_assertions)]
            println!(
                "Configuration file not found at {}, generating default file.",
                file_loc
            );

            let default_config = generate_default_user_config();
            if save_default_config {
                save_user_configuration(file_loc, &default_config).map(|_| default_config)
            } else {
                Ok(default_config)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{any::Any, io::Write};

    use super::*;
    use tempdir::TempDir;

    #[test]
    fn key_map_to_vector_returns_vector() {
        let map: HashMap<String, String> = HashMap::from([
            ("edit:interrupt".to_string(), "ctrl+c".to_string()),
            ("window:new_tab".to_string(), "ctrl+shift+t".to_string()),
        ]);

        let mut expected_vector: Vec<KeyCommandMap> = Vec::from([
            KeyCommandMap {
                command_name: "edit:interrupt".to_string(),
                key_combo: "ctrl+c".to_string(),
            },
            KeyCommandMap {
                command_name: "window:new_tab".to_string(),
                key_combo: "ctrl+shift+t".to_string(),
            },
        ]);
        expected_vector.sort_by(|a, b| a.command_name.cmp(&b.command_name));

        let mut actual_vector = key_map_to_vector(map);
        actual_vector.sort_by(|a, b| a.command_name.cmp(&b.command_name));

        assert_eq!(actual_vector, expected_vector);
    }

    #[test]
    fn save_user_configuration_saves_to_disk() {
        let dir = TempDir::new("usr_home").unwrap();
        let file_path = dir.path().join("userConfig.json");
        let file_path_str = file_path.to_str().unwrap();

        let default_config = generate_default_user_config();
        let _ = save_user_configuration(file_path_str, &default_config);
        let file_metadata = match fs::metadata(file_path_str) {
            Ok(_) => Ok(()),
            Err(_) => Err(()),
        };
        assert_eq!(file_metadata, Ok(()));

        let _ = dir.close();
    }

    #[test]
    fn get_user_configuration_loads_config_from_file() {
        let dir = TempDir::new("usr_home").unwrap();
        let file_path = dir.path().join("userConfig.json");
        let file_path_str = file_path.to_str().unwrap();

        let default_config = generate_default_user_config();
        let _ = save_user_configuration(file_path_str, &default_config);

        let actual = get_user_configuration(file_path_str, false).unwrap();
        assert_eq!(actual, default_config);

        let _ = dir.close();
    }

    #[test]
    fn get_user_configuration_saves_default_configuration() {
        let dir = TempDir::new("usr_home").unwrap();
        let file_path = dir.path().join("userConfig.json");
        let file_path_str = file_path.to_str().unwrap();

        let mut file_metadata = match fs::metadata(file_path_str) {
            Ok(_) => Ok(()),
            Err(_) => Err(()),
        };
        assert_eq!(file_metadata, Err(()));

        let _actual = get_user_configuration(file_path_str, true).unwrap();

        file_metadata = match fs::metadata(file_path_str) {
            Ok(_) => Ok(()),
            Err(_) => Err(()),
        };
        assert_eq!(file_metadata, Ok(()));

        let _ = dir.close();
    }

    #[test]
    fn get_user_configuration_returns_parse_error() {
        let dir = TempDir::new("usr_home").unwrap();
        let file_path = dir.path().join("userConfig.json");
        let file_path_str = file_path.to_str().unwrap();
        let expected_type = UserConfigError::Parse("test".to_string()).type_id();

        let mut f = std::fs::File::create(file_path_str).unwrap();
        f.write_all(b"{\"shell\":\"program\":\"bash\",\"args\":[],\"env\":{},\"bell\":true},\"keymaps\":[]}").unwrap();
        f.sync_all().unwrap();

        let actual = match get_user_configuration(file_path_str, false) {
            Ok(json) => json.type_id(),
            Err(e) => e.type_id(),
        };

        assert_eq!(actual, expected_type);

        let _ = dir.close();
    }
}

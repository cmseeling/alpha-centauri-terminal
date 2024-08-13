use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct KeyCommandMap {
    pub command_name: String,
    pub key_combo: String,
}

#[derive(Debug, Serialize)]
pub struct Mappings {
    pub mapped_commands: Vec<KeyCommandMap>,
}

impl From<HashMap<String, String>> for Mappings {
    fn from(h_map: HashMap<String, String>) -> Self {
        let commands = h_map
            .into_iter()
            .map(|(key, value)| KeyCommandMap {
                command_name: key,
                key_combo: value,
            })
            .collect();
        Mappings {
            mapped_commands: commands,
        }
    }
}

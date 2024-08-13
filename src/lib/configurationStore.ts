import { readable, derived, type Readable } from "svelte/store";
import { invoke } from "@tauri-apps/api";
import type { CommandKeyMap } from "./types";

const TAURI_COMMAND_GET_USER_CONFIG = "get_user_config";

export const isWebGL2Enabled = readable(false, (set) => {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) {
    if (typeof WebGL2RenderingContext !== 'undefined') {
      console.log('your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers');
    }
  } else {
    set(true);
  }

  return () => {};
});

// interface Window {

// }

interface Shell {
  program: string;
  args: string[];
  env: {[key: string]: string};
  bell: boolean;
}

export interface UserConfiguration {
  // window: Window;
  shell: Shell;
  keymaps: CommandKeyMap[];
  loaded: boolean;
}

export const userConfiguration: Readable<UserConfiguration> = readable({loaded: false} as UserConfiguration, (set) => {
  // can't use async functions to construct a Svelte readable store so using .then syntax
  invoke<string>(TAURI_COMMAND_GET_USER_CONFIG)
    .then((config) => {
      console.log(config);
      set({...JSON.parse(config), loaded: true})
    })
    .catch((error) => {
      console.log(error)
    });

  return () => {};
})

export const appConfiguration = derived([
  isWebGL2Enabled,
  userConfiguration
], ([
  isWebGL2Enabled,
  userConfiguration
]) => {
  return {
    isWebGL2Enabled: isWebGL2Enabled,
    userConfiguration: userConfiguration
  }
})
import { derived, writable, type Writable } from "svelte/store";
import type { CommandKeyMap } from "./types";

export const isWebGL2Enabled = writable(false);

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

export const userConfiguration: Writable<UserConfiguration> = writable({loaded: false} as UserConfiguration);

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
import { derived, writable, type Writable } from "svelte/store";
import type { UserConfiguration } from "$lib/types";

export const isWebGL2Enabled = writable(false);

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
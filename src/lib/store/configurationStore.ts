import { derived, writable, type Writable } from 'svelte/store';
import type { SystemInfo, UserConfiguration } from '$lib/types';

export const isWebGL2Enabled = writable(false);

export const userConfiguration: Writable<UserConfiguration> = writable({
	loaded: false
} as UserConfiguration);

export const systemInfo: Writable<SystemInfo> = writable({ system: 'unknown' });

export const appConfiguration = derived(
	[isWebGL2Enabled, userConfiguration],
	([isWebGL2Enabled, userConfiguration]) => {
		return {
			isWebGL2Enabled: isWebGL2Enabled,
			userConfiguration: userConfiguration
		};
	}
);

import { derived, writable, type Writable } from 'svelte/store';
import { createTabs } from '@melt-ui/svelte';
import type { SystemInfo, TabTreeMap, UserConfiguration } from '$lib/types';

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

export const {
	elements: { root, list, content, trigger },
	states: { value: activeTab }
} = createTabs({ defaultValue: '1' });

export const tabTrees = writable({} as TabTreeMap);

export { sessions } from './sessions';

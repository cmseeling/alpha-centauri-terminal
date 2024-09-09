import { render, waitFor } from '@testing-library/svelte';
import { beforeAll, expect, test, vi } from 'vitest';

import { randomFillSync } from 'crypto';
import { mockIPC } from '@tauri-apps/api/mocks';

import { TAURI_COMMAND_GET_SYSTEM_INFO, TAURI_COMMAND_GET_USER_CONFIG } from '$lib/constants';
import { isWebGL2Enabled, systemInfo, userConfiguration } from '$lib/store';

import ConfigLoader from './ConfigLoader.svelte';

const configJson = '{"shell":{"program":"bash","args":[],"env":{},"bell":true},"keymaps":[]}';
const expectedConfigStore = {
	loaded: true,
	shell: {
		program: 'bash',
		args: [],
		env: {},
		bell: true
	},
	keymaps: []
};

const systemInfoJson = '{"system":"system"}';
const expectedInfoStore = {
	system: 'system'
};

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
	Object.defineProperty(window, 'crypto', {
		value: {
			getRandomValues: (buffer: any) => {
				return randomFillSync(buffer);
			}
		}
	});
});

test('load user configuration and system info', async () => {
	mockIPC((cmd, args) => {
		if (cmd === TAURI_COMMAND_GET_USER_CONFIG) {
			return configJson;
		}
		if (cmd === TAURI_COMMAND_GET_SYSTEM_INFO) {
			return systemInfoJson;
		}
	});

	const setUserConfigSpy = vi.spyOn(userConfiguration, 'set');
	const setSysInfoSpy = vi.spyOn(systemInfo, 'set');

	render(ConfigLoader);

	await waitFor(() => {
		expect(setUserConfigSpy).toHaveBeenCalledWith(expectedConfigStore);
	});
	await waitFor(() => {
		expect(setSysInfoSpy).toHaveBeenCalledWith(expectedInfoStore);
	});
});

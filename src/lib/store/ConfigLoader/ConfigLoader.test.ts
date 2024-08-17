import { render, waitFor } from '@testing-library/svelte';
import { beforeAll, expect, test, vi } from 'vitest';

import { randomFillSync } from 'crypto';
import { mockIPC } from '@tauri-apps/api/mocks';

import { TAURI_COMMAND_GET_USER_CONFIG } from '$lib/constants';
import { isWebGL2Enabled, userConfiguration } from '$lib/store/configurationStore';
// import { writable } from 'svelte/store';

import ConfigLoader from './ConfigLoader.svelte';

const configJson = '{"shell":{"program":"bash","args":[],"env":{},"bell":true},"keymaps":[]}';
const expectedStore = {
	loaded: true,
	shell: {
		program: 'bash',
		args: [],
		env: {},
		bell: true
	},
	keymaps: []
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

test('load app configuration', async () => {
	mockIPC((cmd, args) => {
		if (cmd === TAURI_COMMAND_GET_USER_CONFIG) {
			return configJson;
		}
	});

	const setSpy = vi.spyOn(userConfiguration, 'set');

	render(ConfigLoader);

	await waitFor(() => {
		expect(setSpy).toHaveBeenCalledWith(expectedStore);
	});
});

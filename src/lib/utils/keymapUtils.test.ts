import { expect, test, vi } from 'vitest';

import { userConfiguration } from '$lib/store/configurationStore';
import * as store from 'svelte/store';

import { findKeyCommand, matchKeyboardEvent } from './keymapUtils';

const partialConfig = {
	loaded: true,
	window: {
		forceTabBar: false
	},
	shell: {
		program: 'bash',
		args: [],
		env: {},
		bell: true
	}
};

test('matchKeyboardEvent finds events', async () => {
	let keyCombo = 'a';
	let event = {
		key: 'a',
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		metaKey: false
	};

	expect(matchKeyboardEvent(keyCombo, event as KeyboardEvent)).toBeTruthy();

	keyCombo = 'shift+ctrl+t';
	event = {
		key: 't',
		ctrlKey: true,
		altKey: false,
		shiftKey: true,
		metaKey: false
	};

	expect(matchKeyboardEvent(keyCombo, event as KeyboardEvent)).toBeTruthy();
});

test('matchKeyboardEvent returns false if event does not match', async () => {
	const keyCombo = 'ctrl+c';
	const event = {
		key: 'a',
		ctrlKey: false,
		altKey: true,
		shiftKey: false,
		metaKey: false
	};

	expect(matchKeyboardEvent(keyCombo, event as KeyboardEvent)).toBeFalsy();
});

test('matchKeyboardEvent does not match for bad keyCombo', async () => {
	const keyCombo = 'ctrlshift+c';
	const event = {
		key: 'c',
		ctrlKey: true,
		altKey: false,
		shiftKey: true,
		metaKey: false
	};

	expect(matchKeyboardEvent(keyCombo, event as KeyboardEvent)).toBeFalsy();
});

test('findKeyCommand gets command from userConfiguration', async () => {
	const expectedMap = {
		commandName: 'edit:copy',
		keyCombo: 'ctrl+shift+c'
	};
	const userConfig = {
		...partialConfig,
		keymaps: [expectedMap]
	};

	userConfiguration.set(userConfig);
	const getSpy = vi.spyOn(store, 'get');

	const event = {
		key: 'c',
		ctrlKey: true,
		altKey: false,
		shiftKey: true,
		metaKey: false
	};

	const result = findKeyCommand(event as KeyboardEvent);
	expect(result).toStrictEqual(expectedMap);
	expect(getSpy).toHaveBeenCalledOnce();
});

test('findKeyCommand gets command from fallback map', () => {
	const expectedMap = {
		commandName: 'edit:copy',
		keyCombo: 'ctrl+shift+c'
	};

	const configMap = {
		commandName: 'edit:copy',
		keyCombo: 'ctrl+shift+c'
	};
	const userConfig = {
		...partialConfig,
		keymaps: [configMap]
	};

	userConfiguration.set(userConfig);

	const event = {
		key: 'c',
		ctrlKey: true,
		altKey: false,
		shiftKey: true,
		metaKey: false
	};

	const result = findKeyCommand(event as KeyboardEvent);
	expect(result).toStrictEqual(expectedMap);
});

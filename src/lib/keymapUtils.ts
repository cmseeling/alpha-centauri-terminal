import type { CommandKeyMap } from './types';
import { userConfiguration } from './store/configurationStore';
import { get } from 'svelte/store';

export const HexMap: { [key: string]: string } = {
	'edit:interrupt': '\x03'
};

export const fallbackMap: CommandKeyMap[] = [
	{
		commandName: 'edit:copy',
		keyCombo: 'ctrl+shift+c'
	},
	{
		commandName: 'edit:paste',
		keyCombo: 'ctrl+shift+v'
	},
	{
		commandName: 'edit:cut',
		keyCombo: 'ctrl+shift+x'
	},
	{
		commandName: 'edit:undo',
		keyCombo: 'ctrl+shift+z'
	},
	{
		commandName: 'edit:redo',
		keyCombo: 'ctrl+shift+y'
	},
	{
		commandName: 'edit:interrupt',
		keyCombo: 'ctrl+c'
	},
	{
		commandName: 'window:new_tab',
		keyCombo: 'ctrl+shift+t'
	},
	{
		commandName: 'window:next_tab',
		keyCombo: 'ctrl+shift+ArrowRight'
	},
	{
		commandName: 'window:prev_tab',
		keyCombo: 'ctrl+shift+ArrowLeft'
	},
	{
		commandName: 'window:split_right',
		keyCombo: 'ctrl+shift+d'
	},
	{
		commandName: 'window:new_down',
		keyCombo: 'ctrl+shift+e'
	}
];

export const matchKeyboardEvent = (keyCombo: string, event: KeyboardEvent) => {
	const tokens = keyCombo.split('+');
	const key = tokens.splice(tokens.length - 1, 1)[0].toLowerCase();
	const ctrl = tokens.includes('ctrl');
	const alt = tokens.includes('alt');
	const shift = tokens.includes('shift');
	const meta = tokens.includes('meta');

	return (
		event.key.toLowerCase() === key &&
		event.ctrlKey === ctrl &&
		event.altKey === alt &&
		event.shiftKey === shift &&
		event.metaKey === meta
	);
};

export const findKeyCommand = (event: KeyboardEvent): CommandKeyMap | undefined => {
	// prioritize user configuration mappings
	const userKeyMaps = get(userConfiguration).keymaps;
	let mapping = userKeyMaps.find((keyMap: CommandKeyMap) =>
		matchKeyboardEvent(keyMap.keyCombo, event)
	);
	// use fallback map if command not found
	if (mapping === undefined) {
		mapping = fallbackMap.find((keyMap) => matchKeyboardEvent(keyMap.keyCombo, event));
	}
	return mapping;
};

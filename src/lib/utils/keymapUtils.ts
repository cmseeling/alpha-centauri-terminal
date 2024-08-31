import { readText, writeText } from '@tauri-apps/api/clipboard';
import { get } from 'svelte/store';
import type { Terminal } from '@xterm/xterm';
import type { CommandKeyMap, ShellSession } from '$lib/types';
import { userConfiguration } from '$lib/store/configurationStore';

const HexMap: { [key: string]: string } = {
	'edit:interrupt': '\x03',
	'edit:select_all': '\x01'
};

const fallbackMap: CommandKeyMap[] = [
	{
		commandName: 'edit:copy',
		keyCombo: 'ctrl+shift+c'
	},
	{
		commandName: 'edit:paste',
		keyCombo: 'ctrl+shift+v'
	},
	{
		commandName: 'edit:select_all',
		keyCombo: 'ctrl+shift+a'
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
		commandName: 'window:split_down',
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

export const getKeyboardEventHandler = ({
	session,
	terminal,
	dispatch
}: {
	session: ShellSession;
	terminal: Terminal;
	dispatch: (screenCommand: string) => void;
}) => {
	const handleKeyMapEvent = (command: CommandKeyMap): boolean => {
		// console.log('map found for ' + command.commandName);

		if (command.commandName.includes('window')) {
			dispatch(command.commandName);
			return false;
		} else if (command.commandName in HexMap) {
			// console.log('sending hex code');
			session.write(HexMap[command.commandName]);
			return false;
		} else if (command.commandName === 'edit:copy') {
			if (terminal) {
				const contents = terminal.getSelection();
				writeText(contents);
				return false;
			}
		} else if (command.commandName === 'edit:paste') {
			if (terminal) {
				readText().then((text) => {
					if (text) {
						terminal.paste(text);
					}
				});
			}
			return false;
		}
		return true;
	};

	return (event: KeyboardEvent) => {
		if (event.type === 'keydown') {
			console.log(event);
			const command = findKeyCommand(event);
			if (command) {
				console.log(command);
				event.preventDefault();
				return handleKeyMapEvent(command);
			}
		}
		return true;
	};
};

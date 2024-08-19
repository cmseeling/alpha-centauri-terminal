<script lang="ts">
	import '@xterm/xterm/css/xterm.css';
	import { Terminal } from '@xterm/xterm';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebglAddon } from '@xterm/addon-webgl';
	import { CanvasAddon } from '@xterm/addon-canvas';
	import { onMount } from 'svelte';
	import { createSession, type ShellSession } from '$lib/pty/createSession';
	import { height, width, area } from '$lib/store/windowManagementStore';
	import { isWebGL2Enabled, userConfiguration } from '$lib/store/configurationStore';
	import { findKeyCommand, HexMap } from '$lib/utils/keymapUtils';
	import type { CommandKeyMap } from '$lib/types';

	export let screenManagementDispatch: (screenCommand: string) => void;
	export function updateSize() {
		update();
	}

	let loaded = false;
	let resizing = false;
	let frame: number;
	let fitAddon = new FitAddon();
	let terminal: Terminal;
	let shellSession: ShellSession;

	let update = () => {
		resizing = false;
		fitAddon.fit();
		if (shellSession) {
			shellSession.resize(terminal.cols, terminal.rows);
		}
	};

	const requestUpdate = () => {
		if (!resizing) {
			if (update) {
				frame = requestAnimationFrame(update);
			}
		}
		resizing = true;
	};

	onMount(() => {
		loaded = true;

		area.subscribe((value) => {
			requestUpdate();
		});

		return () => {
			cancelAnimationFrame(frame);
			if (shellSession) {
			}
		};
	});

	const handleKeyMapEvent = (command: CommandKeyMap) => {
		console.log('map found for ' + command.commandName);

		if (command.commandName.includes('window')) {
			screenManagementDispatch(command.commandName);
			return false;
		} else if (command.commandName in HexMap) {
			console.log('sending hex code');
			shellSession.write(HexMap[command.commandName]);
			return false;
		} else {
			return true;
		}
	};

	function toHex(str: string) {
		var result = '';
		for (var i = 0; i < str.length; i++) {
			result += str.charCodeAt(i).toString(16) + ' ';
		}
		return result;
	}

	const xtermJs = (node: HTMLElement) => {
		// console.log('mounting xterm');
		// console.log(node.parentElement);
		// console.log(node.parentElement?.style.backgroundColor);

		terminal = new Terminal({
			fontFamily: 'Consolas, Monospace',
			theme: {
				background: '#020617'
			}
		});
		terminal.open(node);
		terminal.focus();

		// FitAddon Usage
		terminal.loadAddon(fitAddon);
		fitAddon.fit();

		// WebGL2 or Canvas usage
		if ($isWebGL2Enabled) {
			console.log('using webGL2');
			const webGL = new WebglAddon();
			terminal.loadAddon(webGL);
			webGL.onContextLoss(() => {
				webGL.dispose();
				terminal.loadAddon(new CanvasAddon());
			});
		} else {
			terminal.loadAddon(new CanvasAddon());
		}

		// can't use asnyc functions for Svelte use bindings, so using .then syntax
		createSession({
			cols: terminal.cols,
			rows: terminal.rows,
			env: $userConfiguration.shell.env
		}).then((session) => {
			shellSession = session;

			session.onShellOutput(async (data: string) => {
				await terminal.write(data);
			});

			session.onShellExit((exitCode: number) => {
				console.log(`Session process exited with code ${exitCode}`);
			});

			terminal.onData((inputData) => {
				console.log(inputData);
				session.write(inputData);
			});

			const handleKeyboardEvent = (event: KeyboardEvent) => {
				if (event.type === 'keydown') {
					console.log(event);
					const command = findKeyCommand(event);
					if (command) {
						return handleKeyMapEvent(command);
					}
					// spacebar is broken for some reason
					if (event.key === ' ') {
						session.write(' ');
						return false;
					} else {
						console.log('map not found');
						return true;
					}
				}
				return false;
			};

			terminal.attachCustomKeyEventHandler(handleKeyboardEvent);

			session.start();
		});
	};
</script>

{#if loaded && $userConfiguration.loaded}
	<div
		class="terminal-screen px-3"
		use:xtermJs
		style="--termHeight:{$height}px; --termWidth:{$width}px;"
	/>
{/if}

<style>
	.terminal-screen {
		height: var(--termHeight, 100%);
		width: var(--termWidth, 100%);
		overflow: hidden;
	}
</style>

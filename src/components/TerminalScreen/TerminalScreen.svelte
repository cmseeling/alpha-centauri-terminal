<script lang="ts">
	import { onMount } from 'svelte';
	import '@xterm/xterm/css/xterm.css';
	import { Terminal } from '@xterm/xterm';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebglAddon } from '@xterm/addon-webgl';
	import { CanvasAddon } from '@xterm/addon-canvas';
	import { isWebGL2Enabled, userConfiguration } from '$lib/store/configurationStore';
	import { activeTab } from '$lib/store/tabs';
	import { height, width, area } from '$lib/store/windowManagementStore';
	import { getKeyboardEventHandler } from '$lib/utils/keymapUtils';
	import type { ShellSession } from '$lib/types';

	export let tabId: string | undefined = undefined;
	export let nodeId: number|undefined = undefined;
	export let session: ShellSession|undefined;
	export let screenManagementDispatch: (screenCommand: string, callerTabId?: string, callerNodeId?: number) => void;
	export let onSessionExit: (exitCode: number, tabId: string | undefined, nodeId: number | undefined) => void;

	console.log(`tabId: ${tabId} | nodeId: ${nodeId} | session: ${session?.pid}`);

	let loaded = false;
	let resizing = false;
	let frame: number;
	let fitAddon = new FitAddon();
	let terminal: Terminal;
	// let shellSession: ShellSession;

	let update = () => {
		resizing = false;
		fitAddon.fit();
		if (session) {
			session.resize(terminal.cols, terminal.rows);
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

		const areaUnsub = area.subscribe(() => {
			requestUpdate();
		});

		const tabUnsub = activeTab.subscribe(($activeTab) => {
			if ($activeTab === tabId && terminal) {
				setTimeout(() => {
					terminal.focus();
				}, 10);
			}
		});

		return () => {
			cancelAnimationFrame(frame);
			areaUnsub();
			tabUnsub();
			// if (session) {
			// 	session.dispose();
			// }
		};
	});

	const dispatchCommand = (screenCommand: string) => {
		if(screenManagementDispatch) {
			screenManagementDispatch(screenCommand, tabId, nodeId);
		}
	}

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
			// console.log('using webGL2');
			const webGL = new WebglAddon();
			terminal.loadAddon(webGL);
			webGL.onContextLoss(() => {
				webGL.dispose();
				terminal.loadAddon(new CanvasAddon());
			});
		} else {
			terminal.loadAddon(new CanvasAddon());
		}

		// console.log(session);
		if(session) {
			session.onShellOutput(async (data: string) => {
				await terminal.write(data);
			});

			session.onShellExit((exitCode: number) => {
				if(onSessionExit) {
					onSessionExit(exitCode, tabId, nodeId);
				}
			});

			terminal.onData((inputData) => {
				// console.log(inputData);
				session.write(inputData);
			});

			const handleKeyboardEvent = getKeyboardEventHandler({ session, terminal, dispatch: dispatchCommand });

			terminal.attachCustomKeyEventHandler(handleKeyboardEvent);

			session.start();
		}
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

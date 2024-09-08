<script lang="ts">
	import { onMount } from 'svelte';
	import '@xterm/xterm/css/xterm.css';
	import { Terminal } from '@xterm/xterm';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebglAddon } from '@xterm/addon-webgl';
	import { CanvasAddon } from '@xterm/addon-canvas';
	import { isWebGL2Enabled, userConfiguration } from '$lib/store/configurationStore';
	import { activeTab } from '$lib/store/tabs';
	import { getKeyboardEventHandler } from '$lib/utils/keymapUtils';
	import type { SessionExitStatus } from '$lib/types';
	import type { Readable } from 'svelte/store';
	import { paneTrees } from '$lib/store/panes';
	import { sessions } from '$lib/store/sessions';

	export let tabId: string | undefined = undefined;
	export let nodeId: number | undefined = undefined;
	export let sessionId: number | undefined;
	export let height: Readable<number>;
	export let width: Readable<number>;
	export let area: Readable<number>;
	export let screenManagementDispatch: (
		screenCommand: string,
		callerTabId?: string,
		callerNodeId?: number
	) => void;
	export let onSessionExit: (
		exitStatus: SessionExitStatus,
		tabId: string | undefined,
		nodeId: number | undefined
	) => void;

	// console.log(`tabId: ${tabId} | nodeId: ${nodeId} | session: ${session?.pid}`);

	let loaded = false;
	let resizing = false;
	let frame: number;
	let fitAddon = new FitAddon();
	let terminal: Terminal;
	let session = sessions.get(sessionId ?? -1);

	let update = () => {
		resizing = false;
		fitAddon.fit();
		if (session) {
			session.resize(terminal.cols, terminal.rows);
		}
	};

	const requestUpdate = () => {
		// console.log('update requested');
		if (!resizing) {
			if (update) {
				frame = requestAnimationFrame(update);
			}
		}
		resizing = true;
	};

	onMount(() => {
		loaded = true;

		const areaUnsub = area.subscribe(($area) => {
			// console.log(`resizing for tab ${tabId} : node ${nodeId}`);
			if ($area !== 0) {
				requestUpdate();
			}
		});

		const tabUnsub = activeTab.subscribe(($activeTab) => {
			if ($activeTab === tabId && terminal) {
				setTimeout(() => {
					requestUpdate();
					// terminal.scrollToBottom();
					terminal.focus();
				}, 10);
			}
		});

		return () => {
			// console.log('terminal unmounting');
			cancelAnimationFrame(frame);
			areaUnsub();
			tabUnsub();
		};
	});

	const dispatchCommand = (screenCommand: string) => {
		if (screenManagementDispatch) {
			screenManagementDispatch(screenCommand, tabId, nodeId);
		}
	};

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
				console.log('webGL2 context lost');
				webGL.dispose();
				terminal.loadAddon(new CanvasAddon());
			});
		} else {
			terminal.loadAddon(new CanvasAddon());
		}

		// console.log(session);
		if (session) {
			// set the last active session id of the tab to this session's pid
			if (tabId) {
				$paneTrees[tabId].lastActiveSessionId = session.pid;
			}

			terminal.element?.getElementsByTagName('textarea')[0].addEventListener('focus', () => {
				if (tabId) {
					$paneTrees[tabId].lastActiveSessionId = session.pid;
				}
			});

			session.onShellOutput(async (data: string) => {
				await terminal.write(data);
			});

			session.onShellExit((exitStatus: SessionExitStatus) => {
				if (onSessionExit) {
					onSessionExit(exitStatus, tabId, nodeId);
				}
			});

			terminal.onData((inputData) => {
				// console.log(inputData);
				session.write(inputData);
			});

			const handleKeyboardEvent = getKeyboardEventHandler({
				session,
				terminal,
				dispatch: dispatchCommand
			});

			terminal.attachCustomKeyEventHandler(handleKeyboardEvent);

			terminal.parser.registerOscHandler(7, (oscPayload: string) => {
				// console.log(oscPayload);
				session.rawCwd = oscPayload;
				return false;
			})

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

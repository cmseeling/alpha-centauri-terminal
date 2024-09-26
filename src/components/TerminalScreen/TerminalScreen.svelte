<script lang="ts">
	import { onMount } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import '@xterm/xterm/css/xterm.css';
	import { Terminal } from '@xterm/xterm';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebglAddon } from '@xterm/addon-webgl';
	import { CanvasAddon } from '@xterm/addon-canvas';
	import { SerializeAddon } from '@xterm/addon-serialize';
	import type { SessionExitStatus } from '$lib/types';
	import { activeTab, isWebGL2Enabled, sessions, tabActiveSessions, userConfiguration } from '$lib/store';
	import { getKeyboardEventHandler } from '$lib/utils/keymapUtils';

	export let tabId: string | undefined = undefined;
	export let nodeId: number | undefined = undefined;
	export let sessionId: number | undefined;
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

	console.log(`tabId: ${tabId} | nodeId: ${nodeId} | session: ${sessionId}`);

	export function SerializeScreen() {
		if(terminal) {
			const serializer = new SerializeAddon();
			terminal.loadAddon(serializer);
			return serializer.serialize();
		}
		return ''
	}

	let loaded = false;
	let resizing = false;
	let frame: number;
	let fitAddon = new FitAddon();
	let terminal: Terminal;
	let session = sessions.get(sessionId ?? -1);
	let shellExited = false;
	let shellReadUnsub: () => void;
	let shellExitUnsub: () => void;

	let height = writable(0);
	let width = writable(0);
	let area = derived([height, width], ([$height, $width]) => $height * $width);

	height.subscribe(($h) => {
		console.log($h);
	})

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
		// console.log(`onMount for ${tabId}:${nodeId}`);
		loaded = true;

		const areaUnsub = area.subscribe(($area) => {
			console.log(`resizing for tab ${tabId} : node ${nodeId}`);
			if ($area !== 0) {
				requestUpdate();
			}
		});

		const tabUnsub = activeTab.subscribe(($activeTab) => {
			if ($activeTab === tabId && terminal) {
				setTimeout(() => {
					requestUpdate();
					terminal.scrollToBottom();
					terminal.focus();
				}, 10);
			}
		});

		return async () => {
			// console.log(`terminal unmounting for ${tabId}:${nodeId}`);
			console.log(shellExited);
			if(!shellExited) {
				session?.cacheScrollbackBuffer(SerializeScreen());
			}
			cancelAnimationFrame(frame);
			areaUnsub();
			tabUnsub();
			shellReadUnsub();
			shellExitUnsub();
		};
	});

	const dispatchCommand = async (screenCommand: string) => {
		if (screenManagementDispatch) {
			screenManagementDispatch(screenCommand, tabId, nodeId);
		}
	};

	const xtermJs = (node: HTMLElement) => {
		// console.log(`mounting xterm for ${tabId}:${nodeId}`);
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
				tabActiveSessions.set(tabId, session.pid);
				terminal.textarea?.addEventListener('focus', () => {
					tabActiveSessions.set(tabId, session.pid);
				});
			}

			shellReadUnsub = session.onShellOutput(async (data: string) => {
				await terminal.write(data);
			});

			shellExitUnsub = session.onShellExit((exitStatus: SessionExitStatus) => {
				shellExited = true;
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

<div class="h-full" bind:clientHeight={$height} bind:clientWidth={$width}>
	{#if loaded && $userConfiguration.loaded}
		<div
			class="terminal-screen px-3 h-full w-full"
			use:xtermJs
		/>
	{/if}
</div>


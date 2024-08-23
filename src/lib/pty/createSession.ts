import {
	TAURI_COMMAND_CREATE_SESSION,
	TAURI_COMMAND_RESIZE,
	TAURI_COMMAND_WRITE_TO_SESSION,
	TAURI_COMMAND_END_SESSION,
	TAURI_COMMAND_READ_FROM_SESSION,
	TAURI_COMMAND_CHECK_EXIT_STATUS
} from '$lib/constants';
import { invoke } from '@tauri-apps/api';

export interface ShellSession {
	pid: number;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
	kill: () => void;
	start: () => void;
	onShellOutput: (callback: (data: string) => void) => void;
	onShellExit: (callback: (exitCode: number) => void) => void;
	dispose: () => void;
}

export interface CreateSessionInputs {
	args?: string[];
	cols?: number;
	rows?: number;
	currentWorkingDirectory?: string;
	env?: { [key: string]: string };
}

interface SessionTerminationStatus {
	hasExited: boolean;
	exitCode: number | null;
}

export const createSession = async ({
	args,
	cols,
	rows,
	currentWorkingDirectory,
	env
}: CreateSessionInputs) => {
	let pid: number | null = null;
	let onShellOutputCallback: (data: string) => void = () => {};
	let onShellOutputHasSubscriber = false;
	let onShellExitCallback: (exitCode: number) => void = () => {};
	let onShellExitHasSubscriber = false;
	let shellExited = false;

	pid = await invoke<number>(TAURI_COMMAND_CREATE_SESSION, {
		args,
		cols,
		rows,
		currentWorkingDirectory,
		env
	});
	let sessionActive = true;

	const resize = (cols: number, rows: number) => {
		if (pid != null) {
			invoke(TAURI_COMMAND_RESIZE, { pid, cols, rows });
		}
	};

	const write = (data: string) => {
		if (pid != null) {
			invoke(TAURI_COMMAND_WRITE_TO_SESSION, { pid, data });
		}
	};

	const kill = () => {
		if (pid != null) {
			invoke(TAURI_COMMAND_END_SESSION, { pid });
		}
	};

	const onShellOutput = (callback: (data: string) => void) => {
		onShellOutputCallback = callback;
		onShellOutputHasSubscriber = true;
	};

	const onShellExit = (callback: (exitCode: number) => void) => {
		onShellExitCallback = callback;
		onShellExitHasSubscriber = true;
	};

	// todo: look into using a web worker for this - edit: web worker won't work without implementing a custom uri protocol
	const start = () => {
		_listenForExit();
		_listenToReader();
	};

	const _listenToReader = async () => {
		// listen to session output
		try {
			while (sessionActive && pid !== null) {
				// console.log('reading');
				if (onShellOutputHasSubscriber) {
					const shellData = await invoke<string>(TAURI_COMMAND_READ_FROM_SESSION, { pid });
					onShellOutputCallback(shellData);
				}

				// if we're in a testing environment, don't continuously read
				if (!window.__TAURI_METADATA__) {
					break;
				}
			}
		} catch (e: unknown) {
			console.error('Reading Error: ', e);
		}
	};

	const _listenForExit = async () => {
		// console.log('listening');
		while (!shellExited) {
			// listen for session termination
			if (onShellExitHasSubscriber) {
				const json = await invoke<string>(TAURI_COMMAND_CHECK_EXIT_STATUS, { pid });
				const terminationStatus: SessionTerminationStatus = JSON.parse(json);
				if (terminationStatus.hasExited) {
					shellExited = true;
					onShellExitCallback(terminationStatus.exitCode as number);
				}
			}
		}
	};

	const dispose = () => {
		// console.log('stopping shell session');
		kill();
		sessionActive = false;
		pid = null;
		shellExited = true;
	};

	const returnValue: ShellSession = {
		pid,
		resize,
		write,
		kill,
		start,
		onShellOutput,
		onShellExit,
		dispose
	};
	return returnValue;
};

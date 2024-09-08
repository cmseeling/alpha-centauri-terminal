import { invoke } from '@tauri-apps/api/core';
import type { CreateSessionInputs, SessionExitStatus, ShellSession } from '$lib/types';
import {
	TAURI_COMMAND_CREATE_SESSION,
	TAURI_COMMAND_RESIZE,
	TAURI_COMMAND_WRITE_TO_SESSION,
	TAURI_COMMAND_END_SESSION,
	TAURI_COMMAND_READ_FROM_SESSION,
	TAURI_COMMAND_WAIT_FOR_EXIT
} from '$lib/constants';

function toHex(str: string) {
	var result = '';
	for (var i = 0; i < str.length; i++) {
		result += `${str.charAt(i)}:0x${str.charCodeAt(i).toString(16)}' '`;
	}
	return result;
}

export const createSession = async ({
	args,
	cols,
	rows,
	currentWorkingDirectory,
	env,
	referringSessionId
}: CreateSessionInputs) => {
	let pid: number | null = null;
	let onShellOutputCallback: (data: string) => void = () => {};
	let onShellOutputHasSubscriber = false;
	let onShellExitCallback: (exitStatus: SessionExitStatus) => void = () => {};
	let onShellExitHasSubscriber = false;
	let shellExited = false;
	let killCommandSent = false;

	pid = await invoke<number>(TAURI_COMMAND_CREATE_SESSION, {
		args,
		cols,
		rows,
		currentWorkingDirectory,
		env,
		referringSessionId
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
			killCommandSent = true;
		}
	};

	const onShellOutput = (callback: (data: string) => void) => {
		onShellOutputCallback = callback;
		onShellOutputHasSubscriber = true;
	};

	const onShellExit = (callback: (exitStatus: SessionExitStatus) => void) => {
		onShellExitCallback = callback;
		onShellExitHasSubscriber = true;
	};

	const start = () => {
		_listenToReader();
		_waitForExit();
	};

	const _listenToReader = async () => {
		// listen to session output
		try {
			while (sessionActive && pid !== null) {
				// console.log('reading');
				if (onShellOutputHasSubscriber) {
					const shellData = await invoke<string>(TAURI_COMMAND_READ_FROM_SESSION, { pid });
					// console.log(shellData);
					// const hex = toHex(shellData);
					// console.log(hex);
					onShellOutputCallback(shellData);
				}
			}
		} catch (e: unknown) {
			console.error('Reading Error: ', e);
		}
	};

	const _waitForExit = async () => {
		// console.log('waiting');
		if (shellExited) {
			// console.log('exited');
			return;
		}

		const exitCode = await invoke<number>(TAURI_COMMAND_WAIT_FOR_EXIT, { pid });
		// console.log(exitCode);
		shellExited = true;
		onShellExitCallback({
			exitCode,
			success: exitCode === 0 || (exitCode === 1 && killCommandSent)
		});
	};

	const dispose = () => {
		// console.log(`stopping shell session with pid = ${pid}`);
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

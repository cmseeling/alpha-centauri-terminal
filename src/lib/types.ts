import type { Readable, Writable } from 'svelte/store';

export interface CommandKeyMap {
	commandName: string;
	keyCombo: string;
}

export interface Window {
	forceTabBar: boolean;
}

export interface Shell {
	program: string;
	args: string[];
	env: { [key: string]: string };
	bell: boolean;
}

export interface SystemInfo {
	system: string;
}

export interface UserConfiguration {
	window: Window;
	shell: Shell;
	keymaps: CommandKeyMap[];
	loaded: boolean;
}

export interface Tab {
	id: string;
	title: string;
}

export interface ShellSession {
	pid: number;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
	kill: () => void;
	start: () => void;
	onShellOutput: (callback: (data: string) => void) => void;
	onShellExit: (callback: (exitStatus: SessionExitStatus) => void) => void;
	dispose: () => void;
}

export interface CreateSessionInputs {
	args?: string[];
	cols?: number;
	rows?: number;
	currentWorkingDirectory?: string;
	env?: { [key: string]: string };
}

export interface SessionExitStatus {
	exitCode: number | null;
	success: boolean;
}

export interface TreeNode<T> {
	data: T;
	childNodes: TreeNode<T>[];
}

export type Direction = 'horizontal' | 'vertical';

export interface PaneData {
	nodeId: number;
	parentNodeId?: number;
	direction?: Direction;
	session?: ShellSession;
	height: Writable<number>;
	width: Writable<number>;
	area: Readable<number>;
}

export interface TabTreeMap {
	[tabId: string]: TreeNode<PaneData>;
}

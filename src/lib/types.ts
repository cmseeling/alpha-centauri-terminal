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

export interface IDisposable {
	dispose(): void;
}

export interface ShellSession extends IDisposable {
	pid: number;
	rawCwd: string;
	resize: (cols: number, rows: number) => void;
	write: (data: string) => void;
	kill: () => void;
	start: () => void;
	cacheScrollbackBuffer: (buffer: string) => void;
	onShellOutput: (callback: (data: string) => void) => () => void;
	onShellExit: (callback: (exitStatus: SessionExitStatus) => void) => () => void;
}

export interface CreateSessionInputs {
	args?: string[];
	cols?: number;
	rows?: number;
	currentWorkingDirectory?: string;
	env?: { [key: string]: string };
	referringSessionId?: number;
}

export interface SessionExitStatus {
	exitCode: number | null;
	success: boolean;
}

export type Direction = 'horizontal' | 'vertical';

export interface TreeNode<T> {
	data: T;
	childNodes: TreeNode<T>[];
}

export interface PaneData {
	nodeId: number;
	parentNodeId?: number;
	direction?: Direction;
	sessionId?: number;
}

export interface TabTreeMap {
	[tabId: string]: TreeNode<PaneData>;
}

export interface TabInfo {
	id: string;
	name: string;
	sessionTree: TreeNode<PaneData>;
}

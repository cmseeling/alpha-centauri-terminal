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

export interface SessionTerminationStatus {
	hasExited: boolean;
	exitCode: number | null;
}

export interface TreeNode<T> {
  left?: TreeNode<T>;
  right?: TreeNode<T>;
  data?: T;
}

export interface PaneData {
	nodeId: number;
	direction: 'horizontal' | 'vertical';
	session?: ShellSession;
}
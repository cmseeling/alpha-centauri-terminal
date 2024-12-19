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
  fonts: string;
  changeDirectoryOscCode: number;
  changeWindowTitleOscCode: number;
}

export interface Theme {
  foreground?: string;
  background?: string;
  cursor?: string;
  cursorAccent?: string;
  selection?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
  tabTextColor?: string;
  inactiveTabOpacity?: string;
}

export interface SystemInfo {
  system: 'unix' | 'windows' | 'macos' | 'unknown';
}

export interface UserConfiguration {
  window: Window;
  shell: Shell;
  keymaps: CommandKeyMap[];
  theme?: Theme;
  loaded: boolean;
}

export interface IDisposable {
  dispose(): void;
}

export interface ShellSession extends IDisposable {
  pid: number;
  rawCwd: string;
  title: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolTip: { elements: { trigger: any; content: any; arrow: any }; states: { open: any } };
}

export interface CommandKeyMap {
  commandName: string;
  keyCombo: string;
}

// interface Window {

// }

export interface Shell {
  program: string;
  args: string[];
  env: {[key: string]: string};
  bell: boolean;
}

export interface UserConfiguration {
  // window: Window;
  shell: Shell;
  keymaps: CommandKeyMap[];
  loaded: boolean;
}
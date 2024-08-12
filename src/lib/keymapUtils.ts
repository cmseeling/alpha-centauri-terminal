export interface CommandKeyMap {
    commandName: string;
    keyCombo: string;
  }

export const mappedCommands: CommandKeyMap[] = [
  {
    commandName: "edit:copy",
    keyCombo: "ctrl+shift+c"
  },
  {
    commandName: "edit:paste",
    keyCombo: "ctrl+shift+v"
  },
  {
    commandName: "edit:cut",
    keyCombo: "ctrl+shift+v"
  },
  {
    commandName: "edit:undo",
    keyCombo: "ctrl+shift+z"
  },
  {
    commandName: "edit:redo",
    keyCombo: "ctrl+shift+y"
  },
  {
    commandName: "window:new_tab",
    keyCombo: "ctrl+shift+t"
  },
  {
    commandName: "window:next_tab",
    keyCombo: "ctrl+shift+ArrowLeft"
  },
  {
    commandName: "window:prev_tab",
    keyCombo: "ctrl+shift+ArrowRight"
  },
  {
    commandName: "window:split_right",
    keyCombo: "ctrl+shift+d"
  },
  {
    commandName: "window:new_down",
    keyCombo: "ctrl+shift+e"
  },
];

export const matchKeyboardEvent = (keyCombo: string, event:KeyboardEvent) => {
  const tokens = keyCombo.split('+');
  const key = tokens.splice((tokens.length - 1), 1)[0].toLowerCase();
  const ctrl = tokens.includes('ctrl');
  const alt = tokens.includes('alt');
  const shift = tokens.includes('shift');
  const meta = tokens.includes('meta');

  return event.key.toLowerCase() === key
    && event.ctrlKey === ctrl
    && event.altKey === alt
    && event.shiftKey === shift
    && event.metaKey === meta;
}

export const findKeyCommand = (event: KeyboardEvent) => mappedCommands.find((keyMap) => matchKeyboardEvent(keyMap.keyCombo, event));
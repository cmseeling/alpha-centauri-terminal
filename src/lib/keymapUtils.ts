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
    commandName: "edit:past",
    keyCombo: "ctrl+shift+v"
  },
  {
    commandName: "window:new_tab",
    keyCombo: "ctrl+shift+t"
  },
  {
    commandName: "test",
    keyCombo: "ctrl+ "
  }
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
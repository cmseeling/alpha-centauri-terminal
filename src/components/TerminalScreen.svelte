<script lang="ts">
  import '@xterm/xterm/css/xterm.css';
  import { Terminal } from "@xterm/xterm";
  import { FitAddon } from "@xterm/addon-fit";
  import { onMount } from 'svelte';
  import { createSession, type ShellSession } from "../pty/createSession";
  import { height, width, area } from '$lib/windowManagementStore';

  export let screenManagementDispatch: (screenCommand: string) => void;
  export function updateSize() {
    update();
  }

  let loaded = false;
  let resizing = false;
  let frame: number;
  let fitAddon: FitAddon;
  let terminal: Terminal;
  let shellSession: ShellSession;

  let update = () => {
    resizing = false;
    fitAddon.fit();
    if(shellSession) {
      shellSession.resize(terminal.cols, terminal.rows);
    }
  }

  const requestUpdate = () => {
    if(!resizing) {
      if(update) {
        frame = requestAnimationFrame(update);
      }
    }
    resizing = true;
  }

  const handleResize = (event: any) => {
    console.log(event);
    requestUpdate();
  };

  interface CommandKeyMap {
    command: string;
    keyCombo: string;
  }

  let mappedCommands: CommandKeyMap[] = [
    {
      command: "edit:copy",
      keyCombo: "ctrl+shift+c"
    },
    {
      command: "edit:past",
      keyCombo: "ctrl+shift+v"
    },
    {
      command: "window:new_tab",
      keyCombo: "ctrl+shift+t"
    },
    {
      command: "test",
      keyCombo: "ctrl+ "
    }
  ];

  const matchKeyboardEvent = (keyCombo: string, event:KeyboardEvent) => {
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

  const handleKeyMapEvent = (command: CommandKeyMap) => {
    console.log("map found for " + command.command);

    if(command.command.includes("window")) {
      screenManagementDispatch(command.command);
    }

    return false;
  }

  onMount(() => {
    loaded = true;

    area.subscribe((value) => {
      requestUpdate();
      // update();
    })

    return () => {
      cancelAnimationFrame(frame);
      if(shellSession) {
        ;
      }
    }
  });

  function toHex(str: string) {
    var result = '';
    for (var i=0; i<str.length; i++) {
      result += str.charCodeAt(i).toString(16) + " ";
    }
    return result;
  }
  
  const xtermJs = (node: HTMLElement) => {
    // console.log('mounting xterm');
    // console.log(node.parentElement);
    // console.log(node.parentElement?.style.backgroundColor);

    terminal = new Terminal({
      fontFamily: "Consolas",
      theme: {
        background: "#263238",
      }
    });
    terminal.open(node);

    // FitAddon Usage
		fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		fitAddon.fit();

    createSession({cols: terminal.cols, rows: terminal.rows, env: {"foo": "bar"}}).then((session) => {
      shellSession = session;

      session.onShellOutput(async (data: string) => {
        // console.log(data);
        // console.log(toHex(data));
        await terminal.write(data);
      });

      session.onShellExit((exitCode: number) => {
        console.log(`Session process exited with code ${exitCode}`);
      });

      terminal.onData((inputData) => {
        console.log(inputData);
        // console.log(inputData === '\x7F');
        // console.log(toHex(inputData))
        session.write(inputData);
        // session.write('\x03');
      });

      // terminal.onKey((onKeyEvent, callback) => {
      //   handleKeys(onKeyEvent)
      // });

      const handleKeyboardEvent = (event: KeyboardEvent) => {
        if(event.type === "keydown") {
          console.log(event);
          // console.log(event.key === '\x7f');
          const command = mappedCommands.find((keyMap) => matchKeyboardEvent(keyMap.keyCombo, event));
          if(command) {
            return handleKeyMapEvent(command);
          }
          // spacebar is broken for some reason
          if(event.key === " ") {
            session.write(" ");
            return false;
          }
          else {
            console.log("map not found");
            // console.log(event.key);
            // session.write(event.key);
            return true;
          }
        }
        return false;
      }

      terminal.attachCustomKeyEventHandler(handleKeyboardEvent);

      session.start();
    });
  }
</script>

{#if loaded}
<div class="terminal-screen" use:xtermJs style="--termHeight:{$height}px; --termWidth:{$width}px;" />
{/if}

<style>
  .terminal-screen {
    height: var(--termHeight, 100%);
    width: var(--termWidth, 100%);
  }
</style>
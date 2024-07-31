<script lang="ts">
  import '@xterm/xterm/css/xterm.css';
  import { Terminal } from "@xterm/xterm";
  import { FitAddon } from "@xterm/addon-fit";
  import { createSession } from "../pty/createSession";

  let handleResize: (event: any) => void;

  const xtermJs = (node: HTMLElement) => {
    const terminal = new Terminal({
      theme: {
        background: "rgb(47, 47, 47)",
      }
    });

    // FitAddon Usage
		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		fitAddon.fit();

    // session = await createSession(terminal.cols, terminal.rows);
    createSession(terminal.cols, terminal.rows).then((session) => {
      session.onShellOutput(async (data: string) => {
        await terminal.write(data);
      });
      session.onShellExit((exitCode: number) => {
        console.log(`Session process exited with code ${exitCode}`);
      });

      terminal.onData((inputData) => {
        console.log('onData()', inputData);
        session.write(inputData);
      })

      // todo: only call session.resize after resize is complete if possible
      // or else maybe debounce?
      handleResize = (event: any) => {
        console.log(event)
        fitAddon.fit();
        session.resize(terminal.cols, terminal.rows)
      }

      session.start();
      // todo: figure out when to call stop and/or dispose

      terminal.open(node);
    });
  }
</script>

<svelte:window on:resize={handleResize} />
<div class="terminal-screen" use:xtermJs />
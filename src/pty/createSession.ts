import { invoke } from "@tauri-apps/api";

const TAURI_COMMAND_CREATE_SESSION = "create_session";
const TAURI_COMMAND_READ_FROM_SESSION = "read_from_session";
const TAURI_COMMAND_GET_EXIT_STATUS = "get_exit_status";
const TAURI_COMMAND_RESIZE = "resize";
const TAURI_COMMAND_WRITE_TO_SESSION = "write_to_session";
const TAURI_COMMAND_END_SESSION = "end_session";

export interface ShellSession {
  pid: number;
  resize: (cols: number, rows: number) => void;
  write: (data: string) => void;
  kill: () => void;
  start: () => void;
  stop: () => void;
  onShellOutput: (callback: (data: string) => void) => void;
  onShellExit: (callback: (exitCode: number) => void) => void;
  dispose: () => void;
}

export interface CreateSessionInputs {
  args?: string[];
  cols?: number;
  rows?: number;
  currentWorkingDirectory?: string;
  env?: {[key: string]: string};
}

export const createSession = async ({
  args,
  cols,
  rows,
  currentWorkingDirectory,
  env
}: CreateSessionInputs) => {
  let pid: number|null = null;
  let onShellOutputCallback =  (data: string) => {};
  let onShellOutputHasSubscriber = false;
  let onShellExitCallback = (exitCode: number) => {};
  let onShellExitHasSubscriber = false;

  pid = await invoke<number>(TAURI_COMMAND_CREATE_SESSION, { args, cols, rows, currentWorkingDirectory, env });
  let sessionActive = true;

  const resize = (cols: number, rows: number) => {
    if(pid != null) {
      invoke(TAURI_COMMAND_RESIZE, { pid, cols, rows });
    }
  }
  
  const write = (data: string) => {
    if(pid != null) {
      invoke(TAURI_COMMAND_WRITE_TO_SESSION, { pid, data });
    }
  }

  const kill = () => {
    if(pid != null) {
      invoke(TAURI_COMMAND_END_SESSION, { pid });
    }
  }

  const onShellOutput = (callback: (data: string) => void) => {
    onShellOutputCallback = callback;
    onShellOutputHasSubscriber = true;
  }

  const onShellExit = (callback: (exitCode: number) => void) => {
    onShellExitCallback = callback;
    onShellExitHasSubscriber = true;
  }

  // todo: look into using a web worker for this
  const start = async () => {
    // listen to session output
    try {
      while(sessionActive && pid !== null) {
        if(onShellOutputHasSubscriber) {
          const shellData = await invoke<string>(TAURI_COMMAND_READ_FROM_SESSION, { pid });
          onShellOutputCallback(shellData);
        }
      }
    }
    catch (e: any) {
      console.error('Reading Error: ', e);
    }

    // listen for session termination
    if(onShellExitHasSubscriber) {
      const exitCode = await invoke<number>(TAURI_COMMAND_GET_EXIT_STATUS, { pid });
      onShellExitCallback(exitCode);
    }
  }

  const stop = () => {
    kill();
    sessionActive = false;
    pid = null;
  }

  const dispose = () => {
    stop();
  }

  const returnValue: ShellSession = {
    pid,
    resize,
    write,
    kill,
    start,
    stop,
    onShellOutput,
    onShellExit,
    dispose
  }
  return returnValue;
}
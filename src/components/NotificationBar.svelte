<script lang="ts">
  import { listen } from '@tauri-apps/api/event'
  import { invoke } from "@tauri-apps/api";
  import { onMount } from 'svelte';
  import { createCollapsible, melt } from '@melt-ui/svelte';
  import { slide } from 'svelte/transition';
  import { addToast } from '$lib/Toaster.svelte'
  import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';

  interface NotificationEvent {
    level: number;
    message: string;
    details: string;
  }

  const TAURI_COMMAND_GET_STARTUP_NOTIFICATIONS = "get_startup_notifications";

  let level: number = 0;
  let message: string|undefined = undefined;
  let details: string|undefined = undefined;
  let bgcolor: string = '#c62828';
  let textColor: string = 'white';

  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible();

  const clearNotifcation = () => {
    level = 0;
    message = undefined;
    details = undefined;
  }

  function create() {
    addToast({
      data: {
        title: 'Success',
        description: 'The resource was created!',
        color: 'green'
      }
    })
  }

  onMount(() => {
    let unlisten: () => void;

    create()

    listen<NotificationEvent>('notification-event', ({payload}) => {
      console.log('got event')
      level = payload.level;
      message = payload.message;
      details = payload.details;

      switch(level) {
        case 1: {
          bgcolor ='#1565c0';
          textColor = 'white';
          break;
        }
        case 2: {
          bgcolor = '#ffc107';
          textColor = '#37474f';
          break;
        }
        case 3: {
          bgcolor = '#c62828';
          textColor = 'white';
          break;
        }
        default: {
          bgcolor = '#c62828';
          textColor = 'white';
          break;
        }
      }
    }).then((unlistenFn) => {
      unlisten = unlistenFn;
      invoke(TAURI_COMMAND_GET_STARTUP_NOTIFICATIONS);
    });

    return () => {
      if(unlisten) {
        unlisten();
      }
    }
  })
</script>

{#if message !== undefined}
<div class="notification-bar" style="--bgcolor:{bgcolor};">
  <div class="message" style="--textColor: {textColor};">
    {message}
  </div>
  <div class="close-button-container">
    <button class="close-button" on:click={clearNotifcation}>
      <CloseCircleOutline style="font-size:1.5em"/>
    </button>
  </div>
  {#if details !== undefined}
  <div use:melt={$root} class="root">
    <div class="header">
      <button use:melt={$trigger} class="collapse-button">
        See details
      </button>
    </div>
    {#if $open}
      <div use:melt={$content} transition:slide>
        <div class="collapsible">
          <div class="item">
            {@html details}
          </div>
        </div>
      </div>
    {/if}
  </div>
  {/if}
</div>
{/if}

<style>
  .notification-bar {
    background-color: var(--bgcolor, #c62828);
    position: fixed;
    width: 100%;
    padding: 0.5em 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 1000;
  }

  .close-button-container {
    position: fixed;
    top: 0;
    right: 0;
    margin-top: .5em;
    margin-right: .5em;
  }

  .close-button {
    box-shadow: none;
    background-color: transparent;
    border: 0;
    opacity: .65;
  }

  .close-button:hover {
    opacity: 1;
  }

  .message {
    color: var(--textColor, white);
    display: flex;
    justify-content: center;
    margin: .25em 0 .75em 0;
  }
  
  .root {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 28rem;
  }

  .header {
    display: flex;
    justify-content: center;
  }

  .collapse-button {
    border-radius: 180px;

    font-size: 0.6rem;

    box-shadow: 0 10px 15px -3px rgb(var(--color-black) / 0.1),
      0 4px 6px -4px rgb(var(--color-black) / 0.1);
  }

  .collapse-button:hover {
    background-color: #bbdefb;
  }

  .item {
    margin: 0.5em 0;
    padding: 0.75rem;
    border-radius: 0.25rem;

    background-color: #bdbdbd;

    box-shadow: 0 10px 15px -3px rgb(var(--color-black) / 0.1),
      0 4px 6px -4px rgb(var(--color-black) / 0.1);

    font-size: .75rem;
    line-height: 25px;
    color: #424242;
  }

  .item::first-of-type {
    margin: 0.5rem 0;
  }

  .collapsible {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
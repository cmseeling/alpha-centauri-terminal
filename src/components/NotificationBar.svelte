<script lang="ts">
  import { listen } from '@tauri-apps/api/event'
  import { onMount } from 'svelte';

  import { createCollapsible, melt } from '@melt-ui/svelte';
  import { slide } from 'svelte/transition';
  import XmarkSolid from '$lib/components/svgs/xmark-solid.svelte';

  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible();

  interface NotificationEvent {
    level: number;
    message: string;
    details: string;
  }

  let level: number = 0;
  let message: string|undefined = undefined;
  let details: string|undefined = undefined;
  let bgcolor: string = '#c62828';
  let textColor: string = 'white';

  onMount(() => {
    let unlisten: () => void;

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
      unlisten = unlistenFn
    });

    level = 3;
    message = "test"
    details = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sollicitudin velit nisl, id iaculis sapien tristique sed. Aliquam lobortis ut dui et facilisis. Quisque tempus venenatis odio non venenatis. Mauris in libero lobortis, congue augue nec, vehicula metus. Nunc interdum sapien non justo sagittis, et faucibus magna cursus. Nam rutrum maximus orci id accumsan. Mauris fermentum non diam ut elementum. Donec nunc felis, tincidunt in nibh a, ornare tincidunt velit. Etiam non turpis in purus ullamcorper facilisis. Praesent iaculis varius bibendum." 

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
    <XmarkSolid />
  </div>
  {#if details !== undefined}
  <div use:melt={$root} class="root">
    <div class="header">
      <button use:melt={$trigger} class="collapse-button">
        See debugging details
      </button>
    </div>
    {#if $open}
      <div use:melt={$content} transition:slide>
        <div class="collapsible">
          <div class="item">
            <span>{details}</span>
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
    position: absolute;
    width: 100%;
    padding: 0.5em 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 1000;
  }

  .close-button-container {
    position: absolute;
    right: 0;
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

    font-size: 0.75rem;

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
  }

  .item span {
    font-size: .75rem;
    line-height: 25px;

    color: rgb(var(--color-magnum-800) / 1);
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
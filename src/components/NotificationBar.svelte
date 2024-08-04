<script lang="ts">
  import { listen } from '@tauri-apps/api/event'
  import { onMount } from 'svelte';
  import * as Card from "$lib/components/ui/card";
  import * as Collapsible from "$lib/components/ui/collapsible";

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

    level = 2;
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
  {#if details !== undefined}
  <Collapsible.Root>
    <Collapsible.Trigger><span class="debug-info-trigger">Click to see debugging info.</span></Collapsible.Trigger>
    <Collapsible.Content>
      <Card.Root>
        <Card.Content class="bg-secondary">
          {details}
        </Card.Content>
      </Card.Root>
    </Collapsible.Content>
  </Collapsible.Root>
  {/if}
</div>
{/if}

<style>
  .notification-bar {
    background-color: var(--bgcolor, #c62828);
    position: absolute;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 1000;
  }

  .message {
    color: var(--textColor, white);
    display: flex;
    justify-content: center;
    margin: .25em 0;
  }

  div[data-collapsible-root] {
    display: flex;
    justify-content: center;
  }

  .debug-info-trigger {
    color: #1a237e;
    font-size: 10px;
  }
</style>
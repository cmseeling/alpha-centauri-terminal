<script lang="ts">
  import { fade } from 'svelte/transition';
  import { trigger } from '$lib/store';
  import type { TabInfo } from '$lib/types';
  import { melt } from '@melt-ui/svelte';
  import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';

  export let triggerItem: TabInfo;
  export let index: number;
  export let closeTabClicked: (tabId: string) => void;

  $: tooltipTrigger = triggerItem.toolTip.elements.trigger;
  $: tooltipContent = triggerItem.toolTip.elements.content;
  $: tooltipArrow = triggerItem.toolTip.elements.arrow;
  $: tooltipOpen = triggerItem.toolTip.states.open;
</script>

<div
  use:melt={$trigger(triggerItem.id)}
  class="trigger flex h-6 grow cursor-pointer items-center justify-center rounded-tr-md
    border-r border-black bg-gray-950 pe-2 ps-2 text-white opacity-75 data-[state=active]:opacity-100"
>
  <span
    use:melt={$tooltipTrigger}
    class="w-full overflow-hidden whitespace-nowrap text-center"
    data-testid={`tab-index-${index}`}
  >
    {triggerItem.name}
  </span>
  <button
    class="border-0 bg-gray-950 pl-2 pt-0.5 text-white"
    on:click={() => closeTabClicked(triggerItem.id)}
    data-testid={`close-tab-${index}`}
  >
    <CloseCircleOutline style="font-size:1em" />
  </button>
  {#if $tooltipOpen}
    <div
      use:melt={$tooltipContent}
      transition:fade={{ duration: 100 }}
      class=" z-10 rounded-lg bg-white shadow"
    >
      <div use:melt={$tooltipArrow} />
      <p class="text-magnum-700 px-4 py-1">{triggerItem.name}</p>
    </div>
  {/if}
</div>

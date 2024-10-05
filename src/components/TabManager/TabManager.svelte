<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { melt } from '@melt-ui/svelte';
  import { content, list, root, trigger, tabs } from '$lib/store';
  import Add from 'virtual:icons/mdi/add';
  import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';
  import Tab from './Tab.svelte';

  const dispatch = createEventDispatcher();

  const newTabClicked = () => {
    dispatch('newtab');
  };

  const closeTabClicked = (tabId: string) => {
    dispatch('closetab', { tabId });
  };
</script>

<div use:melt={$root} class="flex h-full flex-col">
  <div use:melt={$list} class="flex grow flex-row items-center bg-slate-400">
    {#each $tabs as triggerItem, index (triggerItem.id)}
      <Tab {index} {triggerItem} {closeTabClicked} />
    {/each}
    <button
      class="h-5 w-6 border border-black pe-0.5 ps-0.5"
      data-testid="add-new-tab"
      on:click={newTabClicked}
    >
      <Add style="font-size:1em" />
    </button>
  </div>
  <div class="h-full overflow-y-hidden bg-gray-950">
    {#each $tabs as tabItem, index (tabItem.id)}
      <div use:melt={$content(tabItem.id)} class="h-full">
        <slot tabId={tabItem.id} tabIndex={index} />
      </div>
    {/each}
  </div>
</div>

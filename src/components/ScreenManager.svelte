<script lang="ts">
  import { createTabs, melt } from '@melt-ui/svelte';
  import TerminalScreen from './TerminalScreen.svelte';
  import Add from 'virtual:icons/mdi/add';
  import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';
  import { height, width } from '$lib/windowManagementStore';

  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: '1',
  });

  let tabs = [
    { id: '1', title: 'Tab 1' },
  ];

  const addNewTab = () => {
    console.log('adding new tab');
    tabs = [
      ...tabs,
      {
        id: '' + new Date().getTime(),
        title: 'New Tab'
      }
    ];
    $value = tabs[tabs.length - 1].id;
  }

  const closeTab = (tabId: string) => {
    console.log('closing tab ' + tabId);
    tabs = tabs.filter((tab) => {
      return tab.id !== tabId
    });
    if($value === tabId) {
      $value = tabs[0].id;
    }
  }

  const handleCommandDispatch = (command: string) => {
    console.log("received " + command);
    switch(command) {
      case "window:new_tab": {
        addNewTab();
        break;
      }
    }
  }
</script>

<div use:melt={$root} class="flex flex-col h-full">
  {#if tabs.length > 1}
  <div use:melt={$list} class="flex shrink-0 flex-row items-center bg-slate-400">
    {#each tabs as triggerItem (triggerItem.id)}
      <div use:melt={$trigger(triggerItem.id)}
            class="trigger flex items-center justify-center border-r border-black rounded-t-lg
            bg-gray-950 text-white opacity-75 ps-2 pe-2 h-6 data-[state=active]:opacity-100 cursor-pointer">
        {triggerItem.title}
        <button class="bg-gray-950 text-white border-0 pt-0.5 pl-2" on:click={() => closeTab(triggerItem.id)}>
          <CloseCircleOutline style="font-size:1em"/>
        </button>
      </div>
    {/each}
    <button class="h-5 border border-black w-6 ps-0.5 pe-0.5" on:click={addNewTab}>
      <Add style="font-size:1em"/>
    </button>
  </div>
  {/if}
  <div class="h-full bg-gray-950 overflow-y-hidden" bind:clientHeight={$height} bind:clientWidth={$width}>
    {#each tabs as tabItem (tabItem.id)}
      <div use:melt={$content(tabItem.id)}>
        <TerminalScreen screenManagementDispatch={handleCommandDispatch}/>
      </div>
    {/each}
  </div>
</div>

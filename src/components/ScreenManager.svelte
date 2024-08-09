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
    { id: '2', title: 'Tab 2 with a longer name' },
    { id: '3', title: 'Tab 3' }
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

<div use:melt={$root} class="container">
  {#if tabs.length > 1}
  <div use:melt={$list} class="tab-list">
    {#each tabs as triggerItem (triggerItem.id)}
      <div use:melt={$trigger(triggerItem.id)} class="trigger">
        {triggerItem.title}
        <button class="close-tab-button" on:click={() => closeTab(triggerItem.id)}>
          <CloseCircleOutline style="font-size:1em"/>
        </button>
      </div>
    {/each}
    <button class="add-button" on:click={addNewTab}>
      <Add />
    </button>
  </div>
  {/if}
  <div class="tab-content" bind:clientHeight={$height} bind:clientWidth={$width} on:resize={(event) => console.log(event)}>
    {#each tabs as tabItem (tabItem.id)}
      <div use:melt={$content(tabItem.id)}>
        <TerminalScreen screenManagementDispatch={handleCommandDispatch}/>
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tab-list {
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    align-items: center;
  }
  
  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;

    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    border-left: 0px;
    border-top: 0px;
    border-bottom: 0px;
    border-right: 1px solid black;

    background-color: #263238;
    color: white;

    opacity: 75%;

    height: 1.4em;
    padding-inline-start: 0.5em;

    &[data-state='active'] {
      opacity: 100%;
    }
  }

  .close-tab-button {
    background-color: #263238;
    color: white;
    border: 0;
    padding-top: 0.4em;
  }

  .add-button {
    height: 1.5em;
  }

  .tab-content {
    height: 100%;
    overflow-y: hidden;
    background-color: #263238;
  }
</style>
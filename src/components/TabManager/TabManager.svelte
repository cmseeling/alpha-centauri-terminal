<script lang="ts">
  import { createTabs, melt } from '@melt-ui/svelte';
	import Add from 'virtual:icons/mdi/add';
	import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';
	import { height, width } from '$lib/store/windowManagementStore';
	import type { Tab } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let forceTabBar = false;
  export function setTabs(newTabs: Tab[], activeTabId: string) {
    tabs = newTabs;
    $activeTab = activeTabId;
  };
  export function getActiveTabId() {
    return $activeTab;
  };

  let tabs: Tab[] = [{ id: '1', title: 'Tab 1' }];

	const {
		elements: { root, list, content, trigger },
		states: { value: activeTab }
	} = createTabs({
		defaultValue: '1'
	});

  const dispatch = createEventDispatcher();

  const newTabClicked = () => {
    dispatch('newtab');
  }

  const closeTabClicked = (tabId: string) => {
    dispatch('closetab', { tabId })
  }

	// const addNewTab = () => {
	// 	console.log('adding new tab');
	// 	tabs = [
	// 		...tabs,
	// 		{
	// 			id: '' + new Date().getTime(),
	// 			title: 'New Tab'
	// 		}
	// 	];
	// 	$activeTab = tabs[tabs.length - 1].id;
	// };

	// const closeTab = (tabId: string) => {
	// 	console.log('closing tab ' + tabId);
	// 	tabs = tabs.filter((tab) => {
	// 		return tab.id !== tabId;
	// 	});
	// 	if ($activeTab === tabId) {
	// 		$activeTab = tabs[0].id;
	// 	}
	// };

	// export const handleCommandDispatch = (command: string) => {
	// 	console.log('received ' + command);
	// 	switch (command) {
	// 		case 'window:new_tab': {
	// 			addNewTab();
	// 			break;
	// 		}
	// 	}
	// };
</script>

<div use:melt={$root} class="flex h-full flex-col">
	{#if tabs.length > 1 || forceTabBar}
		<div use:melt={$list} class="flex shrink-0 flex-row items-center bg-slate-400">
			{#each tabs as triggerItem (triggerItem.id)}
				<div
					use:melt={$trigger(triggerItem.id)}
					class="trigger flex h-6 cursor-pointer items-center justify-center rounded-t-lg
            border-r border-black bg-gray-950 pe-2 ps-2 text-white opacity-75 data-[state=active]:opacity-100"
				>
					{triggerItem.title}
					<button
						class="border-0 bg-gray-950 pl-2 pt-0.5 text-white"
						on:click={() => closeTabClicked(triggerItem.id)}
						data-testid={`close-tab-${triggerItem.id}`}
					>
						<CloseCircleOutline style="font-size:1em" />
					</button>
				</div>
			{/each}
			<button
				class="h-5 w-6 border border-black pe-0.5 ps-0.5"
				data-testid="add-new-tab"
				on:click={newTabClicked}
			>
				<Add style="font-size:1em" />
			</button>
		</div>
	{/if}
	<div
		class="h-full overflow-y-hidden bg-gray-950"
		bind:clientHeight={$height}
		bind:clientWidth={$width}
	>
		{#each tabs as tabItem (tabItem.id)}
			<div use:melt={$content(tabItem.id)}>
				<slot tabId={tabItem.id} />
			</div>
		{/each}
	</div>
</div>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { melt } from '@melt-ui/svelte';
	import { content, list, root, trigger, tabs } from '$lib/store';
	import Add from 'virtual:icons/mdi/add';
	import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';

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
		{#each $tabs as triggerItem (triggerItem.id)}
			<div
				use:melt={$trigger(triggerItem.id)}
				class="trigger grow flex h-6 cursor-pointer items-center justify-center
					border-r border-black bg-gray-950 pe-2 ps-2 text-white opacity-75 data-[state=active]:opacity-100"
			>
				<span class="w-full overflow-hidden whitespace-nowrap text-center">
					{triggerItem.name}
				</span>
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
	<div class="h-full overflow-y-hidden bg-gray-950">
		{#each $tabs as tabItem, index (tabItem.id)}
			<div use:melt={$content(tabItem.id)} class="h-full">
				<slot tabId={tabItem.id} tabIndex={index} />
			</div>
		{/each}
	</div>
</div>

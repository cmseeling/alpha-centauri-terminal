<script lang="ts">
	import { appWindow } from '@tauri-apps/api/window';
	import { activeTab } from '$lib/store/tabs';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	import { addNode } from '$lib/utils/paneTreeUtils';
	import type { TreeNode, PaneData } from '$lib/types';
	import { onMount } from 'svelte';
	import { userConfiguration } from '$lib/store/configurationStore';

	export let forceTabBar = false;

	let tabs = [{ id: '1', title: 'Tab 1' }];

	const addNewTab = () => {
		console.log('adding new tab');
		tabs = [
			...tabs,
			{
				id: '' + new Date().getTime(),
				title: 'New Tab'
			}
		];
		$activeTab = tabs[tabs.length - 1].id;
	};

	const closeTab = (event: CustomEvent) => {
		const tabId = event.detail.tabId;
		closeTabById(tabId);
	};

	const closeTabById = (tabId: string) => {
		console.log('closing tab ' + tabId);
		tabs = tabs.filter((tab) => {
			return tab.id !== tabId;
		});
		if (tabs.length > 0) {
			if ($activeTab === tabId) {
				$activeTab = tabs[0].id;
			}
		} else {
			appWindow.close();
		}
	};

	const handleSessionExit = (exitCode: number, tabId: string | undefined) => {
		console.log(`Session process exited with code ${exitCode}`);
		if (tabId) {
			closeTabById(tabId);
		}
		if (exitCode !== 0) {
			addWarningToast('Session ended with non-zero exit code', `Exit code: ${exitCode}`);
		}
	};

	const handleCommandDispatch = (command: string) => {
		console.log('received ' + command);
		switch (command) {
			case 'window:new_tab': {
				addNewTab();
				break;
			}
		}
	};

	let paneTree: TreeNode<PaneData>;
	let loaded = false;
	let unSubusrCgf;

	onMount(() => {
		unSubusrCgf = userConfiguration.subscribe(async (config) => {
			if(config.loaded) {
				paneTree = await addNode(null, 0, 'horizontal');
				loaded = true;
			}
		});
	})
</script>

{#if loaded && $userConfiguration.loaded}
<TabManager
	{forceTabBar}
	{tabs}
	on:newtab={addNewTab}
	on:closetab={closeTab}
	let:tabId={screenTabId}
>
	<PaneManager tree={paneTree} let:session={shellSession}>
		<TerminalScreen
			tabId={screenTabId}
			session={shellSession}
			screenManagementDispatch={handleCommandDispatch}
			onSessionExit={handleSessionExit}
		/>
	</PaneManager>
</TabManager>
{/if}

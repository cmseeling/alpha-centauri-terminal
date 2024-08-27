<script lang="ts">
	import { appWindow } from '@tauri-apps/api/window';
	import { activeTab } from '$lib/store/tabs';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	import { addNode, lastNodeId, terminateSessions } from '$lib/utils/paneTreeUtils';
	import type { TreeNode, PaneData } from '$lib/types';
	import { onMount } from 'svelte';
	import { userConfiguration } from '$lib/store/configurationStore';

	export let forceTabBar = false;

	// interface PaneTreeMap {
	// 	[tabId: string]: TreeNode<PaneData>;
	// }

	let loaded = false;
	let unSubusrCgf;
	let tabs = [{ id: '1', title: 'Tab 1' }];
	// let trees: PaneTreeMap = {};
	let trees = new Map<string, TreeNode<PaneData>>();

	const addNewTab = async () => {
		console.log('adding new tab');

		const newTabId = '' + new Date().getTime();

		const newTree = await addNode(null, $lastNodeId, 'horizontal');
		trees.set(newTabId, newTree);
		
		tabs = [
			...tabs,
			{
				id: newTabId,
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
		terminateSessions(trees.get(tabId));
		trees.delete(tabId);
		if (tabs.length > 0) {
			if ($activeTab === tabId) {
				$activeTab = tabs[0].id;
			}
		} else {
			appWindow.close();
		}
	};

	const handleSessionExit = (exitCode: number, tabId: string | undefined, nodeId: number|undefined) => {
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

	onMount(() => {
		unSubusrCgf = userConfiguration.subscribe(async (config) => {
			if(config.loaded) {
				const newNode = await addNode(null, 0, 'horizontal');
				trees.set('1', newNode);
				loaded = true;
			}
		});
	});

	// hack for now
  // TODO: handle the error if it really is undefined
  const forceGetTree = (screenTabId: string): TreeNode<PaneData> => {
    return trees.get(screenTabId) as TreeNode<PaneData>;
  }
</script>

{#if loaded && $userConfiguration.loaded}
<TabManager
	{forceTabBar}
	{tabs}
	on:newtab={addNewTab}
	on:closetab={closeTab}
	let:tabId={screenTabId}
>
	<PaneManager tree={forceGetTree(screenTabId)} let:session={shellSession} let:nodeId={paneNodeId}>
		<TerminalScreen
			tabId={screenTabId}
			nodeId={paneNodeId}
			session={shellSession}
			screenManagementDispatch={handleCommandDispatch}
			onSessionExit={handleSessionExit}
		/>
	</PaneManager>
</TabManager>
{/if}

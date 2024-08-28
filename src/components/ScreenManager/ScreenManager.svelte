<script lang="ts">
	import { appWindow } from '@tauri-apps/api/window';
	import { activeTab } from '$lib/store/tabs';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	import { addNode, createSingleNode, terminateSessions } from '$lib/utils/paneTreeUtils';
	import type { Direction } from '$lib/types';
	import { onMount } from 'svelte';
	import { userConfiguration } from '$lib/store/configurationStore';
	import { paneTrees } from '$lib/store/panes';

	export let forceTabBar = false;

	// interface PaneTreeMap {
	// 	[tabId: string]: TreeNode<PaneData>;
	// }

	let loaded = false;
	let tabs = [{ id: '1', title: 'Tab 1' }];
	// let trees: PaneTreeMap = {};
	// let trees = new Map<string, TreeNode<PaneData>>();

	const addNewTab = async () => {
		console.log('adding new tab');

		const newTabId = '' + new Date().getTime();

		const newTree = await createSingleNode();
		$paneTrees = { ...$paneTrees, [newTabId]: newTree };

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
		terminateSessions($paneTrees[tabId]);
		let clone = {...$paneTrees};
		delete clone[tabId];
		$paneTrees = clone;
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

	const addNewPane = async (tabId: string, nodeId: number, direction: Direction) => {
		console.log(`adding new pane: ${direction}`)
		let tree = $paneTrees[tabId];
		if(tree) {
			tree = await addNode(tree, nodeId, direction);
			$paneTrees = { ...$paneTrees, [tabId]: tree };
		}
		console.log($paneTrees);
	}

	const handleCommandDispatch = (command: string, tabId?: string, nodeId?: number) => {
		console.log('received ' + command);
		switch (command) {
			case 'window:new_tab': {
				addNewTab();
				break;
			}
			case 'window:split_right': {
				if(tabId !== undefined && nodeId !== undefined) {
					addNewPane(tabId, nodeId, 'horizontal');
				}
				break;
			}
			case 'window:split_down': {
				if(tabId !== undefined && nodeId !== undefined) {
					addNewPane(tabId, nodeId, 'vertical');
				}
				break;
			}
		}
	};

	onMount(() => {
		const unSubUsrCgf = userConfiguration.subscribe(async (config) => {
			if(config.loaded) {
				let newTree = await createSingleNode();
				// newTree = await addNode(newTree, 1, 'horizontal')
				$paneTrees = { ...$paneTrees, '1': newTree };
				loaded = true;
			}
		});

		return () => {
			unSubUsrCgf();
		}
	});
</script>

{#if loaded && $userConfiguration.loaded}
<TabManager
	{forceTabBar}
	{tabs}
	on:newtab={addNewTab}
	on:closetab={closeTab}
	let:tabId={screenTabId}
>
	<PaneManager
		tabId={screenTabId}
		tree={$paneTrees[screenTabId]}
		disspatchCommand={handleCommandDispatch}
		onExit={handleSessionExit} />
</TabManager>
{/if}

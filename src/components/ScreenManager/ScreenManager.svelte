<script lang="ts">
	import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { onMount } from 'svelte';
	import type { Direction, SessionExitStatus } from '$lib/types';
	import { activeTab, tabTrees, userConfiguration } from '$lib/store';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import {
		addNode,
		createSingleNode,
		removeLeafNode,
		terminateSessions
	} from '$lib/utils/paneTreeUtils';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	
	const appWindow = getCurrentWebviewWindow();

	let loaded = false;
	let tabs = [{ id: '1', title: 'Tab 1' }];

	const addNewTab = async (referringSessionId?: number) => {
		// console.log('adding new tab');

		const newTabId = '' + new Date().getTime();

		const newTree = await createSingleNode({ referringSessionId });
		$tabTrees = { ...$tabTrees, [newTabId]: { tree: newTree } };

		tabs = [
			...tabs,
			{
				id: newTabId,
				title: 'New Tab'
			}
		];
		$activeTab = tabs[tabs.length - 1].id;
	};

	const handleNewTabClick = async () => {
		const referringSessionId = $tabTrees[$activeTab].lastActiveSessionId;
		await addNewTab(referringSessionId);
	};

	const closeTab = (event: CustomEvent) => {
		const tabId = event.detail.tabId;
		closeTabById(tabId);
	};

	const closeTabById = (tabId: string) => {
		console.log('closing tab ' + tabId);
		terminateSessions($tabTrees[tabId].tree);
		let clone = { ...$tabTrees };
		delete clone[tabId];
		$tabTrees = clone;
		// console.log($tabTrees);
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

	const handleSessionExit = (
		exitStatus: SessionExitStatus,
		tabId: string | undefined,
		nodeId: number | undefined
	) => {
		// console.log(`Session process exited with code ${exitCode}`);
		if (tabId && nodeId) {
			if($tabTrees[tabId]) {
				const newTree = removeLeafNode($tabTrees[tabId].tree, nodeId);
				// console.log(newTree);
				if (newTree) {
					$tabTrees[tabId].tree = newTree;
				} else {
					closeTabById(tabId);
				}
			}
		}
		if (!exitStatus.success) {
			addWarningToast('Session ended with non-zero exit code', `Exit code: ${exitStatus.exitCode}`);
		}
	};

	// todo: implement referring session id
	const addNewPane = async (
		tabId: string,
		nodeId: number,
		direction: Direction,
		referringSessionId?: number
	) => {
		// console.log(`adding new pane: ${direction}`);
		let tree = $tabTrees[tabId].tree;
		if (tree) {
			tree = await addNode(tree, nodeId, direction, referringSessionId);
			$tabTrees = { ...$tabTrees, [tabId]: { tree } };
		}
		// console.log($tabTrees);
	};

	const handleCommandDispatch = (command: string, tabId?: string, nodeId?: number) => {
		// console.log('received ' + command);
		switch (command) {
			case 'window:new_tab': {
				let referringSessionId = undefined;
				if (tabId !== undefined && nodeId !== undefined) {
					referringSessionId = $tabTrees[tabId].lastActiveSessionId;
				}
				// console.log(referringSessionId);
				addNewTab(referringSessionId);
				break;
			}
			case 'window:split_right': {
				if (tabId !== undefined && nodeId !== undefined) {
					const referringSessionId = $tabTrees[tabId].lastActiveSessionId;
					addNewPane(tabId, nodeId, 'horizontal', referringSessionId);
				}
				break;
			}
			case 'window:split_down': {
				if (tabId !== undefined && nodeId !== undefined) {
					const referringSessionId = $tabTrees[tabId].lastActiveSessionId;
					addNewPane(tabId, nodeId, 'vertical', referringSessionId);
				}
				break;
			}
		}
	};

	onMount(() => {
		const unSubUsrCgf = userConfiguration.subscribe(async (config) => {
			if (config.loaded) {
				let newTree = await createSingleNode({});
				$tabTrees = { ...$tabTrees, '1': { tree: newTree } };
				loaded = true;
			}
		});

		return () => {
			unSubUsrCgf();
		};
	});
</script>

{#if loaded && $userConfiguration.loaded}
	<TabManager {tabs} on:newtab={handleNewTabClick} on:closetab={closeTab} let:tabId={screenTabId}>
		<PaneManager
			tabId={screenTabId}
			tree={$tabTrees[screenTabId].tree}
			disspatchCommand={handleCommandDispatch}
			onExit={handleSessionExit}
		/>
	</TabManager>
{/if}

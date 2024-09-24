<script lang="ts">
	import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { onMount } from 'svelte';
	import type { Direction, SessionExitStatus } from '$lib/types';
	import { activeTab, userConfiguration } from '$lib/store';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	import { WINDOW_COMMAND_NEW_TAB, WINDOW_COMMAND_SPLIT_DOWN, WINDOW_COMMAND_SPLIT_RIGHT } from '$lib/constants';
	// import { tabTrees } from '$lib/store/tabTrees';
	// import { addNode, createSingleNode, removeLeafNode, terminateSessions } from '$lib/utils/paneTreeUtils';
	import { trees } from '$lib/store';
	import { tabActiveSessions } from '$lib/store/trees';
	
	const appWindow = getCurrentWebviewWindow();

	let loaded = false;
	let tabs = [{ id: '1', title: 'Tab 1' }];

	const addNewTab = async (referringSessionId?: number) => {
		// console.log('adding new tab');

		const newTabId = '' + new Date().getTime();

		// const newTree = await createSingleNode({ referringSessionId });
		// // const newTree = await initializeTree(referringSessionId);
		// $tabTrees = { ...$tabTrees, [newTabId]: { tree: newTree } };
		// // await trees.createTree(newTabId, referringSessionId);
		await trees.createTree(newTabId, referringSessionId);

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
		// const referringSessionId = $tabTrees[$activeTab].lastActiveSessionId;
		// const referringSessionId = $trees[$activeTab].lastActiveSessionId;
		const referringSessionId = tabActiveSessions.get($activeTab);
		// const referringSessionId = trees.get($activeTab)?.lastActiveSessionId;
		await addNewTab(referringSessionId);
	};

	const closeTab = (event: CustomEvent) => {
		const tabId = event.detail.tabId;
		closeTabById(tabId);
	};

	const closeTabById = (tabId: string) => {
		// // console.log('closing tab ' + tabId);
		// terminateSessions($tabTrees[tabId].tree);
		// let clone = { ...$tabTrees };
		// delete clone[tabId];
		// $tabTrees = clone;
		// // console.log($tabTrees);
		
		// // trees.remove(tabId);
		// tabs = tabs.filter((tab) => {
		// 	return tab.id !== tabId;
		// });
		// if (tabs.length > 0) {
		// 	if ($activeTab === tabId) {
		// 		$activeTab = tabs[0].id;
		// 	}
		// } else {
		// 	appWindow.close();
		// }

		trees.remove(tabId);
		removeTabHelper(tabId);
	};

	const removeTabHelper = (tabId: string) => {
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
	}

	const handleSessionExit = (
		exitStatus: SessionExitStatus,
		tabId: string | undefined,
		nodeId: number | undefined
	) => {
		// console.log(`Session process exited with code ${exitCode}`);
		if (tabId && nodeId) {
			// const tree = trees.get(tabId)
			// if(tree) {
			// 	const result = tree.removeLeafNode(nodeId);
			// 	if (!result) {
			// 		closeTabById(tabId);
			// 	}
			// }
			// if($tabTrees[tabId]) {
			// 	const newTree = removeLeafNode($tabTrees[tabId].tree, nodeId);
			// 	// console.log(newTree);
			// 	if (newTree) {
			// 		$tabTrees[tabId].tree = newTree;
			// 	} else {
			// 		closeTabById(tabId);
			// 	}
			// }
			const stillExists = trees.removeLeafNode(tabId, nodeId);
			if(!stillExists) {
				removeTabHelper(tabId);
			}
		}
		if (!exitStatus.success) {
			addWarningToast('Session ended with non-zero exit code', `Exit code: ${exitStatus.exitCode}`);
		}
	};

	const addNewPane = async (
		tabId: string,
		nodeId: number,
		direction: Direction,
		referringSessionId?: number
	) => {
		// console.log(`adding new pane: ${direction}`);
		// let tree = $tabTrees[tabId].tree;
		// // let tree = trees.get(tabId)
		// if (tree) {
		// 	tree = await addNode(tree, nodeId, direction, referringSessionId);
		// 	$tabTrees = { ...$tabTrees, [tabId]: { tree } };
		// 	// tree.addNode(nodeId, direction, referringSessionId);
		// }
		trees.addNode(tabId, nodeId, direction, referringSessionId)
		// console.log($tabTrees);
	};

	const handleCommandDispatch = (command: string, tabId?: string, nodeId?: number) => {
		// console.log('received ' + command);
		let referringSessionId
		if(tabId) {
			// referringSessionId = $tabTrees[tabId].lastActiveSessionId;
			// referringSessionId = $trees[tabId].lastActiveSessionId;
			referringSessionId = tabActiveSessions.get($activeTab);
			// referringSessionId = trees.get(tabId)?.lastActiveSessionId
		}
		switch (command) {
			case WINDOW_COMMAND_NEW_TAB: {
				// console.log(referringSessionId);
				addNewTab(referringSessionId);
				break;
			}
			case WINDOW_COMMAND_SPLIT_RIGHT: {
				if (tabId !== undefined && nodeId !== undefined) {
					addNewPane(tabId, nodeId, 'horizontal', referringSessionId);
					// console.log($tabTrees)
				}
				break;
			}
			case WINDOW_COMMAND_SPLIT_DOWN: {
				if (tabId !== undefined && nodeId !== undefined) {
					addNewPane(tabId, nodeId, 'vertical', referringSessionId);
				}
				break;
			}
		}
	};

	onMount(() => {
		const unSubUsrCgf = userConfiguration.subscribe(async (config) => {
			if (config.loaded) {
				// let newTree = await createSingleNode({});
				// // let newTree = await initializeTree();
				// $tabTrees = { ...$tabTrees, '1': { tree: newTree } };
				// // await trees.createTree('1');
				await trees.createTree('1');
				console.log($trees)
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
			tree={$trees[screenTabId].tree}
			disspatchCommand={handleCommandDispatch}
			onExit={handleSessionExit}
		/>
	</TabManager>
{/if}

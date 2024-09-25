<script lang="ts">
	import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { onMount } from 'svelte';
	import type { Direction, SessionExitStatus } from '$lib/types';
	import { activeTab, userConfiguration, trees, tabActiveSessions } from '$lib/store';
	import { WINDOW_COMMAND_NEW_TAB, WINDOW_COMMAND_SPLIT_DOWN, WINDOW_COMMAND_SPLIT_RIGHT } from '$lib/constants';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import TabManager from '$components/TabManager/TabManager.svelte';
	import PaneManager from '$components/PaneManager/PaneManager.svelte';
	
	const appWindow = getCurrentWebviewWindow();

	let loaded = false;
	let tabs = [{ id: '1', title: 'Tab 1' }];

	const addNewTab = async (referringSessionId?: number) => {
		// console.log('adding new tab');
		const newTabId = '' + new Date().getTime();

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
		const referringSessionId = tabActiveSessions.get($activeTab);
		await addNewTab(referringSessionId);
	};

	const closeTab = (event: CustomEvent) => {
		const tabId = event.detail.tabId;
		closeTabById(tabId);
	};

	const closeTabById = (tabId: string) => {
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
		trees.addNode(tabId, nodeId, direction, referringSessionId)
	};

	const handleCommandDispatch = (command: string, tabId?: string, nodeId?: number) => {
		// console.log('received ' + command);
		let referringSessionId
		if(tabId) {
			referringSessionId = tabActiveSessions.get($activeTab);
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
			tree={$trees[screenTabId]}
			disspatchCommand={handleCommandDispatch}
			onExit={handleSessionExit}
		/>
	</TabManager>
{/if}

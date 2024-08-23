<script lang="ts">
	import TabManager from '$components/TabManager/TabManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import { addWarningToast } from '$lib/components/Toaster.svelte';
	import { appWindow } from '@tauri-apps/api/window';

	export let forceTabBar = false;

	let tabManager: TabManager;
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
		const activeTab = tabs[tabs.length - 1].id;
		tabManager.setTabs(tabs, activeTab);
	};

	const closeTab = (event: CustomEvent) => {
		const tabId = event.detail.tabId
		closeTabById(tabId);
	};

	const closeTabById = (tabId: string) => {
		console.log('closing tab ' + tabId);
		tabs = tabs.filter((tab) => {
			return tab.id !== tabId;
		});
		if(tabs.length > 0) {
			let activeTab = tabManager.getActiveTabId();
			if (activeTab === tabId) {
				activeTab = tabs[0].id;
			}
			tabManager.setTabs(tabs, activeTab);
		}
		else {
			appWindow.close();
		}
	}

	const handleSessionExit = (exitCode: number, tabId: string|undefined) => {
		console.log(`Session process exited with code ${exitCode}`);
		if(tabId) {
			closeTabById(tabId);
		}
		if(exitCode !== 0) {
			addWarningToast('Session ended with non-zero exit code', `Exit code: ${exitCode}`);
		}
	}

	const handleCommandDispatch = (command: string) => {
		console.log('received ' + command);
		switch (command) {
			case 'window:new_tab': {
				addNewTab();
				break;
			}
		}
	};
</script>

<TabManager bind:this={tabManager} {forceTabBar} on:newtab={addNewTab} on:closetab={closeTab} let:tabId={screenTabId}>
	<TerminalScreen
		tabId={screenTabId}
		screenManagementDispatch={handleCommandDispatch}
		onSessionExit={handleSessionExit}
	/>
</TabManager>
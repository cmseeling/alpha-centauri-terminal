<script lang="ts">
	import ScreenManager from '$components/ScreenManager/ScreenManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import { userConfiguration } from '$lib/store/configurationStore';
	import { onMount } from 'svelte';

	let screenManager: ScreenManager;
	let handleDispatch: (screenCommand: string) => void;
	let forceTabBar: boolean = false;

	onMount(() => {
		handleDispatch = (screenCommand) => {
			screenManager.handleCommandDispatch(screenCommand);
		};

		userConfiguration.subscribe((value) => {
			if(value.loaded) {
				forceTabBar = value.window.forceTabBar;
			}
		});
	});
</script>

<div class="h-screen">
	<ScreenManager bind:this={screenManager} forceTabBar={forceTabBar}>
		<TerminalScreen screenManagementDispatch={handleDispatch} onShellExit={(exitCode) => {console.log(`Session process exited with code ${exitCode}`);}} />
	</ScreenManager>
</div>

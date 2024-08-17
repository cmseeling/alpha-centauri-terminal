<script lang="ts">
	import ScreenManager from '$components/ScreenManager/ScreenManager.svelte';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import { onMount } from 'svelte';

	let screenManager: ScreenManager;
	let handleDispatch: (screenCommand: string) => void;

	onMount(() => {
		handleDispatch = (screenCommand) => {
			screenManager.handleCommandDispatch(screenCommand);
		};
	});
</script>

<div class="h-screen">
	<ScreenManager bind:this={screenManager}>
		<TerminalScreen screenManagementDispatch={handleDispatch} />
	</ScreenManager>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { userConfiguration } from '$lib/store/configurationStore';
	import ScreenManager from '$components/ScreenManager/ScreenManager.svelte';

	let forceTabBar: boolean = false;

	onMount(() => {
		userConfiguration.subscribe((value) => {
			if (value.loaded) {
				forceTabBar = value.window.forceTabBar;
			}
		});
	});
</script>

<div class="h-screen">
	<ScreenManager {forceTabBar} />
</div>

<script lang="ts" context="module">
	import { invoke } from '@tauri-apps/api';
	import { isWebGL2Enabled, userConfiguration } from '$lib/store/configurationStore';

	const gl = document.createElement('canvas').getContext('webgl2');
	if (!gl) {
		if (typeof WebGL2RenderingContext !== 'undefined') {
			console.log(
				'your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers'
			);
		}
	} else {
		isWebGL2Enabled.set(true);
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { TAURI_COMMAND_GET_USER_CONFIG } from '$lib/constants';

	onMount(async () => {
		try {
			const configJson = await invoke<string>(TAURI_COMMAND_GET_USER_CONFIG);
			console.log(configJson);
			userConfiguration.set({ ...JSON.parse(configJson), loaded: true });
		} catch (e) {
			console.log(e);
		}
	});
</script>

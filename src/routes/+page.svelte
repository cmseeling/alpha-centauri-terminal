<script lang="ts">
  import { userConfiguration } from '$lib/store';
  import ScreenManager from '$components/ScreenManager/ScreenManager.svelte';
</script>

{#if $userConfiguration.loaded}
<div class="h-screen alpha-centauri" style="--config-font:{$userConfiguration.shell.fonts}">
  <ScreenManager />
</div>
{/if}

<style>
  .alpha-centauri {
    font-family: var(--config-font);
  }
</style>
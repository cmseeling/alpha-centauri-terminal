<script lang="ts">
  import { appWindow, PhysicalSize } from '@tauri-apps/api/window';
  import ScreenManager from "../components/ScreenManager.svelte";

  appWindow.setMinSize(new PhysicalSize(300, 200));
</script>

<div class="h-screen">
  <ScreenManager/>
</div>

<script lang="ts">
  import { appWindow, PhysicalSize } from '@tauri-apps/api/window';

  import NotificationBar from "../components/NotificationBar.svelte";
  import ScreenManager from "../components/ScreenManager.svelte";

  appWindow.setMinSize(new PhysicalSize(300, 200));
</script>

<div class="app-container">
  <NotificationBar/>
  <ScreenManager/>
</div>

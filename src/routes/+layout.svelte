<script>
  import "../app.css";
  import Toaster from '$lib/Toaster.svelte'
  import NotificationListener from "$lib/NotificationListener.svelte";
  import { onDestroy } from "svelte";
  import { appConfiguration } from '$lib/configurationStore';

  const unsub = appConfiguration.subscribe((value) => { console.log(value) });

  onDestroy(() => {
    unsub();
  });
</script>
 
<Toaster />
<NotificationListener/>
<slot />
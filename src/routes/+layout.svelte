<script>
  import "../app.css";
  import Toaster from '$lib/Toaster.svelte'
  import NotificationListener from "$lib/NotificationListener.svelte";
  import { onMount } from "svelte";
  import { isWebGL2Enabled } from '$lib/webGL2Store';

  onMount(() => {
    const unsub = isWebGL2Enabled.subscribe((value) => {})

    return () => {
      unsub();
    }
  })
</script>
 
<Toaster />
<NotificationListener/>
<slot />
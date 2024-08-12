<script>
  import "../app.css";
  import Toaster from '$lib/Toaster.svelte'
  import NotificationListener from "$lib/NotificationListener.svelte";
  import { onMount } from "svelte";
  import { appConfiguration } from '$lib/configurationStore';

  onMount(() => {
    const unsub = appConfiguration.subscribe((value) => { console.log(value) })

    return () => {
      unsub();
    }
  })
</script>
 
<Toaster />
<NotificationListener/>
<slot />
<script>
  import "../app.css";
  import Toaster from '$lib/Toaster.svelte'
  import NotificationListener from "$lib/NotificationListener.svelte";
  import ConfigLoader from "$lib/ConfigLoader.svelte";

</script>
 
<ConfigLoader/>
<Toaster />
<NotificationListener/>
<slot />
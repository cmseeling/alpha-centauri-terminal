<script>
  import "../app.css";
  import Toaster from '$lib/components/Toaster.svelte'
  import NotificationListener from "$lib/NotificationListener.svelte";
  import ConfigLoader from "$lib/store/ConfigLoader.svelte";

</script>
 
<ConfigLoader/>
<Toaster />
<NotificationListener/>
<slot />
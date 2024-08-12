<script>
  import "../app.css";
  import Toaster from '$lib/Toaster.svelte'
    import NotificationListener from "$lib/NotificationListener.svelte";
</script>
 
<Toaster />
<NotificationListener/>
<slot />
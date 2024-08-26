<script lang="ts">
	import { PaneGroup, Pane } from "paneforge";

  type Direction = 'horizontal' | 'vertical';

  let direction: Direction = 'vertical';

</script>

<PaneGroup {direction} class="h-full" data-testid="pane-manager">
  <Pane defaultSize={100}>
    <slot/>
  </Pane>
  <Pane defaultSize={0} class="text-white">
    hello world
  </Pane>
</PaneGroup>
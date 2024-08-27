<script lang="ts">
	import type { Direction, TreeNode, PaneData } from "$lib/types";
	import { PaneGroup, Pane } from "paneforge";

  export let tree: TreeNode<PaneData>;

  // hack for now since if direction should never be undefined at this point.
  // TODO: handle the error if it really is undefined
  const forceDirectionType = (direction?: Direction): Direction => {
    return direction as Direction
  }

  console.log(tree)
</script>

{#if tree.childNodes.length === 0}
<slot session={tree.data.session} nodeId={tree.data.nodeId} />
{:else}
<PaneGroup direction={forceDirectionType(tree.data.direction)} class="h-full">
  {#each tree.childNodes as node (node.data.nodeId)}
  <Pane defaultSize={1/tree.childNodes.length}>
    <svelte:self tree={node}/>
  </Pane>
  {/each}
</PaneGroup>
{/if}

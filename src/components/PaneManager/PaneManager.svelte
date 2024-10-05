<script lang="ts">
  import { PaneGroup, Pane } from 'paneforge';
  import type { Direction, TreeNode, PaneData, SessionExitStatus } from '$lib/types';
  import Divider from '$components/PaneManager/Divider.svelte';
  import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';

  export let tabId: string;

  export let tree: TreeNode<PaneData>;
  // console.log(tree);
  export let disspatchCommand: (
    screenCommand: string,
    callerTabId?: string,
    callerNodeId?: number
  ) => void;
  export let onExit: (
    exitStatus: SessionExitStatus,
    tabId: string | undefined,
    nodeId: number | undefined
  ) => void;

  // hack for now since if direction should never be undefined at this point.
  // TODO: handle the error if it really is undefined
  const forceDirectionType = (direction?: Direction): Direction => {
    if (direction) {
      return direction as Direction;
    } else {
      return 'horizontal';
    }
  };

  const getDefaultSize = () => {
    const fraction = 1 / tree.childNodes.length;
    return fraction * 100;
  };
</script>

{#if tree.childNodes.length === 0}
  <TerminalScreen
    {tabId}
    nodeId={tree.data.nodeId}
    sessionId={tree.data.sessionId}
    screenManagementDispatch={disspatchCommand}
    onSessionExit={onExit}
  />
{:else}
  <PaneGroup
    direction={forceDirectionType(tree.data.direction)}
    class="h-full"
    data-testid="pane-group"
  >
    {#each tree.childNodes as node, i (node.data.nodeId)}
      <Pane defaultSize={getDefaultSize()} data-testid={`pane-${node.data.nodeId}`}>
        <svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
      </Pane>
      {#if i < tree.childNodes.length - 1}
        <Divider direction={forceDirectionType(tree.data.direction)} />
      {/if}
    {/each}
  </PaneGroup>
{/if}

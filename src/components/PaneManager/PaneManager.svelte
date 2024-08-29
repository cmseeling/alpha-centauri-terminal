<script lang="ts">
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import { paneTrees } from '$lib/store/panes';
	// import { width } from "$lib/store/windowManagementStore";
	// import { height, width } from "$lib/store/windowManagementStore";
	import type { Direction, TreeNode, PaneData } from '$lib/types';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import { onMount } from 'svelte';

	export let tabId: string;

	// let loaded = false;
	export let tree: TreeNode<PaneData>;
	export let disspatchCommand: (
		screenCommand: string,
		callerTabId?: string,
		callerNodeId?: number
	) => void;
	export let onExit: (
		exitCode: number,
		tabId: string | undefined,
		nodeId: number | undefined
	) => void;

	console.log(tree);

	// hack for now since if direction should never be undefined at this point.
	// TODO: handle the error if it really is undefined
	const forceDirectionType = (direction?: Direction): Direction => {
		return direction as Direction;
	};

	// onMount(() => {
	//   const unSubPaneTrees = paneTrees.subscribe((treeMap) => {
	//     console.log(treeMap);
	//     console.log('pane tree store updated');
	//     tree = treeMap[tabId];
	//     console.log(tree);
	//     let counter = 0;
	//     const interval = setInterval(() => {
	//       console.log(tabId);
	//       if(tabId || counter > 500) {
	//         clearInterval(interval)
	//       }
	//       counter++;
	//     }, 500)
	//   });

	//   loaded = true;

	//   return () => {
	//     unSubPaneTrees();
	//   }
	// });
	$: height = tree.data.height;
	$: width = tree.data.width;
</script>

{#if tree.childNodes.length === 0}
	<div
		data-testid="terminal-container"
		class="h-full"
		bind:clientHeight={$height}
		bind:clientWidth={$width}
	>
		<TerminalScreen
			{tabId}
			nodeId={tree.data.nodeId}
			session={tree.data.session}
			height={tree.data.height}
			width={tree.data.width}
			area={tree.data.area}
			screenManagementDispatch={disspatchCommand}
			onSessionExit={onExit}
		/>
	</div>
{:else}
	<PaneGroup
		direction={forceDirectionType(tree.data.direction)}
		class="h-full"
		data-testid="pane-group"
	>
		{#each tree.childNodes as node (node.data.nodeId)}
			<Pane defaultSize={1 / tree.childNodes.length} data-testid={`pane-${node.data.nodeId}`}>
				<svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
			</Pane>
		{/each}
	</PaneGroup>
{/if}

<!-- <PaneGroup class="h-full" direction={'horizontal'}>
  <Pane defaultSize={1/2}>
    <PaneGroup class="h-full" direction={'vertical'}>
      <Pane defaultSize={1/2}>
        <div class="h-full w-full bg-slate-200">pane 1</div>
      </Pane>
      <PaneResizer class="relative flex h-2 items-center justify-center bg-background">
			<div class="z-10 flex h-5 w-7 items-center justify-center rounded-sm border bg-brand">
				x
			</div>
		</PaneResizer>
      <Pane defaultSize={1/2}>
        <div class="h-full w-full bg-lime-400">pane 3</div>
      </Pane>
    </PaneGroup>
  </Pane>
  <PaneResizer class="relative flex w-2 items-center justify-center bg-background">
		<div class="z-10 flex h-7 w-5 items-center justify-center rounded-sm border bg-brand">
			x
		</div>
	</PaneResizer>
  <Pane defaultSize={1/2}>
    <div class="h-full w-full bg-orange-300">pane 2</div>
  </Pane>
</PaneGroup> -->

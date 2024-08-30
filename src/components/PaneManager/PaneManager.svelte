<script lang="ts">
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import type { Direction, TreeNode, PaneData, SessionExitStatus } from '$lib/types';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';

	export let tabId: string;

	export let tree: TreeNode<PaneData>;
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
		return direction as Direction;
	};

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

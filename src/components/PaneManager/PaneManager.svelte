<script lang="ts">
	import { PaneGroup, Pane } from 'paneforge';
	import type { Direction, TreeNode, PaneData, SessionExitStatus, TabTree } from '$lib/types';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import Divider from './Divider.svelte';
	import { trees } from '$lib/store/trees';
	import { onMount } from 'svelte';

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

	// $: treeRoot = trees.get(tabId)!.root;

	// onMount(() => {
	// 	tree = trees.get(tabId)!;
	// 	console.log(tree);
	// })

	// hack for now since if direction should never be undefined at this point.
	// TODO: handle the error if it really is undefined
	const forceDirectionType = (direction?: Direction): Direction => {
		if(direction) {
			return direction as Direction;
		}
		else {
			return 'horizontal';
		}
	};

	const getDefaultSize = () => {
		const fraction = 1 / tree.childNodes.length;
		// const fraction = 1 / ($treeRoot.childNodes.length ?? 1);
		// console.log(fraction);
		return fraction * 100;
	}

	// $: height = tree.data.height;
	// $: width = tree.data.width;
	// $: heightStores = tree.childNodes.map((node) => node.data.height);
	// $: widthStores = tree.childNodes.map((node) => node.data.width);
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
		{#each tree.childNodes as node, i (node.data.sessionId)}
			<Pane defaultSize={getDefaultSize()} data-testid={`pane-${node.data.nodeId}`}>
				<svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
			</Pane>
			{#if i < tree.childNodes.length - 1}
			<Divider direction={forceDirectionType(tree.data.direction)}/>
			{/if}
		{/each}
	</PaneGroup>
{/if}

<!-- <PaneGroup direction={forceDirectionType(tree.data.direction)} class="h-full" data-testid="pane-group">
	{#if tree.childNodes.length > 0}
		{#each tree.childNodes as node, i (node.data.nodeId)}
			<Pane defaultSize={getDefaultSize()} data-testid={`pane-${node.data.nodeId}`}>
				<svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
			</Pane>
			{#if i < tree.childNodes.length - 1}
			<Divider direction={forceDirectionType(tree.data.direction)}/>
			{/if}
		{/each}
	{:else}
			<Pane>
				<div
					data-testid="terminal-container"
					class="h-full"
					bind:clientHeight={$height}
					bind:clientWidth={$width}
				>
					<TerminalScreen
						{tabId}
						nodeId={tree.data.nodeId}
						sessionId={tree.data.sessionId}
						height={tree.data.height}
						width={tree.data.width}
						area={tree.data.area}
						screenManagementDispatch={disspatchCommand}
						onSessionExit={onExit}
					/>
				</div>
			</Pane>
	{/if}
</PaneGroup> -->

<!-- <PaneGroup direction={forceDirectionType($treeRoot.data.direction)} class="h-full" data-testid="pane-group">
	{#each $treeRoot.childNodes as node, i (node.data.nodeId)}
		<Pane defaultSize={getDefaultSize()} class="h-full" data-testid={`pane-${node.data.nodeId}`}>
			{#if node.data.sessionId !== undefined}
				<TerminalScreen
					{tabId}
					nodeId={node.data.nodeId}
					sessionId={node.data.sessionId}
					screenManagementDispatch={disspatchCommand}
					onSessionExit={onExit}
				/>
			{:else}
			<svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
			{/if}
		</Pane>
		{#if i < $treeRoot.childNodes.length - 1}
		<Divider direction={forceDirectionType($treeRoot.data.direction)}/>
		{/if}
	{/each}
</PaneGroup> -->

<script lang="ts">
	import { PaneGroup, Pane } from 'paneforge';
	import type { Direction, TreeNode, PaneData, SessionExitStatus } from '$lib/types';
	import TerminalScreen from '$components/TerminalScreen/TerminalScreen.svelte';
	import Divider from './Divider.svelte';

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
		if(direction) {
			return direction as Direction;
		}
		else {
			return 'horizontal';
		}
	};

	const getDefaultSize = () => {
		const fraction = 1 / tree.childNodes.length;
		// console.log(fraction);
		return fraction * 100;
	}

	// $: height = tree.data.height;
	// $: width = tree.data.width;
	$: heightStores = tree.childNodes.map((node) => node.data.height);
	$: widthStores = tree.childNodes.map((node) => node.data.width);
	let screenRefs = [];
</script>

<!-- {#if tree.childNodes.length === 0}
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
{/if} -->

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

<PaneGroup direction={forceDirectionType(tree.data.direction)} class="h-full" data-testid="pane-group">
	{#each tree.childNodes as node, i (node.data.nodeId)}
		<Pane defaultSize={getDefaultSize()} class="h-full" data-testid={`pane-${node.data.nodeId}`}>
			{#if node.data.sessionId !== undefined}
				<div
					data-testid="terminal-container"
					class="h-full"
					bind:this={screenRefs[i]}
				>
					<TerminalScreen
						{tabId}
						nodeId={node.data.nodeId}
						sessionId={node.data.sessionId}
						height={node.data.height}
						width={node.data.width}
						area={node.data.area}
						screenManagementDispatch={disspatchCommand}
						onSessionExit={onExit}
					/>
				</div>
			{:else}
			<svelte:self {tabId} tree={node} {disspatchCommand} {onExit} />
			{/if}
		</Pane>
		{#if i < tree.childNodes.length - 1}
		<Divider direction={forceDirectionType(tree.data.direction)}/>
		{/if}
	{/each}
</PaneGroup>

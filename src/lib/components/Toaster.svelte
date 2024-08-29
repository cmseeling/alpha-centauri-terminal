<script lang="ts" context="module">
	export type ToastBackgroundColor =
		| 'bg-neutral-800'
		| 'bg-red-700'
		| 'bg-yellow-500'
		| 'bg-sky-600';
	export type ToastTextColor = 'text-white' | 'text-black';
	export type ToastData = {
		title: string;
		description?: string | HTMLElement;
		bgColor: ToastBackgroundColor;
		textColor: ToastTextColor;
		collapseDetails?: boolean;
	};

	const {
		elements: { content: toastContent, title, description, close },
		helpers,
		states: { toasts },
		actions: { portal }
	} = createToaster<ToastData>({
		closeDelay: 0
	});

	export const addToast = helpers.addToast;

	export const addInfoToast = (message: string, details: string) => {
		addToast({
			data: {
				title: message,
				description: details,
				bgColor: 'bg-sky-600',
				textColor: 'text-white',
				collapseDetails: true
			}
		});
	};

	export const addWarningToast = (message: string, details: string) => {
		addToast({
			data: {
				title: message,
				description: details,
				bgColor: 'bg-yellow-500',
				textColor: 'text-black',
				collapseDetails: true
			}
		});
	};

	export const addErrorToast = (message: string, details: string) => {
		addToast({
			data: {
				title: message,
				description: details,
				bgColor: 'bg-red-700',
				textColor: 'text-white',
				collapseDetails: true
			}
		});
	};
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { createToaster, melt } from '@melt-ui/svelte';
	import CloseCircleOutline from 'virtual:icons/mdi/close-circle-outline';
	import CollapsibleDetails from './CollapsibleDetails.svelte';
</script>

<div use:portal class="fixed right-0 top-0 z-50 m-4 flex flex-col items-end gap-2">
	{#each $toasts as { id, data } (id)}
		<div
			use:melt={$toastContent(id)}
			in:fly={{ duration: 150, x: '100%' }}
			out:fly={{ duration: 150, x: '100%' }}
			class="rounded-lg {data.bgColor} {data.textColor} shadow-md"
		>
			<div
				class="relative flex w-[30rem] max-w-[calc(100vw-2rem)] items-center justify-between gap-4 p-5"
			>
				<div class="w-full">
					<h3 use:melt={$title(id)} class="flex items-center gap-2 font-semibold">
						{data.title}
					</h3>
					{#if data.description}
						<div use:melt={$description(id)} class="w-full">
							{#if data.collapseDetails}
								<CollapsibleDetails>
									{@html data.description}
								</CollapsibleDetails>
							{:else}
								{@html data.description}
							{/if}
						</div>
					{/if}
				</div>
				<button
					use:melt={$close(id)}
					aria-label="close notification"
					class="text-magnum-500 hover:bg-magnum-900/50 absolute right-4 top-4 grid size-6 place-items-center rounded-full"
				>
					<CloseCircleOutline />
				</button>
			</div>
		</div>
	{/each}
</div>

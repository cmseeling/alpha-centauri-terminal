<script lang="ts">
	import { listen } from '@tauri-apps/api/event';
	import { invoke } from '@tauri-apps/api';
	import { onMount } from 'svelte';
	import { addToast } from '$lib/components/Toaster.svelte';
	import { TAURI_COMMAND_GET_STARTUP_NOTIFICATIONS } from './constants';

	interface NotificationEvent {
		level: number;
		message: string;
		details: string;
	}

	onMount(() => {
		let unlisten: () => void;
		listen<NotificationEvent>('notification-event', ({ payload: { level, message, details } }) => {
			console.log('got event');
			switch (level) {
				case 1: {
					addToast({
						data: {
							title: message,
							description: details,
							bgColor: 'bg-sky-600',
							textColor: 'text-white',
							collapseDetails: true
						}
					});
					break;
				}
				case 2: {
					addToast({
						data: {
							title: message,
							description: details,
							bgColor: 'bg-yellow-500',
							textColor: 'text-black',
							collapseDetails: true
						}
					});
					break;
				}
				case 3: {
					addToast({
						data: {
							title: message,
							description: details,
							bgColor: 'bg-red-700',
							textColor: 'text-white',
							collapseDetails: true
						}
					});
					break;
				}
				default: {
					addToast({
						data: {
							title: message,
							description: details,
							bgColor: 'bg-red-700',
							textColor: 'text-white',
							collapseDetails: true
						}
					});
					break;
				}
			}
		}).then((unlistenFn) => {
			unlisten = unlistenFn;
			invoke(TAURI_COMMAND_GET_STARTUP_NOTIFICATIONS);
		});

		return () => {
			if (unlisten) {
				unlisten();
			}
		};
	});
</script>

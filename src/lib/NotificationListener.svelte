<script lang="ts">
	import { listen } from '@tauri-apps/api/event';
	import { invoke } from '@tauri-apps/api';
	import { onMount } from 'svelte';
	import {
		addErrorToast,
		addInfoToast,
		addToast,
		addWarningToast
	} from '$lib/components/Toaster.svelte';
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
					addInfoToast(message, details);
					break;
				}
				case 2: {
					addWarningToast(message, details);
					break;
				}
				case 3: {
					addErrorToast(message, details);
					break;
				}
				default: {
					addErrorToast(message, details);
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

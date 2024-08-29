import { writable } from 'svelte/store';
import type { TabTreeMap } from '$lib/types';

export const paneTrees = writable({} as TabTreeMap);

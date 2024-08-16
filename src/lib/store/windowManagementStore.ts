import { writable, derived } from 'svelte/store';

export const height = writable(0);
export const width = writable(0);

export const area = derived([height, width], ([$height, $width]) => $height * $width);

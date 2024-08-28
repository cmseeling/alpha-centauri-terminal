import type { TabTreeMap } from "$lib/types";
import { writable } from "svelte/store";

export const paneTrees = writable({} as TabTreeMap);
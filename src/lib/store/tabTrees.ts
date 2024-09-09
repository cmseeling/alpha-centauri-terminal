import type { TabTreeMap } from "$lib/types";
import { writable } from "svelte/store";

export const tabTrees = writable({} as TabTreeMap);
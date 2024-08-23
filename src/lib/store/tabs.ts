import { createTabs } from '@melt-ui/svelte';

export const {
	elements: { root, list, content, trigger },
	states: { value: activeTab }
} = createTabs({ defaultValue: '1' });

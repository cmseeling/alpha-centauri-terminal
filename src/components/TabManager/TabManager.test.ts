import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { tabs } from '$lib/store';

import TabManager from './TabManager.svelte';
import { createTooltip } from '@melt-ui/svelte';

const mockPaneData = {
	nodeId: 1
};

const mockTabInfo1 = {
	id: '1',
	name: 'Tab 1',
	sessionTree: {
		data: mockPaneData,
		childNodes: []
	},
	toolTip: createTooltip({
    positioning: {
      placement: 'bottom',
    },
    openDelay: 1000,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  })
};

const mockTabInfo2 = {
	id: '2',
	name: 'Tab 2',
	sessionTree: {
		data: mockPaneData,
		childNodes: []
	},
	toolTip: createTooltip({
    positioning: {
      placement: 'bottom',
    },
    openDelay: 1000,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  })
};

test('render the tab bar', async () => {
	tabs.set([mockTabInfo1]);
	render(TabManager);
	const button = screen.getByTestId('add-new-tab');

	expect(button).toBeInTheDocument();
});

test('new tab button dispatches event', async () => {
	tabs.set([mockTabInfo1]);
	const user = userEvent.setup();
	const { component } = render(TabManager);
	const mock = vi.fn(() => {});
	component.$on('newtab', mock);

	const button = screen.getByTestId('add-new-tab');
	expect(button).toBeInTheDocument();
	await user.click(button);

	expect(mock).toHaveBeenCalledOnce();
});

test('close button dispatches event', async () => {
	tabs.set([mockTabInfo1, mockTabInfo2]);
	const user = userEvent.setup();
	const { component } = render(TabManager);

	let eventTabId = '';
	const mock = vi.fn((event) => {
		eventTabId = event.detail.tabId;
	});
	component.$on('closetab', mock);

	const closeTabButton = screen.getByTestId('close-tab-1');
	expect(closeTabButton).toBeInTheDocument();
	await user.click(closeTabButton);

	expect(mock).toHaveBeenCalledOnce();
	expect(eventTabId).toBe('1');
});

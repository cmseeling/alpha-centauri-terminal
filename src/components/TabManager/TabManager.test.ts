import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import TabManager from './TabManager.svelte';

test('render the tab bar', async () => {
	// const tabs = [{ id: '1', title: 'Tab 1' }];
	render(TabManager);
	const button = screen.getByTestId('add-new-tab');

	expect(button).toBeInTheDocument();
});

test('new tab button dispatches event', async () => {
	// const tabs = [{ id: '1', title: 'Tab 1' }];
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
	// const tabs = [
	// 	{ id: '1', title: 'Tab 1' },
	// 	{ id: '2', title: 'Tab 2' }
	// ];
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

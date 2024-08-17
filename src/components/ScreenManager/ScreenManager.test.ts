import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import ScreenManager from './ScreenManager.svelte';

test('render the tab bar', async () => {
	render(ScreenManager, { forceTabBar: true });
	const button = screen.getByTestId('add-new-tab');

	expect(button).toBeInTheDocument();
});

test('do not render the tab bar', async () => {
	render(ScreenManager, { forceTabBar: false });
	const button = screen.queryByTestId('add-new-tab');

	expect(button).not.toBeInTheDocument();
});

test('button click adds new tab', async () => {
	const user = userEvent.setup();
	render(ScreenManager, { forceTabBar: true });

	const originalTab = screen.getByText('Tab 1');
	const button = screen.getByTestId('add-new-tab');

	expect(originalTab).toBeInTheDocument();
	expect(button).toBeInTheDocument();

	await user.click(button);
	const newTab = screen.getByText('New Tab');

	expect(newTab).toBeInTheDocument();
});

test('dispatch handler adds new tab', async () => {
	const { component } = render(ScreenManager, { forceTabBar: true });

	const originalTab = screen.getByText('Tab 1');
	const button = screen.getByTestId('add-new-tab');

	expect(originalTab).toBeInTheDocument();
	expect(button).toBeInTheDocument();

	component.handleCommandDispatch('window:new_tab');
	const newTab = await screen.findByText('New Tab');

	expect(newTab).toBeInTheDocument();
});

test('close button click closes tab', async () => {
	const user = userEvent.setup();
	render(ScreenManager, { forceTabBar: true });

	let originalTab = screen.queryByText('Tab 1');
	const closeTabButton = screen.getByTestId('close-tab-1');
	const button = screen.getByTestId('add-new-tab');

	expect(originalTab).not.toBeNull();
	expect(button).toBeInTheDocument();

	await user.click(button);
	let newTab = screen.queryByText('New Tab');

	expect(newTab).toBeInTheDocument();

	await user.click(closeTabButton);
	originalTab = screen.queryByText('Tab 1');
	newTab = screen.queryByText('New Tab');

	expect(originalTab).toBeNull();
	expect(newTab).toBeInTheDocument();
});

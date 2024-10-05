import { chromium, test, expect } from '@playwright/test';
import getLogger from './utils/logger';

const logger = getLogger('e2e.log', 'e2e.error.log');

test('terminal loads', async () => {
	logger.info('test starting');
	const browser = await chromium.connectOverCDP('http://localhost:9222');

	console.log(browser.isConnected() && 'Connected to Chrome.');
	console.log(`Contexts in CDP session: ${browser.contexts().length}.`);

	const context = browser.contexts()[0];
	logger.info(`found ${await context.pages().length} pages in browser`);
	const page = await context.pages()[0];

	// app starts up
	logger.info('testing app start');
	const newTabButton = await page.getByTestId('add-new-tab');
	await expect(newTabButton).toBeVisible();
	await page.screenshot({ path: 'test-results/__snapshots/1_startup.png' });

	// new tab button works
	logger.info('testing new tab button');
	await newTabButton.click();
	let newTab = await page.getByTestId('tab-index-1');
	await expect(newTab).toHaveCount(1);
	await page.screenshot({ path: 'test-results/__snapshots/2_new_tab_by_button.png' });

	// new tab key combo works
	logger.info('testing new tab key shortcut');
	await page.keyboard.press('Control+Shift+T');
	newTab = await page.getByTestId('tab-index-1');
	await expect(newTab).toHaveCount(1);
	await page.screenshot({ path: 'test-results/__snapshots/3_new_tab_by_key_shortcut.png' });

	// close tab button works
	logger.info('testing close tab button');
	await page.getByTestId(`close-tab-1`).click();
	const tabs = await page.getByText('~');
	await expect(tabs).toHaveCount(1);
	await page.screenshot({ path: 'test-results/__snapshots/4_close_tab.png' });

	// split right key combo works
	logger.info('testing split right');
	await page.keyboard.press('Control+Shift+D');
	const horizontalSplitter = await page.getByTestId('horizontal-splitter');
	await expect(horizontalSplitter).toHaveCount(1);
	await page.screenshot({ path: 'test-results/__snapshots/5_split_right.png' });

	// split down key combo works
	logger.info('testing split right');
	await page.keyboard.press('Control+Shift+E');
	const verticalSplitter = await page.getByTestId('vertical-splitter');
	await expect(verticalSplitter).toHaveCount(1);
	await page.screenshot({ path: 'test-results/__snapshots/5_split_down.png' });
});

import { chromium, test, expect } from '@playwright/test';

test('terminal loads', async () => {
	try {
		const browser = await chromium.connectOverCDP('http://localhost:9222');

		console.log(browser.isConnected() && 'Connected to Chrome.');
		console.log(`Contexts in CDP session: ${browser.contexts().length}.`);

		const context = browser.contexts()[0];
    const page = await context.pages()[0];

		// const page = await context.newPage();
		// await page.goto('http://localhost:1420');
    await page.getByTestId('add-new-tab').click();
		await page.screenshot({ path: 'test-results/__snapshots/startup.png' });

		await page.close();
		await context.close();
		await browser.close();
	} catch (error) {
		console.log('Cannot connect to Chrome.');
	}
});

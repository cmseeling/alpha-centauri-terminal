import { beforeAll, describe, expect, test, vi } from 'vitest';
import { tabs, sessions, userConfiguration } from '$lib/store';
import { afterEach } from 'node:test';
import type { ShellSession } from '$lib/types';
import { get } from 'svelte/store';

const createSessionSpy = vi.spyOn(sessions, 'createSession');

describe('tab store', () => {
	beforeAll(() => {
		userConfiguration.set({
			window: { forceTabBar: false },
			shell: { program: 'bash', args: [], env: {}, bell: true },
			keymaps: [],
			loaded: true
		});

		createSessionSpy.mockResolvedValue({
			pid: 1
		} as ShellSession);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('create tab adds a new session', async () => {
		tabs.closeAll();
		await tabs.createTab({});
		expect(createSessionSpy).toHaveBeenCalledOnce();
	});

	test('add node creates a new parent', async () => {
		tabs.closeAll();
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];
		await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');

		// expected tree structure:
		// root
		//   |-left pane
		//   --right pane
		expect(createSessionSpy).toHaveBeenCalledTimes(3);
		expect(get(tabs)[0].sessionTree.childNodes.length).toBe(2);
	});

	test('add node adds a sibling', async () => {
		tabs.closeAll();
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];
		await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');
		await tabs.addNode(id, sessionTree.childNodes[1].data.nodeId, 'horizontal');

		// expected tree structure:
		// root
		//   |-first pane
		//   |-middle pane
		//   --last pane
		expect(get(tabs)[0].sessionTree.childNodes.length).toBe(3);
	});

	test('closeTab terminates all sessions', async () => {
		tabs.closeAll();
		const removeSpy = vi.spyOn(sessions, 'remove');
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];
		await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');
		await tabs.addNode(id, sessionTree.childNodes[1].data.nodeId, 'horizontal');
		tabs.closeTab(get(tabs)[0].id);

		expect(removeSpy).toHaveBeenCalledTimes(3);
	});

	test('removeLeafNode removes a single node', async () => {
		tabs.closeAll();
		const removeSpy = vi.spyOn(sessions, 'remove');
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];
		await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');
		await tabs.addNode(id, sessionTree.childNodes[1].data.nodeId, 'horizontal');
		expect(sessionTree.childNodes.length).toBe(3);
		tabs.removeLeafNode(id, sessionTree.childNodes[1].data.nodeId);

		expect(removeSpy).toHaveBeenCalledOnce();
		expect(sessionTree.childNodes.length).toBe(2);
	});

	test('removeLeafNode converts middle node to a leaf', async () => {
		tabs.closeAll();
		const removeSpy = vi.spyOn(sessions, 'remove');
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];
		await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');
		await tabs.addNode(id, sessionTree.childNodes[0].data.nodeId, 'vertical');
		// expected tree structure at this point:
		// root
		//   |-mid-level node
		//   |	|--top pane
		// 	 |	---bottom pane
		//   --last pane

		const topPaneId = sessionTree.childNodes[0].childNodes[0].data.nodeId;
		tabs.removeLeafNode(id, topPaneId);

		expect(removeSpy).toHaveBeenCalledOnce();
		expect(sessionTree.childNodes.length).toBe(2);
		expect(sessionTree.childNodes[0].childNodes.length).toBe(0);
	});

	test('removeLeafeNode removes a tab when last node is deleted', async () => {
		tabs.closeAll();
		const removeSpy = vi.spyOn(sessions, 'remove');
		await tabs.createTab({});
		const { id, sessionTree } = get(tabs)[0];

		const returnValue = tabs.removeLeafNode(id, sessionTree.data.nodeId);

		expect(removeSpy).toHaveBeenCalledOnce();
		expect(returnValue).toBeFalsy();
		expect(get(tabs).length).toBe(0);
	});
});

import { beforeAll, expect, test, vi } from 'vitest';
import { tabs, sessions, userConfiguration } from '$lib/store'
import { afterEach } from 'node:test';
import type { ShellSession } from '$lib/types';
import { get } from 'svelte/store';

const createSessionSpy = vi.spyOn(sessions, 'createSession');

beforeAll(() => {
  userConfiguration.set(
    {
      window: { forceTabBar: false },
      shell: { program: 'bash', args: [], env: {}, bell: true },
      keymaps: [],
      loaded: true
    }
  );

  createSessionSpy.mockResolvedValue({
    pid: 1
  } as ShellSession)
});

afterEach(() => {
  vi.restoreAllMocks();
  tabs.set([]);
});

test('create tab adds a new session', async () => {
  tabs.createTab({});
  expect(createSessionSpy).toHaveBeenCalledOnce();
});

test('add node creates a new parent', async () => {
  tabs.createTab({});
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
  tabs.createTab({});
  const { id, sessionTree } = get(tabs)[1];
  await tabs.addNode(id, sessionTree.data.nodeId, 'horizontal');
  await tabs.addNode(id, sessionTree.childNodes[1].data.nodeId, 'horizontal');

  // expected tree structure:
  // root
  //   |-first pane
  //   --middle pane
  //   --last pane
  expect(get(tabs)[1].sessionTree.childNodes.length).toBe(3);
});

test('closeTab terminates all sessions', async () => {
  const removeSpy = vi.spyOn(sessions, 'remove');
  tabs.closeTab(get(tabs)[1].id);

  expect(removeSpy).toHaveBeenCalledTimes(3);
});

// test('removeLeafNode removes a single node', async () => {});

// test('removeLeafNode converts middle node to a leaf', async () => {});

// test('removeLeafeNode removes a tab when last node is deleted', () => {});
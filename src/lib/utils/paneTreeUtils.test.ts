import { beforeEach, expect, test, vi, type MockInstance } from "vitest";
import * as store from "svelte/store";
import type { TreeNode, PaneData, ShellSession } from "$lib/types";
import * as session from '$lib/pty/createSession';
import { addNode, createSingleNode, findNode, removeLeafNode, terminateSessions } from "./paneTreeUtils";

let sessionCallMock: MockInstance;
const mockedSession = { pid: 1 } as unknown as ShellSession;

let tree: TreeNode<PaneData>;
let childOne: TreeNode<PaneData>;
let childTwo: TreeNode<PaneData>;
let grandChild: TreeNode<PaneData>;

beforeEach(async () => {
  sessionCallMock = vi.spyOn(session, 'createSession').mockResolvedValue(mockedSession);

  tree = {
    data: {
      nodeId: 1,
      height: store.writable(0),
      width: store.writable(0),
      area: store.readable(0)
    },
    childNodes: []
  };

  childOne = {
    data: {
      nodeId: 2,
      height: store.writable(0),
      width: store.writable(0),
      area: store.readable(0)
    },
    childNodes: []
  }

  childTwo = {
    data: {
      nodeId: 3,
      height: store.writable(0),
      width: store.writable(0),
      area: store.readable(0)
    },
    childNodes: []
  }

  grandChild = {
    data: {
      nodeId: 4,
      height: store.writable(0),
      width: store.writable(0),
      area: store.readable(0)
    },
    childNodes: []
  }
})

test('findNode returns null on empty root', async () => {
  let [parentActual, resultActual] = findNode(null, 0);
  expect(parentActual).toBeNull();
  expect(resultActual).toBeNull();

  [parentActual, resultActual] = findNode(undefined, 0);
  expect(parentActual).toBeNull();
  expect(resultActual).toBeNull();
});

test('findNode finds simple case', async () => {
  const expectedNodeId = 3
  tree.data.nodeId = expectedNodeId

  const [parentActual, resultActual] = findNode(tree, expectedNodeId);
  expect(parentActual).toBeNull();
  expect(resultActual).toStrictEqual(tree);
});

test('findNode also returns parent', async () => {
  tree.childNodes.push(childOne)

  const [parentActual, resultActual] = findNode(tree, 2);
  expect(parentActual).toStrictEqual(tree);
  expect(resultActual).toStrictEqual(childOne);
});

test('findNode searches all children', async () => {
  childTwo.childNodes.push(grandChild);
  tree.childNodes.push(childOne);
  tree.childNodes.push(childTwo);

  const [parentActual, resultActual] = findNode(tree, grandChild.data.nodeId);
  expect(parentActual).toStrictEqual(childTwo);
  expect(resultActual).toStrictEqual(grandChild);
});

test('terminateSessions disposes all sessions', async () => {
  const disposeMock = vi.fn();

  grandChild.data.session = { pid: 3, dispose: disposeMock } as unknown as ShellSession;
  childOne.data.session = { pid: 1, dispose: disposeMock } as unknown as ShellSession;
  childTwo.data.session = { pid: 2, dispose: disposeMock } as unknown as ShellSession;
  childTwo.childNodes.push(grandChild);
  tree.childNodes.push(childOne);
  tree.childNodes.push(childTwo);

  terminateSessions(tree);
  expect(disposeMock).toBeCalledTimes(3);
});

test('createSingleNode works', async () => {
  const expectedParentId = 5;
  const expectedConfig = { shell: { env: {} } };
  const storeMock = vi.spyOn(store, 'get')
    .mockImplementationOnce(() => 0)
    .mockImplementationOnce(() => expectedConfig);
  
  const result = createSingleNode(expectedParentId);
  expect(result).not.toBeNull();
  expect((await result).data.parentNodeId).toBe(expectedParentId);
  expect(storeMock).toBeCalledTimes(2);
  expect(sessionCallMock).toHaveBeenCalledOnce();
});

test('createSingleNode uses existing session', async () => {
  const expectedParentId = 5;
  const expectedSession = { pid: 3 } as unknown as ShellSession
  const storeMock = vi.spyOn(store, 'get')
    .mockImplementationOnce(() => 0);
  
  const result = createSingleNode(expectedParentId, expectedSession);
  expect((await result)).not.toBeNull();
  expect((await result).data.parentNodeId).toBe(expectedParentId);
  expect((await result).data.session).toBe(expectedSession);
  expect(storeMock).toHaveBeenCalledOnce();
  expect(sessionCallMock).not.toHaveBeenCalled();
});

test('addNode creates a new tree', async () => {
  const expectedConfig = { shell: { env: {} } };
  vi.spyOn(store, 'get')
    .mockImplementationOnce(() => 7)
    .mockImplementationOnce(() => expectedConfig);

  const result = addNode(null, 0, 'horizontal');
  expect((await result)).not.toBeNull();
  expect((await result).data.nodeId).toBe(8);
  expect((await result).data.session).toBe(mockedSession);
});

test('addNode adds a child', async () => {
  const originalMockedSession = { pid: 0 } as unknown as ShellSession;
  tree.data.session = originalMockedSession;
  const expectedConfig = { shell: { env: {} } };
  vi.spyOn(store, 'get')
    .mockImplementationOnce(() => 3)
    .mockImplementationOnce(() => 4)
    .mockImplementationOnce(() => expectedConfig);

  const result = addNode(tree, tree.data.nodeId, 'horizontal');
  expect((await result)).not.toBeNull();
  expect((await result).childNodes.length).toBe(2);
  expect((await result).data.session).toBe(undefined);
  expect((await result).childNodes[0].data.nodeId).toBe(4);
  expect((await result).childNodes[0].data.session).toBe(originalMockedSession);
  expect((await result).childNodes[1].data.nodeId).toBe(5);
  expect((await result).childNodes[1].data.session).toBe(mockedSession);
});

test('addNode adds sibling when direction matches', async () => {
  const expectedNewNodeId = childTwo.data.nodeId + 1;
  tree.childNodes.push(childOne);
  tree.childNodes.push(childTwo);
  tree.data.direction = 'vertical';
  const expectedConfig = { shell: { env: {} } };
  vi.spyOn(store, 'get')
    .mockImplementationOnce(() => childTwo.data.nodeId)
    .mockImplementationOnce(() => expectedConfig);

  const result = addNode(tree, childTwo.data.nodeId, 'vertical');
  expect((await result)).not.toBeNull();
  expect((await result).childNodes.length).toBe(3);
  expect((await result).childNodes).toContain(childOne);
  expect((await result).childNodes).toContain(childTwo);
  expect((await result).childNodes.find(c => c.data.nodeId === expectedNewNodeId)).not.toBeNull();
});

test('removeLeafNode empties the tree', async () => {
  const disposeMock = vi.fn();
  mockedSession.dispose = disposeMock;
  tree.data.session = mockedSession;

  const result = removeLeafNode(tree, tree.data.nodeId);
  expect((await result)).toBeNull();
  expect(disposeMock).toHaveBeenCalledOnce();
});

test('removeLeafNode returns whole tree if node has children', async () => {
  tree.childNodes.push(childOne);

  const result = removeLeafNode(tree, tree.data.nodeId);
  expect((await result)).toStrictEqual(tree);
});

test('removeLeafNode turns parent into leaf', async () => {
  const disposeMock = vi.fn();
  mockedSession.dispose = disposeMock;
  childOne.data.session = mockedSession;
  childOne.data.direction = 'horizontal';
  tree.childNodes.push(childOne);
  tree.childNodes.push(childTwo);

  const result = removeLeafNode(tree, childTwo.data.nodeId);
  expect((await result)?.childNodes.length).toBe(0);
  expect((await result)?.data.session).toBe(mockedSession);
  expect((await result)?.data.direction).toBe('horizontal');
})

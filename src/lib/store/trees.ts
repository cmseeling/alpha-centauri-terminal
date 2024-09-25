import { get, writable } from "svelte/store";
import type { Direction, PaneData, TabTreeMap, TreeNode } from "$lib/types";
import { userConfiguration } from ".";
import { sessions } from "./sessions";

const lastNodeId = writable(0);
// const _trees = new Map<string, TabTree>();
export const tabActiveSessions = new Map<string, number>();
const _trees = writable({} as TabTreeMap);
const { subscribe, update } = _trees;

const findNode = (
	root: TreeNode<PaneData> | undefined | null,
	nodeId: number,
	suppliedParent: TreeNode<PaneData> | null = null
): [TreeNode<PaneData> | null, TreeNode<PaneData> | null] => {
	let returnValue: [TreeNode<PaneData> | null, TreeNode<PaneData> | null] = [null, null];
	if (root) {
		if (root.data.nodeId === nodeId) {
			returnValue = [suppliedParent, root];
		} else {
			for (let i = 0; i < root.childNodes.length; i++) {
				const [foundParent, foundNode] = findNode(root.childNodes[i], nodeId, root);
				if (foundNode !== null) {
					returnValue = [foundParent, foundNode];
					break;
				}
			}
		}
	}

	return returnValue;
};

interface CreateSingleNodeArgs {
	parentNodeId?: number;
	sessionId?: number;
	referringSessionId?: number;
	createNewSession?: boolean;
}

const createSingleNode = async ({
    parentNodeId,
    sessionId,
    referringSessionId,
    createNewSession = true
  }: CreateSingleNodeArgs) => {
  const newId = get(lastNodeId) + 1;

  const newNode: TreeNode<PaneData> = {
    data: {
      nodeId: newId,
      parentNodeId,
      sessionId
    },
    childNodes: []
  };

  if (sessionId === undefined && createNewSession) {
    const config = get(userConfiguration);
    let currentWorkingDirectory = undefined;
    if(referringSessionId !== undefined) {
      currentWorkingDirectory = sessions.get(referringSessionId)?.rawCwd;
    }
    const session = await sessions.createSession({
      env: config.shell.env,
      currentWorkingDirectory,
      referringSessionId
    });
    newNode.data!.sessionId = session.pid;
  }

  lastNodeId.set(newId);

  return newNode;
};

const terminateSessions = (root: TreeNode<PaneData> | undefined | null) => {
	// console.log(root);
	if (root) {
		if (root.data.sessionId) {
			sessions.remove(root.data.sessionId);
			root.data.sessionId = undefined;
		}
		for (let i = 0; i < root.childNodes.length; i++) {
			terminateSessions(root.childNodes[i]);
		}
	}
};

const createTree = async (tabId: string, referringSessionId?: number) => {
  const newTree = await createSingleNode({ referringSessionId });
  update(($trees) => {
    $trees = { ...$trees, [tabId]: newTree };
    return $trees;
  });
}

const addNode = async (
  tabId: string,
  startNodeId: number,
  direction: Direction,
  referringSessionId?: number
) => {
  const tree = get(_trees)[tabId];
  const [parentNode, startNode] = findNode(tree, startNodeId);
  if (startNode !== null) {
    // PaneGroup is already going in the same direction so this new node can be added as a sibling
    if (parentNode && parentNode.data.direction === direction) {
      parentNode.childNodes.push(
        await createSingleNode({ parentNodeId: parentNode.data.nodeId, referringSessionId })
      );
    } else {
      startNode.data.direction = direction;
      // pass session to child
      startNode.childNodes.push(
        await createSingleNode({
          parentNodeId: startNode.data.nodeId,
          sessionId: startNode.data.sessionId
        })
      );
      startNode.childNodes.push(
        await createSingleNode({ parentNodeId: startNode.data.nodeId, referringSessionId })
      );
      startNode.data.sessionId = undefined;
    }
  }

  update(($trees) => {
    $trees[tabId] = tree;
    console.log($trees);
    return $trees;
  });
};

const removeLeafNode = (
  tabId: string,
  nodeId: number
): boolean => {
  let stillExists = true;
  update(($trees) => {
    const tree = $trees[tabId];
    if (tree) {
      const [parentNode, nodeToDelete] = findNode(tree, nodeId);
      if (parentNode) {
        if (nodeToDelete) {
          // check if this node is a leaf
          if (nodeToDelete.childNodes.length === 0) {
            if(nodeToDelete.data.sessionId !== undefined) {
              sessions.remove(nodeToDelete.data.sessionId);
              nodeToDelete.data.sessionId = undefined;
            }
            parentNode.childNodes = parentNode.childNodes.filter((child) => {
              return child.data.nodeId !== nodeId;
            });
            // if parent only has 1 child now, child data should move up to parent
            // parent could become a leaf or it could remain a parent with new children
            if (parentNode.childNodes.length === 1) {
              parentNode.data.direction = parentNode.childNodes[0].data.direction;
              parentNode.data.sessionId = parentNode.childNodes[0].data.sessionId;
              parentNode.childNodes = parentNode.childNodes[0].childNodes;
            }
          }
        }
      } else {
        if (nodeToDelete) {
          // check if this node is a leaf
          if (nodeToDelete.childNodes.length === 0) {
            if(nodeToDelete.data.sessionId !== undefined) {
              sessions.remove(nodeToDelete.data.sessionId);
              nodeToDelete.data.sessionId = undefined;
            }
            delete $trees[tabId];
            stillExists = false;
          }
        }
      }
    }

    return $trees;
  })

  return stillExists
};

export const trees = {
  createTree,
  subscribe,
  getTabTree: (tabId: string) => get(_trees)[tabId],
  addNode,
  removeLeafNode,
  remove: (tabId: string) => {
    update(($trees) => {
      terminateSessions($trees[tabId]);
      delete $trees[tabId];
      return $trees;
    });
  }
}
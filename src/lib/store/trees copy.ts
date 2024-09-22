import { get, writable } from "svelte/store";
import type { Direction, PaneData, TabTree, TreeNode } from "$lib/types";
import { userConfiguration } from ".";
import { sessions } from "./sessions";

const lastNodeId = writable(0);
const _trees = new Map<string, TabTree>();

const findNodeRecursive = (
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
				const [foundParent, foundNode] = findNodeRecursive(root.childNodes[i], nodeId, root);
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

const initializeTree = async(referringSessionId?: number) => {
  const root = await createSingleNode({ createNewSession: false });
  root.childNodes.push(await createSingleNode({ parentNodeId: root.data.nodeId, referringSessionId }));
  return root;
}

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
  let lastActiveSessionId: number|undefined = undefined;
  const root = writable(await initializeTree(referringSessionId));
  lastActiveSessionId = get(root).childNodes[0].data.sessionId;

  const findNode = (nodeId: number): [TreeNode<PaneData> | null, TreeNode<PaneData> | null] => 
    findNodeRecursive(get(root), nodeId);

  const addNode = async (
    startNodeId: number,
    direction: Direction,
    referringSessionId?: number
  ) => {
    const [parentNode, startNode] = findNode(startNodeId);
    if (startNode !== null) {
      // PaneGroup is already going in the same direction so this new node can be added as a sibling
      // alternatively, the direction was arbitrarily set
      if (parentNode && (parentNode.data.direction === direction || parentNode.childNodes.length === 1)) {
        parentNode.childNodes.push(
          await createSingleNode({ parentNodeId: parentNode.data.nodeId, referringSessionId })
        );
        parentNode.data.direction = direction;
      } else {
        const newParent = await createSingleNode({
          parentNodeId: startNode.data.parentNodeId,
          createNewSession: false
        });
        newParent.data.direction = direction;
        startNode.data.parentNodeId = newParent.data.nodeId;
        // attach original
        newParent.childNodes.push(startNode);
        // create new
        newParent.childNodes.push(
          await createSingleNode({ parentNodeId: newParent.data.nodeId, referringSessionId })
        )
        // remove reference to original from parent
        if(parentNode) {
          const index = parentNode.childNodes.indexOf(startNode);
          parentNode.childNodes.splice(index, 1, newParent);
        }
        else {
          root.set(newParent)
        }
        // startNode.data.direction = direction;
        // // pass session to child
        // startNode.childNodes.push(
        // 	await createSingleNode({
        // 		parentNodeId: startNode.data.nodeId,
        // 		sessionId: startNode.data.sessionId
        // 	})
        // );
        // startNode.childNodes.push(
        // 	await createSingleNode({ parentNodeId: startNode.data.nodeId, referringSessionId })
        // );
        // startNode.data.sessionId = undefined;
        
      }
    }
  };

  const removeLeafNode = (nodeId: number): boolean => {
    if (get(root)) {
      const [parentNode, nodeToDelete] = findNode(nodeId);
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
      }
    }
    return get(root).childNodes.length > 0;
  };

  const tree = {
    root,
    lastActiveSessionId,
    findNode,
    addNode,
    removeLeafNode
  }

  _trees.set(tabId, tree);

  return tree;
}

export const trees = {
  createTree,
  get: (tabId: string) => _trees.get(tabId),
  remove: (tabId: string) => {
    const tree = _trees.get(tabId);
    if(tree) {
      terminateSessions(get(tree.root));
      _trees.delete(tabId);
    }
  }
}
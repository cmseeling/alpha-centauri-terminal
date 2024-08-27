import { createSession } from "$lib/pty/createSession";
import type { TreeNode, PaneData, Direction, ShellSession } from "$lib/types";
import { userConfiguration } from '$lib/store/configurationStore';
import { get, writable } from "svelte/store";

export const lastNodeId = writable(0);

export const findNode = (
  root: TreeNode<PaneData>|undefined|null,
  nodeId: number,
  suppliedParent: TreeNode<PaneData>|null = null
): [TreeNode<PaneData>|null, TreeNode<PaneData>|null] => {
  let returnValue: [TreeNode<PaneData>|null, TreeNode<PaneData>|null] = [null, null];

  if(root) {
    if(root.data.nodeId === nodeId) {
      returnValue = [suppliedParent, root];
    }
    else {
      for(let i=0; i<root.childNodes.length; i++) {
        returnValue = findNode(root.childNodes[i], nodeId, root);
        if(returnValue !== null) {
          break;
        }
      }
    }
  }

  return returnValue;
}

export const terminateSessions = (root: TreeNode<PaneData>|undefined|null) => {
  if(root) {
    root.data.session?.dispose();
    for(let i=0; i<root.childNodes.length; i++) {
      terminateSessions(root.childNodes[i]);
    }
  }
}

const createSingleNode = async (parentNodeId?: number, session?: ShellSession) => {
  const newId = get(lastNodeId) + 1;
  const newNode: TreeNode<PaneData> = {
    data: {
      nodeId: newId,
      parentNodeId,
      session
    },
    childNodes: []
  }

  if(session === undefined) {
    const config = get(userConfiguration);
    console.log(config)
    const session = await createSession({
      env: config.shell.env
    });
    newNode.data!.session = session;
  }

  lastNodeId.set(newId);

  return newNode;
}

export const addNode = async (tree: TreeNode<PaneData>|null, startNodeId: number, direction: Direction): Promise<TreeNode<PaneData>> => {
  if(tree === null) {
    const newNode = await createSingleNode();
    return newNode;
  }
  
  const [parentNode, startNode] = findNode(tree, startNodeId);
  if(startNode === null) {
    return tree;
  }
  else {
    // PaneGroup is already going in the same direction so this new node can be added as a sibling
    if (parentNode && parentNode.data.direction === direction) {
      parentNode.childNodes.push(await createSingleNode(parentNode.data.nodeId));
    }
    else {
      startNode.data.direction = direction;
      // pass session to child
      startNode.childNodes.push(await createSingleNode(startNode.data.nodeId, startNode.data.session));
      startNode.childNodes.push(await createSingleNode(startNode.data.nodeId));
      startNode.data.session = undefined;
    }
  }

  return tree;
}

export const removeLeafNode = (tree: TreeNode<PaneData>|null, nodeId: number): TreeNode<PaneData>|null => {
  if(tree) {
    const [parentNode, nodeToDelete] = findNode(tree, nodeId);
    if(parentNode) {
      if(nodeToDelete) {
        // check if this node is a leaf
        if(nodeToDelete.childNodes.length === 0) {
          nodeToDelete.data.session?.dispose();
          parentNode.childNodes = parentNode.childNodes.filter((child) => {
            return child.data.nodeId !== nodeId
          });
          // if parent only has 1 child now, child data should move up to parent
          // parent could become a leaf or it could remain a parent with new children
          if(parentNode.childNodes.length === 1) {
            parentNode.data.direction = parentNode.childNodes[0].data.direction;
            parentNode.data.session = parentNode.childNodes[0].data.session;
            parentNode.childNodes = parentNode.childNodes[0].childNodes;
          }
        }
      }
    }
    else {
      if(nodeToDelete) {
        // check if this node is a leaf
        if(nodeToDelete.childNodes.length === 0) {
          nodeToDelete.data.session?.dispose();
          tree = null;
        }
      }
    }
  }
  return tree;
}

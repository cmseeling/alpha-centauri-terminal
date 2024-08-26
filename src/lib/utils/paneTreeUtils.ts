import { createSession } from "$lib/pty/createSession";
import type { TreeNode, PaneData } from "$lib/types";
import { userConfiguration } from '$lib/store/configurationStore';
import { get } from "svelte/store";

export const findNode = (root: TreeNode<PaneData>|undefined, nodeId: number): TreeNode<PaneData>|null => {
  let returnValue: TreeNode<PaneData>|null = null;

  if(root) {
    // base case
    if(root.left === undefined && root.right === undefined) {
      if(root.data?.nodeId === nodeId) {
        returnValue = root;
      }
    }
    else {
      const leftResult = findNode(root.left, nodeId);
      if(leftResult !== null) {
        returnValue = leftResult;
      }
      else {
        const rightResult = findNode(root.right, nodeId);
        if(rightResult !== null) {
          returnValue = rightResult;
        }
      }
    }
  }

  return returnValue;
}

// (null, 0) => { data: { nodeId: 1, parentNode: undefined, isLeaf: true, direction: 'horizontal', session: { pid = 1 } }, left: undefined, right: undefined }
// (tree, 1) => { data: { nodeId: 1, parentNode: undefined, isLeaf: false, direction: 'horizontal', session: undefined }, left: { nodeId: 2, parentNode:  isLeaf: true } }
export const addNode = async (tree: TreeNode<PaneData>|null, parentId: number): TreeNode<PaneData> => {
  if(tree === null) {
    const newNode: TreeNode<PaneData> = {
      data: {
        nodeId: 1,
        isLeaf: true,
        direction: 'horizontal',
      }
    }

    newNode.data!.session = await createSession({
			env: get(userConfiguration).shell.env
		});

    return newNode
  }
  
  const parentNode = findNode(tree, parentId);
  if(parentNode === null) {
    return tree;
  }

}



interface TreeNode<T> {
  left?: TreeNode<T>;
  right?: TreeNode<T>;
  data?: T;
}

let tree: TreeNode<SessionPointer> = {
  left: {
    data: {
      left: {
        data: {
          nodeId: 1
          session: 1
        }
      },
      right: {
        data: {
          nodeId: 3
          session: 3
       }
      }
    }
  },
  right: {
    data: {
      nodeId: 2
      session: 2
    }
  }
}

<PaneGroup direction={data.direction}>
{#if data.session}
  <Pane>
    <Terminal session={data.session}/>
  </Pane>
{:else}
  <Pane>
    <svelte:self tree={data.left}/>
  </Pane>
  <Pane>
    <svelte:self tree={data.right}/>
  </Pane>
{/if}
</PaneGroup>
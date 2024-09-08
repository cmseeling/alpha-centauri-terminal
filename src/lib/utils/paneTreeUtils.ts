import { derived, get, writable } from 'svelte/store';
import type { TreeNode, PaneData, Direction, ShellSession } from '$lib/types';
import { userConfiguration } from '$lib/store/configurationStore';
import { sessions } from '$lib/store/sessions';
import { createSession } from '$lib/pty/createSession';

export const lastNodeId = writable(0);

export const findNode = (
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

export const terminateSessions = (root: TreeNode<PaneData> | undefined | null) => {
	// console.log(root);
	if (root) {
		if (root.data.sessionId) {
			const session = sessions.get(root.data.sessionId);
			if(session) {
				session.dispose();
				sessions.delete(root.data.sessionId);
			}
			root.data.sessionId = undefined;
		}
		for (let i = 0; i < root.childNodes.length; i++) {
			terminateSessions(root.childNodes[i]);
		}
	}
};

interface CreateSingleNodeArgs {
	parentNodeId?: number;
	sessionId?: number;
	referringSessionId?: number;
}

export const createSingleNode = async ({
	parentNodeId,
	sessionId,
	referringSessionId
}: CreateSingleNodeArgs) => {
	const newId = get(lastNodeId) + 1;

	const height = writable(0);
	const width = writable(0);
	const area = derived([height, width], ([$height, $width]) => $height * $width);

	const newNode: TreeNode<PaneData> = {
		data: {
			nodeId: newId,
			parentNodeId,
			sessionId,
			height,
			width,
			area
		},
		childNodes: []
	};

	if (sessionId === undefined) {
		const config = get(userConfiguration);
		let currentWorkingDirectory = undefined;
		if(referringSessionId !== undefined) {
			currentWorkingDirectory = sessions.get(referringSessionId)?.rawCwd;
		}
		const session = await createSession({
			env: config.shell.env,
			currentWorkingDirectory,
			referringSessionId
		});
		sessions.set(session.pid, session);
		newNode.data!.sessionId = session.pid;
	}

	lastNodeId.set(newId);

	return newNode;
};

export const addNode = async (
	tree: TreeNode<PaneData> | null,
	startNodeId: number,
	direction: Direction,
	referringSessionId?: number
): Promise<TreeNode<PaneData>> => {
	if (tree === null) {
		const newNode = await createSingleNode({});
		return newNode;
	}

	const [parentNode, startNode] = findNode(tree, startNodeId);
	if (startNode === null) {
		return tree;
	} else {
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

	return tree;
};

export const removeLeafNode = (
	tree: TreeNode<PaneData> | null,
	nodeId: number
): TreeNode<PaneData> | null => {
	if (tree) {
		const [parentNode, nodeToDelete] = findNode(tree, nodeId);
		if (parentNode) {
			if (nodeToDelete) {
				// check if this node is a leaf
				if (nodeToDelete.childNodes.length === 0) {
					if(nodeToDelete.data.sessionId !== undefined) {
						const session = sessions.get(nodeToDelete.data.sessionId);
						if(session) {
							session.dispose();
							sessions.delete(nodeToDelete.data.sessionId);
						}
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
						const session = sessions.get(nodeToDelete.data.sessionId);
						if(session) {
							session.dispose();
							sessions.delete(nodeToDelete.data.sessionId);
						}
						nodeToDelete.data.sessionId = undefined;
					}
					tree = null;
				}
			}
		}
	}
	return tree;
};

import { NextRequest, NextResponse } from 'next/server';

const MOCK_ERRORS = [
  'API Request Timed Out.',
  'Invalid Action Parameters provided.',
  'User lacks permission to approve.',
  'Third-party service unavailable.',
];

type Node = { id: string; type: string; data: { title?: string; endMessage?: string; actionId?: string; approverRole?: string } };
type Edge = { id: string; source: string; target: string };
type StepStatus = 'success' | 'error' | 'skipped';

interface SimStep {
  nodeId:    string;
  nodeType:  string;
  nodeTitle: string;
  status:    StepStatus;
  message:   string;
  timestamp: string;
  durationMs: number;
}

interface SimulateResponse {
  success:      boolean;
  steps:        SimStep[];
  finalMessage: string;
  failedNodeId: string | null;
  totalNodes:   number;
  executedNodes: number;
  requestId:    string;
}

function ts() {
  return new Date().toISOString();
}

function simulateWorkflow(nodes: Node[], edges: Edge[], forceError = false): SimulateResponse {
  const requestId = `sim_${Date.now()}`;
  const startNode = nodes.find(n => n.type === 'startNode');
  const steps: SimStep[] = [];

  if (!startNode) {
    return {
      success: false,
      steps,
      finalMessage: 'No Start Node found. Add a Start Node to your workflow.',
      failedNodeId: null,
      totalNodes: nodes.length,
      executedNodes: 0,
      requestId,
    };
  }

  let currentNode: Node | undefined = startNode;
  const visited = new Set<string>();
  let baseFakeMs = 100;

  while (currentNode && !visited.has(currentNode.id)) {
    visited.add(currentNode.id);
    const title = currentNode.data.title || currentNode.type;
    const duration = baseFakeMs + Math.floor(Math.random() * 300);
    baseFakeMs += 50;

    // End node always succeeds immediately
    if (currentNode.type === 'endNode') {
      steps.push({
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeTitle: title,
        status: 'success',
        message: `Workflow reached end: ${title}`,
        timestamp: ts(),
        durationMs: duration,
      });
      return {
        success: true,
        steps,
        finalMessage: currentNode.data.endMessage || 'Workflow completed successfully.',
        failedNodeId: null,
        totalNodes: nodes.length,
        executedNodes: visited.size,
        requestId,
      };
    }

    // forceError: inject a mock failure on the 2nd non-start node
    const isInjectTarget = forceError && currentNode.type !== 'startNode' && visited.size === 2;
    if (isInjectTarget) {
      const errMsg = MOCK_ERRORS[Math.floor(Math.random() * MOCK_ERRORS.length)];
      steps.push({ nodeId: currentNode.id, nodeType: currentNode.type, nodeTitle: title, status: 'error', message: `[FORCED] ${errMsg}`, timestamp: ts(), durationMs: duration });
      return { success: false, steps, finalMessage: errMsg, failedNodeId: currentNode.id, totalNodes: nodes.length, executedNodes: visited.size, requestId };
    }
    // Build a meaningful message per node type
    let message = `Completed: ${title}`;
    if (currentNode.type === 'approvalNode') {
      message = `Approval granted by ${currentNode.data.approverRole || 'Approver'} for "${title}"`;
    } else if (currentNode.type === 'automatedNode') {
      message = `Automated action "${currentNode.data.actionId || 'action'}" executed successfully`;
    } else if (currentNode.type === 'startNode') {
      message = `Workflow initiated: ${title}`;
    } else if (currentNode.type === 'taskNode') {
      message = `Manual task "${title}" marked complete`;
    }

    steps.push({
      nodeId: currentNode.id,
      nodeType: currentNode.type,
      nodeTitle: title,
      status: 'success',
      message,
      timestamp: ts(),
      durationMs: duration,
    });

    const outboundEdge = edges.find(e => e.source === currentNode!.id);
    if (!outboundEdge) {
      return {
        success: false,
        steps,
        finalMessage: `Node "${title}" has no outbound connection. Connect it to the next step or an End Node.`,
        failedNodeId: currentNode.id,
        totalNodes: nodes.length,
        executedNodes: visited.size,
        requestId,
      };
    }

    const nextNode = nodes.find(n => n.id === outboundEdge.target);
    if (!nextNode) {
      return {
        success: false,
        steps,
        finalMessage: `Broken edge: target node not found after "${title}".`,
        failedNodeId: currentNode.id,
        totalNodes: nodes.length,
        executedNodes: visited.size,
        requestId,
      };
    }
    currentNode = nextNode;
  }

  return {
    success: false,
    steps,
    finalMessage: 'Execution halted: infinite loop or cyclical path detected.',
    failedNodeId: null,
    totalNodes: nodes.length,
    executedNodes: visited.size,
    requestId,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodes, edges, forceError } = body as { nodes: Node[]; edges: Edge[]; forceError?: boolean };

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: 'Invalid payload: `nodes` and `edges` arrays are required.' },
        { status: 400 }
      );
    }

    const result = simulateWorkflow(nodes, edges, Boolean(forceError));
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
}

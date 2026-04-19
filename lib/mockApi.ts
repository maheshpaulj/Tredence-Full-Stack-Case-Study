import { Node, Edge } from 'reactflow';

export const getAutomations = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: "send_email", label: "Send Email", params: ["to", "subject", "body"] },
    { id: "create_ticket", label: "Create IT Ticket", params: ["department", "priority"] },
    { id: "update_status", label: "Update Employee Status", params: ["employeeId", "newStatus"] },
  ];
};

export const simulateWorkflow = async (payload: { nodes: Node[]; edges: Edge[] }) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { nodes, edges } = payload;
  const logs: string[] = [];
  
  // Basic topological simulation
  let currentNode = nodes.find(n => n.type === 'startNode');
  if (!currentNode) throw new Error("No Start Node found");

  logs.push(`[START] Workflow initialized at '${currentNode.data.title || 'Start'}'`);

  let steps = 0;
  while (currentNode && steps < 50) {
    steps++;
    // Find outbound edge
    const outboundEdge = edges.find(e => e.source === currentNode?.id);
    if (!outboundEdge) {
      if (currentNode.type !== 'endNode') {
        logs.push(`[WARNING] Execution stopped. Node '${currentNode.data.title}' is disconnected.`);
      } else {
        logs.push(`[END] Workflow completed successfully. Message: ${currentNode.data.endMessage}`);
      }
      break;
    }

    const nextNode = nodes.find(n => n.id === outboundEdge.target);
    if (!nextNode) break;

    // Log the step execution
    if (nextNode.type === 'approvalNode') {
      logs.push(`[APPROVAL] Pending review from '${nextNode.data.approverRole}'. Threshold set to ${nextNode.data.autoApproveThreshold}.`);
    } else if (nextNode.type === 'automatedNode') {
      logs.push(`[AUTOMATION] Executing '${nextNode.data.actionId}' with params: ${JSON.stringify(nextNode.data.actionParams)}`);
    } else if (nextNode.type === 'taskNode') {
      logs.push(`[TASK] Assigned to ${nextNode.data.assignee || 'Unassigned'} - Due: ${nextNode.data.dueDate}`);
    }
    
    currentNode = nextNode;
  }

  if (steps >= 50) logs.push("[ERROR] Infinite loop detected!");

  return { success: true, logs };
};
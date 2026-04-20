import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge, OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  history: { past: { nodes: Node[]; edges: Edge[] }[]; future: { nodes: Node[]; edges: Edge[] }[] };
  theme: 'light' | 'dark';
  highlightedNodeId: string | null;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  setSelectedNode: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string, newId: string) => void;
  deleteEdge: (id: string) => void;
  updateEdgeStyle: (id: string, color: string) => void;
  setNodesAndEdges: (nodes: Node[], edges: Edge[]) => void;
  clearCanvas: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setHighlightedNodeId: (id: string | null) => void;
  
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  history: { past: [], future: [] },
  theme: 'light',
  highlightedNodeId: null,

  saveHistory: () => {
    const { nodes, edges, history } = get();
    set({ history: { past: [...history.past, { nodes, edges }], future: [] } });
  },

  onNodesChange: (changes) => {
    const isSignificant = changes.some(c => c.type === 'position' && !c.dragging || c.type === 'remove');
    if (isSignificant) get().saveHistory();
    
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    const selectChange = changes.find((c) => c.type === 'select');
    if (selectChange && selectChange.type === 'select') {
      set({ selectedNodeId: selectChange.selected ? selectChange.id : null });
    }
  },
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    get().saveHistory();
    // Default style for new connections (thicker line)
    const newEdge = { ...connection, style: { strokeWidth: 3, stroke: '#9ca3af' } };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  
  updateNodeData: (id, newData) => {
    get().saveHistory();
    set({ nodes: get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n) });
  },

  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
  
  setHighlightedNodeId: (id) => set({ highlightedNodeId: id }),

  addNode: (node) => {
    get().saveHistory();
    set({ nodes: [...get().nodes, node] });
  },

  deleteNode: (id) => {
    get().saveHistory();
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      edges: get().edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
    });
  },

  duplicateNode: (id, newId) => {
    const node = get().nodes.find(n => n.id === id);
    if (!node) return;
    get().saveHistory();
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  deleteEdge: (id) => {
    get().saveHistory();
    set({ edges: get().edges.filter(e => e.id !== id) });
  },

  updateEdgeStyle: (id, color) => {
    get().saveHistory();
    set({ edges: get().edges.map(e => e.id === id ? { ...e, style: { ...e.style, stroke: color } } : e) });
  },

  setNodesAndEdges: (nodes, edges) => {
    get().saveHistory();
    set({ nodes, edges });
  },

  clearCanvas: () => {
    get().saveHistory();
    set({ nodes: [], edges: [], selectedNodeId: null });
  },


  undo: () => {
    const { history, nodes, edges } = get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    set({ nodes: previous.nodes, edges: previous.edges, history: { past: history.past.slice(0, -1), future: [{ nodes, edges }, ...history.future] } });
  },

  redo: () => {
    const { history, nodes, edges } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    set({ nodes: next.nodes, edges: next.edges, history: { past: [...history.past, { nodes, edges }], future: history.future.slice(1) } });
  },

  exportJSON: () => JSON.stringify({ nodes: get().nodes, edges: get().edges }, null, 2),
  
  importJSON: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.nodes && data.edges) {
        get().saveHistory();
        set({ nodes: data.nodes, edges: data.edges });
      }
    } catch (e) {
      alert("Invalid JSON format");
    }
  }
}));
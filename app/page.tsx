"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, Background, Controls, MiniMap, ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Upload, Undo2, Redo2, LayoutTemplate, Play, CheckSquare, UserCheck, Zap, Flag, Copy, Trash2, Palette, MoreVertical, FileText, AlertTriangle, Moon, Sun, X } from 'lucide-react';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import { nodeTypes } from '@/components/Nodes/CustomNodes';
import ConfigPanel from '@/components/ConfigPanel';
import SandboxPanel from '@/components/SandboxPanel';
import { getLayoutedElements } from '@/lib/autoLayout';

let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

const COLORS = ['#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'];
const EDGE_COLORS = ['#9ca3af', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const ErrorModal = ({ isOpen, onClose, details }: { isOpen: boolean; onClose: () => void; details: { title: string, message: string } }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200 border dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 p-2 rounded-full"><AlertTriangle size={20} /></div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{details.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{details.message}</p>
      </div>
    </div>
  );
};
const ThemeToggle = () => {
  const { theme, toggleTheme } = useWorkflowStore();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};
const OverwriteWarningModal = ({ isOpen, onClose, onConfirm, exportJSON }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; exportJSON: () => string; }) => {
  if (!isOpen) return null;

  const handleSaveAndConfirm = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportJSON());
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "workflow-backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-full shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Overwrite Canvas?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              This action will clear your current workflow. You can save a backup before overwriting.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            Discard & Overwrite
          </button>
          <button onClick={handleSaveAndConfirm} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
            <Download size={16} /> Save Backup & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, deleteNode, duplicateNode, deleteEdge, updateEdgeStyle, updateNodeData, setNodesAndEdges, undo, redo, exportJSON, importJSON, theme, clearCanvas } = useWorkflowStore();
  const isDark = theme === 'dark';
  
  const [menu, setMenu] = useState<{ show: boolean, x: number, y: number, type: 'pane' | 'node' | 'edge', id?: string }>({ show: false, x: 0, y: 0, type: 'pane' });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState({ title: '', message: '' });

  const showErrorModal = (details: { title: string, message: string }) => {
    setErrorDetails(details);
    setIsErrorModalOpen(true);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (nodes.length > 0) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes.length]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNode({ id: getId(), type, position, data: { title: type.replace('Node', '') } });
  }, [reactFlowInstance, addNode]);

  const handleContextMenu = useCallback((event: React.MouseEvent, type: 'pane' | 'node' | 'edge', elementId?: string) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (bounds) {
      setMenu({ show: true, x: event.clientX - bounds.left, y: event.clientY - bounds.top, type, id: elementId });
      setShowMoreMenu(false);
    }
  }, []);

  const closeMenus = () => {
    setMenu(prev => ({ ...prev, show: false }));
    setShowMoreMenu(false);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportJSON());
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "workflow-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowMoreMenu(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (nodes.length > 0) {
        setPendingImportContent(content);
      } else {
        importJSON(content);
      }
      setShowMoreMenu(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmImport = () => {
    if (pendingImportContent) {
      importJSON(pendingImportContent);
      setPendingImportContent(null);
    }
  };

  return (
    <div className="flex-1 relative flex flex-col h-full w-full bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-200" onClick={closeMenus} onContextMenu={(e) => handleContextMenu(e, 'pane')}>
      <OverwriteWarningModal 
        isOpen={!!pendingImportContent} 
        onClose={() => setPendingImportContent(null)} 
        onConfirm={confirmImport} 
        exportJSON={exportJSON} 
      />

      <ErrorModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} details={errorDetails} />

      <style>{`
        .react-flow__edge.selected .react-flow__edge-path { stroke: #6366f1 !important; stroke-width: 5px !important; filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.6)); }
        .react-flow__edge:hover .react-flow__edge-path { stroke: #818cf8 !important; }
      `}</style>
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white dark:bg-[#262626] dark:border-[#3a3a3a] p-1.5 rounded-lg shadow-md border border-gray-200" onClick={e => e.stopPropagation()}>
        <button onClick={undo} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-700 dark:text-gray-300 transition-colors" title="Undo"><Undo2 size={16} /></button>
        <button onClick={redo} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-700 dark:text-gray-300 transition-colors" title="Redo"><Redo2 size={16} /></button>
        <div className="w-px h-5 bg-gray-300 dark:bg-[#3a3a3a] mx-1" />
        <button onClick={() => {
          const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
          setNodesAndEdges([...ln], [...le]);
        }} className="p-1.5 px-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-700 dark:text-gray-300 flex items-center gap-2 text-xs font-semibold transition-colors">
          <LayoutTemplate size={16} /> Auto Layout
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-[#3a3a3a] mx-1" />
        
        <div className="relative">
          <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-700 dark:text-gray-300 transition-colors">
            <MoreVertical size={16} />
          </button>
          {showMoreMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#3a3a3a] shadow-xl rounded-md py-1 z-50">
              <button onClick={handleExport} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300"><Download size={14} /> Export JSON</button>
              <label className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <Upload size={14} /> Import JSON
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
              <div className="border-t border-gray-100 dark:border-[#3a3a3a] my-1" />
              <button
                onClick={() => { clearCanvas(); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <Trash2 size={14} /> Reset Canvas
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" ref={reactFlowWrapper} style={{ background: isDark ? '#1e1e1e' : '#f9fafb' }}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onInit={setReactFlowInstance} onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onNodeContextMenu={(e, node) => { e.stopPropagation(); handleContextMenu(e, 'node', node.id); }}
          onEdgeContextMenu={(e, edge) => { e.stopPropagation(); handleContextMenu(e, 'edge', edge.id); }}
          defaultEdgeOptions={{ style: { strokeWidth: 3, stroke: isDark ? '#555' : '#9ca3af' } }}
          fitView
        >
          <Background color={isDark ? '#444' : '#ccc'} gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeStrokeWidth={3} style={{ background: isDark ? '#262626' : '#f0f0f0' }} />
        </ReactFlow>
      </div>

      {menu.show && (
        <div className="absolute z-50 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#3a3a3a] shadow-xl rounded-md py-1 w-48 text-sm" style={{ top: menu.y, left: menu.x }} onClick={e => e.stopPropagation()}>
          {menu.type === 'pane' && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Add Node</div>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 flex items-center gap-2" onClick={() => { addNode({ id: getId(), type: 'taskNode', position: reactFlowInstance!.screenToFlowPosition({x: menu.x, y: menu.y}), data: { title: 'New Task' } }); closeMenus(); }}><CheckSquare size={14} className="text-gray-500" /> Task</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 flex items-center gap-2" onClick={() => { addNode({ id: getId(), type: 'approvalNode', position: reactFlowInstance!.screenToFlowPosition({x: menu.x, y: menu.y}), data: { title: 'Approval' } }); closeMenus(); }}><UserCheck size={14} className="text-orange-500" /> Approval</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 flex items-center gap-2" onClick={() => { addNode({ id: getId(), type: 'automatedNode', position: reactFlowInstance!.screenToFlowPosition({x: menu.x, y: menu.y}), data: { title: 'Automated' } }); closeMenus(); }}><Zap size={14} className="text-blue-500" /> Action</button>
            </>
          )}

          {menu.type === 'node' && menu.id && (
            <>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#333] flex items-center gap-2 text-gray-700 dark:text-gray-300" onClick={() => { duplicateNode(menu.id!, getId()); closeMenus(); }}><Copy size={14} /> Duplicate</button>
              <div className="border-t dark:border-[#3a3a3a] my-1"></div>
              <div className="px-3 py-1.5 flex items-center justify-between">
                <Palette size={14} className="text-gray-400" />
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c }} onClick={() => { updateNodeData(menu.id!, { bgColor: c }); closeMenus(); }} />
                  ))}
                </div>
              </div>
              <div className="border-t dark:border-[#3a3a3a] my-1"></div>
              <button className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2" onClick={() => { deleteNode(menu.id!); closeMenus(); }}><Trash2 size={14} /> Delete Node</button>
            </>
          )}

          {menu.type === 'edge' && menu.id && (
            <>
              <div className="px-3 py-1.5 flex items-center justify-between">
                <Palette size={14} className="text-gray-400" />
                <div className="flex gap-1">
                  {EDGE_COLORS.map(c => (
                    <button key={c} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c }} onClick={() => { updateEdgeStyle(menu.id!, c); closeMenus(); }} />
                  ))}
                </div>
              </div>
              <div className="border-t dark:border-[#3a3a3a] my-1"></div>
              <button className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2" onClick={() => { deleteEdge(menu.id!); closeMenus(); }}><Trash2 size={14} /> Delete Connection</button>
            </>
          )}
        </div>
      )}

      <SandboxPanel showErrorModal={showErrorModal} />
    </div>
  );
}

const Sidebar = () => {
  const { nodes, setNodesAndEdges, exportJSON } = useWorkflowStore();
  const [pendingTemplate, setPendingTemplate] = useState<'onboarding' | 'leave' | null>(null);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTemplateClick = (type: 'onboarding' | 'leave') => {
    if (nodes.length > 0) setPendingTemplate(type);
    else executeLoadTemplate(type);
  };

  const executeLoadTemplate = (type: 'onboarding' | 'leave') => {
    if (type === 'onboarding') {
      setNodesAndEdges([
        { id: 't1_1', type: 'startNode', position: { x: 250, y: 50 }, data: { title: 'Employee Hired' } },
        { id: 't1_2', type: 'taskNode', position: { x: 250, y: 150 }, data: { title: 'IT Setup', assignee: 'IT Dept' } },
        { id: 't1_3', type: 'automatedNode', position: { x: 250, y: 300 }, data: { title: 'Send Welcome Email', actionId: 'send_email' } },
        { id: 't1_4', type: 'endNode', position: { x: 250, y: 450 }, data: { title: 'End Onboarding' } },
      ], [
        { id: 'e1', source: 't1_1', target: 't1_2', style: { strokeWidth: 3, stroke: '#9ca3af' } },
        { id: 'e2', source: 't1_2', target: 't1_3', style: { strokeWidth: 3, stroke: '#9ca3af' } },
        { id: 'e3', source: 't1_3', target: 't1_4', style: { strokeWidth: 3, stroke: '#9ca3af' } },
      ]);
    } else if (type === 'leave') {
      setNodesAndEdges([
        { id: 't2_1', type: 'startNode', position: { x: 250, y: 50 }, data: { title: 'Leave Requested' } },
        { id: 't2_2', type: 'approvalNode', position: { x: 250, y: 150 }, data: { title: 'Manager Approval', approverRole: 'Manager' } },
        { id: 't2_3', type: 'automatedNode', position: { x: 250, y: 300 }, data: { title: 'Update HRIS', actionId: 'update_status' } },
        { id: 't2_4', type: 'endNode', position: { x: 250, y: 450 }, data: { title: 'End Process' } },
      ], [
        { id: 'e4', source: 't2_1', target: 't2_2', style: { strokeWidth: 3, stroke: '#9ca3af' } },
        { id: 'e5', source: 't2_2', target: 't2_3', style: { strokeWidth: 3, stroke: '#9ca3af' } },
        { id: 'e6', source: 't2_3', target: 't2_4', style: { strokeWidth: 3, stroke: '#9ca3af' } },
      ]);
    }
    setPendingTemplate(null);
  };

  return (
    <>
      <OverwriteWarningModal 
        isOpen={!!pendingTemplate} 
        onClose={() => setPendingTemplate(null)} 
        onConfirm={() => pendingTemplate && executeLoadTemplate(pendingTemplate)} 
        exportJSON={exportJSON} 
      />

      <aside className="w-64 bg-white dark:bg-[#262626] border-r border-gray-200 dark:border-[#3a3a3a] flex flex-col h-full z-10 transition-colors duration-200">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1e1e1e]">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Toolbox</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">Drag onto canvas</p>
          </div>
          
          <div className="flex flex-col items-center gap-6 p-6">
            <div draggable onDragStart={(e) => onDragStart(e, 'startNode')} className="flex items-center justify-center w-32 px-4 py-2 bg-white dark:bg-[#2f2f2f] border-2 border-green-500 rounded-full cursor-grab hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-green-700"><Play size={14} className="fill-current" /><span className="font-bold text-xs">Start</span></div>
            </div>
            <div draggable onDragStart={(e) => onDragStart(e, 'taskNode')} className="flex flex-col w-40 bg-white dark:bg-[#2f2f2f] border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-grab hover:shadow-md transition-shadow">
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-t-md px-2 py-1 border-b border-inherit flex items-center gap-1.5 text-gray-700 dark:text-gray-300"><CheckSquare size={12} /><span className="font-bold text-[10px] uppercase">Task</span></div>
              <div className="p-2"><span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Manual Task</span></div>
            </div>
            <div draggable onDragStart={(e) => onDragStart(e, 'approvalNode')} className="relative group cursor-grab w-40 h-16 flex items-center justify-center hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-white dark:bg-[#2f2f2f] border-2 border-orange-400 -skew-x-[15deg] rounded-md" />
              <div className="relative flex flex-col items-center justify-center text-center z-10"><UserCheck size={14} className="text-orange-500 mb-0.5" /><span className="font-bold text-xs text-gray-900 dark:text-gray-100">Approval</span></div>
            </div>
            <div draggable onDragStart={(e) => onDragStart(e, 'automatedNode')} className="flex items-center gap-2 w-40 p-2 bg-white dark:bg-[#2f2f2f] border-2 border-dashed border-blue-400 rounded-lg cursor-grab hover:shadow-md transition-shadow">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md"><Zap size={14} /></div><span className="text-xs font-bold text-gray-900 dark:text-gray-100">Automated</span>
            </div>
            <div draggable onDragStart={(e) => onDragStart(e, 'endNode')} className="flex items-center justify-center w-32 px-4 py-2 bg-white dark:bg-[#2f2f2f] border-2 border-red-500 rounded-full cursor-grab hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-red-700"><Flag size={14} className="fill-current" /><span className="font-bold text-xs">End</span></div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1e1e1e] p-4">
          <h2 className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider font-bold">Quick Templates</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => handleTemplateClick('onboarding')} className="flex items-center gap-3 p-2 bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-[#3a3a3a] rounded-md hover:border-indigo-400 hover:shadow-sm transition-all text-left">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded"><FileText size={14} /></div>
              <div><div className="text-xs font-bold text-gray-800 dark:text-gray-200">Basic Onboarding</div><div className="text-[9px] text-gray-500 dark:text-gray-400">4 steps • Automated email</div></div>
            </button>
            <button onClick={() => handleTemplateClick('leave')} className="flex items-center gap-3 p-2 bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-[#3a3a3a] rounded-md hover:border-indigo-400 hover:shadow-sm transition-all text-left">
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1.5 rounded"><UserCheck size={14} /></div>
              <div><div className="text-xs font-bold text-gray-800 dark:text-gray-200">Leave Approval</div><div className="text-[9px] text-gray-500 dark:text-gray-400">3 steps • Manager review</div></div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default function WorkflowDesignerPage() {

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-[#1e1e1e] overflow-hidden text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <header className="h-14 border-b bg-white dark:bg-[#262626] dark:border-[#3a3a3a] flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs tracking-wider">HR</div>
          <h1 className="font-semibold text-sm text-gray-800 dark:text-gray-100">Workflow Builder</h1>
        </div>
        <div className="flex items-center justify-center gap-1">
          <ThemeToggle />
          <p className='text-sm'>Built by</p>
          <a href="https://maheshpaul.is-a.dev/" target='_blank' className='font-bold hover:scale-95 transition-all'>Mahesh Paul J</a>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ReactFlowProvider>
          <WorkflowCanvas />
        </ReactFlowProvider>
        <ConfigPanel />
      </div>
    </div>
  );
}
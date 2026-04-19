"use client";
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { ChevronRight, ChevronLeft, Settings2 } from 'lucide-react';

export default function ConfigPanel() {
  const { nodes, selectedNodeId, updateNodeData } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  
  // Resizing and Minimize State
  const [width, setWidth] = useState(320);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Mock Automations List
  const [automations] = useState<any[]>([
    { id: "send_email", label: "Send Email", params: ["to", "subject"] },
    { id: "webhook", label: "Trigger Webhook", params: ["url"] },
  ]);

  // Handle Resizing Logic
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth > 220 && newWidth < 600) setWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = 'auto'; // Restore text selection
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none'; // Prevent text highlighting while dragging
  };

  if (isMinimized) {
    return (
      <div className="bg-white border-l border-gray-200 shadow-sm flex flex-col items-center py-4 w-12 z-20 transition-all cursor-pointer hover:bg-gray-50" onClick={() => setIsMinimized(false)}>
        <ChevronLeft size={20} className="text-gray-500 mb-4" />
        <div className="-rotate-90 whitespace-nowrap text-xs font-bold text-gray-500 mt-10 tracking-widest uppercase">
          Configure
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-l border-gray-200 shadow-sm flex flex-col z-20 transition-all" style={{ width: `${width}px` }}>
      
      {/* Drag Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30" 
        onMouseDown={startDrag}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 text-gray-800">
          <Settings2 size={18} />
          <h3 className="font-bold text-sm">Node Settings</h3>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
        {!selectedNode ? (
          <div className="text-gray-400 text-sm italic text-center mt-10">Select a node to configure</div>
        ) : (
          <>
            {/* Title Input */}
            {selectedNode.type !== 'endNode' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input 
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={selectedNode.data.title || ''} 
                  onChange={(e) => updateNodeData(selectedNode.id, { title: e.target.value })}
                />
              </div>
            )}

            {/* Render fields based on node type... */}
            {selectedNode.type === 'startNode' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Metadata (JSON)</label>
                <textarea className="w-full border rounded p-2 text-sm h-24 font-mono outline-none focus:ring-2 focus:ring-indigo-500" value={selectedNode.data.metadata ? JSON.stringify(selectedNode.data.metadata) : ''} onChange={(e) => { try { updateNodeData(selectedNode.id, { metadata: JSON.parse(e.target.value) }); } catch {} }} />
              </div>
            )}

            {selectedNode.type === 'taskNode' && (
              <>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Description</label><textarea className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedNode.data.description || ''} onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })} /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Assignee</label><input className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedNode.data.assignee || ''} onChange={(e) => updateNodeData(selectedNode.id, { assignee: e.target.value })} /></div>
              </>
            )}

            {selectedNode.type === 'approvalNode' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Approver Role</label>
                <select className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedNode.data.approverRole || ''} onChange={(e) => updateNodeData(selectedNode.id, { approverRole: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Manager">Manager</option>
                  <option value="HRBP">HRBP</option>
                  <option value="Director">Director</option>
                </select>
              </div>
            )}

            {selectedNode.type === 'automatedNode' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
                <select className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedNode.data.actionId || ''} onChange={(e) => updateNodeData(selectedNode.id, { actionId: e.target.value })}>
                  <option value="">Select Action...</option>
                  {automations.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
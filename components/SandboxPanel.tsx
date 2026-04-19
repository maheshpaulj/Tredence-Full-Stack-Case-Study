"use client";
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { ChevronDown, ChevronUp, Terminal, Play } from 'lucide-react';

export default function SandboxPanel() {
  const { nodes, edges } = useWorkflowStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Resizing and Minimize State
  const [height, setHeight] = useState(256); // Default 64rem
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handle Resizing Logic
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const newHeight = document.body.clientHeight - e.clientY;
      if (newHeight > 100 && newHeight < 600) setHeight(newHeight);
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
    document.body.style.userSelect = 'none';
  };

  const handleSimulate = async () => {
    setIsRunning(true);
    setLogs(["[SYSTEM] Initializing Simulation...", `[SYSTEM] Found ${nodes.length} nodes and ${edges.length} connections.`]);
    
    setTimeout(() => {
      setLogs(prev => [...prev, "[SUCCESS] Workflow structure validated."]);
    }, 800);

    setTimeout(() => {
      setLogs(prev => [...prev, "[END] Simulation completed."]);
      setIsRunning(false);
    }, 1500);
  };

  // Minimized State
  if (isMinimized) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md flex items-center justify-between px-4 py-2 z-20 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-2 text-gray-500">
          <Terminal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Sandbox Terminal</span>
        </div>
        <ChevronUp size={18} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative bg-white border-t border-gray-200 shadow-inner flex flex-col z-20 transition-all" style={{ height: `${height}px` }}>
      
      {/* Drag Handle */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30"
        onMouseDown={startDrag}
      />

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 shrink-0 mt-1">
        <div className="flex items-center gap-2 text-gray-800">
          <Terminal size={16} />
          <h3 className="font-bold text-sm">Sandbox & Testing</h3>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSimulate} 
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:bg-indigo-300 shadow-sm"
          >
            <Play size={12} className="fill-current" />
            {isRunning ? "Running..." : "Simulate"}
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 bg-gray-900 m-3 rounded-lg p-3 overflow-y-auto text-xs font-mono flex flex-col gap-1.5 shadow-inner">
        {logs.length === 0 ? (
          <span className="text-gray-500 italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Ready. Click "Simulate" to test workflow logic...
          </span>
        ) : (
          logs.map((log, idx) => (
            <span key={idx} className={log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-gray-300'}>
              <span className="text-gray-600 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span> 
              {log}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { ChevronDown, ChevronUp, Terminal, Play, Loader2, CheckCircle, XCircle, FileText, Flag, Trash2, Wifi } from 'lucide-react';

type StepStatus = 'running' | 'success' | 'error';

type VisStep = {
  nodeId:    string;
  nodeTitle: string;
  status:    StepStatus;
  message:   string;
  timestamp: string;
};

interface ApiStep {
  nodeId:     string;
  nodeType:   string;
  nodeTitle:  string;
  status:     'success' | 'error';
  message:    string;
  timestamp:  string;
  durationMs: number;
}

interface SimulateResponse {
  success:       boolean;
  steps:         ApiStep[];
  finalMessage:  string;
  failedNodeId:  string | null;
  totalNodes:    number;
  executedNodes: number;
  requestId:     string;
}

type LogKind = 'system' | 'request' | 'response' | 'step-ok' | 'step-err' | 'step-run' | 'result-ok' | 'result-err';

interface LogLine {
  kind:    LogKind;
  time:    string;
  content: string;
}

function nowStr() {
  return new Date().toISOString().split('T')[1].replace('Z', '');
}

export default function SandboxPanel({ showErrorModal }: {
  showErrorModal: (details: { title: string; message: string }) => void;
}) {
  const { nodes, edges, setHighlightedNodeId, theme } = useWorkflowStore();
  const isDark = theme === 'dark';

  const [visSteps,   setVisSteps]   = useState<VisStep[]>([]);
  const [finalResult, setFinalResult] = useState<{ message: string; success: boolean } | null>(null);
  const [rawLog,     setRawLog]     = useState<LogLine[]>([]);
  const [isRunning,  setIsRunning]  = useState(false);
  const [activeTab,  setActiveTab]  = useState<'visualizer' | 'rawLog'>('visualizer');

  const [height,      setHeight]      = useState(256);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging,  setIsDragging]  = useState(false);

  const rawEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rawEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawLog]);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const h = document.body.clientHeight - e.clientY;
      if (h > 100 && h < 600) setHeight(h);
    };
    const onMouseUp = () => { setIsDragging(false); document.body.style.userSelect = 'auto'; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',  onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',  onMouseUp);
    };
  }, [isDragging]);

  const addLog = (kind: LogKind, content: string) =>
    setRawLog(prev => [...prev, { kind, time: nowStr(), content }]);

  const handleClear = () => {
    setVisSteps([]);
    setFinalResult(null);
    setRawLog([]);
    setHighlightedNodeId(null);
  };

  const handleSimulate = async () => {
    setIsRunning(true);
    setVisSteps([]);
    setFinalResult(null);
    setRawLog([]);
    setHighlightedNodeId(null);

    const payload = { nodes, edges };
    const payloadStr = JSON.stringify(payload);
    const bodyBytes = new TextEncoder().encode(payloadStr).length;

    addLog('system',  `Simulation started — ${nodes.length} node(s), ${edges.length} edge(s)`);
    addLog('request', `POST /api/simulate HTTP/1.1`);
    addLog('request', `Content-Type: application/json`);
    addLog('request', `Content-Length: ${bodyBytes} bytes`);
    addLog('request', `Body: { nodes: [${nodes.length}], edges: [${edges.length}] }`);

    const t0 = Date.now();
    let data: SimulateResponse;

    try {
      const res = await fetch('/api/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payloadStr,
      });

      const elapsed = Date.now() - t0;
      data = await res.json();

      addLog('response', `HTTP/1.1 ${res.status} ${res.ok ? 'OK' : 'ERROR'} — ${elapsed}ms`);
      addLog('response', `Request-Id: ${data.requestId}`);
      addLog('response', `Nodes processed: ${data.executedNodes}/${data.totalNodes}`);
      addLog('system',   '─────────────────────────────────────');

    } catch (err) {
      const elapsed = Date.now() - t0;
      addLog('response', `HTTP/1.1 500 Network Error — ${elapsed}ms`);
      addLog('result-err', `Fetch failed: ${err}`);
      setIsRunning(false);
      showErrorModal({ title: 'Network Error', message: 'Could not reach /api/simulate.' });
      return;
    }

    for (const step of data.steps) {
      setVisSteps(prev => {
        const exists = prev.findIndex(s => s.nodeId === step.nodeId);
        const entry: VisStep = {
          nodeId:    step.nodeId,
          nodeTitle: step.nodeTitle,
          status:    'running',
          message:   `Executing: ${step.nodeTitle}...`,
          timestamp: step.timestamp,
        };
        if (exists > -1) { const u = [...prev]; u[exists] = entry; return u; }
        return [...prev, entry];
      });

      const logKindRun: LogKind = 'step-run';
      addLog(logKindRun, `[${step.nodeType.toUpperCase()}] ${step.nodeTitle} — executing...`);

      await new Promise(r => setTimeout(r, Math.min(step.durationMs, 700)));

      setVisSteps(prev => {
        const exists = prev.findIndex(s => s.nodeId === step.nodeId);
        const entry: VisStep = {
          nodeId:    step.nodeId,
          nodeTitle: step.nodeTitle,
          status:    step.status === 'error' ? 'error' : 'success',
          message:   step.message,
          timestamp: step.timestamp,
        };
        if (exists > -1) { const u = [...prev]; u[exists] = entry; return u; }
        return [...prev, entry];
      });

      const logKind: LogKind = step.status === 'error' ? 'step-err' : 'step-ok';
      addLog(logKind, `[${step.nodeType.toUpperCase()}] ${step.nodeTitle} — ${step.message} (${step.durationMs}ms)`);
    }

    addLog('system', '─────────────────────────────────────');

    if (data.success) {
      addLog('result-ok', `[SYSTEM] Process exited 0: ${data.finalMessage}`);
    } else {
      if (data.failedNodeId) setHighlightedNodeId(data.failedNodeId);
      addLog('result-err', `[SYSTEM] Process exited 1: ${data.finalMessage}`);
      const failedTitle = nodes.find(n => n.id === data.failedNodeId)?.data?.title || 'Workflow';
      showErrorModal({
        title:   data.failedNodeId ? `Execution Failed at "${failedTitle}"` : 'Workflow Error',
        message: data.finalMessage,
      });
    }

    setFinalResult({ message: data.finalMessage, success: data.success });
    setIsRunning(false);
  };

  const hasResults = visSteps.length > 0 || finalResult !== null || rawLog.length > 0;

  const logColor = (kind: LogKind): string => {
    const map: Record<LogKind, string> = {
      system:     isDark ? 'text-gray-500'      : 'text-gray-400',
      request:    isDark ? 'text-cyan-400'      : 'text-cyan-600',
      response:   isDark ? 'text-yellow-400'    : 'text-yellow-600',
      'step-run': isDark ? 'text-gray-300'      : 'text-gray-500',
      'step-ok':  isDark ? 'text-green-400'     : 'text-green-600',
      'step-err': isDark ? 'text-red-400'       : 'text-red-600',
      'result-ok':  isDark ? 'text-green-300'   : 'text-green-700',
      'result-err': isDark ? 'text-red-300'     : 'text-red-700',
    };
    return map[kind] ?? '';
  };

  const logPrefix = (kind: LogKind): string => {
    const map: Record<LogKind, string> = {
      system:     '  ',
      request:    '→ ',
      response:   '← ',
      'step-run': '⟳ ',
      'step-ok':  '✓ ',
      'step-err': '✗ ',
      'result-ok':  '● ',
      'result-err': '● ',
    };
    return map[kind] ?? '  ';
  };

  if (isMinimized) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#262626] border-t border-gray-200 dark:border-[#3a3a3a] shadow-md flex items-center justify-between px-4 py-2 z-20 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333] transition-colors"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Terminal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Sandbox Terminal</span>
          {isRunning && <Loader2 size={12} className="animate-spin text-indigo-500" />}
        </div>
        <ChevronUp size={18} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-[#262626] border-t border-gray-200 dark:border-[#3a3a3a] shadow-inner flex flex-col z-20" style={{ height: `${height}px` }}>

      <div className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30" onMouseDown={e => { e.preventDefault(); setIsDragging(true); document.body.style.userSelect = 'none'; }} />

      <div className="flex justify-between items-center px-4 pt-2 border-b border-gray-100 dark:border-[#3a3a3a] shrink-0">
        <div className="flex items-center gap-2 border-b-2 border-transparent translate-y-[1px]">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'visualizer' ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Terminal size={14} /> Visualizer
          </button>
          <button
            onClick={() => setActiveTab('rawLog')}
            className={`px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'rawLog' ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <FileText size={14} /> Raw Logs
            {rawLog.length > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {rawLog.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 pb-2">
          {hasResults && !isRunning && (
            <button onClick={handleClear} title="Clear results" className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="fill-current" />}
            {isRunning ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-500 dark:text-gray-400">
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-hidden bg-gray-50 dark:bg-[#1e1e1e]">
        {activeTab === 'visualizer' && (
          <div className="h-full overflow-y-auto space-y-3">
            {visSteps.length === 0 && (
              <div className="text-gray-400 dark:text-gray-500 text-sm text-center pt-8">
                Ready. Click &quot;Run Simulation&quot; to execute the workflow.
              </div>
            )}
            {visSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-md bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#3a3a3a] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                {step.status === 'running'  && <Loader2      size={18} className="text-blue-500 animate-spin shrink-0" />}
                {step.status === 'success'  && <CheckCircle  size={18} className="text-green-500 shrink-0" />}
                {step.status === 'error'    && <XCircle      size={18} className="text-red-500 shrink-0" />}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{step.nodeTitle}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{step.message}</span>
                </div>
              </div>
            ))}
            {finalResult && (
              <div className={`flex items-center gap-3 p-3 mt-2 rounded-lg border-2 animate-in zoom-in-95 ${finalResult.success ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                {finalResult.success
                  ? <Flag    size={20} className="text-green-600 dark:text-green-500 shrink-0" />
                  : <XCircle size={20} className="text-red-600 dark:text-red-500 shrink-0" />}
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Simulation {finalResult.success ? 'Completed Successfully' : 'Failed'}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{finalResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rawLog' && (
          <div className={`h-full overflow-y-auto rounded-lg p-4 text-xs font-mono shadow-inner ${isDark ? 'bg-[#0d1117]' : 'bg-gray-100 border border-gray-200'}`}>
            <div className={`mb-3 pb-2 border-b ${isDark ? 'border-gray-800 text-gray-600' : 'border-gray-300 text-gray-400'}`}>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                <Wifi size={10} className="inline mr-1 mb-0.5" />
                API Layer — Next.js Route Handlers
              </span>
              <br />
              <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>GET  /api/automations   →  returns available actions</span>
              <br />
              <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>POST /api/simulate      →  executes workflow graph</span>
            </div>

            {rawLog.length === 0 && (
              <div className={isDark ? 'text-gray-600' : 'text-gray-400'}>
                $ awaiting simulation run...
              </div>
            )}
            {rawLog.map((line, idx) => (
              <div key={idx} className={`leading-relaxed mb-0.5 ${logColor(line.kind)}`}>
                <span className={isDark ? 'text-gray-700 mr-2' : 'text-gray-400 mr-2'}>[{line.time}]</span>
                <span className="mr-1 opacity-70">{logPrefix(line.kind)}</span>
                {line.content}
              </div>
            ))}
            <div ref={rawEndRef} />
          </div>
        )}

      </div>
    </div>
  );
}
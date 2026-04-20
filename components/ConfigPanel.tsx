"use client";
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Settings2, HelpCircle, Play, CheckSquare, UserCheck, Zap, Flag,
  Loader2, Globe, FolderOpen, Folder, ArrowRight, ArrowLeft,
  Braces, List, AlertCircle, CheckCircle2,
} from 'lucide-react';

// ─── Form Field ─────────────────────────────────────────────────────────────

const FormField = ({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
      {label}
      {help && <HelpCircle size={12} className="text-gray-400 dark:text-gray-500" />}
    </label>
    {children}
  </div>
);

// ─── API Explorer ────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiParam {
  name:     string;
  type:     string;
  required: boolean;
  desc:     string;
}

interface ApiEndpoint {
  method:      HttpMethod;
  path:        string;
  summary:     string;
  requestBody?: { type: string; example: string };
  params?:     ApiParam[];
  response:    { type: string; example: string };
}

interface ApiGroup {
  name:      string;
  endpoints: ApiEndpoint[];
}

const API_REGISTRY: ApiGroup[] = [
  {
    name: 'automations',
    endpoints: [
      {
        method:  'GET',
        path:    '/api/automations',
        summary: 'Returns all available automated actions',
        response: {
          type:    'AutomationAction[]',
          example: `[\n  { "id": "send_email", "label": "Send Email", "params": ["to","subject"] },\n  { "id": "generate_doc", "label": "Generate Document", "params": ["template","recipient"] },\n  { "id": "notify_slack", "label": "Notify Slack Channel", "params": ["channel","message"] },\n  ...\n]`,
        },
      },
    ],
  },
  {
    name: 'simulate',
    endpoints: [
      {
        method:  'POST',
        path:    '/api/simulate',
        summary: 'Executes a workflow graph and returns step-by-step results',
        requestBody: {
          type:    '{ nodes: Node[], edges: Edge[], forceError?: boolean }',
          example: `{\n  "nodes": [ { "id": "n1", "type": "startNode", "data": { "title": "Start" }, "position": { "x": 0, "y": 0 } } ],\n  "edges": [ { "id": "e1", "source": "n1", "target": "n2" } ],\n  "forceError": false\n}`,
        },
        response: {
          type:    'SimulateResponse',
          example: `{\n  "success": true,\n  "requestId": "sim_1713598800",\n  "totalNodes": 4,\n  "executedNodes": 4,\n  "failedNodeId": null,\n  "finalMessage": "Workflow completed successfully.",\n  "steps": [\n    { "nodeId": "n1", "nodeType": "startNode", "nodeTitle": "Start",\n      "status": "success", "message": "Workflow initiated", "durationMs": 142 }\n  ]\n}`,
        },
      },
    ],
  },
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  POST:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  PUT:    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  PATCH:  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function EndpointRow({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState<'request' | 'response'>('response');

  return (
    <div className="border border-gray-200 dark:border-[#3a3a3a] rounded-md overflow-hidden mb-1">
      {/* Row header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors"
      >
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>
          {ep.method}
        </span>
        <span className="text-[11px] font-mono text-gray-700 dark:text-gray-300 flex-1 truncate">{ep.path}</span>
        {open ? <ChevronUp size={12} className="text-gray-400 shrink-0" /> : <ChevronDown size={12} className="text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1e1e1e] px-3 py-2.5 space-y-2.5">
          {/* Summary */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{ep.summary}</p>

          {/* Tab switcher */}
          <div className="flex gap-1">
            {ep.requestBody && (
              <button
                onClick={() => setTab('request')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${tab === 'request' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
              >
                <ArrowRight size={10} /> Request
              </button>
            )}
            <button
              onClick={() => setTab('response')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${tab === 'response' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
            >
              <ArrowLeft size={10} /> Response
            </button>
          </div>

          {/* Body tab */}
          {tab === 'request' && ep.requestBody && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{ep.requestBody.type}</p>
              <pre className="text-[10px] font-mono bg-gray-900 dark:bg-black text-green-300 rounded p-2 overflow-x-auto leading-relaxed whitespace-pre">
                {ep.requestBody.example}
              </pre>
            </div>
          )}

          {/* Response tab */}
          {tab === 'response' && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{ep.response.type}</p>
              <pre className="text-[10px] font-mono bg-gray-900 dark:bg-black text-green-300 rounded p-2 overflow-x-auto leading-relaxed whitespace-pre">
                {ep.response.example}
              </pre>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
            <CheckCircle2 size={11} /> 200 OK — Mock endpoint active
          </div>
        </div>
      )}
    </div>
  );
}

function ApiExplorer() {
  const [expanded,     setExpanded]     = useState(true);
  const [openGroups,   setOpenGroups]   = useState<Record<string, boolean>>({ automations: true, simulate: false });

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="border-t border-gray-200 dark:border-[#3a3a3a]">
      {/* Section header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Globe size={15} />
          <span className="text-xs font-bold uppercase tracking-wider">API Explorer</span>
          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
            {API_REGISTRY.reduce((a, g) => a + g.endpoints.length, 0)} routes
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {/* Base URL */}
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">base:</span>
            <code className="text-[10px] font-mono bg-gray-100 dark:bg-[#1e1e1e] text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
              http://localhost:3000
            </code>
          </div>

          {/* Groups / folder tree */}
          {API_REGISTRY.map(group => (
            <div key={group.name} className="mb-1">
              {/* Folder row */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {openGroups[group.name]
                  ? <FolderOpen size={13} className="text-yellow-500 shrink-0" />
                  : <Folder     size={13} className="text-yellow-500 shrink-0" />}
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex-1 text-left">
                  /{group.name}
                </span>
                <span className="text-[10px] text-gray-400">
                  {group.endpoints.length} {group.endpoints.length === 1 ? 'route' : 'routes'}
                </span>
                {openGroups[group.name]
                  ? <ChevronDown size={11} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={11} className="text-gray-400 shrink-0" />}
              </button>

              {/* Endpoints under this group */}
              {openGroups[group.name] && (
                <div className="ml-4 mt-1 border-l-2 border-gray-200 dark:border-[#3a3a3a] pl-2">
                  {group.endpoints.map((ep, i) => (
                    <EndpointRow key={i} ep={ep} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ConfigPanel ────────────────────────────────────────────────────────

export default function ConfigPanel() {
  const { nodes, selectedNodeId, updateNodeData } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [width,      setWidth]      = useState(320);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging,  setIsDragging]  = useState(false);

  const [automations,        setAutomations]        = useState<{ id: string; label: string; params: string[] }[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(true);

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(setAutomations)
      .catch(() => setAutomations([]))
      .finally(() => setLoadingAutomations(false));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const w = document.body.clientWidth - e.clientX;
      if (w > 220 && w < 600) setWidth(w);
    };
    const onMouseUp = () => { setIsDragging(false); document.body.style.userSelect = 'auto'; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const renderNodeForm = () => {
    if (!selectedNode) return null;
    const { id, type, data } = selectedNode;
    const upd = (field: string, value: any) => updateNodeData(id, { [field]: value });

    const inputCls = 'w-full border border-gray-300 dark:border-[#3a3a3a] rounded p-2 text-sm bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100';

    const forms: Record<string, React.ReactNode> = {
      startNode: (
        <>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <Play size={16} /> <h4 className="font-bold text-sm">Start Node</h4>
          </div>
          <FormField label="Title">
            <input className={inputCls} value={data.title || ''} onChange={e => upd('title', e.target.value)} />
          </FormField>
          <FormField label="Metadata" help="Enter valid JSON for workflow triggers.">
            <textarea className={`${inputCls} font-mono h-24`} value={data.metadata ? JSON.stringify(data.metadata, null, 2) : ''} onChange={e => { try { upd('metadata', JSON.parse(e.target.value)); } catch {} }} />
          </FormField>
        </>
      ),
      taskNode: (
        <>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 p-2 bg-gray-50 dark:bg-[#1e1e1e] rounded-md border border-gray-200 dark:border-[#3a3a3a]">
            <CheckSquare size={16} /> <h4 className="font-bold text-sm">Task Node</h4>
          </div>
          <FormField label="Title"><input className={inputCls} value={data.title || ''} onChange={e => upd('title', e.target.value)} /></FormField>
          <FormField label="Description"><textarea className={`${inputCls}`} value={data.description || ''} onChange={e => upd('description', e.target.value)} /></FormField>
          <FormField label="Assignee"><input className={inputCls} value={data.assignee || ''} onChange={e => upd('assignee', e.target.value)} /></FormField>
        </>
      ),
      approvalNode: (
        <>
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
            <UserCheck size={16} /> <h4 className="font-bold text-sm">Approval Node</h4>
          </div>
          <FormField label="Title"><input className={inputCls} value={data.title || ''} onChange={e => upd('title', e.target.value)} /></FormField>
          <FormField label="Approver Role">
            <select className={inputCls} value={data.approverRole || ''} onChange={e => upd('approverRole', e.target.value)}>
              <option value="">Select...</option>
              <option value="Manager">Manager</option>
              <option value="HRBP">HRBP</option>
              <option value="Director">Director</option>
            </select>
          </FormField>
        </>
      ),
      automatedNode: (
        <>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <Zap size={16} /> <h4 className="font-bold text-sm">Automated Node</h4>
          </div>
          <FormField label="Title"><input className={inputCls} value={data.title || ''} onChange={e => upd('title', e.target.value)} /></FormField>
          <FormField label="Action">
            {loadingAutomations ? (
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm py-2">
                <Loader2 size={14} className="animate-spin" /> Loading actions...
              </div>
            ) : (
              <select className={inputCls} value={data.actionId || ''} onChange={e => upd('actionId', e.target.value)}>
                <option value="">Select Action...</option>
                {automations.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            )}
            {/* Show params for selected action */}
            {data.actionId && !loadingAutomations && (() => {
              const action = automations.find(a => a.id === data.actionId);
              return action ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {action.params.map(p => (
                    <span key={p} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </FormField>
        </>
      ),
      endNode: (
        <>
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <Flag size={16} /> <h4 className="font-bold text-sm">End Node</h4>
          </div>
          <FormField label="End Message">
            <input className={inputCls} value={data.endMessage || ''} onChange={e => upd('endMessage', e.target.value)} />
          </FormField>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isSummary" checked={data.isSummary || false} onChange={e => upd('isSummary', e.target.checked)} />
            <label htmlFor="isSummary" className="text-sm font-medium text-gray-700 dark:text-gray-300">Include Output Summary</label>
          </div>
        </>
      ),
    };
    return forms[type!];
  };

  if (isMinimized) {
    return (
      <div
        className="bg-white dark:bg-[#262626] border-l border-gray-200 dark:border-[#3a3a3a] shadow-sm flex flex-col items-center py-4 w-12 z-20 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-[#333]"
        onClick={() => setIsMinimized(false)}
      >
        <ChevronLeft size={20} className="text-gray-500 dark:text-gray-400 mb-4" />
        <div className="-rotate-90 whitespace-nowrap text-xs font-bold text-gray-500 dark:text-gray-400 mt-10 tracking-widest uppercase">
          Configure
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white dark:bg-[#262626] border-l border-gray-200 dark:border-[#3a3a3a] shadow-sm flex flex-col z-20"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-30"
        onMouseDown={e => { e.preventDefault(); setIsDragging(true); document.body.style.userSelect = 'none'; }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#3a3a3a] shrink-0">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <Settings2 size={18} />
          <h3 className="font-bold text-sm">Node Settings</h3>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-500 dark:text-gray-400">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Node form */}
      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        {selectedNode ? (
          <div key={selectedNode.id} className="flex flex-col gap-4 animate-in fade-in duration-200">
            {renderNodeForm()}
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-sm italic text-center mt-10">
            Select a node to configure
          </div>
        )}
      </div>

      {/* API Explorer section */}
      <ApiExplorer />
    </div>
  );
}
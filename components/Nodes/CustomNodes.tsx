"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { AlertCircle, Play, CheckSquare, UserCheck, Zap, Flag } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ErrorBadge = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md z-50 cursor-help" title={error}>
      <AlertCircle size={16} />
    </div>
  );
};

/**
 * Handle sits centred on the node's border edge.
 * ReactFlow already centres it horizontally/vertically;
 * we just need to shift it half its own height out so it straddles the border.
 * Handle size = 14px  →  translate ±7px = 50%.
 */
const CustomHandle = ({ type, position }: { type: 'source' | 'target', position: Position }) => {
  const edgeShift: Record<Position, string> = {
    [Position.Top]:    '!-translate-y-1/2',
    [Position.Bottom]: '!translate-y-1/2',
    [Position.Left]:   '!-translate-x-1/2',
    [Position.Right]:  '!translate-x-1/2',
  };
  return (
    <Handle
      type={type}
      position={position}
      className={`!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white dark:!border-[#262626] hover:!scale-125 !transition-transform z-20 ${edgeShift[position]}`}
    />
  );
};

/** Selection / error-highlight ring classes — shape-agnostic. */
const getStateClasses = (selected: boolean, highlighted: boolean) => {
  if (highlighted) return 'border-red-500 ring-4 ring-red-200 dark:ring-red-900/40 shadow-lg animate-pulse-red';
  if (selected)    return 'border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-lg';
  return '';
};

/**
 * Decides whether text on top of `hex` should be dark or light,
 * using the W3C relative-luminance formula.
 */
function readableTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? '#1a1a1a' : '#f0f0f0';
}

// ─── Nodes ──────────────────────────────────────────────────────────────────

export const StartNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
  const highlighted  = useWorkflowStore(s => s.highlightedNodeId === id);
  const theme        = useWorkflowStore(s => s.theme);
  const stateClass   = getStateClasses(selected, highlighted);
  const defaultBorder = !selected && !highlighted ? 'border-green-500' : '';
  const bg           = data.bgColor || (theme === 'dark' ? '#262626' : '#ffffff');
  const textColor    = data.bgColor ? readableTextColor(data.bgColor) : undefined;

  return (
    <div
      className={`relative flex items-center justify-center min-w-[140px] px-6 py-3 border-2 rounded-full shadow-sm hover:shadow-md transition-all ${defaultBorder} ${stateClass}`}
      style={{ backgroundColor: bg, color: textColor }}
    >
      <ErrorBadge error={data.error} />
      <CustomHandle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2" style={{ color: data.bgColor ? textColor : undefined }}>
        <Play size={16} className={`fill-current ${!data.bgColor ? 'text-green-600 dark:text-green-400' : ''}`} />
        <span className={`font-bold text-sm tracking-wide ${!data.bgColor ? 'text-gray-800 dark:text-gray-200' : ''}`}>
          {data.title || "Start"}
        </span>
      </div>
    </div>
  );
};

export const TaskNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
  const highlighted   = useWorkflowStore(s => s.highlightedNodeId === id);
  const theme         = useWorkflowStore(s => s.theme);
  const stateClass    = getStateClasses(selected, highlighted);
  const defaultBorder = !selected && !highlighted ? 'border-gray-300 dark:border-[#3a3a3a]' : '';
  const bg            = data.bgColor || (theme === 'dark' ? '#262626' : '#ffffff');
  const textColor     = data.bgColor ? readableTextColor(data.bgColor) : undefined;

  return (
    // NO overflow-hidden here — it clips the handle dots. Use rounded-t-lg on header instead.
    <div
      className={`relative flex flex-col min-w-[160px] border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${defaultBorder} ${stateClass}`}
      style={{ backgroundColor: bg }}
    >
      <ErrorBadge error={data.error} />
      <CustomHandle type="target" position={Position.Top} />
      <div className="bg-gray-100 dark:bg-[#1e1e1e] px-3 py-1.5 border-b border-gray-200 dark:border-[#3a3a3a] flex items-center gap-2 text-gray-700 dark:text-gray-300 rounded-t-[6px]">
        <CheckSquare size={14} />
        <span className="font-bold text-xs uppercase tracking-wider">Task</span>
      </div>
      <div className="p-3 flex flex-col">
        <span
          className={`text-sm font-semibold ${!data.bgColor ? 'text-gray-900 dark:text-gray-100' : ''}`}
          style={{ color: textColor }}
        >
          {data.title || "Manual Task"}
        </span>
        <span
          className={`text-[10px] mt-1 ${!data.bgColor ? 'text-gray-500 dark:text-gray-400' : 'opacity-70'}`}
          style={{ color: textColor }}
        >
          {data.assignee || "Unassigned"}
        </span>
      </div>
      <CustomHandle type="source" position={Position.Bottom} />
    </div>
  );
};

export const ApprovalNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
  const highlighted   = useWorkflowStore(s => s.highlightedNodeId === id);
  const theme         = useWorkflowStore(s => s.theme);
  const stateClass    = getStateClasses(selected, highlighted);
  const defaultBorder = !selected && !highlighted ? 'border-orange-400' : '';
  const bg            = data.bgColor || (theme === 'dark' ? '#262626' : '#ffffff');
  const textColor     = data.bgColor ? readableTextColor(data.bgColor) : undefined;

  return (
    <div className="relative group min-w-[180px]" style={{ height: '72px' }}>
      {/* Skewed parallelogram — selection ring follows this element */}
      <div
        className={`absolute inset-0 border-2 -skew-x-[15deg] rounded-md shadow-sm transition-all group-hover:shadow-md ${defaultBorder} ${stateClass}`}
        style={{ backgroundColor: bg }}
      />
      <ErrorBadge error={data.error} />
      <CustomHandle type="target" position={Position.Top} />
      {/* Un-skewed content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center z-10 px-8">
        <UserCheck size={18} className={`mb-1 ${!data.bgColor ? 'text-orange-500' : ''}`} style={{ color: data.bgColor ? textColor : undefined }} />
        <span className={`font-bold text-sm ${!data.bgColor ? 'text-gray-900 dark:text-gray-100' : ''}`} style={{ color: textColor }}>
          {data.title || "Approval"}
        </span>
        <span className={`text-[10px] font-semibold mt-0.5 ${!data.bgColor ? 'text-orange-600 dark:text-orange-400' : 'opacity-70'}`} style={{ color: data.bgColor ? textColor : undefined }}>
          {data.approverRole || "Any Role"}
        </span>
      </div>
      <CustomHandle type="source" position={Position.Bottom} />
    </div>
  );
};

export const AutomatedStepNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
  const highlighted   = useWorkflowStore(s => s.highlightedNodeId === id);
  const theme         = useWorkflowStore(s => s.theme);
  const stateClass    = getStateClasses(selected, highlighted);
  const defaultBorder = !selected && !highlighted ? 'border-blue-400' : '';
  const bg            = data.bgColor || (theme === 'dark' ? '#262626' : '#ffffff');
  const textColor     = data.bgColor ? readableTextColor(data.bgColor) : undefined;

  return (
    <div
      className={`relative flex flex-col min-w-[160px] border-2 border-dashed rounded-lg shadow-sm hover:shadow-md transition-all ${defaultBorder} ${stateClass}`}
      style={{ backgroundColor: bg }}
    >
      <ErrorBadge error={data.error} />
      <CustomHandle type="target" position={Position.Top} />
      <div className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-md shrink-0 ${!data.bgColor ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`} style={{ color: textColor }}>
          <Zap size={18} />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${!data.bgColor ? 'text-gray-900 dark:text-gray-100' : ''}`} style={{ color: textColor }}>
            {data.title || "Automated"}
          </span>
          <span className={`text-[10px] mt-0.5 ${!data.bgColor ? 'text-gray-500 dark:text-gray-400' : 'opacity-70'}`} style={{ color: textColor }}>
            {data.actionId || "No action"}
          </span>
        </div>
      </div>
      <CustomHandle type="source" position={Position.Bottom} />
    </div>
  );
};

export const EndNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
  const highlighted   = useWorkflowStore(s => s.highlightedNodeId === id);
  const theme         = useWorkflowStore(s => s.theme);
  const stateClass    = getStateClasses(selected, highlighted);
  const defaultBorder = !selected && !highlighted ? 'border-red-500' : '';
  const bg            = data.bgColor || (theme === 'dark' ? '#262626' : '#ffffff');
  const textColor     = data.bgColor ? readableTextColor(data.bgColor) : undefined;

  return (
    <div
      className={`relative flex items-center justify-center min-w-[140px] px-6 py-3 border-2 rounded-full shadow-sm hover:shadow-md transition-all ${defaultBorder} ${stateClass}`}
      style={{ backgroundColor: bg }}
    >
      <ErrorBadge error={data.error} />
      <CustomHandle type="target" position={Position.Top} />
      <div className="flex items-center gap-2" style={{ color: data.bgColor ? textColor : undefined }}>
        <Flag size={16} className={`fill-current ${!data.bgColor ? 'text-red-600 dark:text-red-400' : ''}`} />
        <span className={`font-bold text-sm tracking-wide ${!data.bgColor ? 'text-gray-800 dark:text-gray-200' : ''}`}>
          {data.title || "End"}
        </span>
      </div>
    </div>
  );
};

export const nodeTypes = {
  startNode: StartNode,
  taskNode: TaskNode,
  approvalNode: ApprovalNode,
  automatedNode: AutomatedStepNode,
  endNode: EndNode,
};
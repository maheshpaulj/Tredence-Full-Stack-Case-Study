"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { AlertCircle, Play, CheckSquare, UserCheck, Zap, Flag } from 'lucide-react';

const ErrorBadge = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md group z-50 cursor-help" title={error}>
      <AlertCircle size={16} />
    </div>
  );
};

// Reusable Large Handle
const CustomHandle = ({ type, position }: { type: 'source' | 'target', position: Position }) => (
  <Handle 
    type={type} 
    position={position} 
    className="!w-4 !h-4 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-600 hover:!scale-125 transition-transform z-20" 
  />
);

export const StartNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`relative flex items-center justify-center min-w-[140px] px-6 py-3 bg-white border-2 rounded-full shadow-sm transition-shadow ${selected ? 'border-indigo-500 shadow-indigo-200 shadow-lg ring-4 ring-indigo-100' : 'border-green-500 hover:shadow-md'}`} style={{ backgroundColor: data.bgColor || 'white' }}>
    <ErrorBadge error={data.error} />
    <div className="flex items-center gap-2 text-green-700">
      <Play size={16} className="fill-current" />
      <span className="font-bold text-sm tracking-wide">{data.title || "Start"}</span>
    </div>
    <CustomHandle type="source" position={Position.Bottom} />
  </div>
);

export const TaskNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`relative flex flex-col min-w-[160px] bg-white border-2 rounded-lg shadow-sm transition-shadow ${selected ? 'border-indigo-500 shadow-indigo-200 shadow-lg ring-4 ring-indigo-100' : 'border-gray-300 hover:shadow-md'}`} style={{ backgroundColor: data.bgColor || 'white' }}>
    <ErrorBadge error={data.error} />
    <CustomHandle type="target" position={Position.Top} />
    
    <div className="bg-gray-100 rounded-t-md px-3 py-1.5 border-b border-inherit flex items-center gap-2 text-gray-700">
      <CheckSquare size={14} />
      <span className="font-bold text-xs uppercase tracking-wider">Task</span>
    </div>
    <div className="p-3 flex flex-col">
      <span className="text-sm font-semibold text-gray-900">{data.title || "Manual Task"}</span>
      <span className="text-[10px] text-gray-500 mt-1">{data.assignee || "Unassigned"}</span>
    </div>

    <CustomHandle type="source" position={Position.Bottom} />
  </div>
);

export const ApprovalNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className="relative group">
    {/* Parallelogram Base */}
    <div className={`absolute inset-0 bg-white border-2 -skew-x-[15deg] shadow-sm transition-all rounded-md ${selected ? 'border-indigo-500 shadow-indigo-200 shadow-lg ring-4 ring-indigo-100' : 'border-orange-400 group-hover:shadow-md'}`} style={{ backgroundColor: data.bgColor || 'white' }} />
    
    <ErrorBadge error={data.error} />
    <CustomHandle type="target" position={Position.Top} />
    
    {/* Un-skewed Content Wrapper */}
    <div className="relative px-8 py-4 flex flex-col items-center justify-center text-center z-10 min-w-[180px]">
      <UserCheck size={18} className="text-orange-500 mb-1" />
      <span className="font-bold text-sm text-gray-900">{data.title || "Approval"}</span>
      <span className="text-[10px] text-orange-600 font-semibold mt-1">{data.approverRole || "Any Role"}</span>
    </div>

    <CustomHandle type="source" position={Position.Bottom} />
  </div>
);

export const AutomatedStepNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`relative flex flex-col min-w-[160px] bg-white border-2 border-dashed shadow-sm transition-shadow rounded-lg ${selected ? 'border-indigo-500 shadow-indigo-200 shadow-lg ring-4 ring-indigo-100 border-solid' : 'border-blue-400 hover:shadow-md'}`} style={{ backgroundColor: data.bgColor || 'white' }}>
    <ErrorBadge error={data.error} />
    <CustomHandle type="target" position={Position.Top} />
    
    <div className="p-3 flex items-center gap-3">
      <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
        <Zap size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900">{data.title || "Automated"}</span>
        <span className="text-[10px] text-gray-500">{data.actionId || "No action"}</span>
      </div>
    </div>

    <CustomHandle type="source" position={Position.Bottom} />
  </div>
);

export const EndNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`relative flex items-center justify-center min-w-[140px] px-6 py-3 bg-white border-2 rounded-full shadow-sm transition-shadow ${selected ? 'border-indigo-500 shadow-indigo-200 shadow-lg ring-4 ring-indigo-100' : 'border-red-500 hover:shadow-md'}`} style={{ backgroundColor: data.bgColor || 'white' }}>
    <ErrorBadge error={data.error} />
    <CustomHandle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 text-red-700">
      <Flag size={16} className="fill-current" />
      <span className="font-bold text-sm tracking-wide">{data.title || "End"}</span>
    </div>
  </div>
);

export const nodeTypes = {
  startNode: StartNode,
  taskNode: TaskNode,
  approvalNode: ApprovalNode,
  automatedNode: AutomatedStepNode,
  endNode: EndNode,
};
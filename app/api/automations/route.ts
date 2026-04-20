import { NextResponse } from 'next/server';

const AUTOMATIONS = [
  { id: 'send_email',    label: 'Send Email',          params: ['to', 'subject'] },
  { id: 'generate_doc',  label: 'Generate Document',   params: ['template', 'recipient'] },
  { id: 'webhook',       label: 'Trigger Webhook',      params: ['url'] },
  { id: 'update_status', label: 'Update HRIS',          params: ['employeeId', 'newStatus'] },
  { id: 'notify_slack',  label: 'Notify Slack Channel', params: ['channel', 'message'] },
  { id: 'create_ticket', label: 'Create JIRA Ticket',   params: ['project', 'summary'] },
];

export async function GET() {
  return NextResponse.json(AUTOMATIONS, { status: 200 });
}

import React, { useState } from 'react';
import { Bot, Terminal, Play, Cpu, RefreshCw, Send } from 'lucide-react';

export default function AIAgentConsole() {
  const [selectedTool, setSelectedTool] = useState('get_platform_statistics');
  const [argsInput, setArgsInput] = useState('{\n  "forceRefresh": false\n}');
  const [output, setOutput] = useState('// Select an MCP tool or click "Execute MCP Tool" to simulate AI Assistant query');
  const [executing, setExecuting] = useState(false);

  const mcpTools = [
    {
      name: 'get_platform_statistics',
      label: 'get_platform_statistics()',
      description: 'Fetches active subscribers, MRR, ARR, total revenue & churn rate.',
      defaultArgs: '{\n  "forceRefresh": false\n}'
    },
    {
      name: 'get_subscriber_details',
      label: 'get_subscriber_details(email)',
      description: 'Queries active subscription status for a specific user.',
      defaultArgs: '{\n  "email": "john.doe@example.com"\n}'
    },
    {
      name: 'get_expiring_subscriptions',
      label: 'get_expiring_subscriptions(days)',
      description: 'Fetches subscriptions approaching renewal within N days.',
      defaultArgs: '{\n  "daysThreshold": 7\n}'
    },
    {
      name: 'trigger_renewal_reminder',
      label: 'trigger_renewal_reminder(payload)',
      description: 'Dispatches asynchronous renewal alert email via BullMQ queue.',
      defaultArgs: '{\n  "userEmail": "john.doe@example.com",\n  "planName": "Pro Plan"\n}'
    }
  ];

  const handleToolSelect = (tool) => {
    setSelectedTool(tool.name);
    setArgsInput(tool.defaultArgs);
  };

  const handleExecuteTool = async () => {
    try {
      setExecuting(true);
      setOutput('// Executing MCP Tool via HTTP Bridge...');
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(argsInput);
      } catch (e) {
        setOutput(`// JSON Error: Invalid arguments JSON formatting\n${e.message}`);
        setExecuting(false);
        return;
      }

      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: selectedTool,
          args: parsedArgs
        })
      });

      const json = await res.json();
      setOutput(JSON.stringify(json.result || json, null, 2));
    } catch (err) {
      setOutput(`// MCP Execution Error:\n${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Model Context Protocol (MCP) AI Interface</h2>
          <p className="page-description">
            Test and interact with the custom MCP Server endpoints exposed for AI Assistants (Claude Desktop, Antigravity AI, LLMs)
          </p>
        </div>
      </div>

      <div className="console-wrapper">
        {/* Left MCP Tool Selector Sidebar */}
        <div className="tools-sidebar">
          <div className="sidebar-title">Exposed MCP Tools</div>
          {mcpTools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => handleToolSelect(tool)}
              className={`tool-button ${selectedTool === tool.name ? 'active' : ''}`}
            >
              <Cpu size={16} />
              <div>
                <div>{tool.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px' }}>
                  {tool.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Terminal & Argument Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tool Argument Configurator */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Tool Arguments (JSON Payload)
              </span>
              <button onClick={handleExecuteTool} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} disabled={executing}>
                <Send size={14} />
                {executing ? 'Executing Tool...' : `Execute ${selectedTool}`}
              </button>
            </div>
            <textarea
              value={argsInput}
              onChange={(e) => setArgsInput(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: '#050811',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Terminal Output */}
          <div className="console-terminal">
            <div className="terminal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14} color="#10b981" />
                <span>MCP Server Response JSON</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>stdio / HTTP JSON-RPC 2.0</span>
            </div>
            <pre className="code-output">{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

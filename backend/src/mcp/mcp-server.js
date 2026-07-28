import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getPlatformAnalytics } from '../services/analytics.service.js';
import { pool } from '../config/db.js';
import { enqueueRenewalReminder } from '../services/queue.service.js';

const server = new Server(
    {
        name: 'saas-analytics-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Register Available Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_platform_statistics',
                description: 'Retrieve real-time SaaS platform statistics including active subscribers, MRR, ARR, total revenue, churn rate, and plan breakdowns.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        forceRefresh: {
                            type: 'boolean',
                            description: 'Bypass Redis cache and query PostgreSQL directly'
                        }
                    }
                }
            },
            {
                name: 'get_subscriber_details',
                description: 'Retrieve subscription profile and active status for a specific user by email.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            description: 'User email address to query'
                        }
                    },
                    required: ['email']
                }
            },
            {
                name: 'get_expiring_subscriptions',
                description: 'Retrieve subscriptions that will expire within the next N days.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        daysThreshold: {
                            type: 'number',
                            description: 'Number of days to check for upcoming expiration (default: 7)'
                        }
                    }
                }
            },
            {
                name: 'trigger_renewal_reminder',
                description: 'Enqueue an asynchronous renewal reminder email job via BullMQ for a subscriber.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        userEmail: { type: 'string' },
                        userName: { type: 'string' },
                        planName: { type: 'string' },
                        periodEnd: { type: 'string' }
                    },
                    required: ['userEmail', 'planName']
                }
            }
        ]
    };
});

// Handle Tool Execution Requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'get_platform_statistics': {
                const forceRefresh = Boolean(args?.forceRefresh);
                const stats = await getPlatformAnalytics(forceRefresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(stats, null, 2)
                        }
                    ]
                };
            }

            case 'get_subscriber_details': {
                const { email } = args;
                const result = await pool.query(
                    `SELECT s.*, u.name, u.email 
                     FROM subscriptions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE u.email = $1 
                     ORDER BY s.created_at DESC LIMIT 1`,
                    [email]
                );

                if (result.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ message: `No active subscriber found for email: ${email}` })
                            }
                        ]
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows[0], null, 2)
                        }
                    ]
                };
            }

            case 'get_expiring_subscriptions': {
                const days = args?.daysThreshold || 7;
                const result = await pool.query(
                    `SELECT s.id, s.plan_name, s.current_period_end, u.email, u.name 
                     FROM subscriptions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE s.status = 'active' 
                       AND s.current_period_end <= NOW() + (INTERVAL '1 day' * $1)
                     ORDER BY s.current_period_end ASC`,
                    [days]
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ expiringCount: result.rows.length, subscriptions: result.rows }, null, 2)
                        }
                    ]
                };
            }

            case 'trigger_renewal_reminder': {
                const { userEmail, userName = 'Subscriber', planName, periodEnd = new Date().toISOString() } = args;
                const job = await enqueueRenewalReminder({ userEmail, userName, planName, periodEnd });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, jobId: job.id, message: `Renewal reminder enqueued for ${userEmail}` })
                        }
                    ]
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (err) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error executing tool ${name}: ${err.message}`
                }
            ]
        };
    }
});

export async function runMcpServer() {
    // Redirect console.log to console.error so stdout is 100% clean for JSON-RPC messages
    console.log = console.error;
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Server running on stdio');
}

if (process.argv[1]?.endsWith('mcp-server.js')) {
    runMcpServer().catch((err) => {
        console.error('Fatal MCP Server Error:', err);
        process.exit(1);
    });
}

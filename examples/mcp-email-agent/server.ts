import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createPeffle } from "../../src/core/index.js";
import { parsePolicyConfig } from "../../src/core/schema.js";
import { guardTool } from "../../src/mcp/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const storagePath = process.env.PEFFLE_STORAGE ?? join(__dirname, ".peffle/ledger.db");
const policyPath = process.env.PEFFLE_POLICY ?? join(__dirname, "peffle.policy.json");
const agentId = process.env.PEFFLE_AGENT_ID ?? "mcp-email-agent";

const ra = createPeffle({
  storagePath,
  policy: parsePolicyConfig(readFileSync(policyPath, "utf8")),
});

const server = new McpServer({ name: "peffle-email-demo", version: "0.1.0" });
const guardOpts = { peffle: ra, agentId };

function asToolResult(out: unknown) {
  if (out && typeof out === "object" && "isError" in out) {
    return out as {
      content: { type: "text"; text: string }[];
      isError: true;
      peffleApprovalRequired?: boolean;
      eventId?: string;
      redemptionHandle?: string;
    };
  }
  return { content: [{ type: "text" as const, text: JSON.stringify(out) }] };
}

server.registerTool(
  "send_email",
  { description: "Send a mock email (cost 1 unit)", inputSchema: {} },
  async () => {
    const run = guardTool(async () => ({ ok: true }), "send_email", guardOpts);
    return asToolResult(await run({ amount: 1 }));
  }
);

server.registerTool(
  "send_invoice",
  {
    description: "Send a mock invoice",
    inputSchema: {
      amount: z.number().describe("Invoice amount in dollars"),
      peffleApproval: z
        .object({
          handle: z.string().optional(),
          eventId: z.string().optional(),
          token: z.string().optional(),
        })
        .optional()
        .describe("Redemption handle (preferred) or eventId+token from a prior approval-required response"),
    },
  },
  async ({ amount, peffleApproval }) => {
    const run = guardTool(
      async (a: { amount: number }) => ({ ok: true, amount: a.amount }),
      "send_invoice",
      guardOpts
    );
    return asToolResult(await run({ amount, peffleApproval }));
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", () => {
  ra.close();
  process.exit(0);
});

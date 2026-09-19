#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRightAuth, DEFAULT_POLICY_EXAMPLE } from "../core/index.js";

function openRightAuth(storage?: string, policy?: string) {
  return createRightAuth({
    storagePath: storage ?? process.env.RIGHTAUTH_STORAGE ?? "./.rightauth/ledger.db",
    policyPath: policy ?? process.env.RIGHTAUTH_POLICY ?? "./rightauth.policy.json",
  });
}

const program = new Command();

program
  .name("rightauth")
  .description("Local policy, kill switch, and audit ledger for AI agents")
  .option("--storage <path>", "SQLite ledger path", process.env.RIGHTAUTH_STORAGE)
  .option("--policy <path>", "Policy JSON path", process.env.RIGHTAUTH_POLICY);

program
  .command("init")
  .description("Scaffold a starter rightauth.policy.json")
  .action(() => {
    const path = resolve("rightauth.policy.json");
    if (existsSync(path)) {
      console.error("rightauth.policy.json already exists");
      process.exit(1);
    }
    writeFileSync(path, JSON.stringify(DEFAULT_POLICY_EXAMPLE, null, 2) + "\n");
    console.log(`Wrote ${path}`);
  });

program
  .command("status")
  .option("--agent <id>", "Filter by agent")
  .action((opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      if (opts.agent) {
        const killed = ra.query({ agentId: opts.agent, limit: 1 });
        console.log(`Agent ${opts.agent}: see ledger for activity (${killed.length} recent events)`);
      } else {
        console.log("RightAuth ledger active. Use `rightauth ledger` for details.");
      }
    } finally {
      ra.close();
    }
  });

program
  .command("ledger")
  .option("--agent <id>")
  .option("--status <s>")
  .option("--since <iso>")
  .option("--limit <n>")
  .option("--json", "JSON output")
  .action((opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      const events = ra.query({
        agentId: opts.agent,
        status: opts.status,
        since: opts.since,
        limit: opts.limit ? Number(opts.limit) : undefined,
      });
      if (opts.json) {
        console.log(JSON.stringify(events, null, 2));
      } else {
        for (const e of events) {
          console.log(
            `${e.createdAt}  ${e.id}  ${e.agent.agentId}  ${e.action}  ${e.status}  ${e.amount ?? ""}`
          );
        }
      }
    } finally {
      ra.close();
    }
  });

program
  .command("pending")
  .description("List pending approval events")
  .action((_opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      const events = ra.query({ status: "pending" });
      for (const e of events) {
        console.log(`${e.id}  agent=${e.agent.agentId}  action=${e.action}  amount=${e.amount ?? ""}`);
      }
    } finally {
      ra.close();
    }
  });

program
  .command("approve <eventId>")
  .option("--note <text>")
  .action((eventId: string, opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      ra.approve(eventId, { note: opts.note });
      console.log(`Approved ${eventId}`);
    } finally {
      ra.close();
    }
  });

program
  .command("revoke <eventId>")
  .description("Revoke an approved-but-unredeemed grant")
  .option("--note <text>")
  .action((eventId: string, opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      ra.revoke(eventId, { note: opts.note });
      console.log(`Revoked approval for ${eventId}`);
    } finally {
      ra.close();
    }
  });

program
  .command("deny <eventId>")
  .option("--note <text>")
  .action((eventId: string, opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      ra.deny(eventId, { note: opts.note });
      console.log(`Denied ${eventId}`);
    } finally {
      ra.close();
    }
  });

program
  .command("kill <agentId>")
  .option("--reason <text>")
  .action((agentId: string, opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      ra.kill(agentId, { reason: opts.reason });
      console.log(`Killed agent ${agentId}`);
    } finally {
      ra.close();
    }
  });

program
  .command("revive <agentId>")
  .option("--reason <text>")
  .action((agentId: string, _opts, cmd) => {
    const globals = cmd.optsWithGlobals();
    const ra = openRightAuth(globals.storage, globals.policy);
    try {
      ra.revive(agentId);
      console.log(`Revived agent ${agentId}`);
    } finally {
      ra.close();
    }
  });

program.parse();

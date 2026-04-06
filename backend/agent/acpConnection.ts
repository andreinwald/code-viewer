import type { ClientSideConnection } from '@agentclientprotocol/sdk';
import { acpClient } from './acpClient';
import { createRequire } from 'node:module';

let connectionPromise: Promise<ClientSideConnection> | null = null;

const req = createRequire(__filename)
const agentRunners = {
    cursor: { bin: `${process.env.HOME}/.local/bin/agent`, args: ['acp'] },
    claude: { bin: process.execPath, args: [req.resolve('@agentclientprotocol/claude-agent-acp/dist/index.js')] },
}

export async function getAcpConnection(): Promise<ClientSideConnection> {
    if (!connectionPromise) {
        connectionPromise = initConnection();
    }
    return connectionPromise;
}

async function initConnection(): Promise<ClientSideConnection> {
    const { spawn } = await import('node:child_process');
    const { Readable, Writable } = await import('node:stream');
    const { ClientSideConnection, ndJsonStream, PROTOCOL_VERSION } = await import('@agentclientprotocol/sdk');


    const runner = agentRunners.cursor;
    const agentProcess = spawn(runner.bin, runner.args, {
        stdio: ['pipe', 'pipe', 'inherit'],
        env: {
            HOME: process.env.HOME,
            PATH: process.env.PATH,
        },
    });

    const input = Writable.toWeb(agentProcess.stdin!);
    const output = Readable.toWeb(agentProcess.stdout!) as ReadableStream<Uint8Array>;
    const stream = ndJsonStream(input, output);

    const connection = new ClientSideConnection(() => acpClient, stream);
    await connection.initialize({ protocolVersion: PROTOCOL_VERSION, clientCapabilities: {} });
    return connection;
}
#!/usr/bin/env node
// One command for the phone demo on Windows, macOS and Linux:
//
//   node scripts/demo.mjs
//
// It starts PostgreSQL and Spring Boot in Docker (reachable on the Wi-Fi), then Expo for Expo Go with this
// computer's LAN address in the QR code. Needs Docker Desktop running and Node.
//
// Flags when a default port is taken: --postgres-port 5434  --server-port 8081  --expo-port 8082
// Flag to force the address:          --lan-ip 192.168.0.10
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { connect, createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const fail = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

function lanAddress() {
  const virtual = /^(lo|docker|br-|veth|utun|awdl|llw|vethernet|vmnet|vboxnet|tailscale|zt)/i;
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => !virtual.test(name))
    .flatMap(([, list]) => list ?? [])
    .filter((item) => item.family === 'IPv4' && !item.internal);
  const isPrivate = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  return (candidates.find((item) => isPrivate(item.address)) ?? candidates[0])?.address;
}

// A port is busy when something answers on it (IPv4 or IPv6) or when it cannot be bound.
function accepts(port, host) {
  return new Promise((resolve) => {
    const socket = connect({ port, host });
    socket.setTimeout(500);
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('timeout', () => (socket.destroy(), resolve(false)));
    socket.once('error', () => resolve(false));
  });
}

async function portIsFree(port) {
  if ((await accepts(port, '127.0.0.1')) || (await accepts(port, '::1'))) return false;
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port);
  });
}

const ip = flag('lan-ip', lanAddress());
if (!ip) fail('No network address found. Connect to Wi-Fi (or a phone hotspot), or pass --lan-ip <address>.');

const serverPort = flag('server-port', '8080');
const postgresPort = flag('postgres-port', '5432');
const expoPort = flag('expo-port', '8081');

if (spawnSync('docker', ['info'], { stdio: 'ignore', shell: true }).status !== 0) {
  fail('Docker is not running. Start Docker Desktop, wait until it is ready, then run this again.');
}
// Containers from a previous run of this script are reused by Compose; only Expo needs a free port.
if (!(await portIsFree(Number(expoPort)))) {
  fail(`Port ${expoPort} is busy (another Expo?). Run again with --expo-port <free port>.`);
}

console.log(`Computer address: ${ip}`);
console.log('Starting PostgreSQL and Spring Boot (the first build takes a few minutes)...');
const compose = spawnSync('docker', ['compose', 'up', '-d', '--build', '--wait', 'postgres', 'backend'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    BIND_ADDRESS: '0.0.0.0',
    SERVER_PORT: serverPort,
    POSTGRES_PORT: postgresPort,
  },
});
if (compose.status !== 0) {
  fail(
    'Docker Compose failed. If a port is busy, add --postgres-port <free port> or --server-port <free port>.',
  );
}
console.log(`Spring is up: http://${ip}:${serverPort}/api/status`);

const frontend = join(root, 'frontend');
if (!existsSync(join(frontend, 'node_modules'))) {
  console.log('Installing app dependencies (first run only)...');
  if (spawnSync('npm', ['ci'], { cwd: frontend, stdio: 'inherit', shell: true }).status !== 0) {
    fail('npm ci failed. Check the Node version (see .nvmrc) and your internet connection.');
  }
}

// The app finds Spring at the same host as Expo on port 8080, unless EXPO_PUBLIC_API_URL says otherwise.
const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: ip };
delete env.EXPO_PUBLIC_API_URL;
if (serverPort !== '8080') env.EXPO_PUBLIC_API_URL = `http://${ip}:${serverPort}`;

console.log('\nScan the QR code with Expo Go. Phones and this computer must be on the same Wi-Fi.');
console.log('Phone 1: choose "I\'m Maria". Phone 2: choose "I\'m Nikita". Stop Expo with Ctrl+C.');
console.log('If the Wi-Fi changes the address changes too: run this script again for a new QR code.\n');
const expo = spawn('npx', ['expo', 'start', '--lan', '--port', expoPort], {
  cwd: frontend,
  stdio: 'inherit',
  shell: true,
  env,
});
expo.on('exit', (code) => process.exit(code ?? 0));

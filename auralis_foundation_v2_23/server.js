const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8800;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'auralis-db.json');
const DEVICE_ID = 'oppo-f19';
const DEVICE_TOKEN = 'auralis-demo-token-4729';

function now(){ return new Date().toISOString(); }
function sha(x){ return crypto.createHash('sha256').update(String(x)).digest('hex'); }
function token(){ return crypto.randomBytes(24).toString('hex'); }

function defaultDevice(){
  return {
    id: DEVICE_ID,
    ownerId: 'user-demo',
    name: 'OPPO F19 Pro',
    model: 'OPPO F19 Pro',
    token: DEVICE_TOKEN,
    mode: 'STANDBY',
    battery: null,
    network: 'offline',
    lat: null,
    lng: null,
    accuracy: null,
    lastUpdate: null,
    lastMap: '',
    commandCounter: 0,
    latestCommandId: null,
    commands: [],
    events: [],
    bridge: {
      pollerEnabled: true,
      lastPollAt: null,
      lastPollResponse: 'NONE',
      lastCommandId: null,
      lastCommandAt: null,
      lastResultAt: null,
      lastResult: ''
    },
    config: {
      recoveryEnabled: false,
      trackingIntervalSec: 30,
      pollingIntervalSec: 5,
      powerSaveTrackingIntervalSec: 120,
      lowBatteryThreshold: 20,
      ringDurationSec: 15,
      voiceAlertText: 'This phone is protected by Auralis Beacon. Please return it to the owner.',
      allowedCommands: ['RESUME_RECOVERY','NORMAL_TRACKING','POWER_SAVE','RING','STOP_RING','STOP_RECOVERY','SET_VOLUME']
    }
  };
}

function defaultDb(){
  return {
    meta: { version: '2.23', createdAt: now() },
    users: [{ id: 'user-demo', name: 'Auralis Owner', email: 'owner@auralis.local', passwordHash: sha('Auralis@4729') }],
    sessions: {},
    devices: [defaultDevice()]
  };
}

function loadDb(){
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    db.meta = db.meta || { version: '2.23', createdAt: now() };
    db.users = db.users || [];
    db.sessions = db.sessions || {};
    db.devices = db.devices || [];

    let demo = db.users.find(u => String(u.email).toLowerCase() === 'owner@auralis.local');
    if (!demo) db.users.push(defaultDb().users[0]);
    else {
      demo.name = demo.name || 'Auralis Owner';
      demo.passwordHash = sha('Auralis@4729');
    }

    let d = db.devices.find(x => x.id === DEVICE_ID);
    if (!d) db.devices.push(defaultDevice());
    else {
      const def = defaultDevice();
      d.ownerId = d.ownerId || 'user-demo';
      d.name = d.name || def.name;
      d.model = d.model || def.model;
      d.token = DEVICE_TOKEN;
      d.mode = d.mode || 'STANDBY';
      d.commands = Array.isArray(d.commands) ? d.commands : [];
      d.events = Array.isArray(d.events) ? d.events : [];
      d.commandCounter = Number(d.commandCounter || 0);
      d.config = Object.assign({}, def.config, d.config || {});
      d.config.allowedCommands = Array.from(new Set([...(d.config.allowedCommands || []), 'STOP_RING']));
      d.bridge = Object.assign({}, def.bridge, d.bridge || {});
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  } catch (e) {
    const db = defaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
}

let db = loadDb();
function save(){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function headers(type){
  return {
    'Content-Type': type,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auralis-session, x-auralis-token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
}
function send(res, status, type, data){ res.writeHead(status, headers(type)); res.end(data); }
function json(res, obj, status=200){ send(res, status, 'application/json', JSON.stringify(obj)); }
function notFound(res){ json(res, { ok:false, error:'NOT_FOUND' }, 404); }
function readRaw(req){ return new Promise(resolve => { let s=''; req.on('data', c => s += c); req.on('end', () => resolve(s)); }); }
async function readBody(req){
  const raw = await readRaw(req);
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) { try { return JSON.parse(raw || '{}'); } catch { return {}; } }
  if (ct.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  try { return JSON.parse(raw || '{}'); } catch { return { raw }; }
}
function userFromSession(req){
  const sid = req.headers['x-auralis-session'];
  if (!sid || !db.sessions[sid]) return null;
  return db.users.find(u => u.id === db.sessions[sid].userId) || null;
}
function device(){ return db.devices.find(d => d.id === DEVICE_ID); }
function checkDeviceToken(req, u, d){ return (req.headers['x-auralis-token'] || u.searchParams.get('token') || '') === d.token; }
function event(d, type, detail={}){ d.events.push({ ts: now(), type, ...detail }); d.events = d.events.slice(-500); }
function publicCommand(c){
  return {
    id: c.id, command: c.command, payload:c.payload || {}, status: c.status, source: c.source || 'dashboard', detail: c.detail || '',
    createdAt: c.createdAt, receivedAt: c.receivedAt || null, completedAt: c.completedAt || null, failedAt: c.failedAt || null
  };
}
function publicDevice(d){
  return {
    id:d.id, name:d.name, model:d.model, protectionStatus:'PROTECTED', setupComplete:true, recoveryActive:(d.config && d.config.recoveryEnabled) || ['BOOTED','LIVE_TRACKING','POWER_SAVE'].includes(String(d.mode).toUpperCase()), sharedData:{ liveLocation: ['BOOTED','LIVE_TRACKING','POWER_SAVE'].includes(String(d.mode).toUpperCase()), battery:true, network:true, commandStatus:true }, mode:d.mode, battery:d.battery, network:d.network,
    lat:d.lat, lng:d.lng, accuracy:d.accuracy, lastUpdate:d.lastUpdate, lastMap:d.lastMap,
    commandCounter:d.commandCounter, latestCommandId:d.latestCommandId,
    latestCommand:d.commands.find(c => c.id === d.latestCommandId) || null,
    pendingCount:d.commands.filter(c => c.status === 'PENDING').length,
    commands:d.commands.slice(-60).reverse().map(publicCommand),
    events:d.events.slice(-150).reverse(),
    config:d.config,
    bridge:d.bridge || {}
  };
}


function applyCompletedCommand(d, c){
  if (!c) return;
  if (c.command === 'STOP_RECOVERY') {
    d.mode = 'STOPPED';
    d.config.recoveryEnabled = false;
    d.sharedData = Object.assign({}, d.sharedData || {}, { liveLocation:false });
    d.network = d.network || 'SERVER_STOP';
  }
  if (c.command === 'POWER_SAVE') {
    d.mode = 'POWER_SAVE';
    d.config.recoveryEnabled = true;
  }
  if (['NORMAL_TRACKING','RESUME_RECOVERY','START_RECOVERY'].includes(c.command)) {
    d.mode = 'LIVE_TRACKING';
    d.config.recoveryEnabled = true;
  }
  if (c.command === 'RING') {
    d.config.recoveryEnabled = true;
  }
  if (c.command === 'STOP_RING') {
    d.config.recoveryEnabled = true;
  }
}
function setCommandStatus(d, c, status, detail){
  if (!c) return null;
  status = String(status || '').trim().toUpperCase();
  if (!['RECEIVED','COMPLETED','FAILED'].includes(status)) status = 'COMPLETED';
  c.status = status;
  c.detail = String(detail || c.detail || '').slice(0,260);
  if (status === 'RECEIVED') c.receivedAt = c.receivedAt || now();
  if (status === 'COMPLETED') {
    c.completedAt = now();
    applyCompletedCommand(d, c);
  }
  if (status === 'FAILED') c.failedAt = now();
  event(d, 'COMMAND_' + status, { id:c.id, command:c.command, detail:c.detail });
  return c;
}

function freshness(d){
  if (!d || !d.lastUpdate) return { fresh:false, ageSec:null };
  const ageSec = Math.max(0, Math.floor((Date.now() - new Date(d.lastUpdate).getTime()) / 1000));
  return { fresh: ageSec <= 120, ageSec };
}
function isStopState(d){
  return String(d.mode || '').toUpperCase() === 'STOPPED';
}

async function handleApi(req, res, u){
  if (req.method === 'OPTIONS') return json(res, { ok:true });
  if (u.pathname === '/api/health') return json(res, { ok:true, version:'2.23', port:PORT, ts:now() });

  if (u.pathname === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const email = String(b.email || b.username || '').trim().toLowerCase();
    const password = String(b.password || '');
    const user = db.users.find(x => String(x.email).toLowerCase() === email || String(x.name || '').toLowerCase() === email);
    if (!user || user.passwordHash !== sha(password)) return json(res, { ok:false, error:'INVALID_LOGIN' }, 401);
    const sid = token();
    db.sessions[sid] = { userId:user.id, createdAt:now() };
    save();
    return json(res, { ok:true, session:sid, user:{ id:user.id, name:user.name, email:user.email } });
  }

  if (u.pathname === '/api/register' && req.method === 'POST') {
    const b = await readBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    if (!email || password.length < 4) return json(res, { ok:false, error:'EMAIL_AND_PASSWORD_REQUIRED' }, 400);
    if (db.users.some(x => String(x.email).toLowerCase() === email)) return json(res, { ok:false, error:'EMAIL_EXISTS' }, 409);
    const user = { id:'user-' + crypto.randomBytes(5).toString('hex'), name:b.name || 'Auralis User', email, passwordHash:sha(password) };
    db.users.push(user); save();
    return json(res, { ok:true, user:{ id:user.id, name:user.name, email:user.email } });
  }

  if (u.pathname === '/api/me') {
    const user = userFromSession(req);
    if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
    return json(res, { ok:true, user:{ id:user.id, name:user.name, email:user.email } });
  }

  if (u.pathname === '/api/devices') {
    const user = userFromSession(req);
    if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
    return json(res, { ok:true, devices:db.devices.filter(d => d.ownerId === user.id).map(publicDevice) });
  }

  if (u.pathname === '/api/register-device' && req.method === 'POST') {
    const user = userFromSession(req);
    if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
    const b = await readBody(req);
    let d = db.devices.find(x => x.id === DEVICE_ID);
    if (!d) { d = defaultDevice(); db.devices.push(d); }
    d.ownerId = user.id;
    d.name = String(b.name || d.name || 'Protected Phone');
    d.model = String(b.model || d.model || 'Android Device');
    d.protectionStatus = 'PROTECTED';
    d.setupComplete = true;
    event(d, 'DEVICE_REGISTERED', { name:d.name, model:d.model });
    save();
    return json(res, { ok:true, device:publicDevice(d), token:d.token });
  }

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts[0] === 'api' && parts[1] === 'device' && parts[2]) {
    const d = db.devices.find(x => x.id === parts[2]);
    if (!d) return json(res, { ok:false, error:'DEVICE_NOT_FOUND' }, 404);
    const action = parts[3] || '';

    if (action === 'state') {
      const user = userFromSession(req);
      if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
      return json(res, { ok:true, device:publicDevice(d) });
    }

    if (action === 'config') {
      if (req.method === 'GET') {
        if (!checkDeviceToken(req, u, d) && !userFromSession(req)) return json(res, { ok:false, error:'AUTH_OR_TOKEN_REQUIRED' }, 401);
        return json(res, { ok:true, deviceId:d.id, config:d.config, serverTime:now() });
      }
      if (req.method === 'POST') {
        const user = userFromSession(req);
        if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
        const b = await readBody(req);
        const next = {};
        for (const k of ['trackingIntervalSec','pollingIntervalSec','powerSaveTrackingIntervalSec','lowBatteryThreshold','ringDurationSec']) {
          if (b[k] !== undefined && b[k] !== '') next[k] = Math.max(1, Number(b[k]));
        }
        if (b.recoveryEnabled !== undefined) next.recoveryEnabled = !!b.recoveryEnabled;
        if (b.voiceAlertText !== undefined) next.voiceAlertText = String(b.voiceAlertText).slice(0,180);
        d.config = Object.assign({}, d.config, next);
        event(d, 'CONFIG_UPDATED', next);
        save();
        return json(res, { ok:true, config:d.config });
      }
    }

    if (action === 'command' && req.method === 'POST') {
      const user = userFromSession(req);
      if (!user) return json(res, { ok:false, error:'AUTH_REQUIRED' }, 401);
      const b = await readBody(req);
      const command = String(b.command || '').trim().toUpperCase();
      if (!command) return json(res, { ok:false, error:'COMMAND_REQUIRED' }, 400);
      d.config.allowedCommands = Array.from(new Set([...(d.config.allowedCommands || []), 'STOP_RING']));
      if (!d.config.allowedCommands.includes(command)) return json(res, { ok:false, error:'COMMAND_NOT_ALLOWED', allowed:d.config.allowedCommands }, 400);
      d.commandCounter += 1;
      const payload = (b.payload && typeof b.payload === 'object') ? b.payload : {}; if(command === 'SET_VOLUME'){ payload.level = Math.max(0, Math.min(100, Number(payload.level ?? b.level ?? 70))); payload.stream = String(payload.stream || b.stream || 'alarm'); } const c = { id:d.commandCounter, command, payload, status:'PENDING', source:'dashboard', detail:String(b.detail || ''), createdAt:now() };
      d.commands.push(c); d.commands = d.commands.slice(-200); d.latestCommandId = c.id;
      if (command === 'STOP_RECOVERY') d.config.recoveryEnabled = false;
      if (['START_RECOVERY','RESUME_RECOVERY','NORMAL_TRACKING','POWER_SAVE','RING','SILENT','SEND_STATUS','REQUEST_LOCATION','SET_VOLUME'].includes(command)) d.config.recoveryEnabled = true;
      event(d, 'COMMAND_CREATED', { id:c.id, command:c.command, status:c.status });
      save();
      return json(res, { ok:true, command:publicCommand(c), device:publicDevice(d) });
    }

    if (action === 'latest-command') {
      if (!checkDeviceToken(req, u, d)) return json(res, { ok:false, error:'BAD_DEVICE_TOKEN' }, 401);
      const c = d.commands.find(x => x.status === 'PENDING') || d.commands.slice().reverse().find(x => x.status === 'RECEIVED');
      return json(res, { ok:true, command:c ? publicCommand(c) : null, config:d.config, serverTime:now() });
    }



    if (action === 'reset-state') {
      if (!checkDeviceToken(req, u, d)) return send(res, 401, 'text/plain', 'ERROR:BAD_DEVICE_TOKEN');
      d.mode = 'STANDBY';
      d.battery = null;
      d.network = 'offline';
      d.lat = null;
      d.lng = null;
      d.accuracy = null;
      d.lastUpdate = null;
      d.lastMap = '';
      d.config.recoveryEnabled = false;
      d.sharedData = Object.assign({}, d.sharedData || {}, { liveLocation:false });
      d.bridge = Object.assign({}, d.bridge || {}, { lastPollAt:null, lastPollResponse:'NONE', lastCommandId:null, lastCommandAt:null, lastResultAt:null, lastResult:'' });
      d.commands = [];
      event(d, 'DEMO_RESET', { detail:'Device state reset for clean demo' });
      save();
      return send(res, 200, 'text/plain', 'OK:RESET');
    }

    if (action === 'force-stop') {
      if (!checkDeviceToken(req, u, d)) return send(res, 401, 'text/plain', 'ERROR:BAD_DEVICE_TOKEN');
      d.mode = 'STOPPED';
      d.network = u.searchParams.get('network') || 'FORCE_STOP';
      d.config.recoveryEnabled = false;
      d.sharedData = Object.assign({}, d.sharedData || {}, { liveLocation:false });
      d.lastUpdate = now();
      event(d, 'FORCE_STOP', { network:d.network });
      save();
      return send(res, 200, 'text/plain', 'OK:STOPPED');
    }

    if (action === 'macro-poll') {
      if (!checkDeviceToken(req, u, d)) return send(res, 401, 'text/plain', 'ERROR:BAD_DEVICE_TOKEN');
      d.bridge = d.bridge || {};
      d.bridge.lastPollAt = now();
      const c = d.commands.find(x => x.status === 'PENDING');
      if (!c) {
        d.bridge.lastPollResponse = 'NONE';
        save();
        return send(res, 200, 'text/plain', 'NONE');
      }
      setCommandStatus(d, c, 'RECEIVED', 'MacroDroid command poller received command');
      d.bridge.lastPollResponse = 'CMD:' + c.command + ';ID:' + c.id;
      d.bridge.lastCommandId = c.id;
      d.bridge.lastCommandAt = now();
      save();
      return send(res, 200, 'text/plain', 'CMD:' + c.command + ';ID:' + c.id);
    }

    if (action === 'macro-complete' || action === 'macro-result') {
      if (!checkDeviceToken(req, u, d)) return send(res, 401, 'text/plain', 'ERROR:BAD_DEVICE_TOKEN');
      d.bridge = d.bridge || {};
      const id = Number(u.searchParams.get('id') || 0);
      const status = String(u.searchParams.get('status') || 'COMPLETED').toUpperCase();
      const detail = String(u.searchParams.get('detail') || 'MacroDroid executed command');
      let c = id ? d.commands.find(x => x.id === id) : d.commands.slice().reverse().find(x => x.status === 'RECEIVED' || x.status === 'PENDING');
      if (!c) {
        d.bridge.lastResultAt = now();
        d.bridge.lastResult = 'NO_COMMAND';
        save();
        return send(res, 200, 'text/plain', 'NO_COMMAND');
      }
      setCommandStatus(d, c, status, detail);
      d.bridge.lastResultAt = now();
      d.bridge.lastResult = status + ':' + c.command + ';ID:' + c.id;
      save();
      return send(res, 200, 'text/plain', 'OK:' + status + ':' + c.command + ';ID:' + c.id);
    }

    if (action === 'macro-status') {
      if (!checkDeviceToken(req, u, d)) return send(res, 401, 'text/plain', 'ERROR:BAD_DEVICE_TOKEN');
      const b = d.bridge || {};
      return send(res, 200, 'text/plain', [
        'MODE=' + (d.mode || 'STANDBY'),
        'RECOVERY=' + (!!(d.config && d.config.recoveryEnabled)),
        'LAST_POLL=' + (b.lastPollAt || ''),
        'LAST_RESPONSE=' + (b.lastPollResponse || 'NONE'),
        'LAST_RESULT=' + (b.lastResult || '')
      ].join('\n'));
    }

    if (action === 'command-result' && req.method === 'POST') {
      if (!checkDeviceToken(req, u, d)) return json(res, { ok:false, error:'BAD_DEVICE_TOKEN' }, 401);
      const b = await readBody(req);
      const id = Number(b.id || b.commandId || u.searchParams.get('id'));
      const status = String(b.status || '').trim().toUpperCase();
      const c = d.commands.find(x => x.id === id);
      if (!c) return json(res, { ok:false, error:'COMMAND_NOT_FOUND' }, 404);
      if (!['RECEIVED','COMPLETED','FAILED'].includes(status)) return json(res, { ok:false, error:'BAD_STATUS' }, 400);
      setCommandStatus(d, c, status, String(b.detail || b.message || c.detail || ''));
      save();
      return json(res, { ok:true, command:publicCommand(c), device:publicDevice(d) });
    }

    if (['boot','location','status'].includes(action)) {
      if (!checkDeviceToken(req, u, d)) return json(res, { ok:false, error:'BAD_DEVICE_TOKEN' }, 401);
      const b = req.method === 'POST' ? await readBody(req) : {};
      const data = Object.assign({}, Object.fromEntries(u.searchParams), b);
      if (data.mode) d.mode = String(data.mode);
      if (data.battery !== undefined && data.battery !== '') d.battery = String(data.battery).replace('%','');
      if (data.network) d.network = String(data.network);
      if (data.accuracy !== undefined && data.accuracy !== '') d.accuracy = Number(data.accuracy);
      const lat = data.lat ?? data.latitude;
      const lng = data.lng ?? data.lon ?? data.long ?? data.longitude;
      if (lat !== undefined && lng !== undefined && lat !== '' && lng !== '') {
        const nlat = Number(lat), nlng = Number(lng);
        if (!Number.isNaN(nlat) && !Number.isNaN(nlng)) { d.lat = nlat; d.lng = nlng; d.lastMap = data.map || `https://maps.google.com/?q=${d.lat},${d.lng}`; }
      }
      if (action === 'boot') d.config.recoveryEnabled = true;
      if (action === 'status' && d.mode === 'STOPPED') d.config.recoveryEnabled = false;
      d.lastUpdate = now();
      event(d, action.toUpperCase(), { mode:d.mode, battery:d.battery, lat:d.lat, lng:d.lng, network:d.network });
      save();
      return json(res, { ok:true, device:publicDevice(d) });
    }
  }

  return notFound(res);
}

function serve(req, res, u){
  let file = u.pathname === '/' ? 'index.html' : u.pathname.replace(/^\/+/, '');
  if (file === 'agent') file = 'agent.html';
  const full = path.join(PUBLIC, file);
  if (!full.startsWith(PUBLIC) || !fs.existsSync(full)) return send(res, 404, 'text/plain', 'Not found');
  const ext = path.extname(full).toLowerCase();
  const type = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json' }[ext] || 'text/plain';
  send(res, 200, type, fs.readFileSync(full));
}

http.createServer(async (req,res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    if (u.pathname.startsWith('/api/')) return await handleApi(req, res, u);
    return serve(req, res, u);
  } catch (e) {
    return json(res, { ok:false, error:e.message }, 500);
  }
}).listen(PORT, () => {
  console.log(`Auralis Beacon V2.23 running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Agent simulator: http://localhost:${PORT}/agent.html`);
  console.log('Demo login: owner@auralis.local / Auralis@4729');
});

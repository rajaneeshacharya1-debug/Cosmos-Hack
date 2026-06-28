let streamTimer = null, pollTimer = null, seen = new Set(), tick = 0;
let config = { trackingIntervalSec:30, pollingIntervalSec:5 };
function $(id){ return document.getElementById(id); }
function server(){ return $('server').value.replace(/\/$/, ''); }
function dev(){ return $('device').value.trim(); }
function tok(){ return $('token').value.trim(); }
function log(x){ $('log').textContent = '[' + new Date().toLocaleTimeString() + '] ' + x + '\n' + $('log').textContent; }
async function getConfig(){
  try {
    const r = await fetch(`${server()}/api/device/${dev()}/config?token=${encodeURIComponent(tok())}`).then(x => x.json());
    if (r.ok) { config = r.config; $('cfgState').textContent = `T${config.trackingIntervalSec}/P${config.pollingIntervalSec}`; return r.config; }
    log('Config error: ' + r.error);
  } catch (e) { log('Config fetch failed: ' + e.message); }
}
async function testPacket(){
  tick++;
  const lat = Number($('lat').value) + Math.sin(tick/5)*0.0015;
  const lng = Number($('lng').value) + Math.cos(tick/4)*0.0015;
  const batt = Math.max(5, Number($('battery').value) - Math.floor(tick/3));
  const mode = $('mode').value || 'LIVE_TRACKING';
  const url = `${server()}/api/device/${dev()}/location?token=${encodeURIComponent(tok())}&mode=${encodeURIComponent(mode)}&battery=${batt}&lat=${lat}&lng=${lng}&accuracy=8&network=AGENT_SIM`;
  try {
    const r = await fetch(url).then(x => x.json());
    if (r.ok) log(`Packet sent: ${mode} · ${batt}% · ${lat.toFixed(5)},${lng.toFixed(5)}`);
    else log('Packet error: ' + r.error);
  } catch (e) { log('Packet failed: ' + e.message); }
}
function toggleStream(){
  if (streamTimer) { clearInterval(streamTimer); streamTimer = null; $('streamState').textContent = 'OFF'; $('streamBtn').textContent = 'Start Stream'; log('Stream stopped'); return; }
  testPacket();
  const sec = Math.max(2, Number(config.trackingIntervalSec || 30));
  streamTimer = setInterval(testPacket, sec * 1000);
  $('streamState').textContent = 'ON'; $('streamBtn').textContent = 'Stop Stream'; log('Stream started every ' + sec + ' sec');
}
async function report(id, status, detail){
  try {
    const r = await fetch(`${server()}/api/device/${dev()}/command-result?token=${encodeURIComponent(tok())}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status, detail }) }).then(x => x.json());
    if (r.ok) log('Reported ' + status + ' for command #' + id); else log('Report error: ' + r.error);
  } catch (e) { log('Report failed: ' + e.message); }
}
async function execute(c){
  let detail = 'Completed by simulator';
  if (c.command === 'SET_VOLUME') detail = 'Simulated volume set to ' + (c.payload?.level ?? '?') + '%';
  if (c.command === 'REQUEST_LOCATION') { detail = 'Fresh location packet sent'; await testPacket(); }
  if (c.command === 'STOP_RECOVERY') { detail = 'Recovery service stopped by dashboard command'; $('mode').value = 'STOPPED'; if (streamTimer) toggleStream(); }
  if (c.command === 'POWER_SAVE') { detail = 'Power save tracking mode active'; $('mode').value = 'POWER_SAVE'; }
  if (['NORMAL_TRACKING','RESUME_RECOVERY','START_RECOVERY'].includes(c.command)) { detail = 'Normal live tracking active'; $('mode').value = 'LIVE_TRACKING'; if (!streamTimer) toggleStream(); }
  if (c.command === 'RING') detail = 'Simulated ring command executed';
  if (c.command === 'SILENT') detail = 'Simulated audio stopped';
  if (c.command === 'SEND_STATUS') { detail = 'Fresh status packet sent'; await testPacket(); }
  await report(c.id, 'COMPLETED', detail);
}
async function pollOnce(){
  await getConfig();
  try {
    const r = await fetch(`${server()}/api/device/${dev()}/latest-command?token=${encodeURIComponent(tok())}`).then(x => x.json());
    if (!r.ok) { log('Poll error: ' + r.error); return; }
    if (!r.command) return;
    const c = r.command;
    $('lastCommand').textContent = '#' + c.id + ' ' + c.command;
    if (seen.has(c.id + '-' + c.status)) return;
    seen.add(c.id + '-' + c.status);
    log('Command received: #' + c.id + ' ' + c.command + ' [' + c.status + ']');
    if (c.status === 'PENDING') {
      await report(c.id, 'RECEIVED', 'Agent simulator received command');
      setTimeout(() => execute(c), 700);
    }
  } catch (e) { log('Poll failed: ' + e.message); }
}
function togglePoll(){
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; $('pollState').textContent = 'OFF'; $('pollBtn').textContent = 'Start Polling'; log('Polling stopped'); return; }
  pollOnce();
  const sec = Math.max(2, Number(config.pollingIntervalSec || 5));
  pollTimer = setInterval(pollOnce, sec * 1000);
  $('pollState').textContent = 'ON'; $('pollBtn').textContent = 'Stop Polling'; log('Polling started every ' + sec + ' sec');
}
function stopAll(){ if (streamTimer) toggleStream(); if (pollTimer) togglePoll(); }
document.addEventListener('DOMContentLoaded', () => {
  $('packetBtn').addEventListener('click', testPacket);
  $('streamBtn').addEventListener('click', toggleStream);
  $('pollBtn').addEventListener('click', togglePoll);
  $('stopBtn').addEventListener('click', stopAll);
  getConfig(); log('Agent simulator ready. Use dashboard command buttons to test command queue.');
});

let session=localStorage.getItem('auralisSessionV29')||'';let currentDevice=null,devices=[],map=null,marker=null,trail=null,route=[],tick=0;let currentPage='home';let savedTrackerView=localStorage.getItem('auralisTrackerView');let trackerView=savedTrackerView||(window.innerWidth<760?'phone':window.innerWidth<1180?'compact':'desktop');const DEVICE_ID='oppo-f19',DEVICE_TOKEN='auralis-demo-token-4729';function $(id){return document.getElementById(id)}function setAuthTab(t){$('loginTab').classList.toggle('active',t==='login');$('registerTab').classList.toggle('active',t==='register');$('loginForm').classList.toggle('hidden',t!=='login');$('registerForm').classList.toggle('hidden',t!=='register')}async function api(p,o={}){o.headers=o.headers||{};o.headers['Content-Type']='application/json';if(session)o.headers['x-auralis-session']=session;return fetch(p,o).then(r=>r.json())}async function login(){let v=$('loginEmail').value.trim();let r=await api('/api/login',{method:'POST',body:JSON.stringify({email:v,username:v,password:$('loginPassword').value})});if(!r.ok){$('authMsg').textContent='Login failed. Use owner@auralis.local / Auralis@4729';return}session=r.session;localStorage.setItem('auralisSessionV29',session);enter()}async function register(){let r=await api('/api/register',{method:'POST',body:JSON.stringify({name:$('regName').value,email:$('regEmail').value,password:$('regPassword').value})});$('authMsg').textContent=r.ok?'Account saved. Login now. New accounts will start with no secured devices.':'Register failed: '+r.error;if(r.ok){$('loginEmail').value=$('regEmail').value;setAuthTab('login')}}function logout(){document.body.classList.remove('is-authenticated');localStorage.removeItem('auralisSessionV29');location.reload()}async function restore(){prepareLoginFields();if(!session)return;let r=await api('/api/me');if(r.ok)enter();else{document.body.classList.remove('is-authenticated');localStorage.removeItem('auralisSessionV29');session=''}}function prepareLoginFields(){['loginEmail','loginPassword'].forEach(id=>{let el=$(id);if(!el)return;el.value='';el.name=id+'_'+Math.random().toString(36).slice(2);})}async function enter(){document.body.classList.add('is-authenticated');$('auth').classList.add('hidden');$('app').classList.remove('hidden');applySavedLayout();initMap();updateUrls();await refreshAll();showPage(currentPage)}function applySavedLayout(){let collapsed=localStorage.getItem('auralisSidebarCollapsed')==='1';$('app').classList.toggle('sidebar-collapsed',collapsed);setTrackerView(trackerView,false)}function toggleSidebar(){let collapsed=!$('app').classList.contains('sidebar-collapsed');$('app').classList.toggle('sidebar-collapsed',collapsed);localStorage.setItem('auralisSidebarCollapsed',collapsed?'1':'0');setTimeout(()=>{if(map)map.invalidateSize()},240)}function setTrackerView(v,save=true){trackerView=v||'desktop';if(save)localStorage.setItem('auralisTrackerView',trackerView);let layout=$('trackLayout');if(layout){layout.classList.remove('desktop','compact','phone');layout.classList.add(trackerView)}document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===trackerView));setTimeout(()=>{if(map)map.invalidateSize()},180)}function showPage(p){if(p!=='track'&&document.body.classList.contains('map-fullscreen-active'))toggleMapFullscreen(true);currentPage=p;document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('page-'+p)?.classList.add('active');document.querySelectorAll('.nav,.mobile-nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===p));let names={home:['Auralis Dashboard','One interface for protection, tracking and recovery.'],devices:['Your Devices','Registered phones under this account.'],track:['Live Tracker','Map, recovery controls and mobile layout preview.'],trackdemo:['Tracker Showcase','Focused auto-demo for map, controls and command queue.'],setup:['Device Protection','Register this phone once and keep it protected.'],demo:['Demo','Animated recovery flow and live command lifecycle.'],macros:['MacroDroid Setup','Exact 5-macro bridge configuration.'],activity:['Activity','Command history and recovery timeline.'],settings:['Settings','Server config and app behaviour.']};$('pageTitle').textContent=(names[p]||names.home)[0];$('pageSub').textContent=(names[p]||names.home)[1];$('viewSwitch').style.display=p==='track'?'flex':'none';requestAnimationFrame(()=>{let c=document.querySelector('.content-v2');if(c)c.scrollTo({top:0,left:0,behavior:'smooth'});window.scrollTo({top:0,left:0,behavior:'smooth'});let active=$('page-'+p);if(active)active.scrollTop=0;});if(p==='track'&&map)setTimeout(()=>map.invalidateSize(),160)}function initMap(){if(map||!window.L)return;map=L.map('map',{zoomControl:true}).setView([27.7172,85.3240],13);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);trail=L.polyline([],{weight:3,opacity:.65}).addTo(map)}function icon(){return L.divIcon({className:'',html:'<div class="pulse-marker"></div>',iconSize:[24,24],iconAnchor:[12,12]})}async function refreshAll(){let r=await api('/api/devices');if(!r.ok)return;devices=r.devices||[];currentDevice=devices.find(d=>d.id===DEVICE_ID)||devices[0]||null;if(!currentDevice)return renderEmptyState();let banner=$('emptyStateBanner');if(banner)banner.classList.add('hidden');render()}async function refreshState(){if(!currentDevice)return refreshAll();let r=await api(`/api/device/${currentDevice.id}/state`);if(r.ok){currentDevice=r.device;devices=devices.map(d=>d.id===currentDevice.id?currentDevice:d);if(!devices.find(d=>d.id===currentDevice.id))devices.push(currentDevice);render()}}function pct(x){return x==null||x===''?'--':x+'%'}function ago(ts){if(!ts)return'--';let s=Math.max(0,Math.floor((Date.now()-new Date(ts))/1000));if(s<8)return'now';if(s<60)return s+'s ago';let m=Math.floor(s/60);if(m<60)return m+'m ago';return Math.floor(m/60)+'h ago'}function networkHtml(v){
  let raw=String(v??'').trim();
  if(!raw || raw==='--')return '--';
  let u=raw.toUpperCase();
  if(u==='MOBILE_DATA')return '<span class="net-word">Mobile</span><span class="net-word">Data</span>';
  if(u==='SMS_BOOT')return '<span class="net-word">SMS</span><span class="net-word">Boot</span>';
  if(u==='SMS_STOP')return '<span class="net-word">SMS</span><span class="net-word">Stop</span>';
  if(u==='DASH_SIM')return '<span class="net-word">Dashboard</span><span class="net-word">Sim</span>';
  return raw.replace(/_/g,'<br>').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function noDeviceCard(){
  return `<div class="empty-device-card">
    <div class="empty-orb"><span>◎</span></div>
    <h3>No secured devices found</h3>
    <p>This account is saved, but no device has been protected yet. Add this phone to start Auralis recovery protection.</p>
    <div class="empty-actions"><button class="btn" data-go="setup">Add this device</button><button class="btn ghost" data-go="macros">View setup guide</button></div>
  </div>`;
}
function renderEmptyState(){
  currentDevice=null;
  const safe=(id, value, html=false)=>{let el=$(id); if(el){ if(html)el.innerHTML=value; else el.textContent=value; }};
  let banner=$('emptyStateBanner'); if(banner)banner.classList.remove('hidden');
  safe('protectText','No secured device');
  safe('protectSub','Your account is saved. Add this device to begin protection.');
  let rb=$('recoveryBar'); if(rb)rb.classList.remove('active');
  safe('shareText','No live location, battery or network data is shared yet.');
  let ld=$('liveDot'); if(ld)ld.classList.remove('on');
  safe('liveText','No device linked');
  safe('statDevices','0');
  safe('statProtected','Not set');
  safe('statSeen','--');
  safe('deviceList', noDeviceCard(), true);
  safe('mode','NO DEVICE');
  safe('deviceName','No secured device');
  safe('battery','--');
  safe('network','--');
  safe('lat','--');
  safe('lng','--');
  safe('lastUpdate','No device has reported yet');
  safe('trackPill','No device');
  safe('streamText','Add a device to begin live recovery telemetry.');
  safe('commands', renderCommands([]), true);
  safe('activityCommands', renderCommands([]), true);
  safe('events', '<div class="event">Account created. No device activity yet.</div>', true);
  safe('setupStatus','Not protected');
  safe('setupNote','No protected device is linked to this account yet. Complete setup to add one.');
  safe('shareLoc','Not active');
  safe('bridgeLastPoll','--');
  safe('bridgeLastResponse','NONE');
  safe('demoDeviceState','NO DEVICE');
  safe('demoLastPacket','none');
  safe('demoBridgePoll','not yet');
  safe('demoLatestCommand','none');
  safe('demoLifecycle','<div class="empty-life">No device yet. Add this device first.</div>', true);
  ['cfgTrack','cfgPoll','cfgPower','cfgVoice'].forEach(id=>{let el=$(id); if(el)el.value='';});
}
function render(){let d=currentDevice;if(!d)return renderEmptyState();let banner=$('emptyStateBanner');if(banner)banner.classList.add('hidden');$('protectText').textContent=d.protectionStatus==='PROTECTED'?'Protected':'Not Protected';$('protectSub').textContent=d.protectionStatus==='PROTECTED'?`${d.name} is registered.`:'Register this phone once.';$('recoveryBar').classList.toggle('active',!!d.recoveryActive);$('shareText').textContent=(d.sharedData?.liveLocation?'Live location · ':'')+'Battery · Network status are being shared.';let live=d.lastUpdate&&Date.now()-new Date(d.lastUpdate)<120000;$('liveDot').classList.toggle('on',!!live);$('liveText').textContent=live?'Live packet received':'No recent packet';$('statDevices').textContent=devices.length;$('statProtected').textContent=d.protectionStatus==='PROTECTED'?'Protected':'Not set';$('statSeen').textContent=d.lastUpdate?ago(d.lastUpdate):'--';$('deviceList').innerHTML=devices.map(x=>`<div class="device-card" data-select-device="${esc(x.id)}"><div><h3>${esc(x.name)}</h3><div class="device-meta">${esc(x.model)} · Last seen: ${x.lastUpdate?ago(x.lastUpdate):'not yet'} · Battery: ${pct(x.battery)} · Network: ${esc(x.network||'--')}</div></div><div class="pill">${x.recoveryActive?'Recovery active':x.protectionStatus}</div></div>`).join('');$('mode').textContent=(d.mode||'STANDBY') + ((d.mode!=='STOPPED'&&d.fresh===false&&d.lastKnown)?' · LAST KNOWN':'');$('deviceName').textContent=d.name;$('battery').textContent=pct(d.battery);$('network').innerHTML=networkHtml(d.network);$('lat').textContent=d.lat==null?'--':Number(d.lat).toFixed(5);$('lng').textContent=d.lng==null?'--':Number(d.lng).toFixed(5);$('lastUpdate').textContent=d.lastUpdate?'Last update: '+new Date(d.lastUpdate).toLocaleString():'No live update yet';$('trackPill').textContent=d.recoveryActive?'Recovery active':(d.mode||'Standby');if(d.lat!=null&&d.lng!=null&&map){let pos=[Number(d.lat),Number(d.lng)];if(!marker){marker=L.marker(pos,{icon:icon()}).addTo(map);map.setView(pos,16)}else marker.setLatLng(pos);route.push(pos);route=route.slice(-80);trail.setLatLngs(route);map.panTo(pos,{animate:true});$('streamText').textContent=`Updated ${new Date(d.lastUpdate).toLocaleTimeString()} · ${Number(d.lat).toFixed(6)}, ${Number(d.lng).toFixed(6)}`}$('commands').innerHTML=renderCommands(d.commands);$('activityCommands').innerHTML=renderCommands(d.commands);$('events').innerHTML=renderEvents(d.events);$('setupStatus').textContent=d.protectionStatus==='PROTECTED'?'Protected':'Not Protected';$('setupNote').textContent=d.protectionStatus==='PROTECTED'?'Setup complete. This phone can report to Auralis after activation.':'Register this device to complete protection.';$('shareLoc').textContent=d.sharedData?.liveLocation?'Active':'When active';if($('bridgeLastPoll'))$('bridgeLastPoll').textContent=d.bridge?.lastPollAt?ago(d.bridge.lastPollAt):'--';if($('bridgeLastResponse'))$('bridgeLastResponse').textContent=d.bridge?.lastPollResponse||'NONE';if($('demoDeviceState'))$('demoDeviceState').textContent=(d.mode||'STANDBY')+(d.recoveryActive?' · active':'');if($('demoLastPacket'))$('demoLastPacket').textContent=d.lastUpdate?ago(d.lastUpdate):'none';if($('demoBridgePoll'))$('demoBridgePoll').textContent=d.bridge?.lastPollAt?ago(d.bridge.lastPollAt):'not yet';if($('demoLatestCommand'))$('demoLatestCommand').textContent=d.commands&&d.commands.length?('#'+d.commands[0].id+' '+d.commands[0].command+' · '+d.commands[0].status):'none';if($('demoLifecycle'))$('demoLifecycle').innerHTML=d.commands&&d.commands.length?lifecycle(d.commands[0]):'<div class="empty-life">No command yet. Click Ring Device or Stop Ring.</div>';let c=d.config||{};$('cfgTrack').value=c.trackingIntervalSec||30;$('cfgPoll').value=c.pollingIntervalSec||5;$('cfgPower').value=c.powerSaveTrackingIntervalSec||120;$('cfgVoice').value=c.voiceAlertText||''}function lifecycle(c){let stages=['PENDING','RECEIVED','COMPLETED'];let status=String(c.status||'PENDING').toUpperCase();let idx=status==='FAILED'?1:stages.indexOf(status);if(idx<0)idx=0;return `<div class="lifecycle"><div class="life-head"><strong>#${c.id} ${esc(c.command)}</strong><span class="status ${esc(status)}">${esc(status)}</span></div><div class="life-rail">${stages.map((s,i)=>`<span class="${i<=idx?'done':''} ${status==='FAILED'&&i===idx?'failed':''}"><em>${i+1}</em>${s}</span>`).join('')}</div><div class="life-detail">${esc(c.detail||'Waiting for protected phone bridge...')}</div><div class="life-time">${new Date(c.createdAt).toLocaleString()}</div></div>`}
function renderCommands(cs=[]){return cs&&cs.length?cs.slice(0,35).map(c=>`<div class="command-row rich-command">${lifecycle(c)}</div>`).join(''):'<div class="command-row">No commands yet.</div>'}function renderEvents(es=[]){return es&&es.length?es.slice(0,45).map(e=>`<div class="event"><strong>${esc(e.type)}</strong><br>${esc([e.command,e.mode,e.battery?'Battery '+e.battery+'%':'',e.lat!=null?Number(e.lat).toFixed(5)+', '+Number(e.lng).toFixed(5):'',e.detail].filter(Boolean).join(' · '))}<br>${new Date(e.ts).toLocaleString()}</div>`).join(''):'<div class="event">No events yet.</div>'}function updateUrls(){let o=location.origin;let urls=['BOOT URL:',`${o}/api/device/${DEVICE_ID}/boot?token=${DEVICE_TOKEN}&mode=BOOTED&battery=[battery]&lat=[lat]&lng=[lon]&network=SMS_BOOT`,'','LIVE URL:',`${o}/api/device/${DEVICE_ID}/location?token=${DEVICE_TOKEN}&mode=LIVE_TRACKING&battery=[battery]&lat=[lat]&lng=[lon]&network=MOBILE_DATA`,'','STOP URL:',`${o}/api/device/${DEVICE_ID}/status?token=${DEVICE_TOKEN}&mode=STOPPED&battery=[battery]&network=SMS_STOP`,'','COMMAND POLLER URL:',`${o}/api/device/${DEVICE_ID}/macro-poll?token=${DEVICE_TOKEN}`,'','COMMAND COMPLETE URL:',`${o}/api/device/${DEVICE_ID}/macro-complete?token=${DEVICE_TOKEN}&status=COMPLETED&detail=MacroDroid_executed`,'','COMMAND STATUS URL:',`${o}/api/device/${DEVICE_ID}/macro-status?token=${DEVICE_TOKEN}`,'','RESET DEMO STATE:',`${o}/api/device/${DEVICE_ID}/reset-state?token=${DEVICE_TOKEN}`,'','AGENT POLL:',`${o}/api/device/${DEVICE_ID}/latest-command?token=${DEVICE_TOKEN}`].join('\n');$('urlBox').textContent=urls;let a=$('audioUrlText');if(a)a.textContent=o+'/auralis-beacon-alert.wav';let b=$('bridgeBox');if(b)b.textContent=['COMMAND POLLER URL:',`${o}/api/device/${DEVICE_ID}/macro-poll?token=${DEVICE_TOKEN}`,'','COMMAND COMPLETE URL:',`${o}/api/device/${DEVICE_ID}/macro-complete?token=${DEVICE_TOKEN}&status=COMPLETED&detail=MacroDroid_executed`,'','ALERT AUDIO URL:',`${o}/auralis-beacon-alert.wav`,'','Expected poll response examples:','NONE','CMD:RING;ID:7','CMD:STOP_RING;ID:8','CMD:STOP_RECOVERY;ID:9'].join('\n')}async function sendCommand(cmd,payload={}){if(!currentDevice)return alert('No secured device found. Add this device first.');let r=await api(`/api/device/${currentDevice.id}/command`,{method:'POST',body:JSON.stringify({command:cmd,payload})});if(!r.ok)alert('Command failed: '+r.error);await refreshState()}async function registerDevice(){let r=await api('/api/register-device',{method:'POST',body:JSON.stringify({name:$('setupName').value,model:$('setupModel').value})});if(!r.ok)return alert('Setup failed: '+r.error);await refreshAll();showPage('devices');alert('Protection setup complete. This account now has a secured device.')}async function saveConfig(){if(!currentDevice)return alert('No secured device found. Add this device first.');let r=await api(`/api/device/${currentDevice.id}/config`,{method:'POST',body:JSON.stringify({trackingIntervalSec:$('cfgTrack').value,pollingIntervalSec:$('cfgPoll').value,powerSaveTrackingIntervalSec:$('cfgPower').value,voiceAlertText:$('cfgVoice').value})});if(!r.ok)alert('Config failed: '+r.error);await refreshState()}function copyAudioLink(){let url=location.origin+'/auralis-beacon-alert.wav';navigator.clipboard.writeText(url).then(()=>alert('Copied audio link: '+url))}
let autoDemoTimer=null;
let autoDemoRunning=false;
let autoDemoTargets=[];
let autoDemoTargetIndex=0;
let autoDemoPageIndex=0;
let autoDemoTotalSteps=1;
let autoDemoCompletedSteps=0;

const AUTO_DEMO_PAGES=[
  {id:'home',label:'Home'},
  {id:'devices',label:'Devices'},
  {id:'track',label:'Track'},
  {id:'setup',label:'Protection'},
  {id:'demo',label:'Demo'},
  {id:'macros',label:'Macro Setup'},
  {id:'activity',label:'Activity'},
  {id:'settings',label:'Settings'}
];

const AUTO_DEMO_SELECTOR=[
  '.recovery-banner',
  '.card.v2',
  '.cmd',
  '.device-card',
  '.primary-control',
  '.ring-command-pair',
  '.map-card',
  '.map-frame',
  '.status-card',
  '.mini-grid > div',
  '.demo-command-card',
  '.flow-node',
  '.arch-node',
  '.macro-five-strip > div',
  '.macro-card',
  '.rule-list > div',
  '.command-row',
  '.bridge-mini',
  '.audio-link-card',
  'button:not(.nav):not(.mobile-nav button)',
  '.btn',
  '.stat',
  '.kpi'
].join(',');

function quickFillLogin(){
  let email=$('loginEmail');
  let pass=$('loginPassword');
  if(email){email.value='owner@auralis.local';email.dispatchEvent(new Event('input',{bubbles:true}));}
  if(pass){pass.value='Auralis@4729';pass.dispatchEvent(new Event('input',{bubbles:true}));}
  let btn=$('quickFillLoginBtn');
  if(btn){btn.textContent='Demo login filled';setTimeout(()=>btn.textContent='Quick fill demo login',1400)}
}

function getActivePageElement(){
  return document.querySelector('.page.active');
}

function uniqueElements(list){
  let seen=new Set(), out=[];
  list.forEach(el=>{
    if(!el || seen.has(el))return;
    if(el.closest('#autoDemoOverlay') || el.closest('#autoDemoSpotlight'))return;
    seen.add(el); out.push(el);
  });
  return out;
}

function rectOk(el){
  if(!el || el.closest('#autoDemoOverlay') || el.closest('#autoDemoSpotlight'))return false;
  let r=el.getBoundingClientRect();
  if(r.width<40 || r.height<24)return false;
  let st=getComputedStyle(el);
  if(st.visibility==='hidden' || st.display==='none' || st.opacity==='0')return false;
  return true;
}
function visualSort(a,b){
  let ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
  let rowA=Math.round(ra.top/46), rowB=Math.round(rb.top/46);
  if(rowA!==rowB)return rowA-rowB;
  return ra.left-rb.left;
}
function innerSort(a,b){
  let ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
  let rowA=Math.round(ra.top/38), rowB=Math.round(rb.top/38);
  if(rowA!==rowB)return rowA-rowB;
  return ra.left-rb.left;
}
function collectAutoDemoTargets(){
  let page=getActivePageElement();
  if(!page)return [];

  // Top-level "large templates" first: left template fully, then right template fully.
  let containerSelectors=[
    ':scope > .grid > .card.v2',
    ':scope > .track-v21 > .panel',
    ':scope > .track-v21 > .map-card',
    ':scope > .track-v21 > .command-panel',
    ':scope > .demo-stage',
    ':scope > .animated-recovery-flow',
    ':scope > .demo-command-board',
    ':scope > .command-theatre',
    ':scope > .architecture-card',
    ':scope > .card.v2',
    ':scope > .macro-stack > .macro-card',
    ':scope > .macro-rules'
  ];
  let containers=[];
  containerSelectors.forEach(sel=>{try{containers.push(...page.querySelectorAll(sel))}catch(e){}});
  containers=uniqueElements(containers).filter(rectOk).sort(visualSort);

  let out=[];
  const add=(el)=>{if(el && !out.includes(el) && rectOk(el))out.push(el);};

  containers.forEach(box=>{
    add(box);
    let inside=[...box.querySelectorAll(AUTO_DEMO_SELECTOR)]
      .filter(el=>el!==box && rectOk(el))
      .filter(el=>!el.matches('.page,.content-v2'))
      .sort(innerSort);
    inside.forEach(add);
  });

  // Fallback for pages with loose elements not inside cards.
  if(out.length<3){
    [...page.querySelectorAll(AUTO_DEMO_SELECTOR)].filter(rectOk).sort(visualSort).forEach(add);
  }

  return out.slice(0,28);
}

function countAutoDemoSteps(){
  let total=0;
  let current=document.querySelector('.page.active')?.id?.replace('page-','') || 'home';
  AUTO_DEMO_PAGES.forEach(p=>{showPage(p.id); total += Math.max(1, collectAutoDemoTargets().length);});
  showPage(current);
  return Math.max(total,1);
}

function setAutoDemoPanel(title, indexText, progress){
  let o=$('autoDemoOverlay'), s=$('autoDemoStep'), t=$('autoDemoTitle'), bar=$('autoDemoProgress');
  if(!o)return;
  o.classList.remove('hidden');
  if(s)s.textContent=indexText;
  if(t)t.textContent=title;
  if(bar)bar.style.width=Math.max(0,Math.min(100,progress))+'%';
}

function clearAutoDemoFocus(){
  document.querySelectorAll('.auto-demo-focus').forEach(el=>el.classList.remove('auto-demo-focus'));
  let sp=$('autoDemoSpotlight'); if(sp)sp.classList.add('hidden');
}

function labelForElement(el){
  if(!el)return 'Section';
  let h=el.querySelector('h1,h2,h3,h4,b,strong') || el;
  let txt=(h.innerText||h.textContent||'').trim().replace(/\s+/g,' ');
  if(!txt) txt=(el.getAttribute('data-page')||el.getAttribute('data-cmd')||'Feature').toString();
  return txt.slice(0,42);
}

function updateAutoDemoSpotlight(el){
  let sp=$('autoDemoSpotlight');
  if(!sp || !el || !autoDemoRunning)return;
  let r=el.getBoundingClientRect();
  let pad=window.innerWidth<=720?7:10;
  let minW=window.innerWidth<=720?46:50;
  let minH=window.innerWidth<=720?36:40;
  let w=Math.max(minW,Math.min(window.innerWidth-(pad*2),r.width+(pad*2)));
  let h=Math.max(minH,Math.min(window.innerHeight-(pad*2),r.height+(pad*2)));
  let left=Math.max(pad,Math.min(window.innerWidth-w-pad,r.left-pad));
  let top=Math.max(pad,Math.min(window.innerHeight-h-pad,r.top-pad));
  sp.classList.remove('hidden');
  sp.style.left=left+'px';
  sp.style.top=top+'px';
  sp.style.width=w+'px';
  sp.style.height=h+'px';
}
function focusAutoDemoElement(el){
  clearAutoDemoFocus();
  if(!el)return;
  el.classList.add('auto-demo-focus');
  if(el.tagName==='DETAILS')el.open=true;
  let mobile=window.innerWidth<=720;
  try{
    el.scrollIntoView({behavior:'smooth',block:mobile?'center':'center',inline:'nearest'});
  }catch(e){
    el.scrollIntoView();
  }
  // Mobile needed repeated measurement because scroll + sticky header can move the target after the first read.
  [120,360,720,1050].forEach(ms=>setTimeout(()=>updateAutoDemoSpotlight(el),ms));
}
function stopAutoDemo(){
  autoDemoRunning=false;
  if(autoDemoTimer)clearTimeout(autoDemoTimer);
  autoDemoTimer=null;
  clearAutoDemoFocus();
  let o=$('autoDemoOverlay'); if(o)o.classList.add('hidden');
  document.body.classList.remove('auto-demo-running');
}

function specialAutoDemoAction(el,page){
  let cmdEl=el?.matches?.('[data-cmd]')?el:el?.querySelector?.('[data-cmd]');
  let cmd=cmdEl?.dataset?.cmd || '';
  if(!cmd || !currentDevice)return 0;

  // Demonstrate only the ring pair automatically. Other command buttons are visually focused only.
  if(cmd==='RING' && !window.__auralisAutoRingStarted){
    window.__auralisAutoRingStarted=true;
    sendCommand('RING');
    setAutoDemoPanel('Demo · Ring Device command sent','ring',Math.min(99,((autoDemoCompletedSteps+1)/autoDemoTotalSteps)*100));
    return 7800; // enough time for poller delay + sound to start
  }
  if(cmd==='STOP_RING' && window.__auralisAutoRingStarted && !window.__auralisAutoRingStopped){
    window.__auralisAutoRingStopped=true;
    sendCommand('STOP_RING');
    setAutoDemoPanel('Demo · Stop Ring command sent','stop',Math.min(99,((autoDemoCompletedSteps+1)/autoDemoTotalSteps)*100));
    return 6800; // enough time for phone poller to stop sound
  }
  return 0;
}

function runAutoDemo(){
  if(autoDemoRunning){stopAutoDemo();return}
  autoDemoRunning=true;
  window.__auralisAutoRingStarted=false;
  window.__auralisAutoRingStopped=false;
  document.body.classList.add('auto-demo-running');
  autoDemoPageIndex=0; autoDemoTargetIndex=0; autoDemoCompletedSteps=0;
  autoDemoTotalSteps=countAutoDemoSteps();

  const runPage=()=>{
    if(!autoDemoRunning)return;
    if(autoDemoPageIndex>=AUTO_DEMO_PAGES.length){
      setAutoDemoPanel('Tour complete','done',100);
      autoDemoTimer=setTimeout(stopAutoDemo,900);
      return;
    }
    let page=AUTO_DEMO_PAGES[autoDemoPageIndex];
    showPage(page.id);
    setTimeout(()=>{
      let c=document.querySelector('.content-v2'); if(c)c.scrollTo({top:0,left:0,behavior:'smooth'});
      autoDemoTargets=collectAutoDemoTargets();
      autoDemoTargetIndex=0;
      if(autoDemoTargets.length===0){autoDemoCompletedSteps++;autoDemoPageIndex++;autoDemoTimer=setTimeout(runPage,450);return;}
      runTarget();
    },620);
  };

  const runTarget=()=>{
    if(!autoDemoRunning)return;
    if(autoDemoTargetIndex>=autoDemoTargets.length){clearAutoDemoFocus();autoDemoPageIndex++;autoDemoTimer=setTimeout(runPage,620);return;}
    let page=AUTO_DEMO_PAGES[autoDemoPageIndex];
    let el=autoDemoTargets[autoDemoTargetIndex];
    let stepText=String(autoDemoCompletedSteps+1).padStart(2,'0')+'/'+String(autoDemoTotalSteps).padStart(2,'0');
    let progress=((autoDemoCompletedSteps+1)/autoDemoTotalSteps)*100;
    focusAutoDemoElement(el);
    setAutoDemoPanel(page.label+' · '+labelForElement(el),stepText,progress);
    let extraHold=specialAutoDemoAction(el,page);
    autoDemoTargetIndex++; autoDemoCompletedSteps++;
    autoDemoTimer=setTimeout(runTarget,extraHold || 1050);
  };
  runPage();
}


function trackerDemoPanel(title, step, progress){
  let o=$('autoDemoOverlay'), s=$('autoDemoStep'), t=$('autoDemoTitle'), bar=$('autoDemoProgress');
  if(o)o.classList.remove('hidden');
  if(s)s.textContent=step;
  if(t)t.textContent=title;
  if(bar)bar.style.width=Math.max(0,Math.min(100,progress))+'%';
}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function visibleTarget(sel){
  let el=typeof sel==='string'?document.querySelector(sel):sel;
  return el || null;
}
async function focusTrackerDemo(selector,title,step,progress,hold=1500,action=null){
  let el=visibleTarget(selector);
  if(el && typeof focusAutoDemoElement==='function') focusAutoDemoElement(el);
  trackerDemoPanel(title,step,progress);
  if(action)setTimeout(action,300);
  await wait(hold);
}
async function showcaseSendCommand(cmd,title,step,progress,hold){
  let el=document.querySelector(`[data-cmd="${cmd}"]`) || document.querySelector('.ring-command-pair');
  if(el && typeof focusAutoDemoElement==='function') focusAutoDemoElement(el);
  trackerDemoPanel(title,step,progress);
  try{
    if(currentDevice && typeof sendCommand==='function') await sendCommand(cmd);
  }catch(e){
    console.warn('showcase command failed',cmd,e);
  }
  await wait(hold);
  try{await refreshState()}catch(e){}
}
async function runTrackerShowcase(){
  try{
    if(autoDemoRunning && !document.body.classList.contains('tracker-showcase-running')){stopAutoDemo();}
    autoDemoRunning=true;
    document.body.classList.add('auto-demo-running','tracker-showcase-running');
    showPage('track');
    await wait(900);
    let c=document.querySelector('.content-v2');
    if(c)c.scrollTo({top:0,left:0,behavior:'smooth'});
    if(window.map)setTimeout(()=>map.invalidateSize(),250);

    await focusTrackerDemo('.device-panel,.selected-device-card,.track-v21 .panel:first-child','Tracker · Protected phone state','01/16',6,1600);
    await focusTrackerDemo('.track-stat-grid,.mini-grid','Tracker · All live telemetry cards','02/16',12,1500);
    await focusTrackerDemo('.battery-card,.track-stat-grid > div:nth-child(1),.mini-grid > div:nth-child(1)','Tracker · Battery level','03/16',18,1450);
    await focusTrackerDemo('.network-card,.track-stat-grid > div:nth-child(2),.mini-grid > div:nth-child(2)','Tracker · Network state','04/16',24,1450);
    await focusTrackerDemo('.lat-card,.track-stat-grid > div:nth-child(3),.mini-grid > div:nth-child(3)','Tracker · Latitude','05/16',30,1450);
    await focusTrackerDemo('.lng-card,.track-stat-grid > div:nth-child(4),.mini-grid > div:nth-child(4)','Tracker · Longitude','06/16',36,1450);

    await focusTrackerDemo('#mapCard,.map-card','Tracker · Live location map','07/16',43,2100);
    await focusTrackerDemo('#mapFullscreenBtn','Tracker · Opening fullscreen map','08/16',50,6800,()=>{
      if(typeof toggleMapFullscreen==='function')toggleMapFullscreen(false);
    });
    await wait(500);
    await focusTrackerDemo('#mapFullscreenBtn','Tracker · Closing fullscreen map','09/16',58,2200,()=>{
      if(typeof toggleMapFullscreen==='function')toggleMapFullscreen(true);
    });
    await wait(700);

    await focusTrackerDemo('.command-panel,.track-v21 .panel:last-child','Tracker · Recovery controls panel','10/16',66,1600);
    await focusTrackerDemo('.ring-command-pair,[data-cmd="RING"]','Tracker · Ring and Stop Ring controls','11/16',72,1500);

    await showcaseSendCommand('RING','Tracker · Ring command sent, waiting for sound','12/16',79,9000);
    await showcaseSendCommand('STOP_RING','Tracker · Stop Ring command sent, waiting for silence','13/16',86,8000);

    await focusTrackerDemo('.mode-card,.mode-grid','Tracker · Tracking mode controls','14/16',92,1600);
    await focusTrackerDemo('[data-cmd="STOP_RECOVERY"],.primary-control.danger','Tracker · Stop Recovery control','15/16',96,1500);
    await focusTrackerDemo('details.queue,.command-panel details,#commands','Tracker · Command queue lifecycle','16/16',100,3200);

    stopAutoDemo();
  }catch(e){
    console.error('Tracker Showcase failed',e);
    alert('Tracker Showcase error: '+e.message);
    stopAutoDemo();
  }finally{
    document.body.classList.remove('tracker-showcase-running');
  }
}

async function resetDemoState(){let r=await fetch(`/api/device/${DEVICE_ID}/reset-state?token=${DEVICE_TOKEN}`).then(x=>x.text());alert(r);await refreshAll()}function copyUrls(){navigator.clipboard.writeText($('urlBox').textContent).then(()=>alert('Copied URLs'))}async function simulateMove(){tick++;let lat=(currentDevice?.lat||27.7172)+Math.sin(tick/4)*.0015,lng=(currentDevice?.lng||85.324)+Math.cos(tick/5)*.0015;await fetch(`/api/device/${DEVICE_ID}/location?token=${DEVICE_TOKEN}&mode=LIVE_TRACKING&battery=${Math.max(10,82-tick)}&lat=${lat}&lng=${lng}&accuracy=8&network=DASH_SIM`);await refreshState()}
function toggleMapFullscreen(forceOff=false){
  let active=document.body.classList.contains('map-fullscreen-active');
  if(forceOff) active=true;
  document.body.classList.toggle('map-fullscreen-active',!active);
  let btn=$('mapFullscreenBtn');
  if(btn) btn.textContent=!active?'Exit fullscreen':'Fullscreen map';
  setTimeout(()=>{if(map)map.invalidateSize()},220);
}
document.addEventListener('click',e=>{let go=e.target.closest('[data-go]');if(go)showPage(go.dataset.go);let nav=e.target.closest('.nav,.mobile-nav button');if(nav&&nav.dataset.page)showPage(nav.dataset.page);let cmd=e.target.closest('[data-cmd]');if(cmd)sendCommand(cmd.dataset.cmd);let view=e.target.closest('[data-view]');if(view)setTrackerView(view.dataset.view);let select=e.target.closest('[data-select-device]');if(select){currentDevice=devices.find(d=>d.id===select.dataset.selectDevice)||currentDevice;showPage('track');render()}});function bind(id,ev,fn){let el=$(id);if(el)el[ev]=fn;}bind('loginTab','onclick',()=>setAuthTab('login'));bind('registerTab','onclick',()=>setAuthTab('register'));bind('loginBtn','onclick',login);bind('regBtn','onclick',register);bind('logoutBtn','onclick',logout);bind('sidebarToggle','onclick',toggleSidebar);bind('copyUrls','onclick',copyUrls);bind('copyUrlsHome','onclick',copyUrls);bind('simMove','onclick',simulateMove);bind('setupBtn','onclick',registerDevice);bind('saveCfg','onclick',saveConfig);bind('mapFullscreenBtn','onclick',()=>toggleMapFullscreen());bind('autoDemoBtn','onclick',runAutoDemo);bind('autoDemoHomeBtn','onclick',runAutoDemo);bind('demoAutoRunBtn','onclick',runAutoDemo);bind('autoDemoStop','onclick',stopAutoDemo);bind('quickFillLoginBtn','onclick',quickFillLogin);bind('trackerDemoBtn','onclick',runTrackerShowcase);bind('trackerDemoHomeBtn','onclick',runTrackerShowcase);bind('runTrackerDemoBtn','onclick',runTrackerShowcase);bind('demoResetBtn','onclick',resetDemoState);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('map-fullscreen-active'))toggleMapFullscreen(true)});window.addEventListener('resize',()=>{if(map)setTimeout(()=>map.invalidateSize(),160)});restore();setInterval(refreshState,2000);


document.addEventListener('DOMContentLoaded',()=>{
  let lb=$('loginBtn'); if(lb) lb.addEventListener('click',login);
  let qb=$('quickFillLoginBtn'); if(qb) qb.addEventListener('click',quickFillLogin);
  let rb=$('regBtn'); if(rb) rb.addEventListener('click',register);
  let lt=$('loginTab'); if(lt) lt.addEventListener('click',()=>setAuthTab('login'));
  let rt=$('registerTab'); if(rt) rt.addEventListener('click',()=>setAuthTab('register'));
});


function bindTrackerShowcaseButtons(){
  ['trackerDemoBtn','trackerDemoHomeBtn','runTrackerDemoBtn'].forEach(id=>{
    let e=$(id);
    if(e)e.onclick=runTrackerShowcase;
  });
}
document.addEventListener('DOMContentLoaded',bindTrackerShowcaseButtons);
document.addEventListener('click',e=>{
  let t=e.target.closest('#trackerDemoBtn,#trackerDemoHomeBtn,#runTrackerDemoBtn');
  if(t){e.preventDefault();runTrackerShowcase();}
});

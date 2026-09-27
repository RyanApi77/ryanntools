// app.js v10.0 — Full rebuild
(function(){
'use strict';

// ============================================================
// KONFIG
// ============================================================
var DEVICE_API = 'https://ryanndevice.hasbiiryan.workers.dev';
var OWNER_FALLBACK_PWD = 'ryanndev';

// ============================================================
// UTIL
// ============================================================
function $(i){ return document.getElementById(i); }
var $$ = function(q){ return document.querySelectorAll(q); };

var S = {
  set: function(k,v){ try{ localStorage.setItem('rx_'+k, JSON.stringify(v)); }catch(e){} },
  get: function(k,d){ try{ var v=localStorage.getItem('rx_'+k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  del: function(k){ try{ localStorage.removeItem('rx_'+k); }catch(e){} }
};

// ============================================================
// DEVICE FINGERPRINT
// ============================================================
function makeFingerprint(){
  try{
    var parts = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width + 'x' + screen.height + 'x' + (screen.colorDepth||0),
      (new Date()).getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.platform || '',
      navigator.deviceMemory || 0,
      navigator.maxTouchPoints || 0
    ];
    try{
      var c = document.createElement('canvas');
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('ryann-fp-007', 2, 2);
      parts.push(c.toDataURL().slice(-40));
    }catch(e){}
    var raw = parts.join('|');
    var hash = 0;
    for(var i=0;i<raw.length;i++){ hash = ((hash<<5)-hash) + raw.charCodeAt(i); hash = hash & hash; }
    return 'fp' + Math.abs(hash).toString(36);
  }catch(e){ return 'fp' + Math.random().toString(36).slice(2, 10); }
}

function getDeviceId(){
  var id = S.get('device_id', null);
  if(id) return id;
  var fp = makeFingerprint();
  var rand = Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  id = 'dev_' + fp + '_' + rand;
  S.set('device_id', id);
  S.set('device_fp', fp);
  return id;
}

var DEVICE_ID = getDeviceId();
var DEVICE_FP = S.get('device_fp', makeFingerprint());

// ============================================================
// SESSION — cuma memory, tiap buka web wajib login
// ============================================================
var SESSION = null;

function saveSession(role, password){
  SESSION = { role: role, password: password, verifiedAt: Date.now() };
}
function clearSession(){ SESSION = null; }
function isOwner(){ return SESSION && SESSION.role === 'OWNER'; }

// ============================================================
// WORKER API (device)
// ============================================================
async function deviceApi(path, opts){
  opts = opts || {};
  var url = DEVICE_API + path;
  try{
    var r = await fetch(url, opts);
    if(!r.ok){
      var j = await r.json().catch(function(){ return { ok:false, error:'http_'+r.status }; });
      return j;
    }
    return await r.json();
  }catch(e){
    return { ok:false, error:'network', message: e.message };
  }
}

// ============================================================
// SOUND + LOG
// ============================================================
function sndSuccess(){ try{ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(880, a.currentTime); o.frequency.exponentialRampToValueAtTime(1320, a.currentTime+0.08); g.gain.setValueAtTime(0.05, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+0.18); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.2); }catch(e){} }
function sndClick(){ try{ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(), g=a.createGain(); o.type='square'; o.frequency.value=800; g.gain.setValueAtTime(0.03, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+0.05); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.06); }catch(e){} }
function sndError(){ try{ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(), g=a.createGain(); o.type='square'; o.frequency.value=220; g.gain.setValueAtTime(0.04, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+0.15); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.18); }catch(e){} }
function logTo(id,msg,cls){
  var el=$(id); if(!el)return;
  var d=document.createElement('div'); d.className=cls||'ok';
  d.textContent='['+new Date().toLocaleTimeString()+'] '+msg;
  el.appendChild(d); el.scrollTop=el.scrollHeight;
}
window.logTo = logTo;
window.sndSuccess = sndSuccess;
window.sndError = sndError;
window.sndClick = sndClick;

// ============================================================
// ACHIEVEMENTS
// ============================================================
var ACH_LIST = [
  {id:'first_gen', name:'The Beginning', desc:'Pertama kali generate'},
  {id:'ten_gen', name:'Taking Off', desc:'10x generate'},
  {id:'fifty_gen', name:'Benchmarking', desc:'50x generate'},
  {id:'hundred_gen', name:'The Beginning.', desc:'100x generate'},
  {id:'tmp_first', name:'Beam Me Up', desc:'Pertama generate tempmail'},
  {id:'inbox_first', name:'Monster Hunter', desc:'Pertama refresh inbox'},
  {id:'bypass_first', name:'Bypass Rookie', desc:'Pertama bypass link'},
  {id:'search_first', name:'Seek & Find', desc:'Pertama pakai search'},
  {id:'dl_first', name:'Download Master', desc:'Pertama download file'},
  {id:'imgai_first', name:'AI Artist', desc:'Pertama generate AI image'},
  {id:'imghd_first', name:'Enhancer', desc:'Pertama enhance image'},
  {id:'maker_first', name:'Canvas Master', desc:'Pertama pakai maker'},
  {id:'upscale_first', name:'Upscaler', desc:'Pertama pakai upscale'},
  {id:'preview', name:'Sneak Peek', desc:'Pertama preview media'},
  {id:'dev_panel', name:'Dev Access', desc:'Pertama buka dev panel'},
  {id:'gen_pass', name:'Password Smith', desc:'Pertama generate password'},
  {id:'copy_email', name:'Copy Cat', desc:'Copy email tempmail'},
  {id:'theme_change', name:'Delicious Fish', desc:'Ganti theme'},
  {id:'dark', name:'We Need to Go Deeper', desc:'Aktifkan dark mode'},
  {id:'all', name:'The End.', desc:'Semua fitur dipakai'}
];
var ACH_KEY = 'rx_ach_unlocked';

function getAch(){ try{ return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); }catch(e){ return {}; } }
function setAch(a){ try{ localStorage.setItem(ACH_KEY, JSON.stringify(a)); }catch(e){} }

function renderAch(){
  var wrap = document.getElementById('ach-wrap');
  if(!wrap) return;
  var ach = getAch();
  var count = Object.keys(ach).length;
  var counter = document.getElementById('achCounter');
  if(counter) counter.innerHTML = count + ' <span>/ ' + ACH_LIST.length + '</span>';
  wrap.innerHTML = ACH_LIST.map(function(a){
    var u = ach[a.id];
    return '<div class="ach ' + (u ? 'unlocked' : 'locked') + '">' +
      '<div>' + (u ? '🏆 ' : '🔒 ') + a.name + '</div>' +
      '<div class="desc">' + a.desc + '</div>' +
    '</div>';
  }).join('');
}

window.unlockAch = function(id){
  var ach = getAch();
  if(ach[id]) return;
  ach[id] = Date.now();
  setAch(ach);
  var a = ACH_LIST.find(function(x){ return x.id === id; });
  if(a && typeof window.zyToast === 'function') window.zyToast('🏆 ' + a.name);
  renderAch();
};

// ============================================================
// CUSTOM SELECT
// ============================================================
window.initCustomSelect = function(containerId, items, selectedId, onSelect, opts){
  opts = opts || {};
  var container = document.getElementById(containerId);
  if(!container) return null;
  container.innerHTML = '';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'zy-select-btn';
  function labelFor(id){
    var it = items.find(function(x){ return x.id === id; });
    if(it) return it.name;
    return opts.placeholder || '— CHOOSE —';
  }
  function updateLabel(){ var lbl = btn.querySelector('.zy-btn-label'); if(lbl) lbl.textContent = labelFor(selectedId); }
  btn.innerHTML = '<span class="zy-btn-label">' + labelFor(selectedId) + '</span><span class="zy-select-arrow">▾</span>';
  var list = document.createElement('div'); list.className = 'zy-select-list';
  function renderList(){
    list.innerHTML = '';
    items.forEach(function(it){
      var opt = document.createElement('div');
      opt.className = 'zy-select-opt' + (it.id === selectedId ? ' active' : '');
      opt.innerHTML = '<span>' + it.name + '</span>' + (it.desc ? '<small>' + it.desc + '</small>' : '');
      opt.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        selectedId = it.id; updateLabel(); closeList();
        if(typeof onSelect === 'function') onSelect(it.id, it);
      });
      list.appendChild(opt);
    });
  }
  function openList(){ renderList(); list.classList.add('open'); btn.classList.add('open'); }
  function closeList(){ list.classList.remove('open'); btn.classList.remove('open'); }
  function toggleList(){ if(list.classList.contains('open')) closeList(); else openList(); }
  btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggleList(); });
  container.appendChild(btn); container.appendChild(list);
  return {
    getValue: function(){ return selectedId; },
    setValue: function(id){ selectedId = id; updateLabel(); },
    setItems: function(newItems){
      items = newItems;
      if(!items.find(function(x){ return x.id === selectedId; }) && items.length) selectedId = items[0].id;
      updateLabel();
      if(list.classList.contains('open')) renderList();
    }
  };
};

// ============================================================
// PASSWORD GATE
// ============================================================
(function passwordGateInit(){
  var gate = $('passwordGate');
  if(!gate) return;
  var card = $('accessCard');
  var input = $('passwordInput');
  var boxes = gate.querySelectorAll('.password-box');
  var boxesWrap = $('passwordBoxes');
  var statusText = $('statusText');
  var continueBtn = $('continueBtn');
  var eyeToggle = $('eyeToggle');
  var eyeOpen = $('eyeOpen');
  var eyeClosed = $('eyeClosed');
  var verifyOverlay = $('gateVerifying');
  var orbitStatus = $('orbitStatus');
  var verified = false;
  var passwordVisible = false;
  if(!input || !boxesWrap || !continueBtn) return;

  if(eyeToggle){
    eyeToggle.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      passwordVisible = !passwordVisible;
      if(eyeOpen) eyeOpen.style.display = passwordVisible ? 'none' : '';
      if(eyeClosed) eyeClosed.style.display = passwordVisible ? '' : 'none';
      updateBoxes(input.value);
    });
  }
  function updateBoxes(raw){
    var value = (raw || '').slice(0, 8);
    Array.prototype.forEach.call(boxes, function(box, index){
      box.classList.remove('filled','active');
      if(index < value.length){
        box.textContent = passwordVisible ? value[index] : '•';
        box.classList.add('filled');
      } else { box.textContent = ''; }
    });
    if(value.length < 8 && boxes[value.length]) boxes[value.length].classList.add('active');
  }
  boxesWrap.addEventListener('click', function(e){
    if(eyeToggle && e.target.closest('#eyeToggle')) return;
    input.focus();
  });
  input.addEventListener('input', function(){
    var raw = input.value || '';
    updateBoxes(raw);
    statusText.classList.remove('ok','err','success');
    statusText.textContent = raw.length === 8 ? 'PRESS ENTER TO VERIFY' : 'WAITING FOR PASSWORD';
  });
  input.addEventListener('keydown', function(event){
    if(event.key === 'Enter'){ event.preventDefault(); verifyPassword(); }
  });
  continueBtn.addEventListener('click', function(){
    if(verified){
      if(verifyOverlay) verifyOverlay.classList.remove('on');
      gate.classList.add('gate-hidden');
      setTimeout(function(){ gate.style.display = 'none'; }, 700);
      return;
    }
    verifyPassword();
  });

  async function verifyPassword(){
    var raw = (input.value || '').trim().toLowerCase();
    if(raw.length !== 8){ shakeError('PASSWORD HARUS 8 KARAKTER'); return; }

    statusText.textContent = 'VERIFYING...';
    statusText.classList.add('ok');
    if(verifyOverlay) verifyOverlay.classList.add('on');

    var res = await deviceApi('/device/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: raw, deviceId: DEVICE_ID, fingerprint: DEVICE_FP })
    });

    if(!res.ok && res.error === 'network'){
      if(raw === OWNER_FALLBACK_PWD.toLowerCase()){
        res = { ok: true, role: 'OWNER', bootstrap: true, fallback: true };
      }
    }

    if(!res.ok){
      var msg = 'INVALID PASSWORD';
      if(res.error === 'locked_other_device') msg = 'PASSWORD DIPAKAI DI DEVICE LAIN';
      else if(res.error === 'revoked') msg = 'PASSWORD DIBLOKIR';
      else if(res.error === 'invalid_password') msg = 'PASSWORD TIDAK DITEMUKAN';
      else if(res.error === 'network') msg = 'TIDAK BISA HUBUNGI SERVER';
      shakeError(msg);
      if(orbitStatus) orbitStatus.textContent = 'ACCESS DENIED';
      if(verifyOverlay) setTimeout(function(){ verifyOverlay.classList.remove('on'); }, 1500);
      return;
    }

    verified = true;
    saveSession(res.role || 'USER', raw);
    statusText.textContent = 'ACCESS VERIFIED';
    statusText.classList.remove('ok','err');
    statusText.classList.add('success');
    if(orbitStatus) orbitStatus.textContent = 'ACCESS VERIFIED';
    Array.prototype.forEach.call(boxes, function(box){ box.textContent = '✓'; box.classList.add('success'); });
    continueBtn.classList.add('ready');

    setTimeout(function(){
      if(verifyOverlay) verifyOverlay.classList.remove('on');
      gate.classList.add('gate-hidden');
      setTimeout(function(){
        gate.style.display = 'none';
        bootAfterLogin();
      }, 700);
    }, 1200);
  }

  function shakeError(msg){
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    statusText.textContent = msg;
    statusText.classList.remove('ok','success');
    statusText.classList.add('err');
    Array.prototype.forEach.call(boxes, function(box){ box.classList.remove('filled','active','success'); box.classList.add('error'); });
    setTimeout(function(){
      Array.prototype.forEach.call(boxes, function(box){ box.textContent=''; box.classList.remove('error','filled','active'); });
      if(boxes[0]) boxes[0].classList.add('active');
      input.value = '';
      statusText.textContent = 'WAITING FOR PASSWORD';
      statusText.classList.remove('err');
    }, 1500);
  }

  setTimeout(function(){ try{ input.focus(); }catch(e){} }, 300);
})();

// ============================================================
// ACCESS CODE GATE
// ============================================================
(function accessCodeGateInit(){
  var gate = $('accessCodeGate');
  if(!gate) return;
  var input = $('accessCodeInput');
  var btn = $('accessCodeBtn');
  var msg = $('accessCodeMsg');

  async function submit(){
    var code = (input.value || '').trim().toLowerCase();
    if(code.length !== 8){ msg.textContent = 'KODE HARUS 8 KARAKTER'; msg.style.color = 'var(--er)'; return; }
    msg.textContent = 'VERIFIKASI...';
    msg.style.color = 'var(--txd)';

    var res = await deviceApi('/device/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: code, deviceId: DEVICE_ID, fingerprint: DEVICE_FP })
    });

    if(!res.ok){
      var m = 'KODE TIDAK VALID';
      if(res.error === 'locked_other_device') m = 'KODE DIPAKAI DI DEVICE LAIN';
      else if(res.error === 'revoked') m = 'KODE DIBLOKIR';
      else if(res.error === 'network') m = 'TIDAK BISA HUBUNGI SERVER';
      msg.textContent = m; msg.style.color = 'var(--er)';
      return;
    }

    saveSession(res.role || 'USER', code);
    msg.textContent = 'BERHASIL'; msg.style.color = 'var(--ok)';
    setTimeout(function(){ gate.classList.remove('show'); bootAfterLogin(); }, 700);
  }

  if(btn) btn.addEventListener('click', submit);
  if(input) input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); submit(); } });
})();

window.showAccessCodeGate = function(){
  var gate = $('accessCodeGate');
  if(gate) gate.classList.add('show');
};

// ============================================================
// THEME + BG + MODE
// ============================================================
function setTema(t){
  document.body.setAttribute('data-theme',t);
  S.set('theme',t);
  $$('.to').forEach(function(o){ o.classList.toggle('a',o.dataset.t===t); });
  unlockAch('theme_change');
}
$$('.to').forEach(function(o){ o.addEventListener('click', function(){ setTema(o.dataset.t); sndClick(); }); });

var mode=S.get('mode','dark');
function applyMode(){ if(mode==='light') document.body.classList.add('light'); else document.body.classList.remove('light'); if($('mode-tgl')) $('mode-tgl').textContent=mode==='light'?'☀️':'🌙'; }
if($('mode-tgl')) $('mode-tgl').onclick=function(){ mode=(mode==='dark')?'light':'dark'; S.set('mode',mode); applyMode(); sndClick(); if(mode==='dark') unlockAch('dark'); };
if($('tg-dark')) $('tg-dark').onchange=function(){ mode=this.checked?'dark':'light'; S.set('mode',mode); applyMode(); sndClick(); if(mode==='dark') unlockAch('dark'); };

function setBg(b){
  S.set('bg', b);
  document.body.classList.remove('bg-galaxy','bg-binary','bg-ufo','bg-plain','bg-custom');
  document.body.classList.add('bg-'+b);
  if(b==='custom'){ var img=S.get('bg_custom',''); document.body.style.backgroundImage = img ? 'url('+img+')' : 'none'; }
  else document.body.style.backgroundImage = '';
  $$('#bg-grid .snd-opt').forEach(function(o){ o.classList.toggle('a',o.dataset.bg===b); });
}
$$('#bg-grid .snd-opt').forEach(function(o){ o.addEventListener('click',function(){ setBg(o.dataset.bg); sndClick(); }); });
if($('bg-file')) $('bg-file').onchange=function(e){
  var f=e.target.files[0]; if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var c=document.createElement('canvas');
      var s=Math.min(1,1280/img.width);
      c.width=img.width*s; c.height=img.height*s;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      S.set('bg_custom',c.toDataURL('image/jpeg',.7));
      setBg('custom'); sndSuccess();
    };
    img.src=ev.target.result;
  };
  r.readAsDataURL(f);
};

// ============================================================
// NAV
// ============================================================
var currentPage = 'home';
function switchPage(name){
  if(name === currentPage) return;
  var oldPg = $('pg-'+currentPage);
  var newPg = $('pg-'+name);
  if(!newPg) return;
  if(oldPg){ oldPg.classList.remove('active'); oldPg.classList.add('hd'); }
  newPg.classList.remove('hd');
  void newPg.offsetWidth;
  newPg.classList.add('active');
  currentPage = name;

  if(name === 'bp' && typeof window.zyInitBypass === 'function'){ try{ window.zyInitBypass(); }catch(e){} }
  if(name === 'dl' && typeof window.zyInitDownloader === 'function'){ try{ window.zyInitDownloader(); }catch(e){} }
  if(name === 'hst'){ try{ renderHist(); }catch(e){} }
  if(name === 'tmp'){ try{ if(typeof window.tmpLoadDomains === 'function') window.tmpLoadDomains(); }catch(e){} }
  if(name === 'home'){ try{ renderAch(); }catch(e){} }
  if(name === 'up' && typeof window.zyInitApiHub === 'function'){ try{ window.zyInitApiHub('apihub-up','UPSCALE'); }catch(e){} }
  if(name === 'imgai' && typeof window.zyInitApiHub === 'function'){ try{ window.zyInitApiHub('apihub-ai','IMG AI'); }catch(e){} }
  if(name === 'imghd' && typeof window.zyInitApiHub === 'function'){ try{ window.zyInitApiHub('apihub-hd','IMG HD'); }catch(e){} }
  if(name === 'maker' && typeof window.zyInitApiHub === 'function'){ try{ window.zyInitApiHub('apihub-mk','MAKER'); }catch(e){} }
  if(name === 'srchapi' && typeof window.zyInitApiHub === 'function'){ try{ window.zyInitApiHub('apihub-sr','SEARCH'); }catch(e){} }
  try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){}
}

$$('.nb').forEach(function(b){
  b.addEventListener('click', function(){
    if(b.classList.contains('a')) return;
    sndClick();
    $$('.nb').forEach(function(x){ x.classList.remove('a'); });
    b.classList.add('a');
    switchPage(b.dataset.p);
  });
});

window.go = function(p){ var b = document.querySelector('.nb[data-p="'+p+'"]'); if(b && !b.classList.contains('a')) b.click(); };

// ============================================================
// DEV PANEL
// ============================================================
(function devPanelInit(){
  var modal = $('devModal');
  var devBtn = $('dev-btn');
  var closeBtn = $('devClose');
  var loginSec = $('devLogin');
  var dashSec = $('devDashboard');
  var loginBtn = $('devLoginBtn');
  var pwdInput = $('devPwdInput');
  var loginMsg = $('devLoginMsg');
  if(!modal || !devBtn) return;

  devBtn.addEventListener('click', function(){
    if(!isOwner()){ alert('Akses ditolak. Hanya OWNER.'); return; }
    sndClick(); unlockAch('dev_panel');
    modal.classList.add('show');
    if(isOwner()){
      loginSec.classList.add('hd');
      dashSec.classList.remove('hd');
      refreshPwdList();
    } else {
      loginSec.classList.remove('hd');
      dashSec.classList.add('hd');
    }
  });

  if(closeBtn) closeBtn.addEventListener('click', function(){ modal.classList.remove('show'); });

  if(loginBtn) loginBtn.addEventListener('click', async function(){
    var pwd = (pwdInput.value || '').trim().toLowerCase();
    if(!pwd){ loginMsg.innerHTML = '<div class="err-box">Password kosong</div>'; return; }
    loginMsg.innerHTML = '<div class="warn-box">Memverifikasi...</div>';
    var res = await deviceApi('/device/list?adminPassword=' + encodeURIComponent(pwd), { method: 'GET' });
    if(res.ok){
      loginSec.classList.add('hd');
      dashSec.classList.remove('hd');
      loginMsg.innerHTML = '';
      refreshPwdList();
    } else {
      loginMsg.innerHTML = '<div class="err-box">Password owner salah</div>';
      sndError();
    }
  });

  $$('.modal-tab').forEach(function(t){
    t.addEventListener('click', function(){
      $$('.modal-tab').forEach(function(x){ x.classList.remove('a'); });
      t.classList.add('a');
      $$('.modal-section').forEach(function(s){ s.classList.remove('a'); });
      var sec = $('dsec-' + t.dataset.dtab);
      if(sec) sec.classList.add('a');
    });
  });

  var genRole = null;
  try{
    genRole = window.initCustomSelect('genRoleCustom',
      [{id:'USER',name:'USER',desc:'cuma bisa pakai tools'},{id:'OWNER',name:'OWNER',desc:'akses dev panel'}],
      'USER',
      function(id){ }
    );
  }catch(e){}

  if($('genBtn')) $('genBtn').addEventListener('click', async function(){
    var prefix = ($('genPrefix').value || '').replace(/[^a-zA-Z0-9]/g,'');
    var role = genRole ? genRole.getValue() : 'USER';
    var adminPwd = SESSION ? SESSION.password : '';
    var res = await deviceApi('/device/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: adminPwd, prefix: prefix, role: role })
    });
    if(res.ok){
      $('genResult').innerHTML =
        '<div class="code-display">' +
        '<div class="code-text">' + res.password.toUpperCase() + '</div>' +
        '<div class="code-meta">ROLE: ' + res.role + '</div>' +
        '</div>' +
        '<button class="g" id="copyGenCode">📋 COPY CODE</button>' +
        '<div class="ok-box">✓ Berhasil generate. Kirim code ini ke user.</div>';
      var cb = $('copyGenCode');
      if(cb) cb.onclick = function(){
        navigator.clipboard.writeText(res.password.toUpperCase()).then(function(){ sndSuccess(); alert('Tersalin!'); });
      };
      sndSuccess(); unlockAch('gen_pass');
    } else {
      $('genResult').innerHTML = '<div class="err-box">✗ Gagal: ' + (res.error || 'unknown') + '</div>';
      sndError();
    }
  });

  if($('refreshListBtn')) $('refreshListBtn').addEventListener('click', refreshPwdList);

  async function refreshPwdList(){
    var adminPwd = SESSION ? SESSION.password : '';
    var res = await deviceApi('/device/list?adminPassword=' + encodeURIComponent(adminPwd), { method: 'GET' });
    var box = $('pwdList');
    if(!box) return;
    if(!res.ok || !res.list || !res.list.length){
      box.innerHTML = '<div class="warn-box">Belum ada password yang digenerate.</div>';
      return;
    }
    box.innerHTML = res.list.map(function(p, i){
      var status = p.revoked ? 'revoked' : (p.deviceId ? 'used' : 'free');
      var statusTxt = p.revoked ? 'REVOKED' : (p.deviceId ? 'USED' : 'FREE');
      var roleClass = p.role === 'OWNER' ? ' owner' : '';
      var devShort = p.deviceId ? p.deviceId.slice(0, 40) + '...' : '—';
      return '<div class="pwd-list-item">' +
        '<div class="pwd-list-row">' +
          '<div class="pwd-list-code">' + (p.password || '').toUpperCase() + '</div>' +
          '<div class="pwd-list-role' + roleClass + '">' + (p.role||'USER') + '</div>' +
          '<div class="pwd-status ' + status + '">' + statusTxt + '</div>' +
        '</div>' +
        '<div class="pwd-list-meta">prefix: ' + (p.prefix||'-') + ' · dibuat: ' + new Date(p.createdAt).toLocaleString('id-ID') + '</div>' +
        (p.deviceId ? '<div class="device-id">' + devShort + '</div>' : '') +
        '<div class="pwd-list-actions">' +
          (p.deviceId && !p.revoked ? '<button class="g" onclick="window.__devReset(\'' + p.password + '\')">🔄 RESET</button>' : '') +
          (!p.revoked ? '<button class="d" onclick="window.__devRevoke(\'' + p.password + '\')">🚫 REVOKE</button>' : '<button class="g" onclick="window.__devDelete(\'' + p.password + '\')">🗑 HAPUS</button>') +
        '</div>' +
      '</div>';
    }).join('');
  }

  if($('refreshDevBtn')) $('refreshDevBtn').addEventListener('click', refreshDevList);

  async function refreshDevList(){
    var adminPwd = SESSION ? SESSION.password : '';
    var res = await deviceApi('/device/devices?adminPassword=' + encodeURIComponent(adminPwd), { method: 'GET' });
    var box = $('devList');
    if(!box) return;
    if(!res.ok || !res.list || !res.list.length){
      box.innerHTML = '<div class="warn-box">Belum ada device aktif.</div>';
      return;
    }
    box.innerHTML = res.list.map(function(d){
      var lastSeen = d.lastSeen ? new Date(d.lastSeen).toLocaleString('id-ID') : '-';
      var ip = d.ip || '-';
      var isCurrent = d.deviceId === DEVICE_ID;
      return '<div class="pwd-list-item">' +
        '<div class="pwd-list-row">' +
          '<div class="pwd-list-role' + (d.role==='OWNER'?' owner':'') + '">' + (d.role||'USER') + '</div>' +
          (isCurrent ? '<div class="pwd-status used">YOU</div>' : '<button class="d" style="margin:0;padding:4px 8px;font-size:.5rem;width:auto" onclick="window.__devKick(\'' + d.deviceId + '\')">KICK</button>') +
        '</div>' +
        '<div class="pwd-list-meta">last seen: ' + lastSeen + ' · IP: ' + ip + '</div>' +
        '<div class="device-id">' + (d.deviceId || '').slice(0, 60) + '</div>' +
      '</div>';
    }).join('');
  }

  window.__devReset = async function(password){
    if(!confirm('Reset lock device untuk password ' + password + '?')) return;
    var res = await deviceApi('/device/reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: SESSION.password, password: password })
    });
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Reset OK'); } else { sndError(); alert('✗ ' + res.error); }
  };
  window.__devRevoke = async function(password){
    if(!confirm('Revoke (blokir total) password ' + password + '?')) return;
    var res = await deviceApi('/device/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: SESSION.password, password: password })
    });
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Revoked'); } else { sndError(); alert('✗ ' + res.error); }
  };
  window.__devDelete = async function(password){
    if(!confirm('Hapus permanen password ' + password + '?')) return;
    var res = await deviceApi('/device/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: SESSION.password, password: password })
    });
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Dihapus'); } else { sndError(); alert('✗ ' + res.error); }
  };
  window.__devKick = async function(deviceId){
    if(!confirm('Kick device ini?')) return;
    var res = await deviceApi('/device/kick', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: SESSION.password, deviceId: deviceId })
    });
    if(res.ok){ sndSuccess(); refreshDevList(); alert('✓ Kicked'); } else { sndError(); alert('✗ ' + res.error); }
  };
})();

// ============================================================
// API HUB WIRE
// ============================================================
function wireApiHub(tabId, catName){
  var runBtn = $('apihub-'+tabId+'-run');
  var clearBtn = $('apihub-'+tabId+'-clear');
  if(runBtn) runBtn.addEventListener('click', function(){
    sndClick();
    if(typeof window.zyRunApiHub === 'function'){
      try{
        window.zyRunApiHub('apihub-'+tabId, catName);
        if(catName === 'IMG AI') unlockAch('imgai_first');
        if(catName === 'IMG HD') unlockAch('imghd_first');
        if(catName === 'MAKER') unlockAch('maker_first');
        if(catName === 'UPSCALE') unlockAch('upscale_first');
      }catch(e){ alert('Error: '+e.message); }
    }
  });
  if(clearBtn) clearBtn.addEventListener('click', function(){
    sndClick();
    var log = $('apihub-'+tabId+'-log'), res = $('apihub-'+tabId+'-result');
    if(log){ log.innerHTML=''; log.classList.add('hd'); }
    if(res){ res.innerHTML=''; res.classList.add('hd'); }
  });
}
wireApiHub('up','UPSCALE');
wireApiHub('ai','IMG AI');
wireApiHub('hd','IMG HD');
wireApiHub('mk','MAKER');
wireApiHub('sr','SEARCH');

// ============================================================
// SEARCH WIRE
// ============================================================
window.__searchCategory = 'ALL';
$$('.search-cat').forEach(function(el){
  el.addEventListener('click', function(){
    $$('.search-cat').forEach(function(x){ x.classList.remove('a'); });
    el.classList.add('a');
    window.__searchCategory = el.dataset.cat || 'ALL';
    sndClick();
  });
});
if($('search-go')) $('search-go').onclick = function(){
  sndClick(); unlockAch('search_first');
  if(typeof window.zyRunSearch === 'function'){ try{ window.zyRunSearch(); }catch(e){ alert('Search error: '+e.message); } }
};
if($('search-input')) $('search-input').addEventListener('keydown', function(e){
  if(e.key === 'Enter'){ e.preventDefault(); if($('search-go')) $('search-go').click(); }
});

// ============================================================
// OTHER WIRES
// ============================================================
if($('bp-run')) $('bp-run').onclick=function(){ sndClick(); unlockAch('bypass_first'); if(typeof window.zyRunBypass==='function') try{ window.zyRunBypass(); }catch(e){ alert('Bypass error: '+e.message); } };
if($('bp-clear')) $('bp-clear').onclick=function(){ $('bp-log').innerHTML=''; $('bp-log').classList.add('hd'); $('bp-result').innerHTML=''; $('bp-result').classList.add('hd'); sndClick(); };
if($('dl-run')) $('dl-run').onclick=function(){ sndClick(); unlockAch('dl_first'); if(typeof window.zyRunDownloader==='function') try{ window.zyRunDownloader(); }catch(e){ alert('DL error: '+e.message); } };
if($('dl-run-all')) $('dl-run-all').onclick=function(){ sndClick(); unlockAch('dl_first'); if(typeof window.zyRunDownloaderAll==='function') try{ window.zyRunDownloaderAll(); }catch(e){ alert('DL error: '+e.message); } };
if($('dl-preview')) $('dl-preview').onclick=function(){ sndClick(); unlockAch('preview'); if(typeof window.zyPreviewResult==='function') try{ window.zyPreviewResult(); }catch(e){} };
if($('dl-clear')) $('dl-clear').onclick=function(){ sndClick(); if(typeof window.zyClearDownloader==='function') try{ window.zyClearDownloader(); }catch(e){} };

// hook tempmail copy
if($('tmp-copy')) $('tmp-copy').addEventListener('click', function(){ unlockAch('copy_email'); });

// ============================================================
// HISTORY
// ============================================================
function renderHist(){
  var h = S.get('history', []);
  var el = $('hl');
  if(!el) return;
  if(!h.length){ el.innerHTML = '<div class="r">Belum ada</div>'; return; }
  el.innerHTML = h.map(function(x, i){
    return '<div class="hi"><b>'+x.n+'</b> · '+x.s+' KB<div style="color:var(--txd);font-size:.55rem">'+new Date(x.t).toLocaleString()+'</div><div style="margin-top:6px"><button class="g" style="margin-top:0;font-size:.5rem;padding:5px 10px;width:auto;display:inline-block" onclick="window.dlHist('+i+')">DOWNLOAD</button></div></div>';
  }).join('');
}
window.dlHist = function(i){
  var h = S.get('history', []);
  if(!h[i]) return;
  var b = new Blob([h[i].c], {type:'text/plain'});
  var u = URL.createObjectURL(b);
  var a = document.createElement('a'); a.href = u; a.download = h[i].n;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  sndSuccess();
};
if($('hclr')) $('hclr').onclick=function(){ if(confirm('Clear?')){ S.del('history'); renderHist(); sndSuccess(); } };
if($('hexp')) $('hexp').onclick=function(){ var h=S.get('history',[]); var b=new Blob([JSON.stringify(h,null,2)],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download='history.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess(); };

// ============================================================
// DATA EXPORT/IMPORT
// ============================================================
if($('exst')) $('exst').onclick=function(){ var d={}; Object.keys(localStorage).forEach(function(k){ if(k.indexOf('rx_')===0) d[k]=localStorage[k]; }); var b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download='ryanntools_settings.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess(); };
if($('imst')) $('imst').onclick=function(){ var inp=document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=function(e){ var f=e.target.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(ev){ try{ var d=JSON.parse(ev.target.result); Object.keys(d).forEach(function(k){ localStorage.setItem(k,d[k]); }); location.reload(); }catch(er){ alert('Error: '+er.message); } }; r.readAsText(f); }; inp.click(); };
if($('wipe')) $('wipe').onclick=function(){ if(confirm('Wipe ALL?')){ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('rx_')===0) localStorage.removeItem(k); }); location.reload(); } };

// ============================================================
// WELCOME
// ============================================================
(function(){
  var modal = $('welcome-modal');
  if(!modal) return;
  function closeWm(){ modal.classList.add('hd'); sndClick(); }
  if($('wm-start')) $('wm-start').onclick = function(){ closeWm(); sndSuccess(); };
  if($('wm-skip')) $('wm-skip').onclick = closeWm;
})();

// ============================================================
// BOOT AFTER LOGIN
// ============================================================
function bootAfterLogin(){
  if(!isOwner()){
    deviceApi('/device/me?deviceId=' + encodeURIComponent(DEVICE_ID), { method: 'GET' }).then(function(res){
      if(!res || !res.ok || !res.registered){
        window.showAccessCodeGate();
      }
    });
  }

  if(isOwner()){
    var devBtn = $('dev-btn');
    if(devBtn) devBtn.classList.add('show');
    var rb = $('role-badge');
    if(rb) rb.classList.add('show');
  }

  var hr = $('homeRole');
  if(hr) hr.textContent = SESSION ? SESSION.role : 'USER';
  var hd = $('homeDevice');
  if(hd) hd.textContent = DEVICE_ID;

  try{ if(typeof window.zyInitBypass === 'function') window.zyInitBypass(); }catch(e){}
  try{ if(typeof window.zyInitDownloader === 'function') window.zyInitDownloader(); }catch(e){}
  try{ renderAch(); }catch(e){}

  try{
    if(window.initCustomSelect && $('tmp-domain')){
      window.__selTmpDom = window.initCustomSelect('tmp-domain', [{id:'',name:'— CHOOSE —'}], '', function(){});
    }
    if(typeof window.tmpInitProviderSelector === 'function'){
      window.tmpInitProviderSelector();
    }
  }catch(e){}
}

// ============================================================
// BOOT
// ============================================================
function boot(){
  try{ setTema(S.get('theme','t-cyan')); }catch(e){}
  try{ setBg(S.get('bg','galaxy')); }catch(e){}
  try{ applyMode(); }catch(e){}
  try{ renderHist(); }catch(e){}
  try{ renderAch(); }catch(e){}
}

// ============================================================
// AUTO-START
// ============================================================
SESSION = null;
S.del('session');
boot();
setInterval(renderAch, 5000);

})();

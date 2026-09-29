// app.js v10.5 FIXED — P2U + Vercel + GitHub wired
(function(){
'use strict';

var DEVICE_API = 'https://ryanndevice.hasbiiryan.workers.dev';
var OWNER_FALLBACK_PWD = 'ryanndev';

function $(i){ return document.getElementById(i); }
var $$ = function(q){ return document.querySelectorAll(q); };

var S = {
  set: function(k,v){ try{ localStorage.setItem('rx_'+k, JSON.stringify(v)); }catch(e){} },
  get: function(k,d){ try{ var v=localStorage.getItem('rx_'+k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  del: function(k){ try{ localStorage.removeItem('rx_'+k); }catch(e){} }
};

// ============ DEVICE FINGERPRINT ============
function makeFingerprint(){
  try{
    var parts=[navigator.userAgent||'', navigator.language||'', screen.width+'x'+screen.height+'x'+(screen.colorDepth||0), (new Date()).getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||'', navigator.deviceMemory||0, navigator.maxTouchPoints||0];
    try{ var c=document.createElement('canvas'); var ctx=c.getContext('2d'); ctx.textBaseline='top'; ctx.font='14px Arial'; ctx.fillText('ryann-fp-007',2,2); parts.push(c.toDataURL().slice(-40)); }catch(e){}
    var raw=parts.join('|'); var hash=0;
    for(var i=0;i<raw.length;i++){ hash=((hash<<5)-hash)+raw.charCodeAt(i); hash=hash&hash; }
    return 'fp'+Math.abs(hash).toString(36);
  }catch(e){ return 'fp'+Math.random().toString(36).slice(2,10); }
}
function getDeviceId(){
  var id=S.get('device_id',null); if(id) return id;
  var fp=makeFingerprint();
  var rand=Math.random().toString(36).slice(2,8)+Date.now().toString(36);
  id='dev_'+fp+'_'+rand;
  S.set('device_id',id); S.set('device_fp',fp);
  return id;
}
var DEVICE_ID = getDeviceId();
var DEVICE_FP = S.get('device_fp', makeFingerprint());

// ============ SESSION ============
var SESSION=null;
function saveSession(role,password){ SESSION={role:role,password:password,verifiedAt:Date.now()}; }
function clearSession(){ SESSION=null; }
function isOwner(){ return SESSION && SESSION.role==='OWNER'; }

async function deviceApi(path,opts){
  opts=opts||{};
  try{
    var r=await fetch(DEVICE_API+path,opts);
    if(!r.ok){ var j=await r.json().catch(function(){ return {ok:false,error:'http_'+r.status}; }); return j; }
    return await r.json();
  }catch(e){ return {ok:false,error:'network',message:e.message}; }
}

// ============ SOUND ============
var _audioCtx = null;
var _sndPack = S.get('snd_pack','beep');
var _sndMaster = S.get('snd_master',true);
var _volume = S.get('volume',70);
var _haptic = S.get('haptic',false);
var _anim = S.get('anim',true);

function _initAudio(){ if(!_audioCtx){ try{ _audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ _audioCtx=null; } } }
function _volLevel(){ return (_volume/100) * (_sndMaster?1:0); }
function _beep(freq,dur,type,v){ _initAudio(); if(!_audioCtx) return; v=(v||0.04)*_volLevel(); if(v<=0) return; try{ var o=_audioCtx.createOscillator(), g=_audioCtx.createGain(); o.type=type||'sine'; o.frequency.value=freq; g.gain.value=v; o.connect(g); g.connect(_audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime+dur); o.stop(_audioCtx.currentTime+dur); }catch(e){} }
function _noise(dur,v){ _initAudio(); if(!_audioCtx) return; v=(v||0.05)*_volLevel(); if(v<=0) return; try{ var b=_audioCtx.createBuffer(1,_audioCtx.sampleRate*dur,_audioCtx.sampleRate); var d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2); var s=_audioCtx.createBufferSource(); s.buffer=b; var g=_audioCtx.createGain(); g.gain.value=v; s.connect(g); g.connect(_audioCtx.destination); s.start(); }catch(e){} }

function sndPlay(kind){
  if(!_sndMaster||_sndPack==='off') return;
  var k=kind;
  switch(_sndPack){
    case 'beep': if(k==='click')_beep(800,.05,'square',.03); else if(k==='nav')_beep(500,.04,'sine',.02); else if(k==='success'){_beep(600,.08,'sine',.05);setTimeout(function(){_beep(900,.1,'sine',.05)},80);} else if(k==='error')_beep(200,.15,'sawtooth',.05); break;
    case 'click': if(k==='click'||k==='nav')_noise(.03,.06); else if(k==='success'){_noise(.03,.06);setTimeout(function(){_noise(.03,.06)},60);} else if(k==='error')_noise(.03,.08); break;
    case 'digital': if(k==='click')_beep(1200,.03,'square',.04); else if(k==='nav')_beep(1500,.02,'square',.03); else if(k==='success'){_beep(523,.07,'square',.04);setTimeout(function(){_beep(659,.07,'square',.04)},80);} else if(k==='error')_beep(200,.1,'square',.05); break;
    case 'soft': if(k==='click')_beep(400,.08,'sine',.02); else if(k==='nav')_beep(300,.04,'sine',.015); else if(k==='success'){_beep(500,.1,'sine',.03);setTimeout(function(){_beep(700,.12,'sine',.03)},100);} else if(k==='error')_beep(250,.15,'sine',.03); break;
    case 'honey': if(k==='click')_beep(520,.1,'sine',.04); else if(k==='success'){_beep(450,.15,'sine',.05);setTimeout(function(){_beep(620,.18,'sine',.05)},100);} else if(k==='error')_beep(280,.2,'sine',.04); else _beep(400,.06,'sine',.025); break;
    case 'cloud': if(k==='click')_beep(760,.12,'sine',.03); else if(k==='success'){_beep(680,.15,'sine',.04);setTimeout(function(){_beep(880,.2,'sine',.04)},120);} else if(k==='error')_beep(340,.2,'sine',.035); else _beep(600,.08,'sine',.02); break;
    case 'cherry': if(k==='click')_beep(900,.07,'triangle',.035); else if(k==='success'){_beep(750,.1,'triangle',.045);setTimeout(function(){_beep(1050,.12,'triangle',.045)},90);} else if(k==='error')_beep(400,.15,'triangle',.04); else _beep(700,.05,'triangle',.02); break;
    case 'ocean': if(k==='click')_beep(180,.15,'sine',.04); else if(k==='success'){_beep(200,.2,'sine',.05);setTimeout(function(){_beep(280,.25,'sine',.05)},140);} else if(k==='error')_beep(120,.25,'sine',.04); else _beep(140,.1,'sine',.03); break;
    case 'coral': if(k==='click')_beep(640,.1,'triangle',.04); else if(k==='success'){_beep(560,.13,'triangle',.05);setTimeout(function(){_beep(740,.16,'triangle',.05)},100);} else if(k==='error')_beep(320,.18,'triangle',.04); else _beep(500,.07,'triangle',.025); break;
    case 'mint': if(k==='click')_beep(850,.06,'sine',.035); else if(k==='success'){_beep(720,.09,'sine',.045);setTimeout(function(){_beep(960,.12,'sine',.045)},80);} else if(k==='error')_beep(380,.14,'sine',.035); else _beep(680,.04,'sine',.02); break;
    case 'lavender': if(k==='click')_beep(480,.13,'sine',.032); else if(k==='success'){_beep(420,.16,'sine',.042);setTimeout(function(){_beep(580,.18,'sine',.042)},110);} else if(k==='error')_beep(240,.2,'sine',.032); else _beep(360,.09,'sine',.022); break;
    case 'peach': if(k==='click')_beep(580,.1,'sine',.038); else if(k==='success'){_beep(500,.12,'sine',.045);setTimeout(function(){_beep(660,.15,'sine',.045)},95);} else if(k==='error')_beep(300,.18,'sine',.038); else _beep(450,.07,'sine',.024); break;
    case 'tap': if(k==='click')_noise(.02,.08); else if(k==='nav')_noise(.015,.05); else if(k==='success'){_noise(.02,.07);setTimeout(function(){_noise(.02,.07)},70);} else if(k==='error')_noise(.03,.09); break;
    case 'pop': if(k==='click'){_beep(700,.03,'sine',.06);_beep(1200,.02,'sine',.04);} else if(k==='nav')_beep(600,.03,'sine',.04); else if(k==='success'){_beep(650,.04,'sine',.06);_beep(1100,.03,'sine',.05);setTimeout(function(){_beep(1400,.03,'sine',.04)},80);} else if(k==='error'){_beep(300,.05,'sine',.05);_beep(180,.08,'sine',.04);} break;
    case '8bit': if(k==='click'){_beep(440,.04,'square',.05);_beep(880,.02,'square',.03);} else if(k==='nav')_beep(330,.05,'square',.04); else if(k==='success'){_beep(523,.06,'square',.05);setTimeout(function(){_beep(659,.06,'square',.05);},60);setTimeout(function(){_beep(784,.1,'square',.05);},120);} else if(k==='error'){_beep(200,.08,'square',.06);setTimeout(function(){_beep(150,.12,'square',.06);},80);} break;
  }
}
function sndSuccess(){ sndPlay('success'); }
function sndClick(){ sndPlay('click'); }
function sndError(){ sndPlay('error'); }
function sndNav(){ sndPlay('nav'); }
function vib(ms){ if(!_haptic) return; if(navigator.vibrate) try{ navigator.vibrate(ms||20); }catch(e){} }
function logTo(id,msg,cls){
  var el=$(id); if(!el)return;
  var d=document.createElement('div'); d.className=cls||'ok';
  d.textContent='['+new Date().toLocaleTimeString()+'] '+msg;
  el.appendChild(d); el.scrollTop=el.scrollHeight;
}
window.logTo=logTo; window.sndSuccess=sndSuccess; window.sndClick=sndClick; window.sndError=sndError;

// ============ ACHIEVEMENTS (26, no duplicate) ============
var ACH_LIST = [
  {id:'first_gen',name:'The Beginning',desc:'Pertama kali generate'},
  {id:'ten_gen',name:'Taking Off',desc:'10x generate'},
  {id:'fifty_gen',name:'Benchmarking',desc:'50x generate'},
  {id:'hundred_gen',name:'The Beginning.',desc:'100x generate'},
  {id:'tmp_first',name:'Beam Me Up',desc:'Pertama generate tempmail'},
  {id:'inbox_first',name:'Monster Hunter',desc:'Pertama refresh inbox'},
  {id:'bypass_first',name:'Bypass Rookie',desc:'Pertama bypass link'},
  {id:'search_first',name:'Seek & Find',desc:'Pertama pakai search'},
  {id:'dl_first',name:'Download Master',desc:'Pertama download file'},
  {id:'imgai_first',name:'AI Artist',desc:'Pertama generate AI image'},
  {id:'imghd_first',name:'Enhancer',desc:'Pertama enhance image'},
  {id:'maker_first',name:'Canvas Master',desc:'Pertama pakai maker'},
  {id:'upscale_first',name:'Upscaler',desc:'Pertama pakai upscale'},
  {id:'preview',name:'Sneak Peek',desc:'Pertama preview media'},
  {id:'dev_panel',name:'Dev Access',desc:'Pertama buka dev panel'},
  {id:'gen_pass',name:'Password Smith',desc:'Pertama generate password'},
  {id:'copy_email',name:'Copy Cat',desc:'Copy email tempmail'},
  {id:'theme_change',name:'Delicious Fish',desc:'Ganti theme'},
  {id:'dark',name:'We Need to Go Deeper',desc:'Aktifkan dark mode'},
  {id:'scrape_first',name:'Time to Mine',desc:'Pertama scrape proxy'},
  {id:'check_first',name:'Acquire Hardware',desc:'Pertama cek proxy'},
  {id:'deploy_first',name:'Return to Sender',desc:'Pertama deploy Vercel'},
  {id:'dork_first',name:'Hot Topic',desc:'Generate Google Dork'},
  {id:'ip_first',name:'Time to Strike!',desc:'Pertama IP lookup'},
  {id:'p2u_first',name:'Link Master',desc:'Pertama pakai P2U'},
  {id:'github_first',name:'Repo Raider',desc:'Pertama upload GitHub'}
];
var ACH_KEY='rx_ach_unlocked';
function getAch(){ try{ return JSON.parse(localStorage.getItem(ACH_KEY)||'{}'); }catch(e){ return {}; } }
function setAch(a){ try{ localStorage.setItem(ACH_KEY,JSON.stringify(a)); }catch(e){} }

function renderAch(){
  var wrap=document.getElementById('ach-wrap'); if(!wrap) return;
  var ach=getAch();
  var count=Object.keys(ach).length;
  if(ach['all']) count = count - 1; // exclude 'all' dari counter
  var counter=document.getElementById('achCounter');
  if(counter) counter.innerHTML=count+' <span>/ '+ACH_LIST.length+'</span>';
  var html='';
  for(var i=0;i<ACH_LIST.length;i++){
    var a=ACH_LIST[i]; var u=ach[a.id];
    html+='<div class="ach '+(u?'unlocked':'locked')+'"><div>'+(u?'🏆 ':'🔒 ')+a.name+'</div><div class="desc">'+a.desc+'</div></div>';
  }
  wrap.innerHTML=html;
}
window.unlockAch=function(id){
  try{
    var ach=getAch(); if(ach[id]) return;
    ach[id]=Date.now(); setAch(ach);
    var a=null; for(var i=0;i<ACH_LIST.length;i++){ if(ACH_LIST[i].id===id){ a=ACH_LIST[i]; break; } }
    if(a && typeof window.zyToast==='function') window.zyToast('🏆 '+a.name);
    renderAch();
    var realCount = Object.keys(ach).filter(function(k){ return k !== 'all'; }).length;
    if(!ach['all'] && realCount >= ACH_LIST.length){
      ach['all']=Date.now(); setAch(ach);
      if(typeof window.zyToast==='function') window.zyToast('🏆 The End.');
      renderAch();
    }
  }catch(e){}
};
window.__genCount=parseInt(localStorage.getItem('rx_gen_count')||'0',10);
window.__addGen=function(){
  window.__genCount++;
  localStorage.setItem('rx_gen_count',String(window.__genCount));
  if(window.__genCount>=1) window.unlockAch('first_gen');
  if(window.__genCount>=10) window.unlockAch('ten_gen');
  if(window.__genCount>=50) window.unlockAch('fifty_gen');
  if(window.__genCount>=100) window.unlockAch('hundred_gen');
};
window.renderAch=renderAch;

// ============ CUSTOM SELECT ============
window.initCustomSelect = function(containerId,items,selectedId,onSelect,opts){
  opts=opts||{};
  var container=document.getElementById(containerId); if(!container) return null;
  container.innerHTML='';
  var btn=document.createElement('button'); btn.type='button'; btn.className='zy-select-btn';
  function labelFor(id){ var it=items.find(function(x){ return x.id===id; }); return it?it.name:(opts.placeholder||'— CHOOSE —'); }
  function updateLabel(){ var lbl=btn.querySelector('.zy-btn-label'); if(lbl) lbl.textContent=labelFor(selectedId); }
  btn.innerHTML='<span class="zy-btn-label">'+labelFor(selectedId)+'</span><span class="zy-select-arrow">▾</span>';
  var list=document.createElement('div'); list.className='zy-select-list';
  function renderList(){
    list.innerHTML='';
    items.forEach(function(it){
      var opt=document.createElement('div');
      opt.className='zy-select-opt'+(it.id===selectedId?' active':'');
      opt.innerHTML='<span>'+it.name+'</span>'+(it.desc?'<small>'+it.desc+'</small>':'');
      opt.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        selectedId=it.id; updateLabel(); closeList();
        if(typeof onSelect==='function') onSelect(it.id,it);
      });
      list.appendChild(opt);
    });
  }
  function openList(){ renderList(); list.classList.add('open'); btn.classList.add('open'); }
  function closeList(){ list.classList.remove('open'); btn.classList.remove('open'); }
  function toggleList(){ if(list.classList.contains('open')) closeList(); else openList(); }
  btn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); toggleList(); });
  container.appendChild(btn); container.appendChild(list);
  return {
    getValue:function(){ return selectedId; },
    setValue:function(id){ selectedId=id; updateLabel(); },
    setItems:function(newItems){
      items=newItems;
      if(!items.find(function(x){ return x.id===selectedId; }) && items.length) selectedId=items[0].id;
      updateLabel(); if(list.classList.contains('open')) renderList();
    }
  };
};

// ============ COPY WITH ANIM ============
window.copyWithAnim = function(el, text){
  if(!el || !text) return;
  navigator.clipboard.writeText(text).then(function(){
    el.classList.add('copied');
    if(typeof window.zyToast==='function') window.zyToast('✓ Tersalin');
    if(typeof window.sndSuccess==='function') window.sndSuccess();
    setTimeout(function(){ el.classList.remove('copied'); }, 1200);
  }).catch(function(){
    if(typeof window.zyToast==='function') window.zyToast('✗ Gagal copy', 'error');
  });
};

// ============ PASSWORD GATE — ZERO TOUCH ============
(function passwordGateInit(){
  var gate=$('passwordGate'); if(!gate) return;
  var card=$('accessCard'), input=$('passwordInput');
  var boxes=gate.querySelectorAll('.password-box');
  var boxesWrap=$('passwordBoxes'), statusText=$('statusText'), continueBtn=$('continueBtn');
  var eyeToggle=$('eyeToggle'), eyeOpen=$('eyeOpen'), eyeClosed=$('eyeClosed');
  var verifyOverlay=$('gateVerifying'), orbitStatus=$('orbitStatus');
  var verified=false, passwordVisible=false;
  if(!input || !boxesWrap || !continueBtn) return;

  if(eyeToggle){
    eyeToggle.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      passwordVisible=!passwordVisible;
      if(eyeOpen) eyeOpen.style.display=passwordVisible?'none':'';
      if(eyeClosed) eyeClosed.style.display=passwordVisible?'':'none';
      updateBoxes(input.value);
    });
  }
  function updateBoxes(raw){
    var value=(raw||'').slice(0,8);
    Array.prototype.forEach.call(boxes,function(box,index){
      box.classList.remove('filled','active');
      if(index<value.length){ box.textContent=passwordVisible?value[index]:'•'; box.classList.add('filled'); }
      else { box.textContent=''; }
    });
    if(value.length<8 && boxes[value.length]) boxes[value.length].classList.add('active');
  }
  boxesWrap.addEventListener('click',function(e){ if(eyeToggle && e.target.closest('#eyeToggle')) return; input.focus(); });
  input.addEventListener('input',function(){
    var raw=input.value||''; updateBoxes(raw);
    statusText.classList.remove('ok','err','success');
    statusText.textContent=raw.length===8?'PRESS ENTER TO VERIFY':'WAITING FOR PASSWORD';
  });
  input.addEventListener('keydown',function(event){ if(event.key==='Enter'){ event.preventDefault(); verifyPassword(); } });
  continueBtn.addEventListener('click',function(){
    if(verified){
      if(verifyOverlay) verifyOverlay.classList.remove('on');
      gate.classList.add('gate-hidden');
      setTimeout(function(){ gate.style.display='none'; },700);
      return;
    }
    verifyPassword();
  });
  async function verifyPassword(){
    var raw=(input.value||'').trim().toLowerCase();
    if(raw.length!==8){ shakeError('PASSWORD HARUS 8 KARAKTER'); return; }
    statusText.textContent='VERIFYING...'; statusText.classList.add('ok');
    if(verifyOverlay) verifyOverlay.classList.add('on');
    var res=await deviceApi('/device/validate',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:raw, deviceId:DEVICE_ID, fingerprint:DEVICE_FP})
    });
    if(!res.ok && res.error==='network'){
      if(raw===OWNER_FALLBACK_PWD.toLowerCase()) res={ok:true,role:'OWNER',bootstrap:true,fallback:true};
    }
    if(!res.ok){
      var msg='INVALID PASSWORD';
      if(res.error==='locked_other_device') msg='PASSWORD DIPAKAI DI DEVICE LAIN';
      else if(res.error==='revoked') msg='PASSWORD DIBLOKIR';
      else if(res.error==='invalid_password') msg='PASSWORD TIDAK DITEMUKAN';
      else if(res.error==='network') msg='TIDAK BISA HUBUNGI SERVER';
      shakeError(msg);
      if(orbitStatus) orbitStatus.textContent='ACCESS DENIED';
      if(verifyOverlay) setTimeout(function(){ verifyOverlay.classList.remove('on'); },1500);
      return;
    }
    verified=true;
    saveSession(res.role||'USER', raw);
    statusText.textContent='ACCESS VERIFIED';
    statusText.classList.remove('ok','err'); statusText.classList.add('success');
    if(orbitStatus) orbitStatus.textContent='ACCESS VERIFIED';
    Array.prototype.forEach.call(boxes,function(box){ box.textContent='✓'; box.classList.add('success'); });
    continueBtn.classList.add('ready');
    setTimeout(function(){
      if(verifyOverlay) verifyOverlay.classList.remove('on');
      gate.classList.add('gate-hidden');
      setTimeout(function(){ gate.style.display='none'; bootAfterLogin(); },700);
    },1200);
  }
  function shakeError(msg){
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    statusText.textContent=msg;
    statusText.classList.remove('ok','success'); statusText.classList.add('err');
    Array.prototype.forEach.call(boxes,function(box){ box.classList.remove('filled','active','success'); box.classList.add('error'); });
    setTimeout(function(){
      Array.prototype.forEach.call(boxes,function(box){ box.textContent=''; box.classList.remove('error','filled','active'); });
      if(boxes[0]) boxes[0].classList.add('active');
      input.value='';
      statusText.textContent='WAITING FOR PASSWORD';
      statusText.classList.remove('err');
    },1500);
  }
  setTimeout(function(){ try{ input.focus(); }catch(e){} },300);
})();

// ============ ACCESS CODE GATE — ZERO TOUCH ============
(function accessCodeGateInit(){
  var gate=$('accessCodeGate'); if(!gate) return;
  var input=$('accessCodeInput'), btn=$('accessCodeBtn'), msg=$('accessCodeMsg');
  async function submit(){
    var code=(input.value||'').trim().toLowerCase();
    if(code.length!==8){ msg.textContent='KODE HARUS 8 KARAKTER'; msg.style.color='var(--er)'; return; }
    msg.textContent='VERIFIKASI...'; msg.style.color='var(--txd)';
    var res=await deviceApi('/device/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:code,deviceId:DEVICE_ID,fingerprint:DEVICE_FP})});
    if(!res.ok){
      var m='KODE TIDAK VALID';
      if(res.error==='locked_other_device') m='KODE DIPAKAI DI DEVICE LAIN';
      else if(res.error==='revoked') m='KODE DIBLOKIR';
      else if(res.error==='network') m='TIDAK BISA HUBUNGI SERVER';
      msg.textContent=m; msg.style.color='var(--er)'; return;
    }
    saveSession(res.role||'USER', code);
    msg.textContent='BERHASIL'; msg.style.color='var(--ok)';
    setTimeout(function(){ gate.classList.remove('show'); bootAfterLogin(); },700);
  }
  if(btn) btn.addEventListener('click', submit);
  if(input) input.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); submit(); } });
})();
window.showAccessCodeGate=function(){ var gate=$('accessCodeGate'); if(gate) gate.classList.add('show'); };

// ============ THEME + MODE + BG + CUSTOM COLOR ============
function hexToRgba(hex,a){ var h=hex.replace('#',''); if(h.length===3) h=h.split('').map(function(c){return c+c}).join(''); var r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16); return 'rgba('+r+','+g+','+b+','+a+')'; }
function applyCustomTheme(ac,bg,br){
  var el=document.getElementById('custom-theme-override');
  if(!el){ el=document.createElement('style'); el.id='custom-theme-override'; document.head.appendChild(el); }
  var css='';
  if(ac) css+=':root,body[data-theme]{--ac:'+ac+' !important;--ac2:'+ac+' !important;--acd:'+hexToRgba(ac,0.15)+' !important}';
  if(bg) css+=':root,body[data-theme]{--bg:'+bg+' !important}';
  if(br) css+=':root,body[data-theme]{--border:'+br+' !important;--bl:'+br+' !important}';
  el.textContent=css;
}
function clearCustomTheme(){ var el=document.getElementById('custom-theme-override'); if(el && el.parentNode) el.parentNode.removeChild(el); }
function loadCustomTheme(){ var c=S.get('cust_theme',null); if(c&&c.ac){ var a=$('cust-ac'),b=$('cust-bg'),d=$('cust-br'); if(a)a.value=c.ac; if(b)b.value=c.bg; if(d)d.value=c.br; applyCustomTheme(c.ac,c.bg,c.br); } }

function setTema(t){
  document.body.setAttribute('data-theme',t);
  S.set('theme',t);
  $$('.to').forEach(function(o){ o.classList.toggle('a',o.dataset.t===t); });
  if(window.unlockAch) window.unlockAch('theme_change');
}
$$('.to').forEach(function(o){ o.addEventListener('click',function(){ clearCustomTheme(); S.del('cust_theme'); setTema(o.dataset.t); sndClick(); }); });

if($('cust-apply')) $('cust-apply').onclick=function(){
  var ac=$('cust-ac').value, bg=$('cust-bg').value, br=$('cust-br').value;
  S.set('cust_theme',{ac:ac,bg:bg,br:br});
  applyCustomTheme(ac,bg,br);
  sndSuccess(); vib(20);
};
if($('cust-rand')) $('cust-rand').onclick=function(){
  function hsl2hex(hu,s,l){ s/=100; l/=100; var c=(1-Math.abs(2*l-1))*s; var x=c*(1-Math.abs((hu/60)%2-1)); var m=l-c/2; var r=0,g=0,b=0; if(hu<60){r=c;g=x;b=0}else if(hu<120){r=x;g=c;b=0}else if(hu<180){r=0;g=c;b=x}else if(hu<240){r=0;g=x;b=c}else if(hu<300){r=x;g=0;b=c}else{r=c;g=0;b=x} function hx(v){ var s=Math.round((v+m)*255).toString(16); return s.length<2?'0'+s:s; } return '#'+hx(r)+hx(g)+hx(b); }
  var h=Math.floor(Math.random()*360);
  var ac=hsl2hex(h,90,60); var bg=hsl2hex((h+150)%360,70,6); var br=hsl2hex((h+30)%360,70,35);
  $('cust-ac').value=ac; $('cust-bg').value=bg; $('cust-br').value=br;
  S.set('cust_theme',{ac:ac,bg:bg,br:br});
  applyCustomTheme(ac,bg,br);
  sndSuccess(); vib(20);
};
if($('cust-reset')) $('cust-reset').onclick=function(){ S.del('cust_theme'); clearCustomTheme(); setTema(S.get('theme','t-cyan')); sndSuccess(); };

var mode=S.get('mode','dark');
function applyMode(){ if(mode==='light') document.body.classList.add('light'); else document.body.classList.remove('light'); if($('mode-tgl')) $('mode-tgl').textContent=mode==='light'?'☀️':'🌙'; }
if($('mode-tgl')) $('mode-tgl').onclick=function(){ mode=(mode==='dark')?'light':'dark'; S.set('mode',mode); applyMode(); sndClick(); if(mode==='dark' && window.unlockAch) window.unlockAch('dark'); };
if($('tg-dark')) $('tg-dark').onchange=function(){ mode=this.checked?'dark':'light'; S.set('mode',mode); applyMode(); sndClick(); if(mode==='dark' && window.unlockAch) window.unlockAch('dark'); };

function setBg(b){
  S.set('bg', b);
  document.body.classList.remove('bg-galaxy','bg-binary','bg-ufo','bg-plain','bg-custom','bg-retro','bg-starwars');
  document.body.classList.add('bg-'+b);
  if(b==='custom'){ var img=S.get('bg_custom',''); document.body.style.backgroundImage=img?'url('+img+')':'none'; }
  else document.body.style.backgroundImage='';
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

// ============ SOUND UI ============
$$('#snd-grid .snd-opt').forEach(function(o){
  o.addEventListener('click',function(){
    _sndPack=o.dataset.snd; S.set('snd_pack',_sndPack);
    $$('#snd-grid .snd-opt').forEach(function(x){ x.classList.toggle('a',x.dataset.snd===_sndPack); });
    if(_sndPack!=='off') sndSuccess();
  });
});
if($('test-snd')) $('test-snd').onclick=function(){
  var old=_sndPack;
  if(_sndPack==='off') _sndPack='beep';
  sndSuccess();
  setTimeout(function(){ _sndPack=old; },300);
};

var volRange=$('vol-range');
if(volRange){
  volRange.value=_volume;
  if($('vol-val')) $('vol-val').textContent=_volume+'%';
  volRange.addEventListener('input',function(){ _volume=parseInt(this.value); S.set('volume',_volume); if($('vol-val')) $('vol-val').textContent=_volume+'%'; });
  volRange.addEventListener('change',function(){ sndSuccess(); });
}
if($('tg-sound')){ $('tg-sound').checked=_sndMaster; $('tg-sound').onchange=function(){ _sndMaster=this.checked; S.set('snd_master',_sndMaster); if(_sndMaster) sndSuccess(); }; }
if($('tg-notif')){ $('tg-notif').checked=S.get('notif_on',true); $('tg-notif').onchange=function(){ S.set('notif_on',this.checked); }; }
if($('tg-popup')){ $('tg-popup').checked=S.get('popup_on',true); $('tg-popup').onchange=function(){ S.set('popup_on',this.checked); }; }
if($('tg-anim')){ $('tg-anim').checked=_anim; $('tg-anim').onchange=function(){ _anim=this.checked; S.set('anim',_anim); if(_anim) document.body.classList.remove('no-anim'); else document.body.classList.add('no-anim'); }; }
if($('tg-haptic')){ $('tg-haptic').checked=_haptic; $('tg-haptic').onchange=function(){ _haptic=this.checked; S.set('haptic',_haptic); if(_haptic) vib(50); }; }
if($('fsr')) $('fsr').oninput=function(){ document.documentElement.style.setProperty('--fs',this.value+'px'); S.set('font',this.value); if($('fv')) $('fv').textContent=this.value+'px'; };

var FONT_LIST = [
  {id:"'JetBrains Mono',monospace", name:'JetBrains Mono'},
  {id:"'Orbitron',sans-serif", name:'Orbitron'},
  {id:"'Courier New',monospace", name:'Courier New'},
  {id:"'Fira Code',monospace", name:'Fira Code'},
  {id:"system-ui,-apple-system,sans-serif", name:'System UI'},
  {id:"'Roboto',sans-serif", name:'Roboto'},
  {id:"'Consolas',monospace", name:'Consolas'},
  {id:"'VT323',monospace", name:'VT323 (8-bit)'},
  {id:"'Press Start 2P',monospace", name:'Press Start 2P'}
];
if($('sel-font')){
  window.__selFont = window.initCustomSelect('sel-font', FONT_LIST, S.get('font_family', FONT_LIST[0].id), function(id){
    S.set('font_family', id);
    document.documentElement.style.setProperty('--fm', id);
    if($('ffam')) $('ffam').value = id;
  });
}

// ============ NAV ============
var currentPage='home';
function switchPage(name){
  if(name===currentPage) return;
  var oldPg=$('pg-'+currentPage), newPg=$('pg-'+name);
  if(!newPg) return;
  if(oldPg){ oldPg.classList.remove('active'); oldPg.classList.add('hd'); }
  newPg.classList.remove('hd'); void newPg.offsetWidth; newPg.classList.add('active');
  currentPage=name;
  if(name==='bp' && typeof window.zyInitBypass==='function'){ try{ window.zyInitBypass(); }catch(e){} }
  if(name==='dl' && typeof window.zyInitDownloader==='function'){ try{ window.zyInitDownloader(); }catch(e){} }
  if(name==='hst'){ try{ renderHist(); }catch(e){} }
  if(name==='home'){ try{ renderAch(); }catch(e){} }
  if(name==='tmp'){ try{ if(typeof window.tmpLoadDomains==='function') window.tmpLoadDomains(); }catch(e){} }
  if(name==='up' && typeof window.zyInitApiHub==='function'){ try{ window.zyInitApiHub('apihub-up','UPSCALE'); }catch(e){} }
  if(name==='imgai' && typeof window.zyInitApiHub==='function'){ try{ window.zyInitApiHub('apihub-ai','IMG AI'); }catch(e){} }
  if(name==='imghd' && typeof window.zyInitApiHub==='function'){ try{ window.zyInitApiHub('apihub-hd','IMG HD'); }catch(e){} }
  if(name==='maker' && typeof window.zyInitApiHub==='function'){ try{ window.zyInitApiHub('apihub-mk','MAKER'); }catch(e){} }
  if(name==='srchapi' && typeof window.zyInitApiHub==='function'){ try{ window.zyInitApiHub('apihub-sr','SEARCH'); }catch(e){} }
  if(name==='tpl'){ try{ tplBoot(); }catch(e){} }
  if(name==='p2u' && typeof window.__initP2U==='function'){ try{ window.__initP2U(); }catch(e){} }
  if(name==='vc' && typeof window.__initVercel==='function'){ try{ window.__initVercel(); }catch(e){} }
  if(name==='gh' && typeof window.__initGithub==='function'){ try{ window.__initGithub(); }catch(e){} }
  try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
}
$$('.nb').forEach(function(b){
  b.addEventListener('click',function(){
    if(b.classList.contains('a')) return;
    sndNav(); vib(10);
    $$('.nb').forEach(function(x){ x.classList.remove('a'); });
    b.classList.add('a');
    switchPage(b.dataset.p);
  });
});
window.go=function(p){ var b=document.querySelector('.nb[data-p="'+p+'"]'); if(b && !b.classList.contains('a')) b.click(); };

// ============ SPY ============
var SPY_STATE={code:'',blob:null,template:''};
(function spyInit(){
  var tp=$('tp'), tu=$('tu');
  if(tp) tp.onclick=function(){ tp.classList.add('a'); tu.classList.remove('a'); $('sp').classList.remove('hd'); $('su').classList.add('hd'); };
  if(tu) tu.onclick=function(){ tu.classList.add('a'); tp.classList.remove('a'); $('su').classList.remove('hd'); $('sp').classList.add('hd'); };
  if($('fi')) $('fi').onchange=function(e){
    var f=e.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(ev){ $('ci').value=ev.target.result; $('finfo').innerHTML='<div class="r" style="border-color:var(--ac);background:var(--acd);color:var(--ac)">'+f.name+' · '+(f.size/1024).toFixed(1)+' KB</div>'; };
    r.readAsText(f); sndSuccess();
  };
  ['bt','ct','on'].forEach(function(id){
    var el=$(id); if(!el) return;
    var s=S.get('f_'+id,''); if(s) el.value=s;
    var fn=function(){ S.set('f_'+id,el.value); };
    el.addEventListener('input',fn); el.addEventListener('change',fn);
  });
  function templateItems(){
    var items=[{id:'',name:'— CHOOSE —'}];
    if(window.TEMPLATE_COMMAND) items.push({id:'command',name:'SPYWARE COMMAND',desc:'Spyware penuh'});
    if(window.TEMPLATE_BASE) items.push({id:'base',name:'SPYWARE BASE',desc:'Template dasar'});
    return items;
  }
  window.__selSpyTpl=window.initCustomSelect('sel-template',templateItems(),S.get('sel_spy_tpl',''),function(id){
    S.set('sel_spy_tpl',id); SPY_STATE.template=id; var ts=$('ts'); if(ts) ts.value=id;
  });
  function inject(t,u){
    var ls=t.split('\n'), li=-1;
    for(var i=0;i<ls.length;i++){ var l=ls[i].trim(); if(l.indexOf('import ')===0 || l.indexOf('from ')===0) li=i; }
    if(li===-1) return u+'\n\n'+t;
    var b=ls.slice(0,li+1).join('\n'), a=ls.slice(li+1).join('\n');
    return b+'\n\n# USER CODE\n'+u+'\n# END USER CODE\n'+a;
  }
  var gulpBtn=$('gulp-generate');
  if(gulpBtn) gulpBtn.addEventListener('click',function(e){
    e.stopPropagation();
    if(gulpBtn.dataset.state==='pending' || gulpBtn.dataset.state==='eat' || gulpBtn.dataset.state==='done') return;
    var uc=($('ci')||{}).value ? $('ci').value.trim() : '';
    var tpl=($('ts')||{}).value || (window.__selSpyTpl ? window.__selSpyTpl.getValue() : '');
    var sw=$('sw'), rc=$('rc');
    if(!uc){ if(sw) sw.innerHTML='<div class="err-box">Code kosong</div>'; if(rc) rc.classList.add('hd'); sndError(); return; }
    if(!tpl){ if(sw) sw.innerHTML='<div class="err-box">Pilih template</div>'; if(rc) rc.classList.add('hd'); sndError(); return; }
    gulpBtn.dataset.state='eat';
    setTimeout(function(){
      gulpBtn.dataset.state='pending';
      if(sw) sw.innerHTML='<div class="warn-box">⚙ Memproses...</div>';
      var t0=performance.now();
      var bt=($('bt')||{}).value?$('bt').value.trim():'';
      var ct=($('ct')||{}).value?$('ct').value.trim():'';
      setTimeout(function(){
        var t=(tpl==='command')?(window.TEMPLATE_COMMAND||''):(window.TEMPLATE_BASE||'');
        if(!t){ if(sw) sw.innerHTML='<div class="err-box">Template kosong</div>'; sndError(); gulpBtn.dataset.state='idle'; return; }
        var out=t;
        if(bt) out=out.replace(/BOT_TOKEN\s*=\s*['"][^'"]*['"]/g,'BOT_TOKEN = "'+bt+'"');
        if(ct) out=out.replace(/CHAT_ID\s*=\s*['"][^'"]*['"]/g,'CHAT_ID   = "'+ct+'"');
        var final=inject(out,uc);
        SPY_STATE.code=final;
        SPY_STATE.blob=new Blob([final],{type:'text/x-python'});
        var name=(($('on')||{}).value||'spyware_ryan').trim()+'.py';
        var kb=(final.length/1024).toFixed(1);
        var ln=final.split('\n').length;
        var el=Math.round(performance.now()-t0);
        if(sw) sw.innerHTML='<div class="ok-box">✓ Berhasil · '+kb+' KB · '+el+'ms</div>';
        if($('rm')) $('rm').textContent=name;
        if($('rs')) $('rs').textContent=ln+' lines · '+kb+' KB';
        if(rc) rc.classList.remove('hd');
        sndSuccess();
        var h=S.get('history',[]);
        h.unshift({n:name,s:kb,l:ln,t:Date.now(),c:final.substring(0,40000)});
        if(h.length>30) h=h.slice(0,30);
        S.set('history',h);
        if(window.__addGen) window.__addGen();
        gulpBtn.dataset.state='done';
        setTimeout(function(){ gulpBtn.dataset.state='idle'; },2500);
      },180);
    },520);
  });
  if($('db')) $('db').onclick=function(){
    if(!SPY_STATE.code){ sndError(); return; }
    var b=new Blob([SPY_STATE.code],{type:'text/plain'});
    var u=URL.createObjectURL(b);
    var a=document.createElement('a'); a.href=u; a.download=$('rm').textContent;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    sndSuccess(); setTimeout(function(){ URL.revokeObjectURL(u); },1000);
  };
  if($('cob')) $('cob').onclick=function(){ if(!SPY_STATE.code){ sndError(); return; } navigator.clipboard.writeText(SPY_STATE.code).then(sndSuccess); };
  if($('shb')) $('shb').onclick=async function(){
    if(!SPY_STATE.blob){ sndError(); alert('Generate dulu'); return; }
    var name=$('rm').textContent;
    var file=new File([SPY_STATE.blob],name,{type:'text/x-python'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); sndSuccess(); return; }catch(e){ if(e.name==='AbortError') return; } }
    if(navigator.share){ try{ await navigator.share({title:name,text:name}); sndSuccess(); return; }catch(e){ if(e.name==='AbortError') return; } }
    var u=URL.createObjectURL(SPY_STATE.blob);
    var a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    sndSuccess(); setTimeout(function(){ URL.revokeObjectURL(u); },1000);
  };
  if($('cb')) $('cb').onclick=function(){ $('ci').value=''; $('rc').classList.add('hd'); $('sw').innerHTML=''; SPY_STATE.code=''; SPY_STATE.blob=null; sndClick(); };
  if($('vb')) $('vb').onclick=function(){
    var c=$('ci').value;
    var q1=(c.match(/'/g)||[]).length, q2=(c.match(/"/g)||[]).length;
    var w=[];
    if(q1%2) w.push("kutip ' ganjil");
    if(q2%2) w.push('kutip " ganjil');
    $('sw').innerHTML=w.length?'<div class="err-box">⚠ '+w.join(', ')+'</div>':'<div class="ok-box">✓ Kode OK</div>';
    if(w.length) sndError(); else sndSuccess();
  };
  if($('snp-save')) $('snp-save').onclick=function(){
    var c=$('ci').value.trim(); if(!c){ sndError(); return; }
    var n=prompt('Nama snippet:'); if(!n) return;
    var sn=S.get('snippets',{}); sn[n]=c; S.set('snippets',sn);
    sndSuccess(); alert('Saved: '+n);
  };
  if($('snp-load')) $('snp-load').onclick=function(){
    var sn=S.get('snippets',{}); var keys=Object.keys(sn);
    if(!keys.length){ sndError(); return; }
    var pick=prompt('Pilih:\n'+keys.map(function(k,i){ return (i+1)+'. '+k; }).join('\n')+'\n\nNomor:');
    var i=parseInt(pick)-1;
    if(keys[i]){ $('ci').value=sn[keys[i]]; sndSuccess(); }
  };
})();

// ============ FUN / UTILITY ============
(function utilInit(){
  window.__selSep=window.initCustomSelect('sel-sep',
    [{id:'_',name:'_ underscore'},{id:'-',name:'- dash'},{id:'.',name:'. dot'},{id:'@',name:'@ at'},{id:'#',name:'# hash'},{id:'RANDOM',name:'RANDOM',desc:'Acak'}],
    S.get('pg_sep','_'),
    function(id){ S.set('pg_sep',id); }
  );
  var SEP_LIST=['_','-','.','@','#','$','%','&','*','+','?','~'];
  if($('pgen')) $('pgen').onclick=function(){
    var prefix=$('pg-prefix').value;
    var len=parseInt($('plen').value)||16; if(len<1)len=1; if(len>128)len=128;
    var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    var rand='';
    for(var i=0;i<len;i++) rand+=chars[Math.floor(Math.random()*chars.length)];
    var sepSel=window.__selSep?window.__selSep.getValue():'_';
    var sep=(sepSel==='RANDOM')?SEP_LIST[Math.floor(Math.random()*SEP_LIST.length)]:sepSel;
    $('pres').textContent=(prefix?prefix+sep:'')+rand;
    sndSuccess();
  };
  if($('pcp')) $('pcp').onclick=function(){ navigator.clipboard.writeText($('pres').textContent).then(sndSuccess); };
  if($('ugen')) $('ugen').onclick=function(){ $('ures').textContent=crypto.randomUUID(); sndSuccess(); };
  function hashIt(algo,el){
    var t=$('hin').value;
    crypto.subtle.digest(algo,new TextEncoder().encode(t)).then(function(b){
      var h=Array.from(new Uint8Array(b)).map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
      el.textContent=h; sndSuccess();
    });
  }
  if($('hm5')) $('hm5').onclick=function(){
    var t=$('hin').value; var s=0;
    for(var i=0;i<t.length;i++){ s=((s<<5)-s)+t.charCodeAt(i); s=s&s; }
    $('hres').textContent='MD5(len):'+t.length+' hex:'+Math.abs(s).toString(16).padStart(8,'0');
    sndSuccess();
  };
  if($('hs1')) $('hs1').onclick=function(){ hashIt('SHA-1',$('hres')); };
  if($('hs2')) $('hs2').onclick=function(){ hashIt('SHA-256',$('hres')); };
  if($('shgen')) $('shgen').onclick=function(){
    var u=$('shin').value.trim(); if(!u){ sndError(); return; }
    $('shres').textContent='Loading...';
    fetch('https://tinyurl.com/api-create.php?url='+encodeURIComponent(u)).then(function(r){ return r.text(); }).then(function(t){ $('shres').textContent=t; sndSuccess(); }).catch(function(){ $('shres').textContent='Error'; });
  };
  if($('shcp')) $('shcp').onclick=function(){ navigator.clipboard.writeText($('shres').textContent).then(sndSuccess); };
  var encMode='encode';
  if($('enc-t-enc')) $('enc-t-enc').onclick=function(){ encMode='encode'; $('enc-t-enc').classList.add('a'); $('enc-t-dec').classList.remove('a'); };
  if($('enc-t-dec')) $('enc-t-dec').onclick=function(){ encMode='decode'; $('enc-t-dec').classList.add('a'); $('enc-t-enc').classList.remove('a'); };
  function b64enc(s){ return btoa(unescape(encodeURIComponent(s))); }
  function b64dec(s){ return decodeURIComponent(escape(atob(s))); }
  function hexenc(s){ return Array.from(new TextEncoder().encode(s)).map(function(x){ return x.toString(16).padStart(2,'0'); }).join(''); }
  function hexdec(s){ var arr=new Uint8Array(s.length/2); for(var i=0;i<arr.length;i++) arr[i]=parseInt(s.substr(i*2,2),16); return new TextDecoder().decode(arr); }
  var MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
  var MORSE_R={}; for(var mk in MORSE) MORSE_R[MORSE[mk]]=mk;
  function runEnc(m,i){
    try{
      switch(m){
        case 'base64': return b64enc(i);
        case 'hex': return hexenc(i);
        case 'url': return encodeURIComponent(i);
        case 'rot13': return i.replace(/[a-zA-Z]/g,function(c){ var b=c<='Z'?65:97; return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b); });
        case 'morse': return i.toUpperCase().split('').map(function(c){ return MORSE[c]||''; }).filter(function(x){return x}).join(' ');
        case 'binary': return Array.from(new TextEncoder().encode(i)).map(function(x){ return x.toString(2).padStart(8,'0'); }).join(' ');
        case 'reverse': return i.split('').reverse().join('');
      }
    }catch(e){ return 'Error: '+e.message; }
    return '?';
  }
  function runDec(m,i){
    try{
      switch(m){
        case 'base64': return b64dec(i);
        case 'hex': return hexdec(i);
        case 'url': return decodeURIComponent(i);
        case 'rot13': return i.replace(/[a-zA-Z]/g,function(c){ var b=c<='Z'?65:97; return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b); });
        case 'morse': return i.split(' ').map(function(c){ return MORSE_R[c]||''; }).join('');
        case 'binary': var parts=i.trim().split(/\s+/); return new TextDecoder().decode(new Uint8Array(parts.map(function(p){ return parseInt(p,2); })));
        case 'reverse': return i.split('').reverse().join('');
      }
    }catch(e){ return 'Error: '+e.message; }
    return '?';
  }
  window.__selEnc=window.initCustomSelect('sel-enc',
    [{id:'base64',name:'Base64'},{id:'hex',name:'Hex'},{id:'url',name:'URL Encode'},{id:'rot13',name:'ROT13'},{id:'morse',name:'Morse'},{id:'binary',name:'Binary'},{id:'reverse',name:'Reverse'}],
    S.get('enc_method','base64'),
    function(id){ S.set('enc_method',id); }
  );
  if($('enc-run')) $('enc-run').onclick=function(){
    var i=$('enc-input').value; if(!i){ $('enc-output').textContent='—'; sndError(); return; }
    var m=window.__selEnc?window.__selEnc.getValue():'base64';
    $('enc-output').textContent=(encMode==='encode')?runEnc(m,i):runDec(m,i);
    sndSuccess();
  };
  if($('enc-clear')) $('enc-clear').onclick=function(){ $('enc-input').value=''; $('enc-output').textContent='—'; sndClick(); };
  if($('enc-copy')) $('enc-copy').onclick=function(){ navigator.clipboard.writeText($('enc-output').textContent).then(sndSuccess); };
  if($('enc-dl')) $('enc-dl').onclick=function(){
    var t=$('enc-output').textContent; if(!t||t==='—'){ sndError(); return; }
    var b=new Blob([t],{type:'text/plain'}); var u=URL.createObjectURL(b);
    var a=document.createElement('a'); a.href=u; a.download='encoded.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess();
  };
  function b64urlDecode(str){
    str=str.replace(/-/g,'+').replace(/_/g,'/');
    while(str.length%4) str+='=';
    try{ return decodeURIComponent(escape(atob(str))); }catch(e){ return null; }
  }
  if($('jwt-run')) $('jwt-run').onclick=function(){
    var t=$('jwt-input').value.trim();
    if(!t){ $('jwt-status').textContent='Token kosong'; return; }
    var parts=t.split('.');
    if(parts.length!==3){ $('jwt-status').textContent='⚠ Bukan JWT valid'; return; }
    var h=b64urlDecode(parts[0]), p=b64urlDecode(parts[1]);
    if(!h||!p){ $('jwt-status').textContent='✗ Gagal decode'; return; }
    try{ $('jwt-header-out').textContent=JSON.stringify(JSON.parse(h),null,2); }catch(e){ $('jwt-header-out').textContent=h; }
    try{ $('jwt-payload-out').textContent=JSON.stringify(JSON.parse(p),null,2); }catch(e){ $('jwt-payload-out').textContent=p; }
    $('jwt-sig-out').textContent=parts[2];
    ['jwt-header','jwt-payload','jwt-sig'].forEach(function(id){ $(id).classList.remove('hd'); });
    $('jwt-status').textContent='✓ JWT decoded';
    sndSuccess();
  };
  if($('jwt-clear')) $('jwt-clear').onclick=function(){
    $('jwt-input').value='';
    ['jwt-header','jwt-payload','jwt-sig'].forEach(function(id){ $(id).classList.add('hd'); });
    $('jwt-status').textContent='—'; sndClick();
  };
  if($('cc-upper')) $('cc-upper').onclick=function(){ $('cc-output').textContent=$('cc-input').value.toUpperCase(); sndSuccess(); };
  if($('cc-lower')) $('cc-lower').onclick=function(){ $('cc-output').textContent=$('cc-input').value.toLowerCase(); sndSuccess(); };
  if($('cc-copy')) $('cc-copy').onclick=function(){ navigator.clipboard.writeText($('cc-output').textContent).then(sndSuccess); };
  if($('cc-clear')) $('cc-clear').onclick=function(){ $('cc-input').value=''; $('cc-output').textContent='—'; sndClick(); };
  if($('lc-input')) $('lc-input').addEventListener('input',function(){
    var t=this.value;
    $('lc-char').textContent=t.length;
    $('lc-word').textContent=t.trim()?t.trim().split(/\s+/).length:0;
    $('lc-line').textContent=t?t.split('\n').length:0;
  });
})();

// ============ OSINT ============
(function osintInit(){
  if($('ilook')) $('ilook').onclick=function(){
    var ip=$('ipin').value.trim()||'';
    $('ires').textContent='Loading...';
    fetch(ip?'https://ipapi.co/'+ip+'/json/':'https://ipapi.co/json/').then(function(r){ return r.json(); }).then(function(j){
      $('ires').innerHTML='IP: '+j.ip+'<br>Kota: '+(j.city||'-')+'<br>Negara: '+(j.country_name||'-')+'<br>ISP: '+(j.org||'-');
      if(window.unlockAch) window.unlockAch('ip_first');
      sndSuccess();
    }).catch(function(){ $('ires').textContent='Error'; });
  };
  if($('mip')) $('mip').onclick=function(){
    $('mres').textContent='Loading...';
    fetch('https://api.ipify.org?format=json').then(function(r){ return r.json(); }).then(function(j){ $('mres').textContent='IP: '+j.ip; sndSuccess(); }).catch(function(){ $('mres').textContent='Error'; });
  };
  if($('dgen')) $('dgen').onclick=function(){
    var kw=$('dkw').value.trim(), site=$('dsite').value.trim(), tp=$('dtype').value.trim();
    var q='';
    if(site) q+='site:'+site+' ';
    if(kw) q+='"'+kw+'" ';
    if(tp) q+='filetype:'+tp;
    $('dres').textContent=q.trim()||'(kosong)';
    if(window.unlockAch) window.unlockAch('dork_first');
    sndSuccess();
  };
  if($('dvinfo')) $('dvinfo').onclick=function(){
    $('dvres').innerHTML='Browser: '+navigator.userAgent+'<br>Layar: '+screen.width+'x'+screen.height+'<br>Online: '+navigator.onLine;
    sndSuccess();
  };
})();

// ============ SCRAPE ============
(function scrapeInit(){
  if($('ds-paste')) $('ds-paste').onclick=function(){
    navigator.clipboard.readText().then(function(t){ $('ds-url').value=t.trim(); sndSuccess(); }).catch(function(){});
  };
  if($('ds-run')) $('ds-run').onclick=function(){
    sndClick();
    if(typeof window.dsRun==='function'){ try{ window.dsRun(); }catch(e){ alert('Scraper error: '+e.message); } }
    else alert('scraper.js gak load');
  };
  var scrResults=[], scrRunning=false, SCR_CD=15*60*1000;
  function scrCD(){
    var last=S.get('scr_last',0); var diff=last+SCR_CD-Date.now();
    var btn=$('scr-start'); if(!btn) return;
    if(scrRunning){ btn.disabled=true; btn.textContent='⏳...'; return; }
    if(diff>0){ var m=Math.floor(diff/60000), s=Math.floor((diff%60000)/1000); btn.disabled=true; btn.textContent='⏳ '+m+'m '+s+'s'; }
    else { btn.disabled=false; btn.textContent='▶ START'; }
  }
  function scrP(cur,total){ var pct=total>0?Math.min(100,(cur/total)*100):0; if($('scr-prog-fill')) $('scr-prog-fill').style.width=pct+'%'; if($('scr-prog-txt')) $('scr-prog-txt').textContent=cur+' / '+total; if($('scr-prog-label')) $('scr-prog-label').textContent='MENGUMPULKAN · '+pct.toFixed(1)+'%'; }
  if($('scr-clear')) $('scr-clear').onclick=function(){ if(scrRunning)return; $('scr-log').innerHTML=''; $('scr-pbox').classList.add('hd'); scrResults=[]; $('scr-prog-wrap').classList.remove('on'); sndClick(); };
  if($('scr-start')) $('scr-start').onclick=async function(){
    if(scrRunning) return;
    var last=S.get('scr_last',0); var diff=last+SCR_CD-Date.now();
    if(diff>0){ logTo('scr-log','⏳ Cooldown aktif','warn'); return; }
    var sources=$('scr-sources').value.split('\n').map(function(x){return x.trim()}).filter(function(x){return x});
    if(!sources.length){ alert('Sumber kosong'); return; }
    var target=parseInt($('scr-target').value)||10000; if(target<100)target=100; if(target>120000)target=120000;
    $('scr-target').value=target;
    scrRunning=true; $('scr-prog-wrap').classList.add('on'); scrP(0,target); $('scr-log').innerHTML=''; scrResults=[];
    logTo('scr-log','Target: '+target,'in'); sndSuccess();
    if(window.unlockAch) window.unlockAch('scrape_first');
    var seen={}, total=0;
    for(var i=0;i<sources.length;i++){
      if(total>=target) break;
      try{
        var r=await fetch(sources[i]); var t=await r.text();
        var found=t.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g)||[];
        var uniq=0;
        found.forEach(function(p){ if(!seen[p]){ seen[p]=1; scrResults.push(p); uniq++; total++; } });
        logTo('scr-log','['+(i+1)+'/'+sources.length+'] +'+uniq+' · '+total,'ok');
      }catch(e){ logTo('scr-log','['+(i+1)+'] ✗ '+e.message,'er'); }
      scrP(total,target);
      await new Promise(function(res){ setTimeout(res,2000); });
    }
    scrRunning=false; S.set('scr_last',Date.now());
    logTo('scr-log','SELESAI · '+total,'in'); scrCD(); sndSuccess();
  };
  if($('scr-preview')) $('scr-preview').onclick=function(){
    var pb=$('scr-pbox');
    if(pb.classList.contains('hd')){ pb.textContent=scrResults.slice(0,50).join('\n'); pb.classList.remove('hd'); }
    else pb.classList.add('hd');
    sndClick();
  };
  if($('scr-dl')) $('scr-dl').onclick=function(){
    if(!scrResults.length){ sndError(); return; }
    var b=new Blob([scrResults.join('\n')],{type:'text/plain'}); var u=URL.createObjectURL(b);
    var a=document.createElement('a'); a.href=u; a.download='proxies.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess();
  };
  if($('cors-test')) $('cors-test').onclick=async function(){
    var sources=$('cors-sources').value.split('\n').map(function(x){return x.trim()}).filter(function(x){return x});
    var target=$('cors-test-url').value.trim();
    $('cors-log').innerHTML=''; logTo('cors-log','Test '+sources.length,'in'); var alive=0;
    for(var i=0;i<sources.length;i++){
      var p=sources[i];
      var full=p+(p.indexOf('?')!==-1?encodeURIComponent(target):target);
      try{
        var ctrl=new AbortController(); var tm=setTimeout(function(){ ctrl.abort(); },7000);
        var r=await fetch(full,{signal:ctrl.signal}); clearTimeout(tm);
        if(r.ok){ logTo('cors-log','['+(i+1)+'] ✓ '+p,'ok'); alive++; }
        else logTo('cors-log','['+(i+1)+'] ✗ HTTP '+r.status,'er');
      }catch(e){ logTo('cors-log','['+(i+1)+'] ✗ '+p,'er'); }
    }
    logTo('cors-log','SELESAI · Hidup: '+alive+'/'+sources.length,'in'); sndSuccess();
  };
  if($('cors-clear')) $('cors-clear').onclick=function(){ $('cors-log').innerHTML=''; sndClick(); };
  if($('pc-start')) $('pc-start').onclick=async function(){
    var raw=$('pc-input').value.split('\n').map(function(x){return x.trim()}).filter(function(x){return x});
    $('pc-log').innerHTML=''; var alive=0,dead=0,skip=0;
    for(var i=0;i<raw.length;i++){
      var line=raw[i]; var type='http';
      if(line.indexOf('://')!==-1){ var pp=line.split('://'); type=pp[0]; line=pp[1]; }
      if(type==='socks4'||type==='socks5'){ skip++; logTo('pc-log','['+(i+1)+'] ⚠ SKIP socks','warn'); continue; }
      try{
        var ctrl=new AbortController(); var tm=setTimeout(function(){ ctrl.abort(); },5000);
        var r=await fetch('https://api.ipify.org',{signal:ctrl.signal}); clearTimeout(tm);
        if(r.ok){ alive++; logTo('pc-log','['+(i+1)+'] ✓ '+line,'ok'); }
        else { dead++; logTo('pc-log','['+(i+1)+'] ✗ '+line,'er'); }
      }catch(e){ dead++; logTo('pc-log','['+(i+1)+'] ✗ '+line,'er'); }
      $('pc-stat-total').textContent=raw.length;
      $('pc-stat-alive').textContent=alive;
      $('pc-stat-dead').textContent=dead;
      $('pc-stat-skip').textContent=skip;
    }
    sndSuccess();
    if(window.unlockAch) window.unlockAch('check_first');
  };
  if($('pc-clear')) $('pc-clear').onclick=function(){
    $('pc-input').value=''; $('pc-log').innerHTML='';
    $('pc-stat-total').textContent=0; $('pc-stat-alive').textContent=0; $('pc-stat-dead').textContent=0; $('pc-stat-skip').textContent=0;
    sndClick();
  };
})();

// ============ TEMPLATE ============
function tplBoot(){
  var tl=$('tl'); if(!tl) return;
  var items=[];
  if(window.TEMPLATE_COMMAND) items.push({id:'command',name:'SPYWARE COMMAND',desc:'Spyware penuh'});
  if(window.TEMPLATE_BASE) items.push({id:'base',name:'SPYWARE BASE',desc:'Template dasar'});
  if(!items.length){ tl.innerHTML='<div class="r">Gak ada template di templates.js</div>'; return; }
  tl.innerHTML=items.map(function(t){ return '<div class="msg-item" data-tpl="'+t.id+'"><b>'+t.name+'</b> · '+(t.desc||'')+'</div>'; }).join('');
  tl.querySelectorAll('.msg-item').forEach(function(el){
    el.onclick=function(){
      var id=el.dataset.tpl;
      if(window.__selTpl) window.__selTpl.setValue(id);
      var area=$('tplarea');
      if(area) area.value=(id==='command')?(window.TEMPLATE_COMMAND||''):(window.TEMPLATE_BASE||'');
      $('tplsel').value=id;
    };
  });
  if(!window.__selTpl){
    window.__selTpl=window.initCustomSelect('sel-tpl',
      [{id:'',name:'— CHOOSE —'}].concat(items),
      '',
      function(id){
        $('tplsel').value=id;
        var area=$('tplarea');
        if(area) area.value=(id==='command')?(window.TEMPLATE_COMMAND||''):(id==='base')?(window.TEMPLATE_BASE||''):'';
      }
    );
  }
  if($('tplsrc')) $('tplsrc').onclick=function(){
    var q=prompt('Cari di template:'); if(!q) return;
    var src=(window.TEMPLATE_COMMAND||'')+'\n'+(window.TEMPLATE_BASE||'');
    var lines=src.split('\n'); var found=[];
    lines.forEach(function(l,i){ if(l.toLowerCase().indexOf(q.toLowerCase())!==-1) found.push((i+1)+': '+l); });
    $('tplres').textContent=found.length?found.slice(0,50).join('\n'):'Gak ketemu';
    sndSuccess();
  };
  if($('tplexp')) $('tplexp').onclick=function(){
    var t=$('tplarea').value; if(!t){ sndError(); return; }
    var b=new Blob([t],{type:'text/plain'}); var u=URL.createObjectURL(b);
    var a=document.createElement('a'); a.href=u; a.download='template.py'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    sndSuccess();
  };
}
window.tplBoot=tplBoot;

// ============ DEV PANEL ============
(function devPanelInit(){
  var modal=$('devModal'), devBtn=$('dev-btn'), closeBtn=$('devClose');
  var loginSec=$('devLogin'), dashSec=$('devDashboard');
  var loginBtn=$('devLoginBtn'), pwdInput=$('devPwdInput'), loginMsg=$('devLoginMsg');
  if(!modal || !devBtn) return;
  devBtn.addEventListener('click',function(){
    if(!isOwner()){ alert('Akses ditolak. Hanya OWNER.'); return; }
    sndClick();
    if(window.unlockAch) window.unlockAch('dev_panel');
    modal.classList.add('show');
    if(isOwner()){ loginSec.classList.add('hd'); dashSec.classList.remove('hd'); refreshPwdList(); }
    else { loginSec.classList.remove('hd'); dashSec.classList.add('hd'); }
  });
  if(closeBtn) closeBtn.addEventListener('click',function(){ modal.classList.remove('show'); });
  if(loginBtn) loginBtn.addEventListener('click',async function(){
    var pwd=(pwdInput.value||'').trim().toLowerCase();
    if(!pwd){ loginMsg.innerHTML='<div class="err-box">Password kosong</div>'; return; }
    loginMsg.innerHTML='<div class="warn-box">Memverifikasi...</div>';
    var res=await deviceApi('/device/list?adminPassword='+encodeURIComponent(pwd),{method:'GET'});
    if(res.ok){ loginSec.classList.add('hd'); dashSec.classList.remove('hd'); loginMsg.innerHTML=''; refreshPwdList(); }
    else { loginMsg.innerHTML='<div class="err-box">Password owner salah</div>'; sndError(); }
  });
  $$('.modal-tab').forEach(function(t){
    t.addEventListener('click',function(){
      $$('.modal-tab').forEach(function(x){ x.classList.remove('a'); });
      t.classList.add('a');
      $$('.modal-section').forEach(function(s){ s.classList.remove('a'); });
      var sec=$('dsec-'+t.dataset.dtab); if(sec) sec.classList.add('a');
    });
  });
  var genRole=null;
  try{
    genRole=window.initCustomSelect('genRoleCustom',
      [{id:'USER',name:'USER',desc:'cuma bisa pakai tools'},{id:'OWNER',name:'OWNER',desc:'akses dev panel'}],
      'USER',function(){}
    );
  }catch(e){}
  if($('genBtn')) $('genBtn').addEventListener('click',async function(){
    var prefix=($('genPrefix').value||'').replace(/[^a-zA-Z0-9]/g,'');
    var role=genRole?genRole.getValue():'USER';
    var adminPwd=SESSION?SESSION.password:'';
    var res=await deviceApi('/device/generate',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({adminPassword:adminPwd,prefix:prefix,role:role})
    });
    if(res.ok){
      $('genResult').innerHTML='<div class="code-display"><div class="code-text">'+res.password.toUpperCase()+'</div><div class="code-meta">ROLE: '+res.role+'</div></div><button class="g" id="copyGenCode">📋 COPY CODE</button><div class="ok-box">✓ Berhasil generate. Kirim code ini ke user.</div>';
      var cb=$('copyGenCode');
      if(cb) cb.onclick=function(){ navigator.clipboard.writeText(res.password.toUpperCase()).then(function(){ sndSuccess(); alert('Tersalin!'); }); };
      sndSuccess();
      if(window.unlockAch) window.unlockAch('gen_pass');
    } else {
      $('genResult').innerHTML='<div class="err-box">✗ Gagal: '+(res.error||'unknown')+'</div>';
      sndError();
    }
  });
  if($('refreshListBtn')) $('refreshListBtn').addEventListener('click',refreshPwdList);
  async function refreshPwdList(){
    var adminPwd=SESSION?SESSION.password:'';
    var res=await deviceApi('/device/list?adminPassword='+encodeURIComponent(adminPwd),{method:'GET'});
    var box=$('pwdList'); if(!box) return;
    if(!res.ok || !res.list || !res.list.length){ box.innerHTML='<div class="warn-box">Belum ada password yang digenerate.</div>'; return; }
    box.innerHTML=res.list.map(function(p){
      var status=p.revoked?'revoked':(p.deviceId?'used':'free');
      var statusTxt=p.revoked?'REVOKED':(p.deviceId?'USED':'FREE');
      var roleClass=p.role==='OWNER'?' owner':'';
      var devShort=p.deviceId?p.deviceId.slice(0,40)+'...':'—';
      return '<div class="pwd-list-item"><div class="pwd-list-row"><div class="pwd-list-code">'+(p.password||'').toUpperCase()+'</div><div class="pwd-list-role'+roleClass+'">'+(p.role||'USER')+'</div><div class="pwd-status '+status+'">'+statusTxt+'</div></div><div class="pwd-list-meta">prefix: '+(p.prefix||'-')+' · dibuat: '+new Date(p.createdAt).toLocaleString('id-ID')+'</div>'+(p.deviceId?'<div class="device-id">'+devShort+'</div>':'')+'<div class="pwd-list-actions">'+(p.deviceId&&!p.revoked?'<button class="g" onclick="window.__devReset(\''+p.password+'\')">🔄 RESET</button>':'')+(!p.revoked?'<button class="d" onclick="window.__devRevoke(\''+p.password+'\')">🚫 REVOKE</button>':'<button class="g" onclick="window.__devDelete(\''+p.password+'\')">🗑 HAPUS</button>')+'</div></div>';
    }).join('');
  }
  if($('refreshDevBtn')) $('refreshDevBtn').addEventListener('click',refreshDevList);
  async function refreshDevList(){
    var adminPwd=SESSION?SESSION.password:'';
    var res=await deviceApi('/device/devices?adminPassword='+encodeURIComponent(adminPwd),{method:'GET'});
    var box=$('devList'); if(!box) return;
    if(!res.ok || !res.list || !res.list.length){ box.innerHTML='<div class="warn-box">Belum ada device aktif.</div>'; return; }
    box.innerHTML=res.list.map(function(d){
      var lastSeen=d.lastSeen?new Date(d.lastSeen).toLocaleString('id-ID'):'-';
      var ip=d.ip||'-';
      var isCurrent=d.deviceId===DEVICE_ID;
      return '<div class="pwd-list-item"><div class="pwd-list-row"><div class="pwd-list-role'+(d.role==='OWNER'?' owner':'')+'">'+(d.role||'USER')+'</div>'+(isCurrent?'<div class="pwd-status used">YOU</div>':'<button class="d" style="margin:0;padding:4px 8px;font-size:.5rem;width:auto" onclick="window.__devKick(\''+d.deviceId+'\')">KICK</button>')+'</div><div class="pwd-list-meta">last seen: '+lastSeen+' · IP: '+ip+'</div><div class="device-id">'+(d.deviceId||'').slice(0,60)+'</div></div>';
    }).join('');
  }
  window.__devReset=async function(password){
    if(!confirm('Reset lock device untuk password '+password+'?')) return;
    var res=await deviceApi('/device/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:SESSION.password,password:password})});
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Reset OK'); } else { sndError(); alert('✗ '+res.error); }
  };
  window.__devRevoke=async function(password){
    if(!confirm('Revoke (blokir total) password '+password+'?')) return;
    var res=await deviceApi('/device/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:SESSION.password,password:password})});
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Revoked'); } else { sndError(); alert('✗ '+res.error); }
  };
  window.__devDelete=async function(password){
    if(!confirm('Hapus permanen password '+password+'?')) return;
    var res=await deviceApi('/device/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:SESSION.password,password:password})});
    if(res.ok){ sndSuccess(); refreshPwdList(); alert('✓ Dihapus'); } else { sndError(); alert('✗ '+res.error); }
  };
  window.__devKick=async function(deviceId){
    if(!confirm('Kick device ini?')) return;
    var res=await deviceApi('/device/kick',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminPassword:SESSION.password,deviceId:deviceId})});
    if(res.ok){ sndSuccess(); refreshDevList(); alert('✓ Kicked'); } else { sndError(); alert('✗ '+res.error); }
  };
})();

// ============ API HUB WIRE ============
function wireApiHub(tabId, catName){
  var runBtn=$('apihub-'+tabId+'-run');
  var clearBtn=$('apihub-'+tabId+'-clear');
  if(runBtn) runBtn.addEventListener('click',function(){
    sndClick();
    if(window.unlockAch){
      if(catName==='UPSCALE') window.unlockAch('upscale_first');
      else if(catName==='IMG AI') window.unlockAch('imgai_first');
      else if(catName==='IMG HD') window.unlockAch('imghd_first');
      else if(catName==='MAKER') window.unlockAch('maker_first');
      else if(catName==='SEARCH') window.unlockAch('search_first');
    }
    if(window.__addGen) window.__addGen();
    if(typeof window.zyRunApiHub==='function'){ try{ window.zyRunApiHub('apihub-'+tabId, catName); }catch(e){ alert('Error: '+e.message); } }
  });
  if(clearBtn) clearBtn.addEventListener('click',function(){
    sndClick();
    var log=$('apihub-'+tabId+'-log'), res=$('apihub-'+tabId+'-result');
    if(log){ log.innerHTML=''; log.classList.add('hd'); }
    if(res){ res.innerHTML=''; res.classList.add('hd'); }
    if(catName==='UPSCALE' && typeof window.zyProgressHide==='function'){ try{ window.zyProgressHide(); }catch(e){} }
  });
}
wireApiHub('up','UPSCALE');
wireApiHub('ai','IMG AI');
wireApiHub('hd','IMG HD');
wireApiHub('mk','MAKER');
wireApiHub('sr','SEARCH');

// ============ SEARCH WIRE ============
window.__searchCategory='ALL';
$$('.search-cat').forEach(function(el){
  el.addEventListener('click',function(){
    $$('.search-cat').forEach(function(x){ x.classList.remove('a'); });
    el.classList.add('a');
    window.__searchCategory=el.dataset.cat||'ALL';
    sndClick();
  });
});
if($('search-go')) $('search-go').onclick=function(){
  sndClick();
  if(window.unlockAch) window.unlockAch('search_first');
  if(typeof window.zyRunSearch==='function'){ try{ window.zyRunSearch(); }catch(e){ alert('Search error: '+e.message); } }
};
if($('search-input')) $('search-input').addEventListener('keydown',function(e){
  if(e.key==='Enter'){ e.preventDefault(); if($('search-go')) $('search-go').click(); }
});

// ============ BYPASS SCANNER ============
var BYPASS_MAP = {
  'sfl.gl': 'safelink','safelinku.com': 'safelink','ouo.io': 'ouo-bypass','ouo.press': 'ouo-bypass',
  'shrinkme.io': 'shrinkme','shrinke.me': 'shrinkme','modjall.com': 'modjall','move2link.com': 'move2link',
  'mboost.me': 'bypasslinkv2','yoshort.id': 'bypasslinkv3','shortearn.eu': 'bypasslinkv2','fc.lc': 'bypasslinkv2',
  'tei.ai': 'bypasslinkv2','cuty.io': 'bypasslinkv2','shrinkforearn.in': 'shrinkme',
  'wellsfashionhub.com': 'wellbypass','well-healthy.com': 'wellbypass',
  'sub4unlock.com': 'bypasslinkv2','sub4unlock.io': 'bypasslinkv2','sub4unlock.pro': 'bypasslinkv2'
};
function detectBypassProvider(url){
  if(!url) return null;
  try{
    var host = url.toLowerCase().replace(/^https?:\/\//,'').split('/')[0].split(':')[0].replace(/^www\./,'');
    if(BYPASS_MAP[host]) return BYPASS_MAP[host];
    for(var k in BYPASS_MAP){ if(host.indexOf(k) !== -1) return BYPASS_MAP[k]; }
    return null;
  }catch(e){ return null; }
}
function updateBypassBadge(url){
  var badge = $('bp-scan-badge');
  if(!badge) return;
  if(!url || url.length < 8){ badge.style.display = 'none'; badge.textContent = ''; return; }
  var provider = detectBypassProvider(url);
  var providerName = null;
  if(provider && window.ZYVOR && window.ZYVOR.bypassList){
    var api = window.ZYVOR.bypassList().find(function(x){ return x.id === provider; });
    if(api) providerName = api.name;
  }
  if(provider){
    badge.style.display = 'block';
    badge.innerHTML = '🎯 AUTO-DETECT: <b>' + (providerName || provider) + '</b>';
    badge.style.borderColor = 'var(--ok)';
    badge.style.color = 'var(--ok)';
    if(window.__bpSel && typeof window.__bpSel.setValue === 'function'){
      try{ window.__bpSel.setValue(provider); if(typeof window.zyBypassSetSelected==='function') window.zyBypassSetSelected(provider); window.zyRenderBypassParams(); }catch(e){}
    }
  } else {
    badge.style.display = 'block';
    badge.innerHTML = '❓ Provider gak dikenali — auto fallback';
    badge.style.borderColor = 'var(--ac)';
    badge.style.color = 'var(--txd)';
  }
}
if($('bp-url')){
  var bpUrlEl = $('bp-url');
  var bpTimer = null;
  bpUrlEl.addEventListener('input', function(){ clearTimeout(bpTimer); bpTimer = setTimeout(function(){ updateBypassBadge(bpUrlEl.value.trim()); }, 400); });
  bpUrlEl.addEventListener('paste', function(){ setTimeout(function(){ updateBypassBadge(bpUrlEl.value.trim()); }, 50); });
}
if($('bp-scan')) $('bp-scan').onclick=async function(){
  var url = ($('bp-url')||{}).value;
  if(!url){ alert('Isi URL dulu'); return; }
  url = url.trim();
  sndClick();
  var log = $('bp-log'); var res = $('bp-result');
  if(log){ log.innerHTML = ''; log.classList.remove('hd'); }
  if(res){ res.innerHTML = ''; res.classList.add('hd'); }
  var fw = $('bp-final-wrap'); if(fw) fw.classList.add('hd');
  logTo('bp-log','🔍 SCAN: '+url,'in');
  var provider = detectBypassProvider(url);
  if(provider){
    var list = window.ZYVOR && window.ZYVOR.bypassList ? window.ZYVOR.bypassList() : [];
    var api = list.find(function(x){ return x.id===provider; });
    if(api) logTo('bp-log','✓ Step 1: cocok dari map → '+api.name,'ok');
    if(window.__bpSel) try{ window.__bpSel.setValue(provider); if(typeof window.zyBypassSetSelected==='function') window.zyBypassSetSelected(provider); window.zyRenderBypassParams(); }catch(e){}
  } else {
    logTo('bp-log','⚠ Step 1: gak ada di map, coba lewat proxy...','warn');
  }
  if(!provider && typeof window.zyProxyFinalUrl === 'function'){
    try{
      logTo('bp-log','→ Step 2: fetch via proxy untuk lihat redirect...','in');
      var finalUrl = await window.zyProxyFinalUrl(url, 8000);
      if(finalUrl){
        logTo('bp-log','  final: '+finalUrl.slice(0,60),'ok');
        var p2 = detectBypassProvider(finalUrl);
        if(p2){
          logTo('bp-log','✓ Step 2: cocok dari redirect → '+p2,'ok');
          provider = p2;
          if(window.__bpSel) try{ window.__bpSel.setValue(p2); if(typeof window.zyBypassSetSelected==='function') window.zyBypassSetSelected(p2); window.zyRenderBypassParams(); }catch(e){}
        }
      } else { logTo('bp-log','  proxy fetch gagal — lanjut fallback','warn'); }
    }catch(e){ logTo('bp-log','  ✗ proxy error: '+e.message,'er'); }
  }
  if(provider){
    logTo('bp-log','🎯 HASIL SCAN: '+provider,'ok');
    logTo('bp-log','→ Tekan BYPASS untuk proses.','in');
    sndSuccess();
  } else {
    logTo('bp-log','⚠ Provider tidak dikenali — auto fallback saat BYPASS','warn');
  }
};
if($('bp-run')) $('bp-run').onclick=function(){
  sndClick();
  if(window.unlockAch) window.unlockAch('bypass_first');
  if(typeof window.zyRunBypass==='function'){ try{ window.zyRunBypass(); }catch(e){ alert('Bypass error: '+e.message); } }
};
if($('bp-clear')) $('bp-clear').onclick=function(){
  $('bp-log').innerHTML=''; $('bp-log').classList.add('hd');
  $('bp-result').innerHTML=''; $('bp-result').classList.add('hd');
  var fw = $('bp-final-wrap'); if(fw) fw.classList.add('hd');
  var badge = $('bp-scan-badge'); if(badge){ badge.style.display = 'none'; }
  var urlIn = $('bp-url'); if(urlIn) urlIn.value = '';
  sndClick();
};
(function wireBpResult(){
  var copyBtn = $('bp-copy-url');
  if(copyBtn) copyBtn.addEventListener('click', function(){
    var urlEl = $('bp-final-url');
    var url = urlEl ? urlEl.textContent.trim() : '';
    if(!url || url === '—'){ sndError(); return; }
    if(typeof window.copyWithAnim === 'function'){ window.copyWithAnim(copyBtn, url); }
    else { navigator.clipboard.writeText(url).then(function(){ sndSuccess(); }); }
  });
  var openBtn = $('bp-open-url');
  if(openBtn) openBtn.addEventListener('click', function(){
    var urlEl = $('bp-final-url');
    var url = urlEl ? urlEl.textContent.trim() : '';
    if(!url || url === '—'){ sndError(); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
    sndClick();
  });
})();

// ============ DL WIRES ============
if($('dl-run')) $('dl-run').onclick=function(){
  sndClick();
  if(window.unlockAch) window.unlockAch('dl_first');
  if(typeof window.zyRunDownloader==='function'){ try{ window.zyRunDownloader(); }catch(e){ alert('DL error: '+e.message); } }
};
if($('dl-preview')) $('dl-preview').onclick=function(){ sndClick(); if(window.unlockAch) window.unlockAch('preview'); if(typeof window.zyPreviewResult==='function') try{ window.zyPreviewResult(); }catch(e){} };
if($('dl-clear')) $('dl-clear').onclick=function(){ sndClick(); if(typeof window.zyClearDownloader==='function') try{ window.zyClearDownloader(); }catch(e){} };

// ============ P2U WIRE — FIXED ============
(function wireP2U(){
  if(!$('pg-p2u')) return;
  var inited = false;
  window.__initP2U = function(){
    if(inited) return;
    if(typeof window.zyP2UInit === 'function'){ window.zyP2UInit(); inited = true; }
    else setTimeout(function(){ if(!inited){ window.__initP2U(); } }, 200);
  };
  if($('p2u-transform')) $('p2u-transform').addEventListener('click', function(){
    if(window.unlockAch) window.unlockAch('p2u_first');
  });
})();

// ============ VERCEL WIRE — FIXED ============
(function wireVercel(){
  if(!$('pg-vc')) return;
  var inited = false;
  window.__initVercel = function(){
    if(inited) return;
    if(typeof window.zyVercelInit === 'function'){ window.zyVercelInit(); inited = true; }
    else setTimeout(function(){ if(!inited){ window.__initVercel(); } }, 200);
  };
  if($('vc-upload')) $('vc-upload').addEventListener('click', function(){
    if(window.unlockAch) window.unlockAch('deploy_first');
  });
})();

// ============ GITHUB WIRE — FIXED ============
(function wireGithub(){
  if(!$('pg-gh')) return;
  var inited = false;
  window.__initGithub = function(){
    if(inited) return;
    if(typeof window.zyGithubInit === 'function'){ window.zyGithubInit(); inited = true; }
    else setTimeout(function(){ if(!inited){ window.__initGithub(); } }, 200);
  };
  if($('gh-upload')) $('gh-upload').addEventListener('click', function(){
    if(window.unlockAch) window.unlockAch('github_first');
  });
})();

// ============ HISTORY ============
function renderHist(){
  var h=S.get('history',[]); var el=$('hl'); if(!el) return;
  if(!h.length){ el.innerHTML='<div class="r">Belum ada</div>'; return; }
  el.innerHTML=h.map(function(x,i){
    return '<div class="hi"><b>'+x.n+'</b> · '+x.s+' KB<div style="color:var(--txd);font-size:.55rem">'+new Date(x.t).toLocaleString()+'</div><div style="margin-top:6px"><button class="g" style="margin-top:0;font-size:.5rem;padding:5px 10px;width:auto;display:inline-block" onclick="window.dlHist('+i+')">DOWNLOAD</button></div></div>';
  }).join('');
}
window.dlHist=function(i){
  var h=S.get('history',[]); if(!h[i]) return;
  var b=new Blob([h[i].c],{type:'text/plain'}); var u=URL.createObjectURL(b);
  var a=document.createElement('a'); a.href=u; a.download=h[i].n;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess();
};
if($('hclr')) $('hclr').onclick=function(){ if(confirm('Clear?')){ S.del('history'); renderHist(); sndSuccess(); } };
if($('hexp')) $('hexp').onclick=function(){ var h=S.get('history',[]); var b=new Blob([JSON.stringify(h,null,2)],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download='history.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess(); };

// ============ DATA EXPORT/IMPORT ============
if($('exst')) $('exst').onclick=function(){ var d={}; Object.keys(localStorage).forEach(function(k){ if(k.indexOf('rx_')===0) d[k]=localStorage[k]; }); var b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download='ryanntools_settings.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); sndSuccess(); };
if($('imst')) $('imst').onclick=function(){ var inp=document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=function(e){ var f=e.target.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(ev){ try{ var d=JSON.parse(ev.target.result); Object.keys(d).forEach(function(k){ localStorage.setItem(k,d[k]); }); location.reload(); }catch(er){ alert('Error: '+er.message); } }; r.readAsText(f); }; inp.click(); };
if($('wipe')) $('wipe').onclick=function(){ if(confirm('Wipe ALL?')){ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('rx_')===0) localStorage.removeItem(k); }); location.reload(); } };

// ============ WELCOME ============
(function(){
  var modal=$('welcome-modal'); if(!modal) return;
  var popupOn=S.get('popup_on',true);
  if(popupOn) modal.classList.remove('hd'); else modal.classList.add('hd');
  function closeWm(){ modal.classList.add('hd'); sndClick(); }
  if($('wm-start')) $('wm-start').onclick=function(){ closeWm(); sndSuccess(); };
  if($('wm-skip')) $('wm-skip').onclick=closeWm;
})();

// ============ BOOT AFTER LOGIN ============
function bootAfterLogin(){
  if(!isOwner()){
    deviceApi('/device/me?deviceId='+encodeURIComponent(DEVICE_ID),{method:'GET'}).then(function(res){
      if(!res || !res.ok || !res.registered){ window.showAccessCodeGate(); }
    });
  }
  if(isOwner()){
    var devBtn=$('dev-btn'); if(devBtn) devBtn.classList.add('show');
    var rb=$('role-badge'); if(rb) rb.classList.add('show');
  }
  var hr=$('homeRole'); if(hr) hr.textContent=SESSION?SESSION.role:'USER';
  var hd=$('homeDevice'); if(hd) hd.textContent=DEVICE_ID;
  try{ if(typeof window.zyInitBypass==='function') window.zyInitBypass(); }catch(e){}
  try{ if(typeof window.zyInitDownloader==='function') window.zyInitDownloader(); }catch(e){}
  try{ renderAch(); }catch(e){}
  try{
    if(window.initCustomSelect && $('tmp-domain')){ window.__selTmpDom=window.initCustomSelect('tmp-domain',[{id:'',name:'— CHOOSE —'}],'',function(){}); }
    if(typeof window.tmpInitProviderSelector==='function'){ window.tmpInitProviderSelector(); }
  }catch(e){}
}

// ============ BOOT ============
function boot(){
  try{ setTema(S.get('theme','t-cyan')); }catch(e){}
  try{ loadCustomTheme(); }catch(e){}
  try{ setBg(S.get('bg','galaxy')); }catch(e){}
  try{ applyMode(); }catch(e){}
  try{ var f=S.get('font',13); if($('fsr')) $('fsr').value=f; document.documentElement.style.setProperty('--fs',f+'px'); if($('fv')) $('fv').textContent=f+'px'; }catch(e){}
  try{ var ff=S.get('font_family', FONT_LIST[0].id); document.documentElement.style.setProperty('--fm', ff); if($('ffam')) $('ffam').value=ff; }catch(e){}
  try{ if($('snd-grid')) $$('#snd-grid .snd-opt').forEach(function(x){ x.classList.toggle('a',x.dataset.snd===_sndPack); }); }catch(e){}
  try{ renderHist(); }catch(e){}
  try{ renderAch(); }catch(e){}
}

// ============ AUTO-START ============
SESSION=null;
S.del('session');
boot();
setInterval(renderAch, 3000);

})();

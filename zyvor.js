// zyvor.js v6.9 — Engine
(function(){
'use strict';

var BASE = 'https://api.zyvor.my.id';
var TIKWM = 'https://tikwm.com/api/';
var WORKER = 'https://ryann-cors.hasbiiryan.workers.dev';

var CORS = [
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://cors.eu.org/',
  'https://thingproxy.freeboard.io/fetch/'
];

function timeoutFor(path){
  // Endpoint berat = 10 menit. Biasa = 2 menit.
  if(!path) return 120000;
  var heavy = ['/api/imagehd/', '/api/hdvidio/', '/api/maker/', '/api/downloader/'];
  for(var i=0;i<heavy.length;i++){
    if(path.indexOf(heavy[i]) !== -1) return 600000;
  }
  return 120000;
}

async function fetchWithRetry(url, opts, timeoutMs, retries){
  retries = retries || 2;
  var lastErr = null;
  for(var i=0;i<=retries;i++){
    try{
      var ctrl = new AbortController();
      var timer = setTimeout(function(){ ctrl.abort(); }, timeoutMs);
      var r = await fetch(url, Object.assign({}, opts, {signal: ctrl.signal}));
      clearTimeout(timer);
      if(r.ok) return r;
      if(r.status >= 500 && i < retries){
        lastErr = new Error('HTTP ' + r.status);
        await new Promise(function(res){ setTimeout(res, 700); });
        continue;
      }
      return r;
    }catch(e){
      lastErr = e;
      if(i < retries) await new Promise(function(res){ setTimeout(res, 600); });
    }
  }
  throw lastErr || new Error('Fetch failed');
}

async function proxyFetch(url, opts, timeoutMs){
  opts = opts || {};
  timeoutMs = timeoutMs || 120000;
  var lastErr = null;

  // LAYER 1: DIRECT
  try{
    var r1 = await fetchWithRetry(url, opts, Math.min(timeoutMs, 10000), 1);
    if(r1.ok) return { ok:true, text: await r1.text() };
    lastErr = new Error('Direct HTTP ' + r1.status);
  }catch(e){ lastErr = e; }

  // LAYER 2: WORKER
  try{
    var wurl = WORKER + '/?url=' + encodeURIComponent(url);
    var r2 = await fetchWithRetry(wurl, {method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body}, timeoutMs, 2);
    if(r2.ok) return { ok:true, text: await r2.text() };
    lastErr = new Error('Worker HTTP ' + r2.status);
  }catch(e){ lastErr = e; }

  // LAYER 3-6: PUBLIC PROXIES
  for(var i=0;i<CORS.length;i++){
    var p = CORS[i];
    var full = p + (p.indexOf('?') !== -1 ? encodeURIComponent(url) : url);
    try{
      var r3 = await fetchWithRetry(full, {method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body}, Math.min(timeoutMs, 60000), 1);
      if(r3.ok) return { ok:true, text: await r3.text() };
      lastErr = new Error('Proxy ' + i + ' HTTP ' + r3.status);
    }catch(e){ lastErr = e; }
  }

  throw lastErr || new Error('All proxy layers failed');
}

async function callAPIv2(path, params, method){
  method = method || 'GET';
  var qs = '';
  if(method === 'GET') qs = '?' + new URLSearchParams(params).toString();
  var url = BASE + path + qs;
  var opts = { method: method };
  if(method === 'POST'){ opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(params); }
  var res = await proxyFetch(url, opts, timeoutFor(path));
  var json;
  try{ json = JSON.parse(res.text); }catch(e){ json = { raw: res.text }; }
  return json;
}

function $id(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function classify(url){ var u = String(url).toLowerCase(); if(/\.(mp4|mov|webm|mkv)(\?|$)/.test(u)) return 'video'; if(/\.(mp3|m4a|flac|wav|aac|opus)(\?|$)/.test(u)) return 'audio'; if(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/.test(u)) return 'image'; return 'other'; }

function collectMedia(obj, out, baseKey){
  out = out || [];
  if(!obj) return out;
  if(typeof obj === 'string'){
    if(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|mp3|m4a|wav)(\?|$)/i.test(obj) || /^https?:\/\/.+/.test(obj)){
      out.push({ url: obj, key: baseKey || 'url' });
    }
    return out;
  }
  if(typeof obj === 'object' && obj.result && typeof obj.result === 'string' && /^https?:\/\//.test(obj.result)){
    out.push({ url: obj.result, key: 'result' });
    return out;
  }
  if(typeof obj === 'object' && obj.url && typeof obj.url === 'string' && /^https?:\/\//.test(obj.url)){
    out.push({ url: obj.url, key: 'url' });
    return out;
  }
  if(typeof obj === 'object' && obj.image && typeof obj.image === 'string' && /^https?:\/\//.test(obj.image)){
    out.push({ url: obj.image, key: 'image' });
    return out;
  }
  if(Array.isArray(obj)){
    obj.forEach(function(v, i){ collectMedia(v, out, (baseKey||'')+'['+i+']'); });
    return out;
  }
  if(typeof obj === 'object'){
    Object.keys(obj).forEach(function(k){
      var v = obj[k];
      if(typeof v === 'string' && /^https?:\/\//.test(v)){
        if(/url|link|download|video|audio|music|hd|sd|wm|play|src|cover|thumb|image|photo|result|output|file|path|data/i.test(k)){
          out.push({ url: v, key: k });
        }
      }
      collectMedia(v, out, (baseKey||'')+'.'+k);
    });
  }
  return out;
}

function extractResultItems(data){
  var items = [];
  if(!data) return items;
  var arr = data.result || data.results || data.data || data.items || data.videos || data.list || data.array || data.entries || (Array.isArray(data) ? data : null);
  if(!arr && data.result && typeof data.result === 'object'){
    arr = data.result.videos || data.result.items || data.result.list || data.result.array || null;
  }
  if(!arr && data.data && typeof data.data === 'object'){
    arr = data.data.videos || data.data.items || data.data.list || null;
  }
  if(!arr || !Array.isArray(arr)) return items;
  arr.forEach(function(item){
    if(typeof item !== 'object' || !item) return;
    var url = item.url || item.link || item.href || item.share_url || item.web_url || item.permalink || item.spotify_url || (item.external_urls && item.external_urls.spotify) || null;
    var title = item.title || item.name || item.judul || item.headline || item.snippet || item.description || '(no title)';
    var desc = item.snippet || item.description || item.desc || item.excerpt || item.subtitle || '';
    var thumb = item.thumbnail || item.thumb || item.image || item.cover || item.cover_url || item.artwork || null;
    var author = item.author || item.channel || item.username || item.uploader || item.artist || null;
    if(url) items.push({url:url, title:title, desc:desc, thumb:thumb, author:author});
  });
  return items;
}

async function uploadToCatbox(file){
  if(!file) return { ok:false, error:'No file' };
  if(file.size / (1024*1024) > 200) return { ok:false, error:'File > 200MB' };
  try{
    var fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', file);
    var ctrl = new AbortController();
    var timer = setTimeout(function(){ ctrl.abort(); }, 90000);
    var r = await fetch('https://catbox.moe/user/api.php', { method:'POST', body:fd, signal:ctrl.signal });
    clearTimeout(timer);
    if(!r.ok) throw new Error('HTTP '+r.status);
    var txt = (await r.text()).trim();
    if(/^https?:\/\//.test(txt)) return { ok:true, url:txt };
    throw new Error('Bad response');
  }catch(e){ return { ok:false, error: e.message || 'Upload failed' }; }
}

window.zyDownload = async function(url, filename){
  try{
    window.zyToast('⏳ Downloading...');
    var res = await fetch(url);
    if(!res.ok) throw new Error('HTTP ' + res.status);
    var blob = await res.blob();
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(blobUrl); }, 2000);
    window.zyToast('✓ Downloaded: ' + (filename || 'file'));
  }catch(e){
    window.zyToast('✗ Download gagal: ' + e.message, 'error');
  }
};

window.zyOpenPreview = function(idx){
  var m = window.__apiHubMedia && window.__apiHubMedia[idx];
  if(!m) return;
  var isVideo = classify(m.url) === 'video';
  var overlay = document.getElementById('zy-preview-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'zy-preview-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }
  var inner = isVideo
    ? '<video controls autoplay style="max-width:100%;max-height:90vh;border-radius:8px" src="'+m.url+'"></video>'
    : '<img src="'+m.url+'" style="max-width:100%;max-height:90vh;border-radius:8px;object-fit:contain">';
  overlay.innerHTML = '<div style="position:relative;max-width:100%;max-height:100%">'+inner+'<button onclick="document.getElementById(\'zy-preview-overlay\').remove()" style="position:absolute;top:-40px;right:0;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;border:none;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button></div>';
};

(function(){
  if(document.getElementById('zy-toast-style')) return;
  var s = document.createElement('style');
  s.id = 'zy-toast-style';
  s.textContent = '@keyframes zyToastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(s);
})();

window.zyToast = function(msg, type){
  var wrap = document.getElementById('zy-toast-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'zy-toast-wrap';
    wrap.style.cssText = 'position:fixed;right:12px;bottom:180px;z-index:99999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:280px';
    document.body.appendChild(wrap);
  }
  var el = document.createElement('div');
  var isErr = type === 'error';
  el.style.cssText = 'background:linear-gradient(180deg,rgba(10,20,35,.98),rgba(8,12,18,.99));border:1.5px solid ' + (isErr ? '#f87171' : 'var(--ac)') + ';border-radius:10px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:auto;animation:zyToastIn .35s ease-out;backdrop-filter:blur(10px)';
  el.innerHTML = '<div style="font-family:\'Orbitron\',sans-serif;font-weight:900;font-size:.75rem;color:' + (isErr ? '#f87171' : 'var(--ac)') + ';letter-spacing:1.5px;text-transform:uppercase">' + esc(msg) + '</div>';
  wrap.appendChild(el);
  setTimeout(function(){
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
  }, 4000);
};

window.zyCp = function(u){ navigator.clipboard.writeText(u).then(function(){ window.zyToast('URL tersalin'); }); };
window.zyCopyJson = function(btn){ var pre = btn.parentElement.querySelector('.zy-raw pre'); if(pre) navigator.clipboard.writeText(pre.textContent).then(function(){ window.zyToast('JSON tersalin'); }); };

var PARAM_LISTS = {
  'list-reso':      ['480p','720p','1080p','1440p','2160p (4K)'],
  'list-fps':       ['24','30','60','120'],
  'list-quality':   ['low','medium','high','ultra'],
  'list-enhance':   ['off','on','auto'],
  'list-denoise':   ['off','low','medium','high'],
  'list-stabilize': ['off','on'],
  'list-format':    ['mp4','mov','webm','mkv'],
  'list-formatimg': ['png','jpg','jpeg','webp']
};

function paramType(name, category){
  var n = (name || '').toLowerCase();
  var c = (category || '').toUpperCase();
  if(n === 'video' || (n === 'url' && c === 'UPSCALE')) return 'video';
  if(['image','avatar','pp','ppurl','photo','fotourl','pas_photo','profilephoto','mainphoto','background'].indexOf(n) !== -1) return 'image';
  if(n === 'url' && (c === 'IMG HD' || c === 'MAKER' || c === 'IMG AI')) return 'image';
  if(n === 'resolution' || n === 'reso') return 'list-reso';
  if(n === 'fps') return 'list-fps';
  if(n === 'quality') return 'list-quality';
  if(n === 'enhance') return 'list-enhance';
  if(n === 'denoise') return 'list-denoise';
  if(n === 'stabilize') return 'list-stabilize';
  if(n === 'format') return c === 'MAKER' ? 'list-formatimg' : 'list-format';
  if(['duration','saldo','pengikut','like','comment','postingan','koin','terpakai','rollno','width','height','nik','phone','contact'].indexOf(n) !== -1) return 'number';
  return 'text';
}

window.zyRenderDynamicInputs = function(container, params, idPrefix, category){
  if(!container) return;
  container.innerHTML = '';
  window.__apihubCategory = category || '';
  if(!params || !params.length){
    container.innerHTML = '<div class="r" style="font-size:.6rem">Endpoint ini tidak butuh parameter</div>';
    return;
  }
  params.forEach(function(p){
    var type = paramType(p, category);
    var wrap = document.createElement('div');
    wrap.style.marginBottom = '4px';
    var blockId = idPrefix + '-' + p.replace(/[^a-zA-Z0-9]/g,'_');

    if(type === 'image' || type === 'video'){
      var isVideo = type === 'video';
      var html = '<label>' + esc(p.toUpperCase()) + '</label>';
      html += '<div class="upload-dual">';
      html += '<button type="button" class="upload-btn" id="' + blockId + '-btn">📁 ' + (isVideo?'UPLOAD VIDEO':'UPLOAD GAMBAR') + '</button>';
      html += '<input type="file" id="' + blockId + '-file" style="display:none" accept="' + (isVideo?'video/*':'image/*') + '">';
      html += '<input type="text" id="' + blockId + '-url" placeholder="atau paste URL ' + (isVideo?'video':'gambar') + '...">';
      html += '<div id="' + blockId + '-info" class="upload-info" style="display:none;font-size:.55rem;margin-top:4px"></div>';
      html += '</div>';
      wrap.innerHTML = html;
      container.appendChild(wrap);
      (function(bid){
        var btn = document.getElementById(bid+'-btn');
        var file = document.getElementById(bid+'-file');
        var urlIn = document.getElementById(bid+'-url');
        var info = document.getElementById(bid+'-info');
        if(btn && file){
          btn.addEventListener('click', function(){ file.click(); });
          file.addEventListener('change', async function(){
            var f = file.files[0]; if(!f) return;
            info.style.display = 'block';
            info.style.color = 'var(--ac2)';
            info.textContent = '⏳ Upload ' + f.name + ' (' + (f.size/1024/1024).toFixed(1) + ' MB)...';
            var res = await uploadToCatbox(f);
            if(res.ok){
              urlIn.value = res.url;
              info.style.color = 'var(--ok)';
              info.textContent = '✓ Upload OK';
              setTimeout(function(){ info.style.display = 'none'; }, 2500);
            } else {
              info.style.color = 'var(--er)';
              info.textContent = '✗ Gagal: ' + res.error + ' — isi URL manual';
              window.zyToast('UNABLE!', 'error');
            }
          });
        }
      })(blockId);
    } else if(type.indexOf('list-') === 0){
      var list = PARAM_LISTS[type] || [];
      wrap.innerHTML = '<label>' + esc(p.toUpperCase()) + '</label><div class="zy-select-wrap" id="' + blockId + '-wrap"></div>';
      container.appendChild(wrap);
      (function(bid, lst){
        setTimeout(function(){
          if(typeof window.initCustomSelect === 'function'){
            var items = lst.map(function(x){ return { id:x, name:x }; });
            window.initCustomSelect(bid+'-wrap', items, lst[0], function(){});
          }
        }, 20);
      })(blockId, list);
    } else if(type === 'number'){
      wrap.innerHTML = '<label>' + esc(p.toUpperCase()) + '</label><input type="number" id="' + blockId + '" placeholder="angka...">';
      container.appendChild(wrap);
    } else {
      wrap.innerHTML = '<label>' + esc(p.toUpperCase()) + '</label><input type="text" id="' + blockId + '" placeholder="isi ' + esc(p) + '...">';
      container.appendChild(wrap);
    }
  });
};

window.zyCollectParams = function(params, idPrefix, category){
  var out = {};
  if(!params) return out;
  params.forEach(function(p){
    var type = paramType(p, category);
    var blockId = idPrefix + '-' + p.replace(/[^a-zA-Z0-9]/g,'_');
    if(type === 'image' || type === 'video'){
      var urlIn = document.getElementById(blockId+'-url');
      if(urlIn && urlIn.value.trim()) out[p] = urlIn.value.trim();
    } else if(type.indexOf('list-') === 0){
      var wrap = document.getElementById(blockId+'-wrap');
      if(wrap){
        var lbl = wrap.querySelector('.zy-select-btn .zy-btn-label');
        if(lbl) out[p] = lbl.textContent.trim();
      }
    } else {
      var el = document.getElementById(blockId);
      if(el && el.value.trim()) out[p] = el.value.trim();
    }
  });
  return out;
};

// ===== SEARCH APIS =====
var SEARCH_APIS = {
  'WEB': [
    { id:'wikipedia', name:'Wikipedia', path:'/api/search/wikipedia', params:['query'] },
    { id:'nasa', name:'NASA', path:'/api/search/nasa', params:['type','query'], fixed:{type:'images'} },
    { id:'dapodik', name:'Dapodik', path:'/api/search/dapodik', params:['query'] },
    { id:'nowsecure', name:'NowSecure', path:'/api/search/nowsecure', params:['query'] },
    { id:'sinopsis', name:'Sinopsis Film', path:'/api/search/sinopsis', params:['query'] },
    { id:'cookpad', name:'Cookpad', path:'/api/search/cookpad', params:['query'] },
    { id:'goal', name:'Goal.com', path:'/api/search/goal', params:['query'] }
  ],
  'VIDEO': [
    { id:'youtube', name:'YouTube', path:'/api/search/youtube-search', params:['query'] },
    { id:'tiktok', name:'TikTok', path:'/api/search/tiktok-search', params:['query','region','type'], fixed:{region:'ID', type:'video'} }
  ],
  'MUSIC': [
    { id:'spotify', name:'Spotify', path:'/api/search/spotify', params:['query'] }
  ]
};

// ===== BYPASS =====
var BYPASS_LIST = [
  { id:'bypasslink', name:'Bypass Link v1', path:'/api/bypass/bypasslink', method:'POST', params:['url','androidId'] },
  { id:'bypasslinkv2', name:'Bypass Link v2', path:'/api/bypass/bypasslinkv2', method:'POST', params:['url'] },
  { id:'bypasslinkv3', name:'Bypass Link v3', path:'/api/bypass/bypasslinkv3', method:'POST', params:['url'] },
  { id:'modjall', name:'ModJall', path:'/api/bypass/modjall', method:'POST', params:['url'] },
  { id:'move2link', name:'Move2Link', path:'/api/bypass/move2link', method:'POST', params:['url'] },
  { id:'ouo-bypass', name:'Ouo Bypass', path:'/api/bypass/ouo-bypass', method:'POST', params:['url'] },
  { id:'safelink', name:'Safelink', path:'/api/bypass/safelink', method:'POST', params:['url'] },
  { id:'shrinkme', name:'ShrinkMe', path:'/api/bypass/shrinkme', method:'POST', params:['url'] },
  { id:'wellbypass', name:'Wellbypass', path:'/api/bypass/wellbypass', method:'POST', params:['url','turnstileToken'] }
];

// ===== DOWNLOADER =====
var DOWNLOADER_LIST = [
  { id:'tikwm', name:'TikWM (recommended)', path:'TIKWM', method:'GET', params:['url'], cat:'TikTok', desc:'auto WM/NoWM/HD' },
  { id:'tiktokv2', name:'TikTok v2 (HD)', path:'/api/downloader/tiktokv2', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv3', name:'TikTok v3', path:'/api/downloader/tiktokv3', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv4', name:'TikTok v4', path:'/api/downloader/tiktokv4', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv5', name:'TikTok v5 (slide)', path:'/api/downloader/tiktokv5', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokio', name:'TikTok.io', path:'/api/downloader/tiktokio', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktok', name:'TikTok v1', path:'/api/downloader/tiktok', method:'GET', params:['url'], cat:'TikTok' },
  { id:'youtubev1', name:'YouTube v1', path:'/api/downloader/youtubev1', method:'GET', params:['url','quality'], cat:'YouTube' },
  { id:'youtubev2', name:'YouTube v2', path:'/api/downloader/youtubev2', method:'GET', params:['url'], cat:'YouTube' },
  { id:'youtubev3', name:'YouTube v3', path:'/api/downloader/youtubev3', method:'GET', params:['url','json'], cat:'YouTube' },
  { id:'youtubev4', name:'YouTube v4', path:'/api/downloader/youtubev4', method:'GET', params:['url'], cat:'YouTube' },
  { id:'savetube', name:'SaveTube', path:'/api/downloader/savetube', method:'GET', params:['url','format'], cat:'YouTube' },
  { id:'insvid', name:'Insvid', path:'/api/downloader/insvid', method:'GET', params:['url','fileType'], cat:'YouTube' },
  { id:'ytplay', name:'YT Play', path:'/api/downloader/ytplay', method:'GET', params:['query'], cat:'YouTube' },
  { id:'igexport', name:'Instagram Export', path:'/api/downloader/igexport', method:'GET', params:['url'], cat:'Instagram' },
  { id:'facebook', name:'Facebook', path:'/api/downloader/facebook', method:'GET', params:['url'], cat:'Facebook' },
  { id:'capcut', name:'CapCut v1', path:'/api/downloader/capcut', method:'GET', params:['url'], cat:'CapCut' },
  { id:'capcutv2', name:'CapCut v2', path:'/api/downloader/capcutv2', method:'GET', params:['url'], cat:'CapCut' },
  { id:'pinterest', name:'Pinterest', path:'/api/downloader/pinterest', method:'GET', params:['url'], cat:'Pinterest' },
  { id:'pinterest-dl', name:'Pinterest Video', path:'/api/downloader/pinterest-dl', method:'GET', params:['url'], cat:'Pinterest' },
  { id:'pinvid', name:'PinVid', path:'/api/downloader/pinvid', method:'GET', params:['url'], cat:'Pinterest' },
  { id:'spotify', name:'Spotify', path:'/api/downloader/spotify', method:'GET', params:['url'], cat:'Spotify & Audio' },
  { id:'flac', name:'FLAC / MP3', path:'/api/download/flac', method:'POST', params:['track_id','format'], cat:'Spotify & Audio' },
  { id:'mediafire', name:'MediaFire', path:'/api/downloader/mediafire', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'mediafirev2', name:'MediaFire v2', path:'/api/downloader/mediafirev2', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'meganz', name:'MEGA.NZ', path:'/api/downloader/meganz', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'gdrive', name:'Google Drive', path:'/api/downloader/gdrive', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'terabox', name:'TeraBox', path:'/api/downloader/terabox', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'zippyshare', name:'ZippyShare', path:'/api/downloader/zippyshare', method:'GET', params:['url'], cat:'File Hosting' },
  { id:'allinone', name:'All-in-One v1', path:'/api/downloader/allinone', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'allinonev2', name:'All-in-One v2', path:'/api/downloader/allinonev2', method:'GET', params:['url','format'], cat:'All-in-One' },
  { id:'allinonev3', name:'All-in-One v3', path:'/api/downloader/allinonev3', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'allinonev4', name:'All-in-One v4', path:'/api/downloader/allinonev4', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'omnify', name:'Omnify', path:'/api/downloader/omnify', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'9xbuddy', name:'9xBuddy', path:'/api/downloader/9xbuddy', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'savefrom', name:'SaveFrom', path:'/api/downloader/savefrom', method:'GET', params:['url','type'], cat:'All-in-One' },
  { id:'snapany', name:'SnapAny', path:'/api/downloader/snapany', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'getdl', name:'GetDL', path:'/api/downloader/getdl', method:'GET', params:['url'], cat:'All-in-One' },
  { id:'rednote', name:'RedNote', path:'/api/downloader/rednote', method:'GET', params:['url'], cat:'Lain-lain' },
  { id:'weibo', name:'Weibo', path:'/api/downloader/weibo', method:'GET', params:['mode','url'], cat:'Lain-lain' },
  { id:'apkmody', name:'APKMody', path:'/api/downloader/apkmody', method:'GET', params:['action','query'], cat:'Lain-lain' },
  { id:'gtw', name:'GTW APK', path:'/api/downloader/gtw', method:'GET', params:['action','query'], cat:'Lain-lain' },
  { id:'webtoon', name:'Webtoon', path:'/api/downloader/webtoon', method:'GET', params:['query'], cat:'Lain-lain' },
  { id:'youtube-analytic', name:'YT Analytic', path:'/api/downloader/youtube-analytic', method:'GET', params:['url'], cat:'Lain-lain' },
  { id:'mcpelife', name:'MCPelife', path:'/api/downloader/mcpelife', method:'GET', params:['url'], cat:'Lain-lain' }
];

// ===== TIKTOK HELPERS =====
function detectTikTokType(data){
  if(!data || typeof data !== 'object') return 'unknown';
  if(data.images && Array.isArray(data.images) && data.images.length > 0) return 'slideshow';
  if(data.image_post_info && data.image_post_info.images) return 'slideshow';
  if(data.slideshow && Array.isArray(data.slideshow)) return 'slideshow';
  if(data.play || data.hdplay || data.wmplay || data.video || data.video_hd || data.video_wm) return 'video';
  if(data.data) return detectTikTokType(data.data);
  if(data.raw) return detectTikTokType(data.raw);
  return 'unknown';
}
function urlLooksLikeSlideshow(url){
  if(!url) return false;
  var u = url.toLowerCase();
  return /\/photo\//.test(u) || /slideshow/.test(u);
}
function extractTikTokVariants(data){
  var out = { noWM:null, noWMHD:null, wm:null, music:null, title:null, author:null, cover:null, stats:null, images:null };
  if(!data) return out;
  var d = data.data || data.raw || data;
  out.title = d.title || data.title || null;
  out.author = d.author || data.author || null;
  out.cover = d.cover || d.origin_cover || data.cover || null;
  out.stats = data.stats || (d.play_count !== undefined ? { play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count } : null);
  var imgArr = null;
  if(d.images && Array.isArray(d.images)) imgArr = d.images;
  else if(d.image_post_info && d.image_post_info.images) imgArr = d.image_post_info.images;
  else if(data.image_post_info && data.image_post_info.images) imgArr = data.image_post_info.images;
  if(imgArr){
    out.images = imgArr.map(function(x){
      if(typeof x === 'string') return x;
      if(x.url_list && x.url_list[0]) return x.url_list[0];
      if(x.image_url && x.image_url.url_list) return x.image_url.url_list[0];
      if(x.display_image && x.display_image.url_list) return x.display_image.url_list[0];
      return null;
    }).filter(Boolean);
    return out;
  }
  out.noWM = d.play || d.video || d.video_sd || d.play_addr || null;
  out.noWMHD = d.hdplay || d.video_hd || d.hd || d.play_addr_hd || null;
  out.wm = d.wmplay || d.video_wm || d.wm || null;
  out.music = d.music || (d.music_info && d.music_info.play) || d.music_url || null;
  if(!out.noWM && d.video_data){
    out.noWM = (d.video_data.play_addr && d.video_data.play_addr.url_list && d.video_data.play_addr.url_list[0]) || null;
    out.noWMHD = (d.video_data.hd && d.video_data.hd.url_list && d.video_data.hd.url_list[0]) || null;
    out.wm = (d.video_data.wm && d.video_data.wm.url_list && d.video_data.wm.url_list[0]) || null;
  }
  return out;
}

async function fetchTikWM(url){
  var apiURL = TIKWM + '?url=' + encodeURIComponent(url) + '&hd=1';
  var res = await proxyFetch(apiURL, {}, 60000);
  var json = JSON.parse(res.text);
  if(json.code !== 0) throw new Error(json.msg || 'tikwm error');
  var d = json.data;
  return { status:true, __type:detectTikTokType(d), title:d.title, author:d.author, cover:d.cover, duration:d.duration, stats:{ play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count }, video_nowm:d.play, video_nowm_hd:d.hdplay, video_wm:d.wmplay, music:d.music, raw:d };
}

async function fetchWithFallback(list, params, logEl){
  for(var i=0;i<list.length;i++){
    var api = list[i];
    var callParams = {};
    api.params.forEach(function(p){ if(params[p] !== undefined && params[p] !== '') callParams[p] = params[p]; });
    if(logEl){ var l1 = document.createElement('div'); l1.className='ok'; l1.textContent='['+(i+1)+'/'+list.length+'] '+api.name; logEl.appendChild(l1); logEl.scrollTop=logEl.scrollHeight; }
    try{
      var res = api.path === 'TIKWM' ? await fetchTikWM(callParams.url) : await callAPIv2(api.path, callParams, api.method);
      var success = res && ((res.status === true) || (res.status === 'success') || (res.success === true) || (res.result && !res.error) || (res.data) || (res.url) || (res.video) || (res.download_url) || (!res.error && !res.message));
      if(success){
        if(logEl){ var l2 = document.createElement('div'); l2.className='ok'; l2.textContent='  ✓ '+api.name; logEl.appendChild(l2); logEl.scrollTop=logEl.scrollHeight; }
        return { api:api, result:res };
      }
      if(logEl){ var l3 = document.createElement('div'); l3.className='er'; l3.textContent='  ✗ '+(res.error||res.message||'unknown'); logEl.appendChild(l3); logEl.scrollTop=logEl.scrollHeight; }
    }catch(e){
      if(logEl){ var l4 = document.createElement('div'); l4.className='er'; l4.textContent='  ✗ '+e.message; logEl.appendChild(l4); logEl.scrollTop=logEl.scrollHeight; }
    }
  }
  return null;
}

async function fetchTikTokSmart(url, logEl){
  var isSlideUrl = urlLooksLikeSlideshow(url);
  if(logEl){ var l = document.createElement('div'); l.className='in'; l.textContent='🔍 '+(isSlideUrl?'SLIDESHOW':'VIDEO'); logEl.appendChild(l); logEl.scrollTop=logEl.scrollHeight; }
  var order = isSlideUrl
    ? ['tiktokv5','tiktokv4','tiktokv3','tikwm','tiktokv2','tiktokio','tiktok']
    : ['tikwm','tiktokv2','tiktokv4','tiktokv3','tiktokv5','tiktokio','tiktok'];
  var results = [];
  for(var i=0;i<order.length;i++){
    var apiId = order[i];
    var api = DOWNLOADER_LIST.find(function(x){ return x.id===apiId; });
    if(!api) continue;
    if(logEl){ var l2 = document.createElement('div'); l2.className='ok'; l2.textContent='['+(i+1)+'/'+order.length+'] '+api.name; logEl.appendChild(l2); logEl.scrollTop=logEl.scrollHeight; }
    try{
      var res = api.path === 'TIKWM' ? await fetchTikWM(url) : await callAPIv2(api.path, {url:url}, api.method);
      var success = res && ((res.status === true) || (res.status === 'success') || (res.success === true) || (res.result && !res.error) || (res.data) || (res.url) || (res.video) || (res.download_url));
      if(success){
        var type = detectTikTokType(res);
        if(logEl){ var l3 = document.createElement('div'); l3.className='ok'; l3.textContent='  ✓ '+type.toUpperCase(); logEl.appendChild(l3); logEl.scrollTop=logEl.scrollHeight; }
        results.push({ api:api, result:res, type:type });
        if(type === 'slideshow' || type === 'video') break;
      } else {
        if(logEl){ var l4 = document.createElement('div'); l4.className='er'; l4.textContent='  ✗ '+(res.error||res.message||'unknown'); logEl.appendChild(l4); logEl.scrollTop=logEl.scrollHeight; }
      }
    }catch(e){
      if(logEl){ var l5 = document.createElement('div'); l5.className='er'; l5.textContent='  ✗ '+e.message; logEl.appendChild(l5); logEl.scrollTop=logEl.scrollHeight; }
    }
  }
  if(!results.length) return null;
  var primary = results[0];
  var combined = { api: primary.api, result: primary.result, type: primary.type, allVariants: {} };
  results.forEach(function(r){
    var v = extractTikTokVariants(r.result);
    if(v.noWM && !combined.allVariants.noWM) combined.allVariants.noWM = v.noWM;
    if(v.noWMHD && !combined.allVariants.noWMHD) combined.allVariants.noWMHD = v.noWMHD;
    if(v.wm && !combined.allVariants.wm) combined.allVariants.wm = v.wm;
    if(v.music && !combined.allVariants.music) combined.allVariants.music = v.music;
    if(v.images && !combined.allVariants.images) combined.allVariants.images = v.images;
    if(v.title && !combined.allVariants.title) combined.allVariants.title = v.title;
    if(v.author && !combined.allVariants.author) combined.allVariants.author = v.author;
  });
  return combined;
}

// ===== API HUB LIST =====
var API_HUB_LIST = [
  // UPSCALE
  {id:'up_ai', name:'Video Upscale AI', path:'/api/hdvidio/ai-upscale-vidio', method:'GET', params:['url','resolution'], cat:'UPSCALE'},
  {id:'up_v1', name:'Video Upscale v1', path:'/api/hdvidio/upscale', method:'GET', params:['url','resolution'], cat:'UPSCALE'},
  {id:'up_tohd', name:'HD Video Processor', path:'/api/hdvidio/tohd', method:'GET', params:['video','fps','resolution','quality','enhance','denoise','stabilize','format'], cat:'UPSCALE'},
  {id:'up_wink', name:'Wink HD Video Enhancer', path:'/api/hdvidio/wink-hd-video', method:'GET', params:['url','fps','resolution','quality','enhance','denoise','stabilize','format'], cat:'UPSCALE'},
  {id:'up_v2', name:'Video HD Enhancer', path:'/api/hdvidio/enhance', method:'GET', params:['url','fps','resolution','quality','enhance','denoise','stabilize','format'], cat:'UPSCALE'},

  // IMG AI
  {id:'ai_seek', name:'AI Seek Image', path:'/api/imageai/aiseek', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_bing', name:'AI Bing Image', path:'/api/imageai/bingimg', method:'GET', params:['query'], cat:'IMG AI'},
  {id:'ai_dezgo', name:'Dezgo Image', path:'/api/imageai/dezgo', method:'GET', params:['text','model','width','height','negative'], cat:'IMG AI'},
  {id:'ai_freeforai', name:'FreeForAI Image', path:'/api/imageai/freeforai', method:'GET', params:['prompt','model','size'], cat:'IMG AI'},
  {id:'ai_gstory', name:'GStory AI Image', path:'/api/imageai/gstory', method:'GET', params:['prompt','style','ratio'], cat:'IMG AI'},
  {id:'ai_nano', name:'Nano Banana AI', path:'/api/imageai/nanobanana', method:'GET', params:['prompt','ratio','resolution'], cat:'IMG AI'},
  {id:'ai_poll', name:'Pollinations AI', path:'/api/imageai/pollinations', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_quil', name:'Quillbot Image', path:'/api/imageai/quil-image', method:'GET', params:['prompt','style','aspect'], cat:'IMG AI'},
  {id:'ai_strom', name:'Strom-AI T2I', path:'/api/imageai/strom-img', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_t2i', name:'Text to Image (FreeGen)', path:'/api/imageai/text2image', method:'GET', params:['teks','ratio'], cat:'IMG AI'},
  {id:'ai_t2iv2', name:'Text to Image v2 (FLUX)', path:'/api/imageai/text2imgv2', method:'GET', params:['teks'], cat:'IMG AI'},
  {id:'ai_t2iv3', name:'Text to Image v3 (Baidu)', path:'/api/imageai/text2imgv3', method:'GET', params:['teks'], cat:'IMG AI'},

  // IMG HD
  {id:'hd_en1', name:'AI Enhance HD', path:'/api/imagehd/ai-enhance', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_en2', name:'AI Enhance HD v2', path:'/api/imagehd/ai-enhancev2', method:'GET', params:['url','size'], cat:'IMG HD'},
  {id:'hd_en3', name:'AI Enhance HD v3', path:'/api/imagehd/ai-enhancev3', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_en4', name:'AI Enhance HD v4', path:'/api/imagehd/ai-enhancev4', method:'GET', params:['url','scale'], cat:'IMG HD'},
  {id:'hd_en5', name:'AI Enhance HD v5', path:'/api/imagehd/ai-enhancev5', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_en6', name:'AI Enhance HD v6', path:'/api/imagehd/ai-enhancev6', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_en7', name:'AI Enhance HD v7', path:'/api/imagehd/ai-enhancev7', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_en8', name:'AI Enhance HD v8', path:'/api/imagehd/ai-enhancev8', method:'GET', params:['url','scale','model'], cat:'IMG HD'},
  {id:'hd_clearpng', name:'ClearPNG Upscaler', path:'/api/imagehd/clearpng', method:'GET', params:['url','ratio','format'], cat:'IMG HD'},
  {id:'hd_ups1', name:'Image Upscaler', path:'/api/imagehd/imageupscaler', method:'GET', params:['url','scale'], cat:'IMG HD'},
  {id:'hd_nex', name:'NexUpscale', path:'/api/imagehd/nexupscale', method:'GET', params:['url','mode'], cat:'IMG HD'},
  {id:'hd_opti', name:'Optimole Upscaler', path:'/api/imagehd/optimole', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_phot', name:'Photoihancer', path:'/api/imagehd/photoihancer', method:'GET', params:['url','method'], cat:'IMG HD'},
  {id:'hd_remini', name:'Remini HD', path:'/api/imagehd/remini', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_spark', name:'SparkPix HD Upscale', path:'/api/imagehd/sparkpix', method:'GET', params:['url','quality','face'], cat:'IMG HD'},
  {id:'hd_super', name:'AI Super Resolution', path:'/api/imagehd/super-resolution', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_upai', name:'Upscale AI', path:'/api/imagehd/upscale', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_up2', name:'Image Upscaler v2', path:'/api/imagehd/upscalev2', method:'GET', params:['image','scale'], cat:'IMG HD'},
  {id:'hd_up3', name:'Image Upscaler v3', path:'/api/imagehd/upscalev3', method:'GET', params:['image','scale'], cat:'IMG HD'},
  {id:'hd_web', name:'WebAbility Upscaler', path:'/api/imagehd/webability', method:'GET', params:['url','scale','model','mode'], cat:'IMG HD'},
  {id:'hd_wink', name:'Wink HD Enhancer', path:'/api/imagehd/wink-hd', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_yupra', name:'Yupra Enhancer', path:'/api/imagehd/yupra', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_nekoh', name:'Nekohime Upscaler', path:'/api/imagehd/nekohime', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_picsum', name:'Picsum Upscaler', path:'/api/imagehd/picsum', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_pinimg', name:'Pinimg Upscaler', path:'/api/imagehd/pinimg', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_yupra2', name:'Yupra Upscale v2', path:'/api/imagehd/yupra-upscale', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_enh1', name:'Enhancer Pro', path:'/api/imagehd/enhancer-pro', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_enh2', name:'Enhancer Ultra', path:'/api/imagehd/enhancer-ultra', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_enh3', name:'Enhancer Max', path:'/api/imagehd/enhancer-max', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_hd1', name:'HD Converter v1', path:'/api/imagehd/hd-convert', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_hd2', name:'HD Converter v2', path:'/api/imagehd/hd-convertv2', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_hd3', name:'HD Converter v3', path:'/api/imagehd/hd-convertv3', method:'GET', params:['url'], cat:'IMG HD'},
  {id:'hd_hd4', name:'HD Converter v4', path:'/api/imagehd/hd-convertv4', method:'GET', params:['url'], cat:'IMG HD'},

  // KALENDER
  {id:'kal_hari', name:'Hari Ini', path:'/api/kalender/hari-ini', method:'GET', params:[], cat:'KALENDER'},
  {id:'kal_libur', name:'Hari Libur Nasional', path:'/api/kalender/hari-libur', method:'GET', params:['tahun'], cat:'KALENDER'},

  // MAKER
  {id:'mk_bounty', name:'Fake Bounty', path:'/api/maker/bounty', method:'GET', params:['image','text'], cat:'MAKER'},
  {id:'mk_ektp', name:'EKTP Generator', path:'/api/maker/ektp', method:'GET', params:['nama','nik','provinsi','kota','ttl','jenis_kelamin','golongan_darah','alamat','rt/rw','kel/desa','kecamatan','agama','status','pekerjaan','kewarganegaraan','masa_berlaku','terbuat','pas_photo'], cat:'MAKER'},
  {id:'mk_afin', name:'Fake Afinitas ML', path:'/api/maker/fake-afinitas-ml', method:'GET', params:['ppurl'], cat:'MAKER'},
  {id:'mk_ff', name:'Fake FF', path:'/api/maker/fake-ff', method:'GET', params:['username','lobby'], cat:'MAKER'},
  {id:'mk_ml', name:'Fake ML', path:'/api/maker/fake-ml', method:'GET', params:['username','rank','border','avatar'], cat:'MAKER'},
  {id:'mk_nokia', name:'Fake Nokia Message', path:'/api/maker/fake-nokia', method:'GET', params:['text'], cat:'MAKER'},
  {id:'mk_proff', name:'Fake Profile FF', path:'/api/maker/fake-profile-ff', method:'GET', params:['nickname','uid'], cat:'MAKER'},
  {id:'mk_tele', name:'Fake Telegram Profile', path:'/api/maker/fake-tele', method:'GET', params:['nama','ponsel','bio','username','ppurl'], cat:'MAKER'},
  {id:'mk_tweet', name:'Fake Tweet', path:'/api/maker/fake-tweet', method:'GET', params:['name','username','text','avatar'], cat:'MAKER'},
  {id:'mk_bca', name:'Fake BCA Canvas', path:'/api/maker/fakebca', method:'GET', params:['nama','norek','saldo'], cat:'MAKER'},
  {id:'mk_board', name:'Fake Board', path:'/api/maker/fakeboard', method:'GET', params:['teks','author'], cat:'MAKER'},
  {id:'mk_book', name:'Fake Book', path:'/api/maker/fakebook', method:'GET', params:['teks'], cat:'MAKER'},
  {id:'mk_call_a', name:'Fake Call Android', path:'/api/maker/fakecall-andro', method:'GET', params:['name','duration','avatar'], cat:'MAKER'},
  {id:'mk_call_i', name:'Fake Call iOS', path:'/api/maker/fakecall-ios', method:'GET', params:['name','duration','avatar'], cat:'MAKER'},
  {id:'mk_ch', name:'Fake Channel iOS', path:'/api/maker/fakech', method:'GET', params:['nama','pengikut','jam','ppurl'], cat:'MAKER'},
  {id:'mk_dev', name:'Fake Dev Generator', path:'/api/maker/fakedev', method:'GET', params:['url','name','verified'], cat:'MAKER'},
  {id:'mk_gc', name:'Fake Grup iOS', path:'/api/maker/fakegc', method:'GET', params:['nama','anggota','ppurl'], cat:'MAKER'},
  {id:'mk_ig', name:'Fake IG Canvas', path:'/api/maker/fakeig', method:'GET', params:['pp','name','text'], cat:'MAKER'},
  {id:'mk_igp', name:'Fake IG Profile', path:'/api/maker/fakeigprofile', method:'GET', params:['username','postingan','pengikut','mengikuti','bio','ppurl'], cat:'MAKER'},
  {id:'mk_igpv2', name:'Fake IG Profile v2', path:'/api/maker/fakeigprofilev2', method:'GET', params:['username','ppurl','bio','postingan','pengikut','mengikuti'], cat:'MAKER'},
  {id:'mk_note', name:'Fake Note Message', path:'/api/maker/fakenote', method:'GET', params:['name','message','avatar'], cat:'MAKER'},
  {id:'mk_notif', name:'Fake WA Notif', path:'/api/maker/fakenotif', method:'GET', params:['name','message'], cat:'MAKER'},
  {id:'mk_notifwa', name:'Fake WA Lockscreen', path:'/api/maker/fakenotifwa', method:'GET', params:['username','chat','ppurl','tanggal','jam'], cat:'MAKER'},
  {id:'mk_igstory', name:'IG Story Image', path:'/api/maker/igstory', method:'GET', params:['photo','pp','name','username'], cat:'MAKER'},
  {id:'mk_iqcd', name:'IQC Dark', path:'/api/maker/iqc-dark', method:'GET', params:['text','time','image'], cat:'MAKER'},
  {id:'mk_iqcp', name:'IQC Pink', path:'/api/maker/iqc-pink', method:'GET', params:['text','time'], cat:'MAKER'},
  {id:'mk_iqcq', name:'IQC Quotes', path:'/api/maker/iqc', method:'GET', params:['text','author'], cat:'MAKER'},
  {id:'mk_jarvis', name:'Jarvis Meme', path:'/api/maker/jarvis-meme', method:'GET', params:['text'], cat:'MAKER'},
  {id:'mk_motiv', name:'Fake Motivasi', path:'/api/maker/motivasi', method:'GET', params:['quote','author'], cat:'MAKER'},
  {id:'mk_nulis', name:'Nulis', path:'/api/maker/nulis', method:'GET', params:['text'], cat:'MAKER'},
  {id:'mk_postig', name:'IG Story Generator', path:'/api/maker/post-ig', method:'GET', params:['profilePhoto','mainPhoto','username','like','comment','repost'], cat:'MAKER'},
  {id:'mk_profjson', name:'Profile JSON Card', path:'/api/maker/profilejson', method:'GET', params:['name','title','email','link'], cat:'MAKER'},
  {id:'mk_qcwa', name:'WA Quote Chat', path:'/api/maker/qcwa', method:'GET', params:['username','text','avatar','phone','tag','image','mode'], cat:'MAKER'},
  {id:'mk_qcard', name:'QuoteCard', path:'/api/maker/quotecard', method:'GET', params:['text','author'], cat:'MAKER'},
  {id:'mk_qanime', name:'Quotes Anime', path:'/api/maker/quotes-anime', method:'GET', params:['text','username','background'], cat:'MAKER'},
  {id:'mk_resize', name:'Image Resize', path:'/api/maker/resize', method:'GET', params:['url','width','height','format','quality'], cat:'MAKER'},
  {id:'mk_rusdi', name:'Rusdi Quote', path:'/api/maker/rusdi-quote', method:'GET', params:['quote','author'], cat:'MAKER'},
  {id:'mk_dana', name:'Fake Saldo Dana', path:'/api/maker/saldo-dana', method:'GET', params:['saldo'], cat:'MAKER'},
  {id:'mk_gopay', name:'Fake Saldo Gopay', path:'/api/maker/saldo-gopay', method:'GET', params:['saldo','koin','terpakai','bulan'], cat:'MAKER'},
  {id:'mk_ovo', name:'Fake Saldo OVO', path:'/api/maker/saldo-ovo', method:'GET', params:['saldo'], cat:'MAKER'},
  {id:'mk_nasa', name:'Sertifikat NASA', path:'/api/maker/sertifikat-nasa', method:'GET', params:['nama'], cat:'MAKER'},
  {id:'mk_textvid', name:'Text Video Generator', path:'/api/maker/textvideo', method:'GET', params:['text','duration','size'], cat:'MAKER'},
  {id:'mk_ttqc', name:'TikTok Quote Chat', path:'/api/maker/ttqc', method:'GET', params:['username','text','avatar'], cat:'MAKER'},
  {id:'mk_2btn', name:'Two Buttons Meme', path:'/api/maker/twobuttons', method:'GET', params:['teks1','teks2','teks3'], cat:'MAKER'},
  {id:'mk_wafat', name:'Fake Wafat', path:'/api/maker/wafat', method:'GET', params:['fotourl','nama','lahir','wafat'], cat:'MAKER'},
  {id:'mk_students', name:'Student ID Card', path:'/api/maker/students', method:'GET', params:['name','school','studentId','class','rollNo','dob','blood','guardian','contact','address','valid','photo'], cat:'MAKER'},

  // SEARCH API
  {id:'sr_4k', name:'Search Wallpaper 4K', path:'/api/search/4kwallpapers', method:'GET', params:['action','query','slug','page'], cat:'SEARCH'},
  {id:'sr_anime', name:'Anime Search', path:'/api/search/anime', method:'GET', params:['q'], cat:'SEARCH'},
  {id:'sr_bacakomik', name:'BacaKomik', path:'/api/search/bacakomik', method:'GET', params:['action','query','url','page'], cat:'SEARCH'},
  {id:'sr_bansos', name:'Cek Bansos', path:'/api/search/cekbansos', method:'GET', params:['nik'], cat:'SEARCH'},
  {id:'sr_cinesubz', name:'CineSubz', path:'/api/search/cinesubz', method:'GET', params:['q','url','action'], cat:'SEARCH'},
  {id:'sr_cookpad', name:'Cookpad', path:'/api/search/cookpad', method:'GET', params:['action','query','id'], cat:'SEARCH'},
  {id:'sr_dapodik', name:'Dapodik', path:'/api/search/dapodik', method:'GET', params:['action','query','npsn'], cat:'SEARCH'},
  {id:'sr_douyin', name:'Douyin Search', path:'/api/search/douyin-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_flac', name:'FlacDownloader', path:'/api/search/flac', method:'GET', params:['q'], cat:'SEARCH'},
  {id:'sr_gempa', name:'Info Gempa BMKG', path:'/api/search/gempa', method:'GET', params:[], cat:'SEARCH'},
  {id:'sr_genius', name:'Genius Lyrics', path:'/api/search/genius', method:'GET', params:['query','id'], cat:'SEARCH'},
  {id:'sr_goal', name:'Goal.com', path:'/api/search/goal', method:'GET', params:['action','query','url','lang'], cat:'SEARCH'},
  {id:'sr_ipa', name:'IPA Pelajaran', path:'/api/search/ipa-pelajaran', method:'GET', params:['query','page','slug'], cat:'SEARCH'},
  {id:'sr_jadwal1', name:'Jadwal Sepakbola', path:'/api/search/jadwal-sepakbola', method:'GET', params:['date'], cat:'SEARCH'},
  {id:'sr_jadwal2', name:'Jadwal Bola', path:'/api/search/jadwalbola', method:'GET', params:[], cat:'SEARCH'},
  {id:'sr_jadwaltv', name:'Jadwal TV', path:'/api/search/jadwaltv', method:'GET', params:['channel'], cat:'SEARCH'},
  {id:'sr_kodepos', name:'Search KodePos', path:'/api/search/kodepos', method:'GET', params:['kodepos'], cat:'SEARCH'},
  {id:'sr_lazada', name:'Lazada Search', path:'/api/search/lazada', method:'GET', params:['keyword','page'], cat:'SEARCH'},
  {id:'sr_livescore', name:'Livescore', path:'/api/search/livescore', method:'GET', params:['edisi','raw'], cat:'SEARCH'},
  {id:'sr_manhwaindo', name:'Manhwaindo', path:'/api/search/manhwaindo', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_manhwaland', name:'Manhwaland', path:'/api/search/manhwaland', method:'GET', params:['action'], cat:'SEARCH'},
  {id:'sr_mcpedl', name:'MCPEDL', path:'/api/search/mcpedl', method:'GET', params:['query','url','slug','source','action','max','page'], cat:'SEARCH'},
  {id:'sr_moviedetail', name:'Movie Detail', path:'/api/search/moviedetail', method:'GET', params:['url'], cat:'SEARCH'},
  {id:'sr_murotal', name:'Murotal Quran', path:'/api/search/murotal-quran', method:'GET', params:['murotal','surat'], cat:'SEARCH'},
  {id:'sr_musix', name:'Musixmatch Lyrics', path:'/api/search/musixmatch', method:'GET', params:['url'], cat:'SEARCH'},
  {id:'sr_nasa', name:'NASA Search', path:'/api/search/nasa', method:'GET', params:['type','limit','query','detail'], cat:'SEARCH'},
  {id:'sr_nowsecure', name:'NowSecure', path:'/api/search/nowsecure', method:'GET', params:['query','platform'], cat:'SEARCH'},
  {id:'sr_otakudesu', name:'OtakuDesu', path:'/api/search/otakudesu', method:'GET', params:['action','query','page'], cat:'SEARCH'},
  {id:'sr_pinterest', name:'Search Pinterest', path:'/api/search/pinterest', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_pinvid', name:'Pinterest Video', path:'/api/search/pinvid-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_playstore', name:'Play Store', path:'/api/search/playstore', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_prodi', name:'PDDIKTI', path:'/api/search/prodi', method:'GET', params:['query','mode','mahasiswaId'], cat:'SEARCH'},
  {id:'sr_song', name:'Search Song', path:'/api/search/search-song', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_sinopsis', name:'Sinopsis Film', path:'/api/search/sinopsis', method:'GET', params:['action','query'], cat:'SEARCH'},
  {id:'sr_soundcloud', name:'SoundCloud', path:'/api/search/soundcloud', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_spotify', name:'Spotify', path:'/api/search/spotify', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_spotifyv2', name:'Spotify v2', path:'/api/search/spotifyv2', method:'GET', params:['action','query','url','limit'], cat:'SEARCH'},
  {id:'sr_terabox', name:'TeraBox', path:'/api/search/terabox', method:'GET', params:['link'], cat:'SEARCH'},
  {id:'sr_tiktok', name:'TikTok Search', path:'/api/search/tiktok-search', method:'GET', params:['query','page','region','type','count'], cat:'SEARCH'},
  {id:'sr_tokusatsu', name:'Tokusatsu', path:'/api/search/tokusatsu', method:'GET', params:['action','query','url','page'], cat:'SEARCH'},
  {id:'sr_voratoon', name:'Voratoon', path:'/api/search/voratoon', method:'GET', params:['page'], cat:'SEARCH'},
  {id:'sr_webtoon', name:'Webtoon', path:'/api/search/webtoon', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_wiki', name:'Wikipedia', path:'/api/search/wikipedia', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_youtube', name:'YouTube', path:'/api/search/youtube-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_apkcombo', name:'ApkCombo', path:'/api/search/apkcombo', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_bilibili', name:'Bilibili', path:'/api/search/bilibili', method:'GET', params:['query','type','action','url','page','limit','lang'], cat:'SEARCH'}
];

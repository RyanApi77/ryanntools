// zyvor.js — API HUB untuk api.zyvor.my.id
// Bypass + Downloader dengan auto-fallback

(function(){
'use strict';

var BASE = 'https://api.zyvor.my.id';

// ================= CORS PROXY =================
var CORS = [
'https://corsproxy.io/?url=',
'https://api.allorigins.win/raw?url=',
'https://cors.eu.org/',
'https://thingproxy.freeboard.io/fetch/'
];

async function proxyFetch(url, opts){
opts = opts || {};
var lastErr = null;
for(var i=0;i<CORS.length;i++){
var p = CORS[i];
var full = p + (p.indexOf('?')!==-1 ? encodeURIComponent(url) : url);
try{
var ctrl = new AbortController();
var t = setTimeout(function(){ctrl.abort()}, 30000);
var r = await fetch(full, {
method: opts.method || 'GET',
headers: opts.headers || {},
body: opts.body,
signal: ctrl.signal
});
clearTimeout(t);
if(r.ok) return { ok:true, text: await r.text() };
lastErr = new Error('HTTP '+r.status);
}catch(e){ lastErr = e; }
}
// fallback: coba direct fetch (kalau server support CORS)
try{
var r2 = await fetch(url, {method:opts.method||'GET', headers:opts.headers||{}, body:opts.body});
if(r2.ok) return { ok:true, text: await r2.text() };
}catch(e){}
throw lastErr || new Error('All fetch failed');
}

async function callAPI(path, params, method){
method = method || 'GET';
var qs = '';
if(method === 'GET'){
qs = '?' + new URLSearchParams(params).toString();
}
var url = BASE + path + qs;
var opts = { method: method };
if(method === 'POST'){
opts.headers = { 'Content-Type': 'application/json' };
opts.body = JSON.stringify(params);
}
var res = await proxyFetch(url, opts);
var json;
try{ json = JSON.parse(res.text); }catch(e){ json = { raw: res.text }; }
return json;
}

// ================= BYPASS LIST =================
var BYPASS_LIST = [
{ id:'bypasslink', name:'Bypass Link v1', path:'/api/bypass/bypasslink', method:'POST', params:['url','androidId'], desc:'Bypass sf.gl, sub2unlock, tinyurl, linkvertise' },
{ id:'bypasslinkv2', name:'Bypass Link v2', path:'/api/bypass/bypasslinkv2', method:'POST', params:['url'], desc:'40+ layanan shortlink' },
{ id:'bypasslinkv3', name:'Bypass Link v3', path:'/api/bypass/bypasslinkv3', method:'POST', params:['url'], desc:'Universal safelink (sfl.gl, adlinksumo, myshortlink)' },
{ id:'modjall', name:'ModJall Bypass', path:'/api/bypass/modjall', method:'POST', params:['url'], desc:'ModJall / Khaddavi safelinks' },
{ id:'move2link', name:'Move2Link Bypass', path:'/api/bypass/move2link', method:'POST', params:['url'], desc:'move2link.com' },
{ id:'ouo-bypass', name:'Ouo Bypass', path:'/api/bypass/ouo-bypass', method:'POST', params:['url'], desc:'ouo.io / ouo.press' },
{ id:'safelink', name:'Safelink Bypass', path:'/api/bypass/safelink', method:'POST', params:['url'], desc:'sfl.gl / safelinku' },
{ id:'shrinkme', name:'ShrinkMe Bypass', path:'/api/bypass/shrinkme', method:'POST', params:['url'], desc:'shrinkme.click / .io / shrinke.me' },
{ id:'wellbypass', name:'Wellbypass', path:'/api/bypass/wellbypass', method:'POST', params:['url','turnstileToken'], desc:'Linkvertise, Lootlabs, Workink' }
];

// ================= DOWNLOADER LIST =================
var DOWNLOADER_LIST = [
// TikTok
{ id:'tiktok', name:'TikTok v1', path:'/api/downloader/tiktok', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv2', name:'TikTok v2 (HD)', path:'/api/downloader/tiktokv2', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv3', name:'TikTok v3', path:'/api/downloader/tiktokv3', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv4', name:'TikTok v4', path:'/api/downloader/tiktokv4', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv5', name:'TikTok v5 (slide)', path:'/api/downloader/tiktokv5', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokio', name:'TikTok.io', path:'/api/downloader/tiktokio', method:'GET', params:['url'], cat:'TikTok' },

// YouTube
{ id:'youtubev1', name:'YouTube v1', path:'/api/downloader/youtubev1', method:'GET', params:['url','quality'], cat:'YouTube' },
{ id:'youtubev2', name:'YouTube v2', path:'/api/downloader/youtubev2', method:'GET', params:['url'], cat:'YouTube' },
{ id:'youtubev3', name:'YouTube v3 (merge)', path:'/api/downloader/youtubev3', method:'GET', params:['url','json'], cat:'YouTube' },
{ id:'youtubev4', name:'YouTube v4 (y2mate)', path:'/api/downloader/youtubev4', method:'GET', params:['url'], cat:'YouTube' },
{ id:'savetube', name:'SaveTube', path:'/api/downloader/savetube', method:'GET', params:['url','format'], cat:'YouTube' },
{ id:'insvid', name:'Insvid', path:'/api/downloader/insvid', method:'GET', params:['url','fileType'], cat:'YouTube' },
{ id:'ytplay', name:'YT Play (search)', path:'/api/downloader/ytplay', method:'GET', params:['query'], cat:'YouTube' },

// Instagram
{ id:'igexport', name:'Instagram Export', path:'/api/downloader/igexport', method:'GET', params:['url'], cat:'Instagram' },

// Facebook
{ id:'facebook', name:'Facebook', path:'/api/downloader/facebook', method:'GET', params:['url'], cat:'Facebook' },

// CapCut
{ id:'capcut', name:'CapCut v1', path:'/api/downloader/capcut', method:'GET', params:['url'], cat:'CapCut' },
{ id:'capcutv2', name:'CapCut v2', path:'/api/downloader/capcutv2', method:'GET', params:['url'], cat:'CapCut' },

// Pinterest
{ id:'pinterest', name:'Pinterest', path:'/api/downloader/pinterest', method:'GET', params:['url'], cat:'Pinterest' },
{ id:'pinterest-dl', name:'Pinterest Video', path:'/api/downloader/pinterest-dl', method:'GET', params:['url'], cat:'Pinterest' },
{ id:'pinvid', name:'PinVid (m3u8→mp4)', path:'/api/downloader/pinvid', method:'GET', params:['url'], cat:'Pinterest' },

// Spotify / Audio
{ id:'spotify', name:'Spotify', path:'/api/downloader/spotify', method:'GET', params:['url'], cat:'Spotify & Audio' },
{ id:'flac', name:'FLAC / MP3', path:'/api/download/flac', method:'POST', params:['track_id','format','save_to_local'], cat:'Spotify & Audio' },

// File Hosting
{ id:'mediafire', name:'MediaFire', path:'/api/downloader/mediafire', method:'GET', params:['url'], cat:'File Hosting' },
{ id:'mediafirev2', name:'MediaFire v2', path:'/api/downloader/mediafirev2', method:'GET', params:['url'], cat:'File Hosting' },
{ id:'meganz', name:'MEGA.NZ', path:'/api/downloader/meganz', method:'GET', params:['url'], cat:'File Hosting' },
{ id:'gdrive', name:'Google Drive', path:'/api/downloader/gdrive', method:'GET', params:['url'], cat:'File Hosting' },
{ id:'terabox', name:'TeraBox', path:'/api/downloader/terabox', method:'GET', params:['url'], cat:'File Hosting' },
{ id:'zippyshare', name:'ZippyShare', path:'/api/downloader/zippyshare', method:'GET', params:['url'], cat:'File Hosting' },

// All-in-One
{ id:'allinone', name:'All-in-One v1', path:'/api/downloader/allinone', method:'GET', params:['url'], cat:'All-in-One' },
{ id:'allinonev2', name:'All-in-One v2', path:'/api/downloader/allinonev2', method:'GET', params:['url','format'], cat:'All-in-One' },
{ id:'allinonev3', name:'All-in-One v3', path:'/api/downloader/allinonev3', method:'GET', params:['url'], cat:'All-in-One' },
{ id:'allinonev4', name:'All-in-One v4', path:'/api/downloader/allinonev4', method:'GET', params:['url'], cat:'All-in-One' },
{ id:'omnify', name:'Omnify (auto)', path:'/api/downloader/omnify', method:'GET', params:['url'], cat:'All-in-One' },
{ id:'9xbuddy', name:'9xBuddy (1000+)', path:'/api/downloader/9xbuddy', method:'GET', params:['url'], cat:'All-in-One' },
{ id:'savefrom', name:'SaveFrom', path:'/api/downloader/savefrom', method:'GET', params:['url','type'], cat:'All-in-One' },
{ id:'snapany', name:'SnapAny (1000+)', path:'/api/downloader/snapany', method:'GET', params:['url','locale'], cat:'All-in-One' },
{ id:'getdl', name:'GetDL', path:'/api/downloader/getdl', method:'GET', params:['url'], cat:'All-in-One' },

// Lain-lain
{ id:'rednote', name:'RedNote / Xiaohongshu', path:'/api/downloader/rednote', method:'GET', params:['url'], cat:'Lain-lain' },
{ id:'weibo', name:'Weibo', path:'/api/downloader/weibo', method:'GET', params:['mode','url'], cat:'Lain-lain' },
{ id:'apkmody', name:'APKMody (APK)', path:'/api/downloader/apkmody', method:'GET', params:['action','query'], cat:'Lain-lain' },
{ id:'gtw', name:'GetToWallet (APK)', path:'/api/downloader/gtw', method:'GET', params:['action','query'], cat:'Lain-lain' },
{ id:'webtoon', name:'Webtoon', path:'/api/downloader/webtoon', method:'GET', params:['query'], cat:'Lain-lain' },
{ id:'youtube-analytic', name:'YT Analytic', path:'/api/downloader/youtube-analytic', method:'GET', params:['url'], cat:'Lain-lain' },
{ id:'mcpelife', name:'MCPelife', path:'/api/downloader/mcpelife', method:'GET', params:['url'], cat:'Lain-lain' }
];

// ================= UNIVERSAL FETCH WITH FALLBACK =================
async function fetchWithFallback(list, params, logEl){
var usedParams = Object.assign({}, params);
for(var i=0;i<list.length;i++){
var api = list[i];
var callParams = {};
api.params.forEach(function(p){
if(usedParams[p] !== undefined && usedParams[p] !== '') callParams[p] = usedParams[p];
});
if(logEl){
var line = document.createElement('div');
line.className = 'ok';
line.textContent = '['+(i+1)+'/'+list.length+'] Mencoba: '+api.name+'...';
logEl.appendChild(line); logEl.scrollTop = logEl.scrollHeight;
}
try{
var res = await callAPI(api.path, callParams, api.method);
// cek apakah response sukses
var success = res && (
(res.status === true) ||
(res.status === 'success') ||
(res.success === true) ||
(res.result && !res.error) ||
(res.data) ||
(res.url) ||
(res.video) ||
(res.download_url) ||
(!res.error && !res.message)
);
if(success){
if(logEl){
var lineOk = document.createElement('div');
lineOk.className = 'ok';
lineOk.textContent = '  ✓ Sukses via: '+api.name;
logEl.appendChild(lineOk); logEl.scrollTop = logEl.scrollHeight;
}
return { api: api, result: res };
}
if(logEl){
var lineErr = document.createElement('div');
lineErr.className = 'er';
lineErr.textContent = '  ✗ Gagal: '+(res.error || res.message || 'unknown');
logEl.appendChild(lineErr); logEl.scrollTop = logEl.scrollHeight;
}
}catch(e){
if(logEl){
var lineEx = document.createElement('div');
lineEx.className = 'er';
lineEx.textContent = '  ✗ Error: '+e.message;
logEl.appendChild(lineEx); logEl.scrollTop = logEl.scrollHeight;
}
}
}
return null;
}

// ================= RENDER =================
function $id(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

function collectMediaUrls(obj, out){
out = out || [];
if(!obj) return out;
if(typeof obj === 'string'){
if(/^https?:\/\/.+\.(mp4|mp3|m4a|jpg|jpeg|png|webp|gif|flac|wav|zip|apk)(\?|$)/i.test(obj)) out.push(obj);
return out;
}
if(Array.isArray(obj)){ obj.forEach(function(v){ collectMediaUrls(v, out); }); return out; }
if(typeof obj === 'object'){
Object.keys(obj).forEach(function(k){
if(/url|link|download|video|audio|music|hd|sd|wm|play|src|file/i.test(k)){
var v = obj[k];
if(typeof v === 'string' && /^https?:\/\//.test(v)) out.push(v);
}
collectMediaUrls(obj[k], out);
});
}
return out;
}

function renderResult(container, data, apiName){
var mediaUrls = collectMediaUrls(data, []);
var uniqMedia = Array.from(new Set(mediaUrls));
var html = '';
html += '<div class="zy-head">✓ SUKSES via <b>'+esc(apiName)+'</b></div>';
if(uniqMedia.length){
html += '<div class="zy-media"><div class="zy-media-t">📥 Media Download ('+uniqMedia.length+')</div>';
uniqMedia.slice(0,20).forEach(function(u){
var ext = (u.split('.').pop().split('?')[0] || '').toLowerCase();
var icon = ext.match(/^(mp4|mov|webm)$/) ? '🎬' : ext.match(/^(mp3|m4a|flac|wav)$/) ? '🎵' : ext.match(/^(jpg|jpeg|png|webp|gif)$/) ? '🖼' : ext.match(/^(zip|apk|rar)$/) ? '📦' : '🔗';
html += '<a href="'+esc(u)+'" target="_blank" download class="zy-dl"><span>'+icon+'</span> '+esc(u.substring(0,60))+(u.length>60?'...':'')+'</a>';
});
html += '</div>';
}
html += '<details class="zy-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(data,null,2))+'</pre></details>';
html += '<button class="zy-copy" onclick="navigator.clipboard.writeText(this.previousElementSibling.querySelector(\'pre\').textContent).then(function(){alert(\'Tersalin\')})">📋 COPY JSON</button>';
container.innerHTML = html;
container.classList.remove('hd');
}

// ================= UI SETUP =================
window.zyInit = function(){
// Bypass UI
var bpSelect = $id('bp-api');
if(bpSelect){
bpSelect.innerHTML = '<option value="ALL">🔄 ALL (auto-fallback 9 API)</option>' + BYPASS_LIST.map(function(b){
return '<option value="'+b.id+'">'+esc(b.name)+' — '+esc(b.desc||'')+'</option>';
}).join('');
bpSelect.onchange = window.zyRenderBypassParams;
window.zyRenderBypassParams();
}

// Downloader UI
var dlCat = $id('dl-cat');
if(dlCat){
var cats = Array.from(new Set(DOWNLOADER_LIST.map(function(d){return d.cat;})));
dlCat.innerHTML = '<option value="ALL">🔄 ALL (auto-fallback)</option>' + cats.map(function(c){
return '<option value="'+c+'">'+c+'</option>';
}).join('');
dlCat.onchange = window.zyRenderDlApis;
window.zyRenderDlApis();
}
};

window.zyRenderBypassParams = function(){
var v = $id('bp-api').value;
var wrap = $id('bp-params');
if(v === 'ALL'){
wrap.innerHTML = '<label>URL Target</label><input id="bp-url" placeholder="https://sfl.gl/xxx atau https://linkvertise.com/xxx">';
wrap.classList.remove('hd');
}else{
var api = BYPASS_LIST.find(function(x){return x.id===v;});
if(!api) return;
wrap.innerHTML = api.params.map(function(p){
return '<label>'+p+'</label><input id="bp-'+p+'" placeholder="'+p+'">';
}).join('');
wrap.classList.remove('hd');
}
};

window.zyRunBypass = async function(){
var v = $id('bp-api').value;
var log = $id('bp-log');
var res = $id('bp-result');
log.innerHTML = ''; res.innerHTML = ''; res.classList.add('hd');
var list, params;

if(v === 'ALL'){
var url = $id('bp-url').value.trim();
if(!url){ alert('Masukkan URL'); return; }
params = { url: url };
list = BYPASS_LIST;
}else{
var api = BYPASS_LIST.find(function(x){return x.id===v;});
list = [api];
params = {};
api.params.forEach(function(p){
var el = $id('bp-'+p);
if(el) params[p] = el.value.trim();
});
}
if(!params.url && list.length > 1){ alert('URL kosong'); return; }

var out = await fetchWithFallback(list, params, log);
if(out){
renderResult(res, out.result, out.api.name);
}else{
res.innerHTML = '<div class="zy-head er">✗ SEMUA API GAGAL</div>';
res.classList.remove('hd');
}
};

window.zyRenderDlApis = function(){
var cat = $id('dl-cat').value;
var sel = $id('dl-api');
var list;
if(cat === 'ALL') list = DOWNLOADER_LIST;
else list = DOWNLOADER_LIST.filter(function(d){return d.cat === cat;});
sel.innerHTML = list.map(function(d){
return '<option value="'+d.id+'">'+esc(d.name)+'</option>';
}).join('');
sel.onchange = window.zyRenderDlParams;
window.zyRenderDlParams();
};

window.zyRenderDlParams = function(){
var id = $id('dl-api').value;
var api = DOWNLOADER_LIST.find(function(x){return x.id===id;});
var wrap = $id('dl-params');
if(!api){ wrap.innerHTML = ''; return; }
wrap.innerHTML = api.params.map(function(p){
var ph = p;
if(p==='url') ph = 'https://...';
if(p==='query') ph = 'kata kunci';
if(p==='track_id') ph = 'ID track (Spotify/deezer)';
if(p==='format') ph = 'mp3 / mp4 / 720 / 1080';
if(p==='quality') ph = '360 / 720 / 1080 / 2160';
if(p==='fileType') ph = 'mp3 / mp4';
if(p==='type') ph = 'video / audio';
if(p==='locale') ph = 'en / id';
if(p==='action') ph = 'home / search / detail';
if(p==='save_to_local') ph = 'true / false';
if(p==='json') ph = '1';
if(p==='mode') ph = 'home / search / post';
return '<label>'+p+'</label><input id="dl-'+p+'" placeholder="'+ph+'">';
}).join('');
};

window.zyRunDownloader = async function(){
var id = $id('dl-api').value;
var api = DOWNLOADER_LIST.find(function(x){return x.id===id;});
if(!api){ alert('Pilih API'); return; }
var log = $id('dl-log');
var res = $id('dl-result');
log.innerHTML = ''; res.innerHTML = ''; res.classList.add('hd');

var params = {};
api.params.forEach(function(p){
var el = $id('dl-'+p);
if(el && el.value.trim()) params[p] = el.value.trim();
});

// Filter: harus ada minimal satu param
if(Object.keys(params).length === 0){ alert('Isi minimal 1 parameter'); return; }

var out = await fetchWithFallback([api], params, log);
if(out){
renderResult(res, out.result, out.api.name);
}else{
res.innerHTML = '<div class="zy-head er">✗ API GAGAL</div>';
res.classList.remove('hd');
}
};

window.zyRunDownloaderAll = async function(){
var id = $id('dl-api').value;
var api = DOWNLOADER_LIST.find(function(x){return x.id===id;});
if(!api){ alert('Pilih API dulu'); return; }
// Ambil URL input
var urlEl = $id('dl-url') || $id('dl-query') || $id('dl-track_id');
if(!urlEl || !urlEl.value.trim()){ alert('Isi URL / query dulu'); return; }
var value = urlEl.value.trim();
var paramKey = urlEl.id.replace('dl-','');

// Ambil semua API di kategori yang sama, coba satu-satu
var sameCat = DOWNLOADER_LIST.filter(function(d){return d.cat === api.cat;});
var log = $id('dl-log');
var res = $id('dl-result');
log.innerHTML = ''; res.innerHTML = ''; res.classList.add('hd');

var out = await fetchWithFallback(sameCat, {[paramKey]: value}, log);
if(out){
renderResult(res, out.result, out.api.name);
}else{
res.innerHTML = '<div class="zy-head er">✗ SEMUA API DI KATEGORI '+esc(api.cat)+' GAGAL</div>';
res.classList.remove('hd');
}
};

})();

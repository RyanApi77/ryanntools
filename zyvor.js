// zyvor.js v5.3 — API HUB (Bypass + Downloader)
// Compatible dengan index.html v5.3
(function(){
'use strict';

var BASE = 'https://api.zyvor.my.id';
var TIKWM = 'https://tikwm.com/api/';

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
var r = await fetch(full, {method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body, signal: ctrl.signal});
clearTimeout(t);
if(r.ok) return { ok:true, text: await r.text() };
lastErr = new Error('HTTP '+r.status);
}catch(e){ lastErr = e; }
}
try{
var r2 = await fetch(url, {method:opts.method||'GET', headers:opts.headers||{}, body:opts.body});
if(r2.ok) return { ok:true, text: await r2.text() };
}catch(e){}
throw lastErr || new Error('All fetch failed');
}

async function callAPI(path, params, method){
method = method || 'GET';
var qs = '';
if(method === 'GET') qs = '?' + new URLSearchParams(params).toString();
var url = BASE + path + qs;
var opts = { method: method };
if(method === 'POST'){ opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(params); }
var res = await proxyFetch(url, opts);
var json;
try{ json = JSON.parse(res.text); }catch(e){ json = { raw: res.text }; }
return json;
}

// ============ BYPASS ============
var BYPASS_LIST = [
{ id:'bypasslink', name:'Bypass Link v1', path:'/api/bypass/bypasslink', method:'POST', params:['url','androidId'], desc:'sf.gl, sub2unlock, tinyurl, linkvertise' },
{ id:'bypasslinkv2', name:'Bypass Link v2', path:'/api/bypass/bypasslinkv2', method:'POST', params:['url'], desc:'40+ layanan shortlink' },
{ id:'bypasslinkv3', name:'Bypass Link v3', path:'/api/bypass/bypasslinkv3', method:'POST', params:['url'], desc:'Universal safelink' },
{ id:'modjall', name:'ModJall', path:'/api/bypass/modjall', method:'POST', params:['url'], desc:'ModJall / Khaddavi' },
{ id:'move2link', name:'Move2Link', path:'/api/bypass/move2link', method:'POST', params:['url'], desc:'move2link.com' },
{ id:'ouo-bypass', name:'Ouo Bypass', path:'/api/bypass/ouo-bypass', method:'POST', params:['url'], desc:'ouo.io / ouo.press' },
{ id:'safelink', name:'Safelink', path:'/api/bypass/safelink', method:'POST', params:['url'], desc:'sfl.gl / safelinku' },
{ id:'shrinkme', name:'ShrinkMe', path:'/api/bypass/shrinkme', method:'POST', params:['url'], desc:'shrinkme.click' },
{ id:'wellbypass', name:'Wellbypass', path:'/api/bypass/wellbypass', method:'POST', params:['url','turnstileToken'], desc:'Linkvertise, Lootlabs' }
];

// ============ DOWNLOADER ============
var DOWNLOADER_LIST = [
{ id:'tikwm', name:'TikWM (recommended)', path:'TIKWM', method:'GET', params:['url'], cat:'TikTok', desc:'tikwm.com · no watermark + music' },
{ id:'tiktokv2', name:'TikTok v2 (HD)', path:'/api/downloader/tiktokv2', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv3', name:'TikTok v3', path:'/api/downloader/tiktokv3', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv4', name:'TikTok v4', path:'/api/downloader/tiktokv4', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokv5', name:'TikTok v5 (slide)', path:'/api/downloader/tiktokv5', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktokio', name:'TikTok.io', path:'/api/downloader/tiktokio', method:'GET', params:['url'], cat:'TikTok' },
{ id:'tiktok', name:'TikTok v1', path:'/api/downloader/tiktok', method:'GET', params:['url'], cat:'TikTok' },
{ id:'youtubev1', name:'YouTube v1', path:'/api/downloader/youtubev1', method:'GET', params:['url','quality'], cat:'YouTube' },
{ id:'youtubev2', name:'YouTube v2', path:'/api/downloader/youtubev2', method:'GET', params:['url'], cat:'YouTube' },
{ id:'youtubev3', name:'YouTube v3 (merge)', path:'/api/downloader/youtubev3', method:'GET', params:['url','json'], cat:'YouTube' },
{ id:'youtubev4', name:'YouTube v4 (y2mate)', path:'/api/downloader/youtubev4', method:'GET', params:['url'], cat:'YouTube' },
{ id:'savetube', name:'SaveTube', path:'/api/downloader/savetube', method:'GET', params:['url','format'], cat:'YouTube' },
{ id:'insvid', name:'Insvid', path:'/api/downloader/insvid', method:'GET', params:['url','fileType'], cat:'YouTube' },
{ id:'ytplay', name:'YT Play (search)', path:'/api/downloader/ytplay', method:'GET', params:['query'], cat:'YouTube' },
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

// ============ TIKWM ============
async function fetchTikWM(url){
var apiURL = TIKWM + '?url=' + encodeURIComponent(url) + '&hd=1';
var res = await proxyFetch(apiURL);
var json = JSON.parse(res.text);
if(json.code !== 0) throw new Error(json.msg || 'tikwm error');
var d = json.data;
return {
status: true, title: d.title, author: d.author, cover: d.cover, duration: d.duration,
stats: { play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count },
video_nowm: d.play, video_wm: d.wmplay, video_hd: d.hdplay, music: d.music, raw: d
};
}

// ============ FETCH WITH FALLBACK ============
async function fetchWithFallback(list, params, logEl){
for(var i=0;i<list.length;i++){
var api = list[i];
var callParams = {};
api.params.forEach(function(p){ if(params[p] !== undefined && params[p] !== '') callParams[p] = params[p]; });
if(logEl){ var l1 = document.createElement('div'); l1.className = 'ok'; l1.textContent = '['+(i+1)+'/'+list.length+'] '+api.name; logEl.appendChild(l1); logEl.scrollTop = logEl.scrollHeight; }
try{
var res = api.path === 'TIKWM' ? await fetchTikWM(callParams.url) : await callAPI(api.path, callParams, api.method);
var success = res && ((res.status === true) || (res.status === 'success') || (res.success === true) || (res.result && !res.error) || (res.data) || (res.url) || (res.video) || (res.download_url) || (!res.error && !res.message));
if(success){
if(logEl){ var l2 = document.createElement('div'); l2.className = 'ok'; l2.textContent = '  ✓ '+api.name; logEl.appendChild(l2); logEl.scrollTop = logEl.scrollHeight; }
return { api: api, result: res };
}
if(logEl){ var l3 = document.createElement('div'); l3.className = 'er'; l3.textContent = '  ✗ '+(res.error || res.message || 'unknown'); logEl.appendChild(l3); logEl.scrollTop = logEl.scrollHeight; }
}catch(e){
if(logEl){ var l4 = document.createElement('div'); l4.className = 'er'; l4.textContent = '  ✗ '+e.message; logEl.appendChild(l4); logEl.scrollTop = logEl.scrollHeight; }
}
}
return null;
}

// ============ UTILITIES ============
function $id(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function classify(url){
var u = url.toLowerCase();
if(/\.(mp4|mov|webm|mkv)(\?|$)/.test(u)) return 'video';
if(/\.(mp3|m4a|flac|wav|aac|opus)(\?|$)/.test(u)) return 'audio';
if(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/.test(u)) return 'image';
return 'other';
}
function collectMedia(obj, out, baseKey){
out = out || [];
if(!obj) return out;
if(typeof obj === 'string'){
if(/^https?:\/\/.+/.test(obj)) out.push({ url: obj, key: baseKey || '' });
return out;
}
if(Array.isArray(obj)){ obj.forEach(function(v, i){ collectMedia(v, out, (baseKey||'')+'['+i+']'); }); return out; }
if(typeof obj === 'object'){
Object.keys(obj).forEach(function(k){
var v = obj[k];
if(typeof v === 'string' && /^https?:\/\//.test(v)){
if(/url|link|download|video|audio|music|hd|sd|wm|play|src|cover|thumb|image|photo/i.test(k)){
out.push({ url: v, key: k });
}
}
collectMedia(v, out, (baseKey||'')+'.'+k);
});
}
return out;
}
function renderMediaPreview(urls){
var seen = {}, unique = [];
urls.forEach(function(item){ if(!seen[item.url]){ seen[item.url]=1; unique.push(item); } });
if(!unique.length) return '';
var videos = unique.filter(function(x){ return classify(x.url)==='video'; });
var audios = unique.filter(function(x){ return classify(x.url)==='audio'; });
var images = unique.filter(function(x){ return classify(x.url)==='image'; });
var others = unique.filter(function(x){ var c=classify(x.url); return c==='other'; });
var html = '';
videos.forEach(function(item, i){
html += '<div class="zy-media-item"><div class="zy-media-h">🎬 Video '+(i+1)+' <span class="zy-cat">'+esc(item.key)+'</span></div>';
html += '<video controls preload="metadata" class="zy-video" src="'+esc(item.url)+'"></video>';
html += '<div class="zy-media-actions"><a href="'+esc(item.url)+'" download class="zy-dl-btn">⬇ DOWNLOAD</a>';
html += '<button class="zy-cp-btn" onclick="navigator.clipboard.writeText(\''+esc(item.url).replace(/'/g,"\\'")+'\').then(function(){alert(\'URL tersalin\')})">📋 COPY URL</button></div></div>';
});
audios.forEach(function(item, i){
html += '<div class="zy-media-item"><div class="zy-media-h">🎵 Audio '+(i+1)+' <span class="zy-cat">'+esc(item.key)+'</span></div>';
html += '<audio controls preload="metadata" class="zy-audio" src="'+esc(item.url)+'"></audio>';
html += '<div class="zy-media-actions"><a href="'+esc(item.url)+'" download class="zy-dl-btn">⬇ DOWNLOAD</a>';
html += '<button class="zy-cp-btn" onclick="navigator.clipboard.writeText(\''+esc(item.url).replace(/'/g,"\\'")+'\').then(function(){alert(\'URL tersalin\')})">📋 COPY URL</button></div></div>';
});
if(images.length === 1){
var img = images[0];
html += '<div class="zy-media-item"><div class="zy-media-h">🖼 Gambar <span class="zy-cat">'+esc(img.key)+'</span></div>';
html += '<img src="'+esc(img.url)+'" class="zy-image" loading="lazy">';
html += '<div class="zy-media-actions"><a href="'+esc(img.url)+'" download class="zy-dl-btn">⬇ DOWNLOAD</a>';
html += '<button class="zy-cp-btn" onclick="navigator.clipboard.writeText(\''+esc(img.url).replace(/'/g,"\\'")+'\').then(function(){alert(\'URL tersalin\')})">📋 COPY URL</button></div></div>';
} else if(images.length > 1){
html += '<div class="zy-slideshow"><div class="zy-media-h">🖼 Slide Show ('+images.length+' foto)</div>';
html += '<div class="zy-slide-view"><button class="zy-slide-nav" onclick="zySlidePrev(this)">‹</button>';
html += '<div class="zy-slide-track">';
images.forEach(function(item, i){
html += '<div class="zy-slide-item'+(i===0?' active':'')+'"><img src="'+esc(item.url)+'" loading="lazy" onclick="window.open(\''+esc(item.url)+'\',\'_blank\')"></div>';
});
html += '</div><button class="zy-slide-nav" onclick="zySlideNext(this)">›</button></div>';
html += '<div class="zy-slide-dots">';
images.forEach(function(item, i){ html += '<span class="zy-dot'+(i===0?' active':'')+'" onclick="zySlideGo(this,'+i+')"></span>'; });
html += '</div><div class="zy-slide-tools">';
html += '<button class="zy-cp-btn" onclick="zySlideCopyCurrent(this)">📋 COPY AKTIF</button>';
html += '<button class="zy-cp-btn" onclick="zySlideDownloadCurrent(this)">⬇ FOTO AKTIF</button>';
html += '<button class="zy-cp-btn" onclick="zySlideDownloadAll(this)">📦 SEMUA</button>';
html += '</div></div>';
}
others.forEach(function(item, i){
html += '<div class="zy-media-item"><div class="zy-media-h">🔗 File '+(i+1)+' <span class="zy-cat">'+esc(item.key)+'</span></div>';
html += '<div class="zy-url-preview">'+esc(item.url)+'</div>';
html += '<div class="zy-media-actions"><a href="'+esc(item.url)+'" download class="zy-dl-btn">⬇ DOWNLOAD</a>';
html += '<button class="zy-cp-btn" onclick="navigator.clipboard.writeText(\''+esc(item.url).replace(/'/g,"\\'")+'\').then(function(){alert(\'URL tersalin\')})">📋 COPY</button></div></div>';
});
return html;
}
window.zySlidePrev = function(btn){
var show = btn.closest('.zy-slideshow');
var items = show.querySelectorAll('.zy-slide-item');
var curr = Array.from(items).findIndex(function(x){ return x.classList.contains('active'); });
var next = (curr - 1 + items.length) % items.length;
items.forEach(function(x,i){ x.classList.toggle('active', i===next); });
var dots = show.querySelectorAll('.zy-dot');
dots.forEach(function(d,i){ d.classList.toggle('active', i===next); });
};
window.zySlideNext = function(btn){
var show = btn.closest('.zy-slideshow');
var items = show.querySelectorAll('.zy-slide-item');
var curr = Array.from(items).findIndex(function(x){ return x.classList.contains('active'); });
var next = (curr + 1) % items.length;
items.forEach(function(x,i){ x.classList.toggle('active', i===next); });
var dots = show.querySelectorAll('.zy-dot');
dots.forEach(function(d,i){ d.classList.toggle('active', i===next); });
};
window.zySlideGo = function(dot, idx){
var show = dot.closest('.zy-slideshow');
var items = show.querySelectorAll('.zy-slide-item');
items.forEach(function(x,i){ x.classList.toggle('active', i===idx); });
var dots = show.querySelectorAll('.zy-dot');
dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
};
window.zySlideCopyCurrent = function(btn){
var show = btn.closest('.zy-slideshow');
var curr = show.querySelector('.zy-slide-item.active img');
if(curr) navigator.clipboard.writeText(curr.src).then(function(){ alert('URL tersalin'); });
};
window.zySlideDownloadCurrent = function(btn){
var show = btn.closest('.zy-slideshow');
var curr = show.querySelector('.zy-slide-item.active img');
if(curr){
var a = document.createElement('a'); a.href = curr.src; a.download = 'slide.jpg'; a.target='_blank';
document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
};
window.zySlideDownloadAll = function(btn){
var show = btn.closest('.zy-slideshow');
var imgs = show.querySelectorAll('.zy-slide-item img');
imgs.forEach(function(img, i){
setTimeout(function(){
var a = document.createElement('a'); a.href = img.src; a.download = 'slide_'+String(i+1).padStart(2,'0')+'.jpg'; a.target='_blank';
document.body.appendChild(a); a.click(); document.body.removeChild(a);
}, i*500);
});
};

function renderResult(container, data, apiName){
var mediaItems = collectMedia(data, []);
var previewHTML = renderMediaPreview(mediaItems);
var html = '<div class="zy-head">✓ SUKSES via <b>'+esc(apiName)+'</b></div>';
if(data.title || data.author){
html += '<div class="zy-meta">';
if(data.title) html += '<div class="zy-meta-t">'+esc(data.title)+'</div>';
if(data.author){
var au = data.author.unique_id ? '@'+data.author.unique_id+' · '+data.author.nickname : (data.author.nickname || data.author);
html += '<div class="zy-meta-a">'+esc(au)+'</div>';
}
if(data.stats){
var st = [];
if(data.stats.play) st.push('▶ '+data.stats.play);
if(data.stats.like) st.push('❤ '+data.stats.like);
if(data.stats.comment) st.push('💬 '+data.stats.comment);
if(data.stats.share) st.push('↗ '+data.stats.share);
if(st.length) html += '<div class="zy-meta-s">'+st.join(' · ')+'</div>';
}
html += '</div>';
}
if(previewHTML) html += '<div class="zy-media-wrap"><div class="zy-media-title">📥 MEDIA PREVIEW</div>'+previewHTML+'</div>';
html += '<details class="zy-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(data,null,2))+'</pre></details>';
html += '<button class="zy-copy" onclick="zyCopyJSON(this)">📋 COPY JSON</button>';
html += '<button class="zy-copy" onclick="zyDownloadJSON(this)">⬇ DOWNLOAD JSON</button>';
container.innerHTML = html;
container.classList.remove('hd');
}
window.zyCopyJSON = function(btn){
var pre = btn.parentElement.querySelector('.zy-raw pre');
if(pre) navigator.clipboard.writeText(pre.textContent).then(function(){ alert('JSON tersalin'); });
};
window.zyDownloadJSON = function(btn){
var pre = btn.parentElement.querySelector('.zy-raw pre');
if(!pre) return;
var b = new Blob([pre.textContent], {type:'application/json'});
var u = URL.createObjectURL(b);
var a = document.createElement('a'); a.href = u; a.download = 'result.json';
document.body.appendChild(a); a.click(); document.body.removeChild(a);
setTimeout(function(){ URL.revokeObjectURL(u); }, 1000);
};

// ============ CUSTOM SELECT ============
function buildCustomSelect(container, items, selectedId, onSelect){
if(!container) return;
container.innerHTML = '';
var btn = document.createElement('button');
btn.type = 'button';
btn.className = 'zy-select-btn';
var current = items.find(function(x){ return x.id===selectedId; });
btn.innerHTML = '<span>'+(current?current.name:'— Pilih —')+'</span><span class="zy-select-arrow">▾</span>';
btn.onclick = function(e){
e.stopPropagation();
var open = container.querySelector('.zy-select-panel');
if(open){ open.remove(); container.classList.remove('open'); return; }
container.classList.add('open');
var panel = document.createElement('div');
panel.className = 'zy-select-panel';
items.forEach(function(it){
var opt = document.createElement('div');
opt.className = 'zy-select-opt' + (it.id===selectedId?' active':'');
opt.innerHTML = '<span>'+it.name+'</span>' + (it.desc ? '<small>'+it.desc+'</small>' : '');
opt.onclick = function(e2){
e2.stopPropagation();
onSelect(it.id);
btn.querySelector('span').textContent = it.name;
var old = container.querySelector('.zy-select-panel');
if(old) old.remove();
container.classList.remove('open');
};
panel.appendChild(opt);
});
container.appendChild(panel);
};
container.appendChild(btn);
}
document.addEventListener('click', function(){
document.querySelectorAll('.zy-select-panel').forEach(function(p){ p.remove(); });
document.querySelectorAll('.zy-select-wrap').forEach(function(w){ w.classList.remove('open'); });
});

// ============ INIT BYPASS ============
var bypassSelected = 'ALL';
window.zyInitBypass = function(){
var sel = $id('bp-api-custom');
if(!sel) return;
var items = [{ id:'ALL', name:'🔄 ALL (auto-fallback 9 API)', desc:'Coba semua sampai sukses' }].concat(BYPASS_LIST);
buildCustomSelect(sel, items, bypassSelected, function(id){
bypassSelected = id;
window.zyRenderBypassParams();
});
window.zyRenderBypassParams();
};
window.zyRenderBypassParams = function(){
var wrap = $id('bp-params');
if(!wrap) return;
if(bypassSelected === 'ALL'){
wrap.innerHTML = '<label>URL Target</label><input id="bp-url" placeholder="https://sfl.gl/xxx">';
} else {
var api = BYPASS_LIST.find(function(x){ return x.id===bypassSelected; });
if(!api) return;
wrap.innerHTML = api.params.map(function(p){
var ph = p === 'url' ? 'https://...' : '(opsional)';
return '<label>'+p+'</label><input id="bp-'+p+'" placeholder="'+ph+'">';
}).join('');
}
};
window.zyRunBypass = async function(){
var log = $id('bp-log'), res = $id('bp-result');
log.innerHTML = ''; log.classList.remove('hd');
res.innerHTML = ''; res.classList.add('hd');
var list, params;
if(bypassSelected === 'ALL'){
var url = ($id('bp-url')||{}).value;
if(!url){ alert('Masukkan URL'); return; }
params = { url: url.trim() };
list = BYPASS_LIST;
} else {
var api = BYPASS_LIST.find(function(x){ return x.id===bypassSelected; });
list = [api];
params = {};
api.params.forEach(function(p){ var el = $id('bp-'+p); if(el) params[p] = el.value.trim(); });
if(!params.url){ alert('URL kosong'); return; }
}
var out = await fetchWithFallback(list, params, log);
if(out) renderResult(res, out.result, out.api.name);
else { res.innerHTML = '<div class="zy-head er">✗ SEMUA API GAGAL</div>'; res.classList.remove('hd'); }
};

// ============ INIT DOWNLOADER ============
var dlCat = 'ALL';
var dlApi = DOWNLOADER_LIST[0].id;
window.zyInitDownloader = function(){
var catSel = $id('dl-cat-custom');
var apiSel = $id('dl-api-custom');
if(!catSel || !apiSel) return;
var cats = Array.from(new Set(DOWNLOADER_LIST.map(function(d){ return d.cat; })));
var catItems = [{ id:'ALL', name:'🔄 Semua Kategori' }].concat(cats.map(function(c){ return { id:c, name:c }; }));
buildCustomSelect(catSel, catItems, dlCat, function(id){
dlCat = id;
window.zyRenderDlApis();
});
window.zyRenderDlApis();
};
window.zyRenderDlApis = function(){
var apiSel = $id('dl-api-custom');
if(!apiSel) return;
var list = dlCat==='ALL' ? DOWNLOADER_LIST : DOWNLOADER_LIST.filter(function(d){ return d.cat===dlCat; });
var items = list.map(function(d){ return { id:d.id, name:d.name, desc:d.cat }; });
if(!items.find(function(x){ return x.id===dlApi; })) dlApi = items[0].id;
buildCustomSelect(apiSel, items, dlApi, function(id){
dlApi = id;
window.zyRenderDlParams();
});
window.zyRenderDlParams();
};
window.zyRenderDlParams = function(){
var wrap = $id('dl-params');
if(!wrap) return;
var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
if(!api){ wrap.innerHTML = ''; return; }
wrap.innerHTML = api.params.map(function(p){
var ph = p;
if(p==='url') ph = 'https://...';
if(p==='query') ph = 'kata kunci';
if(p==='track_id') ph = 'ID track';
if(p==='format') ph = 'mp3 / mp4';
if(p==='quality') ph = '360 / 720 / 1080';
if(p==='fileType') ph = 'mp3 / mp4';
if(p==='type') ph = 'video / audio';
if(p==='action') ph = 'home / search';
if(p==='json') ph = '1';
if(p==='mode') ph = 'home / search';
return '<label>'+p+'</label><input id="dl-'+p+'" placeholder="'+ph+'">';
}).join('');
};
window.zyRunDownloader = async function(){
var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
if(!api){ alert('Pilih API'); return; }
var log = $id('dl-log'), res = $id('dl-result');
log.innerHTML = ''; log.classList.remove('hd');
res.innerHTML = ''; res.classList.add('hd');
var params = {};
api.params.forEach(function(p){ var el = $id('dl-'+p); if(el && el.value.trim()) params[p] = el.value.trim(); });
if(!Object.keys(params).length){ alert('Isi minimal 1 parameter'); return; }
var out = await fetchWithFallback([api], params, log);
if(out) renderResult(res, out.result, out.api.name);
else { res.innerHTML = '<div class="zy-head er">✗ API GAGAL</div>'; res.classList.remove('hd'); }
};
window.zyRunDownloaderAll = async function(){
var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
if(!api){ alert('Pilih API dulu'); return; }
var urlEl = $id('dl-url') || $id('dl-query') || $id('dl-track_id');
if(!urlEl || !urlEl.value.trim()){ alert('Isi URL / query dulu'); return; }
var value = urlEl.value.trim();
var paramKey = urlEl.id.replace('dl-','');
var sameCat = DOWNLOADER_LIST.filter(function(d){ return d.cat===api.cat; });
var log = $id('dl-log'), res = $id('dl-result');
log.innerHTML = ''; log.classList.remove('hd');
res.innerHTML = ''; res.classList.add('hd');
var out = await fetchWithFallback(sameCat, {[paramKey]: value}, log);
if(out) renderResult(res, out.result, out.api.name);
else { res.innerHTML = '<div class="zy-head er">✗ SEMUA API KATEGORI '+esc(api.cat)+' GAGAL</div>'; res.classList.remove('hd'); }
};

// Auto-init kalau elemen udah ada di DOM
if(document.readyState === 'loading'){
document.addEventListener('DOMContentLoaded', function(){
  if($id('bp-api-custom')) window.zyInitBypass();
  if($id('dl-cat-custom')) window.zyInitDownloader();
});
} else {
if($id('bp-api-custom')) window.zyInitBypass();
if($id('dl-cat-custom')) window.zyInitDownloader();
}

})();

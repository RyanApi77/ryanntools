// zyvor.js v6.2 — API HUB (Bypass + Downloader) + Smart TikTok Detector
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

var DOWNLOADER_LIST = [
  { id:'tikwm', name:'TikWM (recommended)', path:'TIKWM', method:'GET', params:['url'], cat:'TikTok', desc:'auto WM/NoWM/HD' },
  { id:'tiktokv2', name:'TikTok v2 (HD)', path:'/api/downloader/tiktokv2', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv3', name:'TikTok v3', path:'/api/downloader/tiktokv3', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv4', name:'TikTok v4', path:'/api/downloader/tiktokv4', method:'GET', params:['url'], cat:'TikTok' },
  { id:'tiktokv5', name:'TikTok v5 (slide)', path:'/api/downloader/tiktokv5', method:'GET', params:['url'], cat:'TikTok', desc:'khusus slideshow' },
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

// ===== SMART TIKTOK DETECTOR =====
// Cek response object apakah slideshow atau video
function detectTikTokType(data){
  if(!data || typeof data !== 'object') return 'unknown';
  // slide indicators
  if(data.images && Array.isArray(data.images) && data.images.length > 0) return 'slideshow';
  if(data.image_post_info && data.image_post_info.images) return 'slideshow';
  if(data.slideshow && Array.isArray(data.slideshow)) return 'slideshow';
  if(data.image_data && data.image_data.images) return 'slideshow';
  // video indicators
  if(data.play || data.hdplay || data.wmplay || data.video || data.video_hd || data.video_wm) return 'video';
  // nested (raw tiktok)
  if(data.data){
    return detectTikTokType(data.data);
  }
  if(data.raw) return detectTikTokType(data.raw);
  return 'unknown';
}

// Cek URL TikTok — heuristic (photo/ slideshow)
function urlLooksLikeSlideshow(url){
  if(!url) return false;
  var u = url.toLowerCase();
  if(/\/photo\//.test(u)) return true;
  if(/slideshow/.test(u)) return true;
  return false;
}

// Extract variants dari response TikTok (support berbagai format)
function extractTikTokVariants(data){
  var out = { noWM:null, noWMHD:null, wm:null, music:null, title:null, author:null, cover:null, stats:null, images:null };
  if(!data) return out;
  var d = data.data || data.raw || data;

  out.title = d.title || data.title || null;
  out.author = d.author || data.author || null;
  out.cover = d.cover || d.origin_cover || data.cover || null;
  out.stats = data.stats || (d.play_count !== undefined ? { play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count } : null);

  // slideshow
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

  // video variants
  out.noWM = d.play || d.video || d.video_sd || d.play_addr || null;
  out.noWMHD = d.hdplay || d.video_hd || d.hd || d.play_addr_hd || null;
  out.wm = d.wmplay || d.video_wm || d.wm || null;
  out.music = d.music || d.music_info && d.music_info.play || d.music_url || null;

  // coba kalau nested
  if(!out.noWM && d.video_data){
    out.noWM = d.video_data.play_addr && d.video_data.play_addr.url_list && d.video_data.play_addr.url_list[0] || null;
    out.noWMHD = d.video_data.hd && d.video_data.hd.url_list && d.video_data.hd.url_list[0] || null;
    out.wm = d.video_data.wm && d.video_data.wm.url_list && d.video_data.wm.url_list[0] || null;
  }

  return out;
}

async function fetchTikWM(url){
  var apiURL = TIKWM + '?url=' + encodeURIComponent(url) + '&hd=1';
  var res = await proxyFetch(apiURL);
  var json = JSON.parse(res.text);
  if(json.code !== 0) throw new Error(json.msg || 'tikwm error');
  var d = json.data;
  return {
    status: true,
    __type: detectTikTokType(d),
    title: d.title, author: d.author, cover: d.cover, duration: d.duration,
    stats: { play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count },
    video_nowm: d.play, video_nowm_hd: d.hdplay, video_wm: d.wmplay, music: d.music, raw: d
  };
}

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

// TikTok-specific fallback: coba semua API TikTok sampai ketemu
async function fetchTikTokSmart(url, logEl){
  // 1. Deteksi dari URL dulu
  var isSlideUrl = urlLooksLikeSlideshow(url);
  if(logEl){ var l = document.createElement('div'); l.className = 'in'; l.textContent = '🔍 URL heuristic: '+(isSlideUrl?'SLIDESHOW':'VIDEO'); logEl.appendChild(l); logEl.scrollTop = logEl.scrollHeight; }

  // 2. Urutan API: kalau URL slideshow, coba tiktokv5 dulu; kalau video, tikwm dulu
  var order = isSlideUrl
    ? ['tiktokv5','tiktokv4','tiktokv3','tikwm','tiktokv2','tiktokio','tiktok']
    : ['tikwm','tiktokv2','tiktokv4','tiktokv3','tiktokv5','tiktokio','tiktok'];

  var results = []; // semua hasil sukses
  for(var i=0;i<order.length;i++){
    var apiId = order[i];
    var api = DOWNLOADER_LIST.find(function(x){ return x.id===apiId; });
    if(!api) continue;
    if(logEl){ var l2 = document.createElement('div'); l2.className = 'ok'; l2.textContent = '['+(i+1)+'/'+order.length+'] '+api.name; logEl.appendChild(l2); logEl.scrollTop = logEl.scrollHeight; }
    try{
      var res = api.path === 'TIKWM' ? await fetchTikWM(url) : await callAPI(api.path, {url:url}, api.method);
      var success = res && ((res.status === true) || (res.status === 'success') || (res.success === true) || (res.result && !res.error) || (res.data) || (res.url) || (res.video) || (res.download_url));
      if(success){
        var type = detectTikTokType(res);
        if(logEl){ var l3 = document.createElement('div'); l3.className = 'ok'; l3.textContent = '  ✓ deteksi: '+type.toUpperCase(); logEl.appendChild(l3); logEl.scrollTop = logEl.scrollHeight; }
        results.push({ api:api, result:res, type:type });
        // kalau dapet slide, langsung stop
        if(type === 'slideshow') break;
        // kalau video dan dapet variants, stop
        if(type === 'video') break;
      } else {
        if(logEl){ var l4 = document.createElement('div'); l4.className = 'er'; l4.textContent = '  ✗ '+(res.error || res.message || 'unknown'); logEl.appendChild(l4); logEl.scrollTop = logEl.scrollHeight; }
      }
    }catch(e){
      if(logEl){ var l5 = document.createElement('div'); l5.className = 'er'; l5.textContent = '  ✗ '+e.message; logEl.appendChild(l5); logEl.scrollTop = logEl.scrollHeight; }
    }
  }
  if(results.length === 0) return null;

  // 3. Gabungin hasil dari API terbaik
  var primary = results[0];
  var combined = { api: primary.api, result: primary.result, type: primary.type, allVariants: {} };

  // merge variants dari semua hasil
  results.forEach(function(r){
    var v = extractTikTokVariants(r.result);
    if(v.noWM && !combined.allVariants.noWM) combined.allVariants.noWM = v.noWM;
    if(v.noWMHD && !combined.allVariants.noWMHD) combined.allVariants.noWMHD = v.noWMHD;
    if(v.wm && !combined.allVariants.wm) combined.allVariants.wm = v.wm;
    if(v.music && !combined.allVariants.music) combined.allVariants.music = v.music;
    if(v.images && !combined.allVariants.images) combined.allVariants.images = v.images;
    if(v.title && !combined.allVariants.title) combined.allVariants.title = v.title;
    if(v.author && !combined.allVariants.author) combined.allVariants.author = v.author;
    if(v.cover && !combined.allVariants.cover) combined.allVariants.cover = v.cover;
    if(v.stats && !combined.allVariants.stats) combined.allVariants.stats = v.stats;
  });

  return combined;
}

function $id(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

// ===== BYPASS =====
var bypassSelected = 'ALL';
window.zyInitBypass = function(){
  var sel = $id('bp-api-custom');
  if(!sel) return;
  if(typeof window.initCustomSelect !== 'function') return;
  var items = [{ id:'ALL', name:'ALL — auto-fallback 9 API', desc:'Coba semua sampai sukses' }].concat(BYPASS_LIST.map(function(b){
    return { id:b.id, name:b.name, desc:b.desc || '' };
  }));
  window.__bpSel = window.initCustomSelect('bp-api-custom', items, bypassSelected,
    function(id){ bypassSelected = id; window.zyRenderBypassParams(); }
  );
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
    wrap.innerHTML = api.params.map(function(p){ var ph = p === 'url' ? 'https://...' : '(opsional)'; return '<label>'+p+'</label><input id="bp-'+p+'" placeholder="'+ph+'">'; }).join('');
  }
};
window.zyRunBypass = async function(){
  var log = $id('bp-log'), res = $id('bp-result');
  if(log){ log.innerHTML = ''; log.classList.remove('hd'); }
  if(res){ res.innerHTML = ''; res.classList.add('hd'); }
  var list, params;
  if(bypassSelected === 'ALL'){
    var url = ($id('bp-url')||{}).value;
    if(!url){ alert('Masukkan URL'); return; }
    params = { url: url.trim() };
    list = BYPASS_LIST;
  } else {
    var api = BYPASS_LIST.find(function(x){ return x.id===bypassSelected; });
    list = [api]; params = {};
    api.params.forEach(function(p){ var el = $id('bp-'+p); if(el) params[p] = el.value.trim(); });
    if(!params.url){ alert('URL kosong'); return; }
  }
  var out = await fetchWithFallback(list, params, log);
  if(out) window.zyRenderBypassResult(res, out.result, out.api.name);
  else if(res){ res.innerHTML = '<div class="zy-head er">✗ SEMUA API GAGAL</div>'; res.classList.remove('hd'); }
};

window.zyRenderBypassResult = function(container, data, apiName){
  var html = '<div class="zy-head">✓ SUKSES via <b>'+esc(apiName)+'</b></div>';
  html += '<details class="zy-raw" open><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(data,null,2))+'</pre></details>';
  html += '<button class="zy-copy" onclick="zyCopyJson(this)">📋 COPY JSON</button>';
  container.innerHTML = html;
  container.classList.remove('hd');
};
window.zyCopyJson = function(btn){ var pre = btn.parentElement.querySelector('.zy-raw pre'); if(pre) navigator.clipboard.writeText(pre.textContent).then(function(){ alert('JSON tersalin'); }); };

// ===== DOWNLOADER v6.2 =====
var dlCat = 'ALL';
var dlApi = 'tikwm';

window.zyInitDownloader = function(){
  var catSel = $id('dl-cat-custom');
  var apiSel = $id('dl-api-custom');
  if(!catSel || !apiSel) return;
  if(typeof window.initCustomSelect !== 'function') return;

  var cats = Array.from(new Set(DOWNLOADER_LIST.map(function(d){ return d.cat; })));
  var catItems = [{ id:'ALL', name:'ALL — semua kategori' }].concat(cats.map(function(c){ return { id:c, name:c }; }));

  window.__dlCatSel = window.initCustomSelect('dl-cat-custom', catItems, dlCat,
    function(id){
      dlCat = id;
      var list = dlCat==='ALL' ? DOWNLOADER_LIST : DOWNLOADER_LIST.filter(function(d){ return d.cat===dlCat; });
      if(list.length) dlApi = list[0].id;
      window.zyRenderDlApis();
    }
  );
  window.zyRenderDlApis();
};

window.zyRenderDlApis = function(){
  var apiSel = $id('dl-api-custom');
  if(!apiSel) return;
  var list = dlCat==='ALL' ? DOWNLOADER_LIST : DOWNLOADER_LIST.filter(function(d){ return d.cat===dlCat; });
  if(!list.length) return;
  if(!list.find(function(x){ return x.id===dlApi; })) dlApi = list[0].id;
  var items = list.map(function(d){ return { id:d.id, name:d.name, desc:d.cat + (d.desc?' · '+d.desc:'') }; });
  window.__dlApiSel = window.initCustomSelect('dl-api-custom', items, dlApi,
    function(id){ dlApi = id; window.zyRenderDlParams(); }
  );
  window.zyRenderDlParams();
};

window.zyRenderDlParams = function(){
  var wrap = $id('dl-params');
  if(!wrap) return;
  var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
  if(!api){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = api.params.map(function(p){
    var ph=p;
    if(p==='url')ph='https://...';
    if(p==='query')ph='kata kunci';
    if(p==='track_id')ph='ID track';
    if(p==='format')ph='mp3 / mp4';
    if(p==='quality')ph='360 / 720 / 1080';
    if(p==='fileType')ph='mp3 / mp4';
    if(p==='type')ph='video / audio';
    if(p==='action')ph='home / search';
    if(p==='json')ph='1';
    if(p==='mode')ph='home / search';
    return '<label>'+p+'</label><input id="dl-'+p+'" placeholder="'+ph+'">';
  }).join('');
};

// Deteksi kategori TikTok dari URL
function isTikTokUrl(url){
  if(!url) return false;
  return /tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/.test(url.toLowerCase());
}

window.zyRunDownloader = async function(){
  var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
  if(!api){ alert('Pilih API'); return; }
  var log = $id('dl-log'), res = $id('dl-result');
  if(log){ log.innerHTML=''; log.classList.remove('hd'); }
  if(res){ res.innerHTML=''; res.classList.add('hd'); }

  // URL-nya
  var urlEl = $id('dl-url');
  var url = urlEl ? urlEl.value.trim() : '';

  // SMART TIKTOK: kalau URL tiktok → pakai smart flow
  if(isTikTokUrl(url)){
    if(log){ var li = document.createElement('div'); li.className = 'in'; li.textContent = '🧠 Smart TikTok mode aktif'; log.appendChild(li); log.scrollTop = log.scrollHeight; }
    var smart = await fetchTikTokSmart(url, log);
    if(smart){
      window.zyRenderDlResult(res, smart, url);
    } else {
      res.innerHTML = '<div class="zy-head er">✗ Semua API TikTok gagal</div>';
      res.classList.remove('hd');
    }
    return;
  }

  // Non-TikTok: single API call
  var params = {};
  api.params.forEach(function(p){ var el = $id('dl-'+p); if(el && el.value.trim()) params[p] = el.value.trim(); });
  if(!Object.keys(params).length){ alert('Isi minimal 1 parameter'); return; }
  var out = await fetchWithFallback([api], params, log);
  if(out){
    window.zyRenderDlResult(res, { api:out.api, result:out.result, type:'generic', allVariants:null }, url);
  } else {
    res.innerHTML = '<div class="zy-head er">✗ API GAGAL</div>';
    res.classList.remove('hd');
  }
};

window.zyRunDownloaderAll = async function(){
  var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
  if(!api){ alert('Pilih API dulu'); return; }
  var log = $id('dl-log'), res = $id('dl-result');
  if(log){ log.innerHTML=''; log.classList.remove('hd'); }
  if(res){ res.innerHTML=''; res.classList.add('hd'); }

  var urlEl = $id('dl-url');
  var url = urlEl ? urlEl.value.trim() : '';
  if(isTikTokUrl(url)){
    var smart = await fetchTikTokSmart(url, log);
    if(smart) window.zyRenderDlResult(res, smart, url);
    else { res.innerHTML = '<div class="zy-head er">✗ Semua API TikTok gagal</div>'; res.classList.remove('hd'); }
    return;
  }

  var urlElAll = $id('dl-url') || $id('dl-query') || $id('dl-track_id');
  if(!urlElAll || !urlElAll.value.trim()){ alert('Isi URL / query dulu'); return; }
  var value = urlElAll.value.trim();
  var paramKey = urlElAll.id.replace('dl-','');
  var sameCat = DOWNLOADER_LIST.filter(function(d){ return d.cat===api.cat; });
  var out = await fetchWithFallback(sameCat, {[paramKey]: value}, log);
  if(out) window.zyRenderDlResult(res, { api:out.api, result:out.result, type:'generic' }, value);
  else { res.innerHTML='<div class="zy-head er">✗ SEMUA API GAGAL</div>'; res.classList.remove('hd'); }
};

// ===== RENDER DOWNLOADER RESULT v6.2 =====
window.zyRenderDlResult = function(container, smart, sourceUrl){
  var type = smart.type;
  var variants = smart.allVariants || extractTikTokVariants(smart.result);

  // Kalau slideshow
  if(type === 'slideshow' && variants.images && variants.images.length){
    var slideHtml = '<div class="zy-head">🖼 SLIDESHOW — '+variants.images.length+' foto</div>';
    if(variants.title) slideHtml += '<div class="zy-meta"><div class="zy-meta-t">'+esc(variants.title)+'</div>'+(variants.author?'<div class="zy-meta-a">@'+esc(variants.author)+'</div>':'')+'</div>';
    slideHtml += '<div class="zy-slide-grid">';
    variants.images.forEach(function(img, i){
      slideHtml += '<div class="zy-slide-item-card">'+
        '<img src="'+esc(img)+'" loading="lazy" alt="slide '+(i+1)+'">'+
        '<div class="zy-slide-item-num">'+(i+1)+'</div>'+
        '<a href="'+esc(img)+'" download="slide_'+(i+1)+'.jpg" class="zy-dl-btn zy-dl-full">⬇ DOWNLOAD FOTO '+(i+1)+'</a>'+
        '</div>';
    });
    slideHtml += '</div>';
    slideHtml += '<details class="zy-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(smart.result,null,2))+'</pre></details>';
    container.innerHTML = slideHtml;
    container.classList.remove('hd');
    return;
  }

  // Kalau video / generic
  var videoHtml = '<div class="zy-head">✓ '+(type==='video'?'VIDEO':'SUKSES')+' via <b>'+esc(smart.api.name)+'</b></div>';

  if(variants.title || variants.author){
    videoHtml += '<div class="zy-meta">';
    if(variants.title) videoHtml += '<div class="zy-meta-t">'+esc(variants.title)+'</div>';
    if(variants.author) videoHtml += '<div class="zy-meta-a">'+esc(variants.author)+'</div>';
    if(variants.stats){ var st=[]; if(variants.stats.play) st.push('▶ '+variants.stats.play); if(variants.stats.like) st.push('❤ '+variants.stats.like); if(variants.stats.comment) st.push('💬 '+variants.stats.comment); if(variants.stats.share) st.push('↗ '+variants.stats.share); if(st.length) videoHtml += '<div class="zy-meta-s">'+st.join(' · ')+'</div>'; }
    videoHtml += '</div>';
  }

  // Variant buttons
  videoHtml += '<div class="zy-variant-wrap">';
  if(variants.noWM) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.noWM)+'"></video><a href="'+esc(variants.noWM)+'" download="tiktok_nowm.mp4" class="zy-dl-btn zy-dl-full">⬇ NO WM</a></div>';
  if(variants.noWMHD) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.noWMHD)+'"></video><a href="'+esc(variants.noWMHD)+'" download="tiktok_nowm_hd.mp4" class="zy-dl-btn zy-dl-full">⬇ NO WM HD</a></div>';
  if(variants.wm) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.wm)+'"></video><a href="'+esc(variants.wm)+'" download="tiktok_wm.mp4" class="zy-dl-btn zy-dl-full">⬇ WM</a></div>';
  if(variants.music) videoHtml += '<div class="zy-variant"><audio controls preload="metadata" class="zy-audio" src="'+esc(variants.music)+'"></audio><a href="'+esc(variants.music)+'" download="tiktok_music.mp3" class="zy-dl-btn zy-dl-full">⬇ MUSIC</a></div>';
  videoHtml += '</div>';

  // Kalau video variants kosong, fallback ke collectMedia
  if(!variants.noWM && !variants.noWMHD && !variants.wm && !variants.music){
    var mediaItems = collectMedia(smart.result, []);
    if(mediaItems.length){
      videoHtml += '<div class="zy-media-wrap"><div class="zy-media-title">📥 MEDIA</div>';
      mediaItems.forEach(function(item, i){
        var cls = item.url.match(/\.(mp4|mov|webm)/i) ? 'video' : item.url.match(/\.(mp3|m4a)/i) ? 'audio' : 'img';
        if(cls === 'video') videoHtml += '<div class="zy-media-item"><video controls preload="metadata" class="zy-video" src="'+esc(item.url)+'"></video><a href="'+esc(item.url)+'" download class="zy-dl-btn zy-dl-full">⬇ DOWNLOAD</a></div>';
        else if(cls === 'audio') videoHtml += '<div class="zy-media-item"><audio controls preload="metadata" class="zy-audio" src="'+esc(item.url)+'"></audio><a href="'+esc(item.url)+'" download class="zy-dl-btn zy-dl-full">⬇ DOWNLOAD</a></div>';
        else videoHtml += '<div class="zy-media-item"><img src="'+esc(item.url)+'" class="zy-image"><a href="'+esc(item.url)+'" download class="zy-dl-btn zy-dl-full">⬇ DOWNLOAD</a></div>';
      });
      videoHtml += '</div>';
    } else {
      videoHtml += '<div class="zy-head er">⚠ Tidak ada media terdeteksi. Coba API lain.</div>';
    }
  }

  videoHtml += '<details class="zy-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(smart.result,null,2))+'</pre></details>';
  container.innerHTML = videoHtml;
  container.classList.remove('hd');
};

function collectMedia(obj, out, baseKey){
  out = out || [];
  if(!obj) return out;
  if(typeof obj === 'string'){ if(/^https?:\/\/.+/.test(obj)) out.push({ url: obj, key: baseKey || '' }); return out; }
  if(Array.isArray(obj)){ obj.forEach(function(v, i){ collectMedia(v, out, (baseKey||'')+'['+i+']'); }); return out; }
  if(typeof obj === 'object'){ Object.keys(obj).forEach(function(k){ var v = obj[k]; if(typeof v === 'string' && /^https?:\/\//.test(v)){ if(/url|link|download|video|audio|music|hd|sd|wm|play|src|cover|thumb|image|photo/i.test(k)){ out.push({ url: v, key: k }); } } collectMedia(v, out, (baseKey||'')+'.'+k); }); }
  return out;
}

// Preview + Clear
window.zyPreviewResult = function(){
  var res = $id('dl-result');
  if(!res || res.classList.contains('hd')){ alert('Belum ada hasil'); return; }
  res.scrollIntoView({behavior:'smooth', block:'start'});
  var firstMedia = res.querySelector('video, audio, img');
  if(firstMedia){
    var parent = firstMedia.closest('.zy-variant') || firstMedia.closest('.zy-media-item') || firstMedia.closest('.zy-slide-item-card');
    if(parent){
      parent.style.transition = 'box-shadow .3s';
      parent.style.boxShadow = '0 0 30px var(--ac)';
      setTimeout(function(){ parent.style.boxShadow = ''; }, 1200);
    }
    try{ firstMedia.play && firstMedia.play(); }catch(e){}
  }
};
window.zyClearDownloader = function(){
  ['dl-url','dl-query','dl-track_id','dl-format','dl-quality','dl-fileType','dl-type','dl-action','dl-mode','dl-json'].forEach(function(id){
    var el = $id(id); if(el) el.value = '';
  });
  var log = $id('dl-log'), res = $id('dl-result');
  if(log){ log.innerHTML=''; log.classList.add('hd'); }
  if(res){ res.innerHTML=''; res.classList.add('hd'); }
};

// ===== AUTO-INIT =====
function __zyReady(){
  if(typeof window.initCustomSelect !== 'function'){
    setTimeout(__zyReady, 80);
    return;
  }
  try{ if($id('bp-api-custom')) window.zyInitBypass(); }catch(e){}
  try{ if($id('dl-cat-custom')) window.zyInitDownloader(); }catch(e){}
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', __zyReady);
} else {
  __zyReady();
}

})();

// scraper.js — Deep Web Scraper + TikTok Downloader
// loaded by index.html v4.9

(function(){
'use strict';

var CORS_PROXIES=[
'https://corsproxy.io/?url=',
'https://api.allorigins.win/raw?url=',
'https://cors.eu.org/',
'https://thingproxy.freeboard.io/fetch/',
'https://whateverorigin.org/get?url='
];

function $id(i){return document.getElementById(i)}

// ================= HTTP FETCH VIA CORS =================
async function fetchURL(url, opts){
opts = opts || {};
var lastErr = null;
for(var i=0;i<CORS_PROXIES.length;i++){
var p = CORS_PROXIES[i];
var full = p + (p.indexOf('?')!==-1 ? encodeURIComponent(url) : url);
try{
var ctrl = new AbortController();
var t = setTimeout(function(){ctrl.abort()}, 20000);
var r = await fetch(full, {
method: opts.method || 'GET',
headers: opts.headers || {},
body: opts.body || undefined,
signal: ctrl.signal
});
clearTimeout(t);
if(r.ok) return { ok:true, text: await r.text(), url: url, via: p };
lastErr = new Error('HTTP '+r.status);
}catch(e){
lastErr = e;
}
}
throw lastErr || new Error('All CORS proxies failed');
}

// ================= EXTRACTORS =================
function extractEmails(html){
var m = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
return uniq(m).slice(0, 200);
}

function extractPhones(html){
var m = html.match(/(?:\+?\d{1,3}[\s\-\.]?)?(?:\(?\d{2,4}\)?[\s\-\.]?)?\d{3,4}[\s\-\.]?\d{3,4}/g) || [];
var filtered = m.filter(function(x){
var digits = x.replace(/\D/g,'');
return digits.length >= 10 && digits.length <= 15 && !/^\d{4}[\/\-]/.test(x);
});
return uniq(filtered).slice(0, 100);
}

function extractLinks(html, baseUrl){
var links = [];
var re = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
var m;
while((m = re.exec(html))){
var href = m[1];
if(href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
links.push(resolveURL(href, baseUrl));
}
return uniq(links).slice(0, 500);
}

function extractImages(html, baseUrl){
var imgs = [];
var patterns = [
/<img\s[^>]*src\s*=\s*["']([^"']+)["']/gi,
/<img\s[^>]*data-src\s*=\s*["']([^"']+)["']/gi,
/<img\s[^>]*data-lazy-src\s*=\s*["']([^"']+)["']/gi,
/<source\s[^>]*srcset\s*=\s*["']([^"']+)["']/gi,
/<meta\s[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/gi
];
patterns.forEach(function(re){
var m;
while((m = re.exec(html))){
var src = m[1].split(/\s+/)[0];
if(src) imgs.push(resolveURL(src, baseUrl));
}
});
return uniq(imgs).slice(0, 200);
}

function extractScripts(html, baseUrl){
var scripts = { external: [], inline: [] };
var re = /<script\s[^>]*>([\s\S]*?)<\/script>/gi;
var m;
while((m = re.exec(html))){
var tag = m[0];
var content = m[1];
var srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
if(srcMatch) scripts.external.push(resolveURL(srcMatch[1], baseUrl));
else if(content.trim().length > 10) scripts.inline.push(content.trim().substring(0, 2000));
}
scripts.external = uniq(scripts.external);
return scripts;
}

function extractStyles(html, baseUrl){
var styles = [];
var re = /<link\s[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["']/gi;
var m;
while((m = re.exec(html))) styles.push(resolveURL(m[1], baseUrl));
return uniq(styles);
}

function extractMeta(html){
var metas = [];
var re = /<meta\s[^>]*>/gi;
var m;
while((m = re.exec(html))){
var tag = m[0];
var name = (tag.match(/name\s*=\s*["']([^"']+)["']/i) || [])[1];
var prop = (tag.match(/property\s*=\s*["']([^"']+)["']/i) || [])[1];
var content = (tag.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1];
if(content) metas.push({ key: name || prop || '?', value: content });
}
return metas;
}

function extractOG(html){
var og = {};
var re = /<meta\s[^>]*property\s*=\s*["'](og:[^"']+)["'][^>]*content\s*=\s*["']([^"']*)["']/gi;
var m;
while((m = re.exec(html))) og[m[1]] = m[2];
return og;
}

function extractJSONLD(html){
var items = [];
var re = /<script\s[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
var m;
while((m = re.exec(html))){
try{ items.push(JSON.parse(m[1])); }catch(e){ items.push({ raw: m[1].substring(0, 500), _parseError: true }); }
}
return items;
}

function extractForms(html, baseUrl){
var forms = [];
var re = /<form\s([^>]*)>([\s\S]*?)<\/form>/gi;
var m;
while((m = re.exec(html))){
var attrs = m[1];
var inner = m[2];
var action = (attrs.match(/action\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
var method = (attrs.match(/method\s*=\s*["']([^"']*)["']/i) || [])[1] || 'GET';
var inputs = [];
var ire = /<(?:input|select|textarea)\s[^>]*name\s*=\s*["']([^"']+)["'][^>]*>/gi;
var im;
while((im = ire.exec(inner))) inputs.push(im[1]);
forms.push({ action: resolveURL(action, baseUrl), method: method.toUpperCase(), fields: inputs });
}
return forms;
}

function extractComments(html){
var cmts = [];
var re = /<!--([\s\S]*?)-->/g;
var m;
while((m = re.exec(html))){
var c = m[1].trim();
if(c.length > 3 && c.length < 500) cmts.push(c);
}
return uniq(cmts).slice(0, 50);
}

function extractInlineJSON(html){
var findings = [];
var patterns = [
{ name: '__NEXT_DATA__', re: /<script\s[^>]*id\s*=\s*["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i },
{ name: '__NUXT__', re: /window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i },
{ name: 'window.__INITIAL_STATE__', re: /window\.__INITIAL_STATE__\s*=\s*([\s\S]*?);/i },
{ name: 'window.__DATA__', re: /window\.__DATA__\s*=\s*([\s\S]*?);/i },
{ name: 'application/json', re: /<script\s[^>]*type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi }
];
patterns.forEach(function(p){
var m;
if(p.re.global){
while((m = p.re.exec(html))) findings.push({ name: p.name, value: m[1].trim().substring(0, 2000) });
}else{
m = html.match(p.re);
if(m) findings.push({ name: p.name, value: m[1].trim().substring(0, 2000) });
}
});
return findings;
}

function extractAPIEndpoints(html){
var eps = [];
var patterns = [
/fetch\s*\(\s*["']([^"']+)["']/g,
/axios\.(?:get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g,
/["'](\/api\/[^"']+)["']/g,
/["'](https?:\/\/[^"']*\/api\/[^"']+)["']/g,
/url\s*:\s*["']([^"']+)["']/g,
/endpoint\s*:\s*["']([^"']+)["']/g
];
patterns.forEach(function(re){
var m;
while((m = re.exec(html))) eps.push(m[1]);
});
return uniq(eps).filter(function(x){return x.length < 300}).slice(0, 200);
}

function extractSuspicious(html){
var findings = [];
var patterns = [
{ type: 'API Key', re: /(?:api[_-]?key|apikey)\s*[:=]\s*["']([a-zA-Z0-9_\-]{16,})["']/gi },
{ type: 'Token', re: /(?:token|bearer|auth[_-]?token)\s*[:=]\s*["']([a-zA-Z0-9_\-\.]{20,})["']/gi },
{ type: 'Secret', re: /(?:secret|client[_-]?secret)\s*[:=]\s*["']([a-zA-Z0-9_\-]{16,})["']/gi },
{ type: 'JWT', re: /eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g },
{ type: 'AWS Key', re: /AKIA[0-9A-Z]{16}/g },
{ type: 'Google API', re: /AIza[0-9A-Za-z_\-]{35}/g },
{ type: 'GitHub Token', re: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
{ type: 'Slack Token', re: /xox[baprs]-[0-9A-Za-z\-]+/g },
{ type: 'Private Key', re: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
{ type: 'Password', re: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"']{4,64})["']/gi },
{ type: 'Base64 Blob', re: /["']([A-Za-z0-9+\/]{80,}={0,2})["']/g }
];
patterns.forEach(function(p){
var m;
while((m = p.re.exec(html))){
var val = m[1] || m[0];
findings.push({ type: p.type, value: val.substring(0, 200) });
}
});
return findings.slice(0, 100);
}

function extractTechFingerprint(html){
var tech = [];
var sigs = [
{ name: 'Next.js', re: /__NEXT_DATA__|_next\// },
{ name: 'Nuxt.js', re: /__NUXT__|_nuxt\// },
{ name: 'React', re: /react(?:\.production\.min)?\.js|__REACT_DEVTOOLS/ },
{ name: 'Vue.js', re: /vue(?:\.min)?\.js|__VUE__/ },
{ name: 'Angular', re: /ng-version|angular(?:\.min)?\.js/ },
{ name: 'Svelte', re: /svelte-[a-z0-9]+\.js|__svelte/ },
{ name: 'jQuery', re: /jquery(?:\.min)?\.js|jQuery\.fn\.jquery/ },
{ name: 'Bootstrap', re: /bootstrap(?:\.min)?\.css|bootstrap(?:\.min)?\.js/ },
{ name: 'Tailwind CSS', re: /tailwind|cdn\.tailwindcss\.com/ },
{ name: 'WordPress', re: /wp-content|wp-includes|wp-json/ },
{ name: 'Shopify', re: /cdn\.shopify\.com|shopify\.theme/ },
{ name: 'Wix', re: /wix\.com|wixstatic\.com/ },
{ name: 'Squarespace', re: /squarespace\.com|static\.squarespace/ },
{ name: 'Webflow', re: /webflow\.com|assets\.website-files\.com/ },
{ name: 'Cloudflare', re: /cloudflare|cf-ray|__cfduid/ },
{ name: 'Google Analytics', re: /google-analytics\.com|gtag\// },
{ name: 'Google Tag Manager', re: /googletagmanager\.com/ },
{ name: 'Facebook Pixel', re: /connect\.facebook\.net|fbq\(/ },
{ name: 'Hotjar', re: /hotjar\.com|hj\(/ },
{ name: 'Vercel', re: /vercel\.com|vercel\.app|_vercel/ },
{ name: 'Netlify', re: /netlify\.app|netlify\.com/ },
{ name: 'GitHub Pages', re: /github\.io|githubusercontent\.com/ }
];
sigs.forEach(function(s){ if(s.re.test(html)) tech.push(s.name); });
var gen = html.match(/<meta\s[^>]*name\s*=\s*["']generator["'][^>]*content\s*=\s*["']([^"']+)["']/i);
if(gen) tech.push('Generator: '+gen[1]);
return tech;
}

function extractText(html){
var t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
.replace(/<style[\s\S]*?<\/style>/gi, ' ')
.replace(/<[^>]+>/g, ' ')
.replace(/&nbsp;/g, ' ')
.replace(/&amp;/g, '&')
.replace(/&lt;/g, '<')
.replace(/&gt;/g, '>')
.replace(/&quot;/g, '"')
.replace(/\s+/g, ' ')
.trim();
return t.substring(0, 5000);
}

// ================= HELPERS =================
function uniq(arr){
var seen = {};
return arr.filter(function(x){
if(seen[x]) return false;
seen[x] = true;
return true;
});
}
function resolveURL(href, base){
try{ return new URL(href, base).href; }catch(e){ return href; }
}
function getBaseURL(url){
try{ var u = new URL(url); return u.origin; }catch(e){ return url; }
}

// ================= DEEP SCRAPE =================
async function deepScrape(url){
if(!url) throw new Error('URL kosong');
if(!/^https?:\/\//.test(url)) url = 'https://' + url;

var result = await fetchURL(url);
var html = result.text;
var base = getBaseURL(url);

return {
url: url,
via: result.via,
size: html.length,
emails: extractEmails(html),
phones: extractPhones(html),
links: extractLinks(html, base),
images: extractImages(html, base),
scripts: extractScripts(html, base),
styles: extractStyles(html, base),
meta: extractMeta(html),
og: extractOG(html),
jsonld: extractJSONLD(html),
forms: extractForms(html, base),
comments: extractComments(html),
inlineJSON: extractInlineJSON(html),
apiEndpoints: extractAPIEndpoints(html),
suspicious: extractSuspicious(html),
tech: extractTechFingerprint(html),
text: extractText(html),
html: html
};
}

// ================= RENDER UI =================
function section(title, count, contentHTML, copyText){
return '<div class="ds-section">'
+ '<div class="ds-head" onclick="this.parentNode.classList.toggle(\'open\')">'
+ '<span class="ds-title">'+title+'</span>'
+ '<span class="ds-badge">'+count+'</span>'
+ '<span class="ds-arrow">▸</span>'
+ '</div>'
+ '<div class="ds-body">'+contentHTML
+ '<button class="ds-copy" data-copy="'+encodeURIComponent(copyText||'')+'">📋 COPY</button>'
+ '</div>'
+ '</div>';
}

function esc(s){
return String(s).replace(/[&<>"']/g, function(c){
return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
});
}

function renderDeepResult(data){
var wrap = $id('ds-result');
if(!wrap) return;
var h = '';

h += section('📧 Emails', data.emails.length,
data.emails.length ? '<div class="ds-list">'+data.emails.map(esc).join('<br>')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.emails.join('\n'));

h += section('📞 Phones', data.phones.length,
data.phones.length ? '<div class="ds-list">'+data.phones.map(esc).join('<br>')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.phones.join('\n'));

h += section('🔗 Links', data.links.length,
data.links.length ? '<div class="ds-list">'+data.links.slice(0,100).map(function(l){return '<a href="'+esc(l)+'" target="_blank">'+esc(l)+'</a>'}).join('<br>')+(data.links.length>100?'<br><em>...+'+(data.links.length-100)+' lagi</em>':'')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.links.join('\n'));

h += section('🖼 Images', data.images.length,
data.images.length ? '<div class="ds-list">'+data.images.slice(0,50).map(esc).join('<br>')+(data.images.length>50?'<br><em>...+'+(data.images.length-50)+' lagi</em>':'')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.images.join('\n'));

h += section('📜 Scripts (external)', data.scripts.external.length,
data.scripts.external.length ? '<div class="ds-list">'+data.scripts.external.map(esc).join('<br>')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.scripts.external.join('\n'));

h += section('📜 Scripts (inline)', data.scripts.inline.length,
data.scripts.inline.length ? data.scripts.inline.map(function(s,i){return '<pre class="ds-pre">// inline '+i+'\n'+esc(s)+'</pre>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.scripts.inline.join('\n\n// ---\n\n'));

h += section('🎨 Styles', data.styles.length,
data.styles.length ? '<div class="ds-list">'+data.styles.map(esc).join('<br>')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.styles.join('\n'));

h += section('🏷 Meta Tags', data.meta.length,
data.meta.length ? '<table class="ds-table"><tr><th>Key</th><th>Value</th></tr>'+data.meta.map(function(m){return '<tr><td>'+esc(m.key)+'</td><td>'+esc(m.value)+'</td></tr>'}).join('')+'</table>' : '<em class="ds-empty">(kosong)</em>',
data.meta.map(function(m){return m.key+' = '+m.value}).join('\n'));

h += section('📱 Open Graph', Object.keys(data.og).length,
Object.keys(data.og).length ? '<table class="ds-table">'+Object.keys(data.og).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+esc(data.og[k])+'</td></tr>'}).join('')+'</table>' : '<em class="ds-empty">(kosong)</em>',
Object.keys(data.og).map(function(k){return k+' = '+data.og[k]}).join('\n'));

h += section('🗂 JSON-LD', data.jsonld.length,
data.jsonld.length ? data.jsonld.map(function(j){return '<pre class="ds-pre">'+esc(JSON.stringify(j, null, 2))+'</pre>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.jsonld.map(function(j){return JSON.stringify(j, null, 2)}).join('\n\n'));

h += section('📝 Forms', data.forms.length,
data.forms.length ? data.forms.map(function(f){
return '<div class="ds-form"><b>'+esc(f.method)+'</b> '+esc(f.action)+'<br><span class="ds-dim">fields: '+esc(f.fields.join(', '))+'</span></div>';
}).join('') : '<em class="ds-empty">(kosong)</em>',
JSON.stringify(data.forms, null, 2));

h += section('💬 Comments', data.comments.length,
data.comments.length ? data.comments.map(function(c){return '<pre class="ds-pre">'+esc(c)+'</pre>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.comments.join('\n\n'));

h += section('🧩 Inline JSON', data.inlineJSON.length,
data.inlineJSON.length ? data.inlineJSON.map(function(j){return '<b>'+esc(j.name)+'</b><pre class="ds-pre">'+esc(j.value)+'</pre>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.inlineJSON.map(function(j){return j.name+':\n'+j.value}).join('\n\n'));

h += section('🔌 API Endpoints', data.apiEndpoints.length,
data.apiEndpoints.length ? '<div class="ds-list">'+data.apiEndpoints.map(esc).join('<br>')+'</div>' : '<em class="ds-empty">(kosong)</em>',
data.apiEndpoints.join('\n'));

h += section('🔐 Suspicious Strings', data.suspicious.length,
data.suspicious.length ? data.suspicious.map(function(s){return '<div class="ds-sus"><span class="ds-tag">'+esc(s.type)+'</span> <code>'+esc(s.value)+'</code></div>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.suspicious.map(function(s){return '['+s.type+'] '+s.value}).join('\n'));

h += section('🛠 Tech Fingerprint', data.tech.length,
data.tech.length ? data.tech.map(function(t){return '<div class="ds-tech">'+esc(t)+'</div>'}).join('') : '<em class="ds-empty">(kosong)</em>',
data.tech.join('\n'));

h += section('📄 Text Content', data.text.length,
data.text.length ? '<pre class="ds-pre ds-text">'+esc(data.text)+'</pre>' : '<em class="ds-empty">(kosong)</em>',
data.text);

h += section('📦 Raw HTML', data.size,
'<div class="ds-dim">Size: '+data.size+' bytes · via: '+esc(data.via)+'</div><pre class="ds-pre ds-html">'+esc(data.html.substring(0, 5000))+'</pre>',
data.html);

wrap.innerHTML = h;
wrap.classList.remove('hd');
wrap.querySelectorAll('.ds-copy').forEach(function(btn){
btn.onclick = function(e){
e.stopPropagation();
var txt = decodeURIComponent(btn.dataset.copy);
navigator.clipboard.writeText(txt).then(function(){
btn.textContent = '✓ TERSALIN';
setTimeout(function(){ btn.textContent = '📋 COPY'; }, 1200);
});
};
});
}

// ================= MAIN DEEP SCRAPE =================
window.dsRun = async function(){
var input = $id('ds-url');
var log = $id('ds-log');
var btn = $id('ds-run');
if(!input || !input.value.trim()){ alert('Masukkan URL'); return; }

var url = input.value.trim();
btn.disabled = true;
btn.textContent = '⏳ SCRAPING...';
log.innerHTML = '';
log.classList.remove('hd');
log.innerHTML = '<div class="ok">Fetching '+esc(url)+'...</div>';

try{
var t0 = Date.now();
var data = await deepScrape(url);
var el = Date.now() - t0;
log.innerHTML = '<div class="ok">✓ Selesai dalam '+el+'ms · '+data.size+' bytes · via '+esc(data.via)+'</div>';
renderDeepResult(data);
}catch(e){
log.innerHTML = '<div class="er">✗ Gagal: '+esc(e.message)+'</div>';
}
btn.disabled = false;
btn.textContent = '⚡ DEEP SCRAPE';
};

// ================= TIKTOK DOWNLOADER =================
window.ttRun = async function(){
var input = $id('tt-url');
var log = $id('tt-log');
var out = $id('tt-result');
var btn = $id('tt-run');
if(!input || !input.value.trim()){ alert('Masukkan URL TikTok'); return; }

var url = input.value.trim();
btn.disabled = true;
btn.textContent = '⏳ FETCHING...';
log.innerHTML = '';
log.classList.remove('hd');
out.innerHTML = '';
out.classList.add('hd');

log.innerHTML = '<div class="ok">Request ke tikwm.com...</div>';

try{
var apiURL = 'https://tikwm.com/api/?url=' + encodeURIComponent(url) + '&hd=1';
var res = await fetchURL(apiURL);
var json = JSON.parse(res.text);
if(json.code !== 0){
log.innerHTML = '<div class="er">✗ API error: '+esc(json.msg || 'unknown')+'</div>';
btn.disabled = false;
btn.textContent = '⬇ DOWNLOAD';
return;
}
var d = json.data;
log.innerHTML = '<div class="ok">✓ Berhasil. Loading info...</div>';
var html = '';
html += '<div class="tt-card">';
if(d.cover) html += '<img src="'+esc(d.cover)+'" class="tt-cover" alt="cover">';
html += '<div class="tt-info">';
html += '<div class="tt-title">'+esc(d.title || '-')+'</div>';
html += '<div class="tt-author">@'+esc((d.author && d.author.unique_id) || '-')+' · '+esc((d.author && d.author.nickname) || '-')+'</div>';
html += '<div class="tt-stats">';
if(d.play_count) html += '<span>▶ '+d.play_count+'</span>';
if(d.digg_count) html += '<span>❤ '+d.digg_count+'</span>';
if(d.comment_count) html += '<span>💬 '+d.comment_count+'</span>';
if(d.share_count) html += '<span>↗ '+d.share_count+'</span>';
html += '</div>';
if(d.duration) html += '<div class="tt-dur">Duration: '+d.duration+'s · '+esc(d.size ? (d.size/1048576).toFixed(2)+' MB' : '-')+'</div>';
html += '<div class="tt-actions">';
if(d.play) html += '<a href="'+esc(d.play)+'" download target="_blank" class="tt-btn">⬇ VIDEO (NO WM)</a>';
if(d.wmplay) html += '<a href="'+esc(d.wmplay)+'" download target="_blank" class="tt-btn g">⬇ VIDEO (WM)</a>';
if(d.hdplay) html += '<a href="'+esc(d.hdplay)+'" download target="_blank" class="tt-btn g">⬇ HD</a>';
if(d.music) html += '<a href="'+esc(d.music)+'" download target="_blank" class="tt-btn g">🎵 MUSIC</a>';
html += '</div>';
html += '</div></div>';

html += '<details class="tt-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(d, null, 2))+'</pre></details>';

out.innerHTML = html;
out.classList.remove('hd');
log.innerHTML = '<div class="ok">✓ Selesai</div>';
}catch(e){
log.innerHTML = '<div class="er">✗ Gagal: '+esc(e.message)+'</div>';
}
btn.disabled = false;
btn.textContent = '⬇ DOWNLOAD';
};

})();

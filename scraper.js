// scraper.js — Deep Scraper minimal
(function(){
'use strict';
var CORS=['https://corsproxy.io/?url=','https://api.allorigins.win/raw?url=','https://cors.eu.org/','https://thingproxy.freeboard.io/fetch/'];
async function px(url,opts){
  opts=opts||{};
  for(var i=0;i<CORS.length;i++){
    try{
      var c=await fetch(CORS[i]+encodeURIComponent(url),opts);
      if(c.ok)return await c.text();
    }catch(e){}
  }
  throw new Error('CORS fail');
}
window.dsRun=async function(){
  var u=document.getElementById('ds-url').value.trim();
  if(!u)return alert('URL kosong');
  var log=document.getElementById('ds-log');
  var res=document.getElementById('ds-result');
  log.innerHTML=''; log.classList.remove('hd');
  res.innerHTML=''; res.classList.add('hd');
  var d=document.createElement('div'); d.className='ok'; d.textContent='Fetch '+u+'...';
  log.appendChild(d);
  try{
    var html=await px(u);
    var emails=(html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)||[]).filter(function(v,i,a){return a.indexOf(v)===i}).slice(0,100);
    var links=(html.match(/<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi)||[]).slice(0,200);
    var imgs=(html.match(/<img\s[^>]*src\s*=\s*["']([^"']+)["']/gi)||[]).slice(0,100);
    var scripts=(html.match(/<script\s[^>]*src\s*=\s*["']([^"']+)["']/gi)||[]).slice(0,100);
    var title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||['',''])[1];
    var out='✓ Selesai · '+html.length+' bytes\n\n';
    out+='📧 Emails ('+emails.length+'):\n'+emails.slice(0,30).join('\n')+'\n\n';
    out+='🔗 Links ('+links.length+'):\n'+links.slice(0,30).join('\n')+'\n\n';
    out+='🖼 Images ('+imgs.length+'):\n'+imgs.slice(0,20).join('\n')+'\n\n';
    out+='📜 Scripts ('+scripts.length+'):\n'+scripts.slice(0,20).join('\n')+'\n\n';
    out+='🏷 Title: '+title;
    res.textContent=out;
    res.classList.remove('hd');
    var o=document.createElement('div'); o.className='ok'; o.textContent='✓ '+emails.length+' emails, '+links.length+' links';
    log.appendChild(o);
  }catch(e){
    var er=document.createElement('div'); er.className='er'; er.textContent='✗ '+e.message;
    log.appendChild(er);
  }
};
window.ttRun=async function(){
  alert('TikTok downloader pindah ke tab DOWNLOADER → kategori TikTok');
};
})();

// zyvor.js v6.5 — API HUB 156 endpoint + Bypass + Downloader + Smart TikTok
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

var API_HUB_LIST = [
  // UPSCALE VIDEO (5)
  {id:'up_ai', name:'Video Upscale AI', path:'/api/hdvidio/ai-upscale-vidio', method:'GET', params:['url','resolution'], cat:'UPSCALE'},
  {id:'up_v1', name:'Video Upscale v1', path:'/api/hdvidio/upscale', method:'GET', params:['url'], cat:'UPSCALE'},
  {id:'up_tohd', name:'HD Video Processor', path:'/api/hdvidio/tohd', method:'GET', params:['video','fps','resolution','quality','enhance','denoise','stabilize','format'], cat:'UPSCALE'},
  {id:'up_wink', name:'Wink HD Video Enhancer', path:'/api/hdvidio/wink-hd-video', method:'GET', params:['url'], cat:'UPSCALE'},
  {id:'up_v2', name:'Video HD Enhancer', path:'/api/hdvidio/enhance', method:'GET', params:['url'], cat:'UPSCALE'},

  // IMAGE AI (12)
  {id:'ai_seek', name:'AI Seek Image', path:'/api/imageai/aiseek', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_bing', name:'AI Bing Image', path:'/api/imageai/bingimg', method:'GET', params:['query'], cat:'IMG AI'},
  {id:'ai_dezgo', name:'Dezgo Image Generator', path:'/api/imageai/dezgo', method:'GET', params:['text','model','width','height','negative'], cat:'IMG AI'},
  {id:'ai_freeforai', name:'FreeForAI Image', path:'/api/imageai/freeforai', method:'GET', params:['prompt','model','size'], cat:'IMG AI'},
  {id:'ai_gstory', name:'GStory AI Image', path:'/api/imageai/gstory', method:'GET', params:['prompt','style','ratio'], cat:'IMG AI'},
  {id:'ai_nano', name:'Nano Banana AI', path:'/api/imageai/nanobanana', method:'GET', params:['prompt','ratio','resolution'], cat:'IMG AI'},
  {id:'ai_poll', name:'Pollinations AI', path:'/api/imageai/pollinations', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_quil', name:'Quillbot Image Gen', path:'/api/imageai/quil-image', method:'GET', params:['prompt','style','aspect'], cat:'IMG AI'},
  {id:'ai_strom', name:'Strom-AI Text to Image', path:'/api/imageai/strom-img', method:'GET', params:['prompt'], cat:'IMG AI'},
  {id:'ai_t2i', name:'Text to Image (FreeGen)', path:'/api/imageai/text2image', method:'GET', params:['teks','ratio'], cat:'IMG AI'},
  {id:'ai_t2iv2', name:'Text to Image v2 (FLUX)', path:'/api/imageai/text2imgv2', method:'GET', params:['teks'], cat:'IMG AI'},
  {id:'ai_t2iv3', name:'Text to Image v3 (Baidu)', path:'/api/imageai/text2imgv3', method:'GET', params:['teks'], cat:'IMG AI'},

  // IMAGE HD (33)
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

  // KALENDER (2)
  {id:'kal_hari', name:'Hari Ini', path:'/api/kalender/hari-ini', method:'GET', params:[], cat:'KALENDER'},
  {id:'kal_libur', name:'Hari Libur Nasional', path:'/api/kalender/hari-libur', method:'GET', params:['tahun'], cat:'KALENDER'},

  // MAKER (48)
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

  // SEARCH (56)
  {id:'sr_4k', name:'Search Wallpaper 4K', path:'/api/search/4kwallpapers', method:'GET', params:['action','query','slug','page'], cat:'SEARCH'},
  {id:'sr_anime', name:'Anime Search (LiveChart)', path:'/api/search/anime', method:'GET', params:['q'], cat:'SEARCH'},
  {id:'sr_bacakomik', name:'BacaKomik', path:'/api/search/bacakomik', method:'GET', params:['action','query','url','page'], cat:'SEARCH'},
  {id:'sr_bansos', name:'Cek Bansos', path:'/api/search/cekbansos', method:'GET', params:['nik'], cat:'SEARCH'},
  {id:'sr_cinesubz', name:'CineSubz', path:'/api/search/cinesubz', method:'GET', params:['q','url','action'], cat:'SEARCH'},
  {id:'sr_cookpad', name:'Cookpad', path:'/api/search/cookpad', method:'GET', params:['action','query','id'], cat:'SEARCH'},
  {id:'sr_dapodik', name:'Dapodik Sekolah', path:'/api/search/dapodik', method:'GET', params:['action','query','npsn'], cat:'SEARCH'},
  {id:'sr_douyin', name:'Douyin Search', path:'/api/search/douyin-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_flac', name:'FlacDownloader', path:'/api/search/flac', method:'GET', params:['q'], cat:'SEARCH'},
  {id:'sr_gempa', name:'Info Gempa BMKG', path:'/api/search/gempa', method:'GET', params:[], cat:'SEARCH'},
  {id:'sr_genius', name:'Genius Lyrics', path:'/api/search/genius', method:'GET', params:['query','id'], cat:'SEARCH'},
  {id:'sr_goal', name:'Goal.com', path:'/api/search/goal', method:'GET', params:['action','query','url','lang'], cat:'SEARCH'},
  {id:'sr_ipa', name:'IPA Pelajaran', path:'/api/search/ipa-pelajaran', method:'GET', params:['query','page','slug'], cat:'SEARCH'},
  {id:'sr_jadwal1', name:'Jadwal Sepakbola StarLabs', path:'/api/search/jadwal-sepakbola', method:'GET', params:['date'], cat:'SEARCH'},
  {id:'sr_jadwal2', name:'Jadwal Sepakbola', path:'/api/search/jadwalbola', method:'GET', params:[], cat:'SEARCH'},
  {id:'sr_jadwaltv', name:'Jadwal TV', path:'/api/search/jadwaltv', method:'GET', params:['channel'], cat:'SEARCH'},
  {id:'sr_kodepos', name:'Search KodePos', path:'/api/search/kodepos', method:'GET', params:['kodepos'], cat:'SEARCH'},
  {id:'sr_lazada', name:'Lazada Search', path:'/api/search/lazada', method:'GET', params:['keyword','page'], cat:'SEARCH'},
  {id:'sr_livescore', name:'Livescore', path:'/api/search/livescore', method:'GET', params:['edisi','raw'], cat:'SEARCH'},
  {id:'sr_manhwaindo', name:'Manhwaindo Detail', path:'/api/search/manhwaindo', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_manhwaland', name:'Manhwaland Search', path:'/api/search/manhwaland', method:'GET', params:['action'], cat:'SEARCH'},
  {id:'sr_mcpedl', name:'MCPEDL Search & DL', path:'/api/search/mcpedl', method:'GET', params:['query','url','slug','source','action','max','page'], cat:'SEARCH'},
  {id:'sr_moviedetail', name:'Movie Detail TMDB', path:'/api/search/moviedetail', method:'GET', params:['url'], cat:'SEARCH'},
  {id:'sr_murotal', name:'Murotal Quran', path:'/api/search/murotal-quran', method:'GET', params:['murotal','surat'], cat:'SEARCH'},
  {id:'sr_musix', name:'Musixmatch Lyrics', path:'/api/search/musixmatch', method:'GET', params:['url'], cat:'SEARCH'},
  {id:'sr_nasa', name:'NASA Search', path:'/api/search/nasa', method:'GET', params:['type','limit','query','detail'], cat:'SEARCH'},
  {id:'sr_nowsecure', name:'NowSecure Search', path:'/api/search/nowsecure', method:'GET', params:['query','platform'], cat:'SEARCH'},
  {id:'sr_otakudesu', name:'OtakuDesu', path:'/api/search/otakudesu', method:'GET', params:['action','query','page'], cat:'SEARCH'},
  {id:'sr_pinterest', name:'Search Pinterest', path:'/api/search/pinterest', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_pinvid', name:'Pinterest Video Search', path:'/api/search/pinvid-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_playstore', name:'Play Store Search', path:'/api/search/playstore', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_prodi', name:'PDDIKTI Search', path:'/api/search/prodi', method:'GET', params:['query','mode','mahasiswaId'], cat:'SEARCH'},
  {id:'sr_song', name:'Search Song', path:'/api/search/search-song', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_sinopsis', name:'Sinopsis Film', path:'/api/search/sinopsis', method:'GET', params:['action','query'], cat:'SEARCH'},
  {id:'sr_soundcloud', name:'SoundCloud Search', path:'/api/search/soundcloud', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_spotify', name:'Spotify Search', path:'/api/search/spotify', method:'GET', params:['query','limit'], cat:'SEARCH'},
  {id:'sr_spotifyv2', name:'Spotify Search v2', path:'/api/search/spotifyv2', method:'GET', params:['action','query','url','limit'], cat:'SEARCH'},
  {id:'sr_terabox', name:'TeraBox Resolver', path:'/api/search/terabox', method:'GET', params:['link'], cat:'SEARCH'},
  {id:'sr_tiktok', name:'TikTok Search v2', path:'/api/search/tiktok-search', method:'GET', params:['query','page','region','type','count'], cat:'SEARCH'},
  {id:'sr_tokusatsu', name:'Tokusatsu Search', path:'/api/search/tokusatsu', method:'GET', params:['action','query','url','page'], cat:'SEARCH'},
  {id:'sr_voratoon', name:'Voratoon Updates', path:'/api/search/voratoon', method:'GET', params:['page'], cat:'SEARCH'},
  {id:'sr_webtoon', name:'Webtoon Search', path:'/api/search/webtoon', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_wiki', name:'Wikipedia', path:'/api/search/wikipedia', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_youtube', name:'YouTube Search', path:'/api/search/youtube-search', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_apkcombo', name:'ApkCombo Search', path:'/api/search/apkcombo', method:'GET', params:['query'], cat:'SEARCH'},
  {id:'sr_bilibili', name:'Bilibili Search', path:'/api/search/bilibili', method:'GET', params:['query','type','action','url','page','limit','lang'], cat:'SEARCH'}
];

async function fetchTikWM(url){
  var apiURL = TIKWM + '?url=' + encodeURIComponent(url) + '&hd=1';
  var res = await proxyFetch(apiURL);
  var json = JSON.parse(res.text);
  if(json.code !== 0) throw new Error(json.msg || 'tikwm error');
  var d = json.data;
  return { status:true, __type:detectTikTokType(d), title:d.title, author:d.author, cover:d.cover, duration:d.duration, stats:{ play:d.play_count, like:d.digg_count, comment:d.comment_count, share:d.share_count }, video_nowm:d.play, video_nowm_hd:d.hdplay, video_wm:d.wmplay, music:d.music, raw:d };
}

function detectTikTokType(data){
  if(!data || typeof data !== 'object') return 'unknown';
  if(data.images && Array.isArray(data.images) && data.images.length > 0) return 'slideshow';
  if(data.image_post_info && data.image_post_info.images) return 'slideshow';
  if(data.slideshow && Array.isArray(data.slideshow)) return 'slideshow';
  if(data.image_data && data.image_data.images) return 'slideshow';
  if(data.play || data.hdplay || data.wmplay || data.video || data.video_hd || data.video_wm) return 'video';
  if(data.data) return detectTikTokType(data.data);
  if(data.raw) return detectTikTokType(data.raw);
  return 'unknown';
}

function urlLooksLikeSlideshow(url){
  if(!url) return false;
  var u = url.toLowerCase();
  if(/\/photo\//.test(u)) return true;
  if(/slideshow/.test(u)) return true;
  return false;
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
  out.music = d.music || d.music_info && d.music_info.play || d.music_url || null;
  if(!out.noWM && d.video_data){
    out.noWM = d.video_data.play_addr && d.video_data.play_addr.url_list && d.video_data.play_addr.url_list[0] || null;
    out.noWMHD = d.video_data.hd && d.video_data.hd.url_list && d.video_data.hd.url_list[0] || null;
    out.wm = d.video_data.wm && d.video_data.wm.url_list && d.video_data.wm.url_list[0] || null;
  }
  return out;
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

async function fetchTikTokSmart(url, logEl){
  var isSlideUrl = urlLooksLikeSlideshow(url);
  if(logEl){ var l = document.createElement('div'); l.className = 'in'; l.textContent = '🔍 URL heuristic: '+(isSlideUrl?'SLIDESHOW':'VIDEO'); logEl.appendChild(l); logEl.scrollTop = logEl.scrollHeight; }
  var order = isSlideUrl
    ? ['tiktokv5','tiktokv4','tiktokv3','tikwm','tiktokv2','tiktokio','tiktok']
    : ['tikwm','tiktokv2','tiktokv4','tiktokv3','tiktokv5','tiktokio','tiktok'];
  var results = [];
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
        if(type === 'slideshow') break;
        if(type === 'video') break;
      } else {
        if(logEl){ var l4 = document.createElement('div'); l4.className = 'er'; l4.textContent = '  ✗ '+(res.error || res.message || 'unknown'); logEl.appendChild(l4); logEl.scrollTop = logEl.scrollHeight; }
      }
    }catch(e){
      if(logEl){ var l5 = document.createElement('div'); l5.className = 'er'; l5.textContent = '  ✗ '+e.message; logEl.appendChild(l5); logEl.scrollTop = logEl.scrollHeight; }
    }
  }
  if(results.length === 0) return null;
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
    if(v.cover && !combined.allVariants.cover) combined.allVariants.cover = v.cover;
    if(v.stats && !combined.allVariants.stats) combined.allVariants.stats = v.stats;
  });
  return combined;
}

function $id(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function classify(url){ var u = url.toLowerCase(); if(/\.(mp4|mov|webm|mkv)(\?|$)/.test(u)) return 'video'; if(/\.(mp3|m4a|flac|wav|aac|opus)(\?|$)/.test(u)) return 'audio'; if(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/.test(u)) return 'image'; return 'other'; }
function collectMedia(obj, out, baseKey){
  out = out || [];
  if(!obj) return out;
  if(typeof obj === 'string'){ if(/^https?:\/\/.+/.test(obj)) out.push({ url: obj, key: baseKey || '' }); return out; }
  if(Array.isArray(obj)){ obj.forEach(function(v, i){ collectMedia(v, out, (baseKey||'')+'['+i+']'); }); return out; }
  if(typeof obj === 'object'){ Object.keys(obj).forEach(function(k){ var v = obj[k]; if(typeof v === 'string' && /^https?:\/\//.test(v)){ if(/url|link|download|video|audio|music|hd|sd|wm|play|src|cover|thumb|image|photo/i.test(k)){ out.push({ url: v, key: k }); } } collectMedia(v, out, (baseKey||'')+'.'+k); }); }
  return out;
}

// ===== API HUB v6.5 =====
var apiHubCatSel = 'UPSCALE';
var apiHubCurrentEndpoint = null;

window.zyInitApiHub = function(){
  if(typeof window.initCustomSelect !== 'function') return;
  var catList = ['UPSCALE','IMG AI','IMG HD','KALENDER','MAKER','SEARCH'];
  var catItems = catList.map(function(c){ return {id:c, name:c}; });
  window.__apiHubCatSel = window.initCustomSelect('apihub-cat', catItems, apiHubCatSel,
    function(id){ apiHubCatSel = id; window.zyRenderApiHubEndpoints(); }
  );
  window.zyRenderApiHubEndpoints();
};

window.zyRenderApiHubEndpoints = function(){
  var filtered = API_HUB_LIST.filter(function(x){ return x.cat === apiHubCatSel; });
  if(!filtered.length){
    var epWrap = document.getElementById('apihub-endpoint');
    if(epWrap) epWrap.innerHTML = '<div class="r">Belum ada endpoint untuk kategori ini</div>';
    return;
  }
  if(!apiHubCurrentEndpoint || !filtered.find(function(x){ return x.id === apiHubCurrentEndpoint.id; })){
    apiHubCurrentEndpoint = filtered[0];
  }
  var items = filtered.map(function(x){ return {id:x.id, name:x.name}; });
  window.__apiHubEndpointSel = window.initCustomSelect('apihub-endpoint', items, apiHubCurrentEndpoint.id,
    function(id){
      apiHubCurrentEndpoint = filtered.find(function(x){ return x.id === id; });
      window.zyRenderApiHubParams();
    }
  );
  window.zyRenderApiHubParams();
};

window.zyRenderApiHubParams = function(){
  var wrap = document.getElementById('apihub-params');
  if(!wrap) return;
  if(!apiHubCurrentEndpoint){ wrap.innerHTML = ''; return; }
  if(!apiHubCurrentEndpoint.params.length){
    wrap.innerHTML = '<div class="r" style="font-size:.6rem">Endpoint ini tidak butuh parameter</div>';
    return;
  }
  wrap.innerHTML = apiHubCurrentEndpoint.params.map(function(p){
    return '<label>'+p.toUpperCase()+'</label><input id="apihub-p-'+p+'" placeholder="isi '+p+'...">';
  }).join('');
};

window.zyRunApiHub = async function(){
  if(!apiHubCurrentEndpoint){ alert('Pilih endpoint dulu'); return; }
  var log = document.getElementById('apihub-log');
  var res = document.getElementById('apihub-result');
  if(log){ log.innerHTML = ''; log.classList.remove('hd'); }
  if(res){ res.innerHTML = ''; res.classList.add('hd'); }
  var params = {};
  apiHubCurrentEndpoint.params.forEach(function(p){
    var el = document.getElementById('apihub-p-'+p);
    if(el && el.value.trim()) params[p] = el.value.trim();
  });
  if(apiHubCurrentEndpoint.params.length && !Object.keys(params).length){ alert('Isi minimal 1 parameter'); return; }
  if(log){ var l = document.createElement('div'); l.className = 'in'; l.textContent = 'Call ' + apiHubCurrentEndpoint.path + '...'; log.appendChild(l); log.scrollTop = log.scrollHeight; }
  try{
    var out = await callAPI(apiHubCurrentEndpoint.path, params, apiHubCurrentEndpoint.method);
    if(log){ var ok = document.createElement('div'); ok.className = 'ok'; ok.textContent = '✓ Response'; log.appendChild(ok); }
    window.zyRenderApiHubResult(res, out, apiHubCurrentEndpoint.name);
  }catch(e){
    if(log){ var err = document.createElement('div'); err.className = 'er'; err.textContent = '✗ ' + e.message; log.appendChild(err); }
  }
};

window.zyRenderApiHubResult = function(container, data, apiName){
  var html = '<div class="zy-head">✓ Response dari <b>'+esc(apiName)+'</b></div>';
  var mediaItems = collectMedia(data, []);
  var images = mediaItems.filter(function(x){ return classify(x.url)==='image'; });
  var videos = mediaItems.filter(function(x){ return classify(x.url)==='video'; });
  var others = mediaItems.filter(function(x){ return classify(x.url)==='other'; });
  if(images.length){
    html += '<div class="zy-media-wrap"><div class="zy-media-title">🖼 IMAGE HASIL (' + images.length + ')</div>';
    images.slice(0, 20).forEach(function(img, i){
      html += '<div class="zy-media-item"><div class="zy-media-h">Image '+(i+1)+' <span class="zy-cat">'+esc(img.key)+'</span></div>'+
        '<img src="'+esc(img.url)+'" class="zy-image" loading="lazy">'+
        '<div class="zy-media-actions"><a href="'+esc(img.url)+'" download="result_'+i+'.jpg" class="zy-dl-btn">⬇ DOWNLOAD</a>'+
        '<button class="zy-cp-btn" onclick="zyCp(\''+esc(img.url).replace(/'/g,"\\'")+'\')">📋 COPY URL</button></div></div>';
    });
    html += '</div>';
  }
  if(videos.length){
    html += '<div class="zy-media-wrap"><div class="zy-media-title">🎬 VIDEO HASIL (' + videos.length + ')</div>';
    videos.slice(0, 5).forEach(function(vid, i){
      html += '<div class="zy-media-item"><div class="zy-media-h">Video '+(i+1)+'</div>'+
        '<video controls preload="metadata" class="zy-video" src="'+esc(vid.url)+'"></video>'+
        '<div class="zy-media-actions"><a href="'+esc(vid.url)+'" download="video_'+i+'.mp4" class="zy-dl-btn">⬇ DOWNLOAD</a></div></div>';
    });
    html += '</div>';
  }
  if(others.length){
    html += '<div class="zy-media-wrap"><div class="zy-media-title">🔗 LINK HASIL</div>';
    others.slice(0, 20).forEach(function(o, i){
      html += '<div class="zy-media-item"><div class="zy-url-preview">'+esc(o.url)+'</div>'+
        '<div class="zy-media-actions"><a href="'+esc(o.url)+'" download class="zy-dl-btn">⬇ DOWNLOAD</a>'+
        '<button class="zy-cp-btn" onclick="zyCp(\''+esc(o.url).replace(/'/g,"\\'")+'\')">📋 COPY</button></div></div>';
    });
    html += '</div>';
  }
  html += '<details class="zy-raw"><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(data,null,2))+'</pre></details>';
  html += '<button class="zy-copy" onclick="zyCopyJson(this)">📋 COPY JSON</button>';
  container.innerHTML = html;
  container.classList.remove('hd');
};

// ===== ZYVOR EXISTING =====
window.zyCp = function(u){ navigator.clipboard.writeText(u).then(function(){ alert('URL tersalin'); }); };
window.zyCopyJson = function(btn){ var pre = btn.parentElement.querySelector('.zy-raw pre'); if(pre) navigator.clipboard.writeText(pre.textContent).then(function(){ alert('JSON tersalin'); }); };

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
  if(out){
    var html = '<div class="zy-head">✓ SUKSES via <b>'+esc(out.api.name)+'</b></div>';
    html += '<details class="zy-raw" open><summary>RAW JSON</summary><pre>'+esc(JSON.stringify(out.result,null,2))+'</pre></details>';
    html += '<button class="zy-copy" onclick="zyCopyJson(this)">📋 COPY JSON</button>';
    res.innerHTML = html;
    res.classList.remove('hd');
  } else {
    res.innerHTML = '<div class="zy-head er">✗ SEMUA API GAGAL</div>';
    res.classList.remove('hd');
  }
};

// ===== DOWNLOADER =====
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

function isTikTokUrl(url){ if(!url) return false; return /tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/.test(url.toLowerCase()); }

window.zyRunDownloader = async function(){
  var api = DOWNLOADER_LIST.find(function(x){ return x.id===dlApi; });
  if(!api){ alert('Pilih API'); return; }
  var log = $id('dl-log'), res = $id('dl-result');
  if(log){ log.innerHTML=''; log.classList.remove('hd'); }
  if(res){ res.innerHTML=''; res.classList.add('hd'); }
  var urlEl = $id('dl-url');
  var url = urlEl ? urlEl.value.trim() : '';
  if(isTikTokUrl(url)){
    if(log){ var li = document.createElement('div'); li.className = 'in'; li.textContent = '🧠 Smart TikTok mode aktif'; log.appendChild(li); }
    var smart = await fetchTikTokSmart(url, log);
    if(smart) window.zyRenderDlResult(res, smart, url);
    else { res.innerHTML = '<div class="zy-head er">✗ Semua API TikTok gagal</div>'; res.classList.remove('hd'); }
    return;
  }
  var params = {};
  api.params.forEach(function(p){ var el = $id('dl-'+p); if(el && el.value.trim()) params[p] = el.value.trim(); });
  if(!Object.keys(params).length){ alert('Isi minimal 1 parameter'); return; }
  var out = await fetchWithFallback([api], params, log);
  if(out) window.zyRenderDlResult(res, { api:out.api, result:out.result, type:'generic', allVariants:null }, url);
  else { res.innerHTML = '<div class="zy-head er">✗ API GAGAL</div>'; res.classList.remove('hd'); }
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

window.zyRenderDlResult = function(container, smart, sourceUrl){
  var type = smart.type;
  var variants = smart.allVariants || extractTikTokVariants(smart.result);
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
  var videoHtml = '<div class="zy-head">✓ '+(type==='video'?'VIDEO':'SUKSES')+' via <b>'+esc(smart.api.name)+'</b></div>';
  if(variants.title || variants.author){
    videoHtml += '<div class="zy-meta">';
    if(variants.title) videoHtml += '<div class="zy-meta-t">'+esc(variants.title)+'</div>';
    if(variants.author) videoHtml += '<div class="zy-meta-a">'+esc(variants.author)+'</div>';
    if(variants.stats){ var st=[]; if(variants.stats.play) st.push('▶ '+variants.stats.play); if(variants.stats.like) st.push('❤ '+variants.stats.like); if(variants.stats.comment) st.push('💬 '+variants.stats.comment); if(variants.stats.share) st.push('↗ '+variants.stats.share); if(st.length) videoHtml += '<div class="zy-meta-s">'+st.join(' · ')+'</div>'; }
    videoHtml += '</div>';
  }
  videoHtml += '<div class="zy-variant-wrap">';
  if(variants.noWM) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.noWM)+'"></video><a href="'+esc(variants.noWM)+'" download="tiktok_nowm.mp4" class="zy-dl-btn zy-dl-full">⬇ NO WM</a></div>';
  if(variants.noWMHD) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.noWMHD)+'"></video><a href="'+esc(variants.noWMHD)+'" download="tiktok_nowm_hd.mp4" class="zy-dl-btn zy-dl-full">⬇ NO WM HD</a></div>';
  if(variants.wm) videoHtml += '<div class="zy-variant"><video controls preload="metadata" class="zy-video" src="'+esc(variants.wm)+'"></video><a href="'+esc(variants.wm)+'" download="tiktok_wm.mp4" class="zy-dl-btn zy-dl-full">⬇ WM</a></div>';
  if(variants.music) videoHtml += '<div class="zy-variant"><audio controls preload="metadata" class="zy-audio" src="'+esc(variants.music)+'"></audio><a href="'+esc(variants.music)+'" download="tiktok_music.mp3" class="zy-dl-btn zy-dl-full">⬇ MUSIC</a></div>';
  videoHtml += '</div>';
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

window.zyPreviewResult = function(){
  var res = $id('dl-result');
  if(!res || res.classList.contains('hd')){ alert('Belum ada hasil'); return; }
  res.scrollIntoView({behavior:'smooth', block:'start'});
  var firstMedia = res.querySelector('video, audio, img');
  if(firstMedia){
    var parent = firstMedia.closest('.zy-variant') || firstMedia.closest('.zy-media-item') || firstMedia.closest('.zy-slide-item-card');
    if(parent){ parent.style.transition = 'box-shadow .3s'; parent.style.boxShadow = '0 0 30px var(--ac)'; setTimeout(function(){ parent.style.boxShadow = ''; }, 1200); }
    try{ firstMedia.play && firstMedia.play(); }catch(e){}
  }
};
window.zyClearDownloader = function(){
  ['dl-url','dl-query','dl-track_id','dl-format','dl-quality','dl-fileType','dl-type','dl-action','dl-mode','dl-json'].forEach(function(id){ var el = $id(id); if(el) el.value = ''; });
  var log = $id('dl-log'), res = $id('dl-result');
  if(log){ log.innerHTML=''; log.classList.add('hd'); }
  if(res){ res.innerHTML=''; res.classList.add('hd'); }
};

// ===== AUTO-INIT =====
function __zyReady(){
  if(typeof window.initCustomSelect !== 'function'){ setTimeout(__zyReady, 80); return; }
  try{ if($id('bp-api-custom')) window.zyInitBypass(); }catch(e){}
  try{ if($id('dl-cat-custom')) window.zyInitDownloader(); }catch(e){}
  try{ if($id('apihub-cat')) window.zyInitApiHub(); }catch(e){}
}
if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', __zyReady); } else { __zyReady(); }

})();

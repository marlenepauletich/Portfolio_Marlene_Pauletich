// Idioma (ES/EN) y altura de la página.
// Cada texto traducible lleva su versión en inglés en data-en (puede tener <br>);
// el español es el contenido original del elemento. data-en-label traduce aria-label.
// El idioma lo decide el marco exterior (index.html) y llega por postMessage;
// si la página se abre sola, se usa la última elección guardada.
(function(){
  var KEY = 'siteLang';
  var current = null;

  function saved(){
    try { var v = localStorage.getItem(KEY); if (v === 'es' || v === 'en') return v; } catch(e){}
    return null;
  }

  function reportHeight(){
    try { parent.postMessage({ __siteHeight: Math.ceil(document.body.scrollHeight) }, '*'); } catch(e){}
  }

  function apply(lang){
    if (lang !== 'en') lang = 'es';
    current = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function(el){
      if (el.__es === undefined) el.__es = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.__es;
    });
    document.querySelectorAll('[data-en-label]').forEach(function(el){
      if (el.__esLabel === undefined) el.__esLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.getAttribute('data-en-label') : el.__esLabel);
    });
    // Páginas con mucho texto repetido (Home, Proyectos) definen window.__siteDict
    // { "texto en español": "English text" } y se traduce cada texto que coincida.
    var dict = window.__siteDict;
    if (dict) {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        var n = walker.currentNode, tag = n.parentNode && n.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') continue;
        if (n.__es === undefined) {
          var key = n.nodeValue.trim();
          if (!dict.hasOwnProperty(key)) continue;
          n.__es = n.nodeValue;
          n.__en = n.nodeValue.replace(key, dict[key]);
        }
        n.nodeValue = lang === 'en' ? n.__en : n.__es;
      }
    }
    var t = document.documentElement.getAttribute('data-title-en');
    if (t) {
      if (document.__esTitle === undefined) document.__esTitle = document.title;
      document.title = lang === 'en' ? t : document.__esTitle;
    }
    try { document.dispatchEvent(new CustomEvent('sitelang', { detail: lang })); } catch(e){}
    reportHeight();
  }
  window.__siteLang = function(){ return current; };

  window.addEventListener('message', function(ev){
    var d = ev.data;
    if (d && typeof d.__siteVH === 'number' && d.__siteVH > 0) {
      // alto de la ventana real (dentro del iframe 100vh no sirve): lo usan las portadas
      document.documentElement.style.setProperty('--site-vh', d.__siteVH + 'px');
    }
    if (d && (d.__siteLang === 'es' || d.__siteLang === 'en')) apply(d.__siteLang);
  });

  function init(){
    apply(saved() || current || 'es');
    try { if (parent !== window) parent.postMessage({ __siteLangReq: true }, '*'); } catch(e){}
    window.addEventListener('load', reportHeight);
    window.addEventListener('resize', reportHeight);
    [].forEach.call(document.images, function(img){ img.addEventListener('load', reportHeight); });
    if (document.fonts) document.fonts.ready.then(reportHeight);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

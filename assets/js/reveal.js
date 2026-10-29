// Entrada suave dos elementos ao rolar. O esconder e feito por JS (classe no
// <html> + atributo nos elementos), nunca pelo CSS sozinho: se este arquivo
// falhar ou nao rodar, a pagina aparece inteira, sem nada invisivel.
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // um grupo por seletor: os irmaos de cada grupo entram escalonados
  var grupos = [
    '.head', '.center.narrow', '.split > *',
    '.strip li',
    '.questions li',
    // o carrossel entra inteiro: as etapas 2-4 ficam fora da tela na horizontal
    // e, observadas uma a uma, so apareceriam no meio do arraste
    '.carousel',
    '.shift-head', '.shift li',
    '.who-item', '.not-for',
    '.bonus',
    '.offer-copy', '.offer-card', '.guarantee',
    '.faq details',
    '.motto', '.cta-block'
  ];

  var alvos = [];
  grupos.forEach(function(sel){
    var achados = document.querySelectorAll(sel);
    Array.prototype.forEach.call(achados, function(el, i){
      if(el.hasAttribute('data-reveal')) return;
      // a primeira tela aparece pronta: animar o hero so atrasa a primeira impressao
      if(el.closest('.hero')) return;
      el.setAttribute('data-reveal', '');
      // o atraso escalonado so vale entre irmaos do mesmo pai
      var irmaos = Array.prototype.filter.call(achados, function(o){
        return o.parentNode === el.parentNode;
      });
      var pos = irmaos.indexOf(el);
      if(pos > 0) el.style.transitionDelay = Math.min(pos, 5) * 0.12 + 's';
      alvos.push(el);
    });
  });

  if(!alvos.length) return;
  document.documentElement.classList.add('js-reveal');

  // depois de entrar, o elemento volta a ser um elemento comum: sem o atraso
  // escalonado e sem a transicao de entrada, que senao atrasariam os efeitos
  // dele mesmo (a borda do FAQ ao abrir, o hover dos cartoes)
  function solta(el){
    el.removeAttribute('data-reveal');
    el.classList.remove('visivel');
    el.style.transitionDelay = '';
  }
  function mostra(el){
    if(el.classList.contains('visivel')) return;
    el.classList.add('visivel');
    var atraso = parseFloat(el.style.transitionDelay) || 0;
    // linhas do "antes e depois": o risco vem depois que a linha assentou
    if(el.matches('.shift li')){
      el.style.setProperty('--risco-atraso', (atraso + 0.5) + 's');
      el.classList.add('riscado');
    }
    setTimeout(function(){ solta(el); }, (atraso + 0.9) * 1000);
  }

  var observador = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if(!e.isIntersecting) return;
      mostra(e.target);
      observador.unobserve(e.target);   // acontece uma vez so
    });
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.08});

  alvos.forEach(function(el){ observador.observe(el); });

  // rede de seguranca: o que ja estiver na tela aparece de imediato
  requestAnimationFrame(function(){
    alvos.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0){ mostra(el); observador.unobserve(el); }
    });
  });
})();

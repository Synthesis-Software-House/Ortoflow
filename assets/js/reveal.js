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
    '.step',
    '.shift li',
    '.who-item',
    '.bonus',
    '.offer-card', '.guarantee',
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
      if(pos > 0) el.style.transitionDelay = Math.min(pos, 5) * 0.1 + 's';
      alvos.push(el);
    });
  });

  if(!alvos.length) return;
  document.documentElement.classList.add('js-reveal');

  var observador = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('visivel');
      observador.unobserve(e.target);   // acontece uma vez so
    });
  }, {rootMargin: '0px 0px -8% 0px', threshold: 0.05});

  alvos.forEach(function(el){ observador.observe(el); });

  // rede de seguranca: o que ja estiver na tela aparece de imediato
  requestAnimationFrame(function(){
    alvos.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0) el.classList.add('visivel');
    });
  });
})();

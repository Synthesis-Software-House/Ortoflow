// Menu do topo. Duas coisas, ambas so de aparencia:
//  1. .rolou no <header> quando a pagina sai do topo: o menu fixo do desktop
//     fica mais baixo e ganha filete e sombra;
//  2. aria-current no link da secao que esta no meio da tela, para o leitor
//     saber onde esta. Sem este arquivo, o menu continua funcionando igual.
(function(){
  var topo = document.getElementById('topo');
  if(!topo) return;

  var agendado;
  function confere(){
    agendado = 0;
    topo.classList.toggle('rolou', window.scrollY > 8);
  }
  window.addEventListener('scroll', function(){
    if(!agendado) agendado = requestAnimationFrame(confere);
  }, {passive: true});
  confere();

  if(!('IntersectionObserver' in window)) return;
  var links = topo.querySelectorAll('.top-nav a[href^="#"]');
  var porId = {};
  Array.prototype.forEach.call(links, function(a){ porId[a.getAttribute('href').slice(1)] = a; });

  function marca(id){
    Array.prototype.forEach.call(links, function(a){ a.removeAttribute('aria-current'); });
    if(id && porId[id]) porId[id].setAttribute('aria-current', 'true');
  }

  // a faixa de observacao e uma linha no meio da tela: a secao que a cruza e a
  // atual. secoes sem id (beneficios, bonus...) mantem o link anterior aceso;
  // hero e oferta, que tem id mas nao estao no menu, apagam a marcacao
  var obs = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){ if(e.isIntersecting && e.target.id) marca(e.target.id); });
  }, {rootMargin: '-50% 0px -50% 0px'});
  Array.prototype.forEach.call(document.querySelectorAll('main > section'), function(s){
    obs.observe(s);
  });
})();

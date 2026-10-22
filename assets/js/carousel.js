// Carrossel do metodo. A rolagem horizontal e o swipe sao nativos (overflow-x
// + scroll-snap); este arquivo so acrescenta setas e bolinhas. Sem JS, a lista
// continua rolavel com o dedo e nenhum conteudo some.
(function(){
  var raiz = document.querySelector('[data-carousel]');
  if(!raiz) return;
  var trilho = raiz.querySelector('[data-carousel-track]');
  if(!trilho) return;

  var itens = trilho.children;
  if(itens.length < 2) return;

  // quantos cabem por vez, lido do proprio layout em vez de duplicar os breakpoints
  function porVez(){
    var largura = trilho.clientWidth;
    var item = itens[0].getBoundingClientRect().width;
    return Math.max(1, Math.round(largura / item));
  }
  function paginas(){ return Math.max(1, Math.ceil(itens.length / porVez())); }
  function paginaAtual(){
    var p = trilho.scrollLeft / Math.max(1, trilho.clientWidth);
    return Math.min(paginas() - 1, Math.max(0, Math.round(p)));
  }

  var nav = document.createElement('div');
  nav.className = 'carousel-nav';

  function botao(classe, rotulo, caminho){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'car-seta ' + classe;
    b.setAttribute('aria-label', rotulo);
    b.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">' +
                  '<path d="' + caminho + '" fill="none" stroke="currentColor" stroke-width="2.4" ' +
                  'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return b;
  }
  var ant = botao('car-ant', 'Ver etapas anteriores', 'M16 10H5M9 5L4 10l5 5');
  var prox = botao('car-prox', 'Ver próximas etapas', 'M4 10h11M11 5l5 5-5 5');

  var bolinhas = document.createElement('div');
  bolinhas.className = 'car-bolinhas';

  nav.appendChild(ant);
  nav.appendChild(bolinhas);
  nav.appendChild(prox);
  raiz.appendChild(nav);

  function vaPara(i){
    trilho.scrollTo({left: i * trilho.clientWidth, behavior: 'smooth'});
  }

  function montaBolinhas(){
    var total = paginas();
    bolinhas.textContent = '';
    for(var i = 0; i < total; i++){
      (function(i){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'car-bolinha';
        b.setAttribute('aria-label', 'Ir para a página ' + (i + 1) + ' de ' + total);
        b.addEventListener('click', function(){ vaPara(i); });
        bolinhas.appendChild(b);
      })(i);
    }
  }

  function atualiza(){
    var atual = paginaAtual(), total = paginas();
    var filhos = bolinhas.children;
    if(filhos.length !== total) montaBolinhas();
    for(var i = 0; i < bolinhas.children.length; i++){
      var ativo = i === atual;
      bolinhas.children[i].classList.toggle('ativo', ativo);
      bolinhas.children[i].setAttribute('aria-current', ativo ? 'true' : 'false');
    }
    ant.disabled = atual === 0;
    prox.disabled = atual >= total - 1;
    nav.hidden = total < 2;
  }

  ant.addEventListener('click', function(){ vaPara(paginaAtual() - 1); });
  prox.addEventListener('click', function(){ vaPara(paginaAtual() + 1); });

  var agendado;
  trilho.addEventListener('scroll', function(){
    if(agendado) return;
    agendado = requestAnimationFrame(function(){ agendado = 0; atualiza(); });
  }, {passive: true});

  var redimensiona;
  window.addEventListener('resize', function(){
    clearTimeout(redimensiona);
    redimensiona = setTimeout(atualiza, 150);
  });

  montaBolinhas();
  atualiza();
})();

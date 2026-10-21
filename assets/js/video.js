// fachada do video: nada do YouTube e carregado ate a pessoa clicar em play.
// o id do video fica no atributo data-yt de cada bloco .video
(function(){
  var blocos = document.querySelectorAll('.video[data-yt]');

  function abrir(bloco){
    var id = bloco.getAttribute('data-yt');
    if(!id || bloco.dataset.aberto) return;
    bloco.dataset.aberto = '1';

    var fr = document.createElement('iframe');
    fr.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
             '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    fr.title = 'Vídeo de apresentação do OrtoFlow';
    fr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    fr.allowFullscreen = true;
    fr.loading = 'lazy';

    bloco.textContent = '';
    bloco.appendChild(fr);
    fr.focus();
  }

  Array.prototype.forEach.call(blocos, function(bloco){
    var play = bloco.querySelector('.play');
    if(play) play.addEventListener('click', function(){ abrir(bloco); });
  });
})();

// Player do video de apresentacao, com controles proprios e minimos.
// Duas fontes possiveis no mesmo bloco .video:
//   data-mp4  arquivo proprio no <video> nativo: nenhuma marca de terceiros;
//   data-yt   YouTube pela IFrame API, com os controles dele desligados. O iframe
//             nao recebe toque e fica mais alto que a caixa (ver base.css), entao
//             titulo, canal, logo e sugestoes ficam fora da area visivel.
// Nada externo carrega antes do primeiro play.
(function(){
  var blocos = document.querySelectorAll('.video[data-yt], .video[data-mp4]');
  if(!blocos.length) return;

  var ICONE = {
    play:  '<path d="M6 4l11 6-11 6z" fill="currentColor"/>',
    pause: '<path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor"/>',
    som:   '<path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 7.5a3.5 3.5 0 010 5M15 5a7 7 0 010 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    mudo:  '<path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 8l4 4M17 8l-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    tela:  '<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function svg(nome){
    return '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">' + ICONE[nome] + '</svg>';
  }
  function botao(classe, rotulo, icone){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vp-btn ' + classe;
    b.setAttribute('aria-label', rotulo);
    b.innerHTML = svg(icone);
    return b;
  }
  function relogio(s){
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  // ---- fontes: as duas expoem a mesma interface pequena ----

  var apiYT;
  function carregaYT(){
    if(apiYT) return apiYT;
    apiYT = new Promise(function(ok){
      if(window.YT && window.YT.Player) return ok(window.YT);
      var anterior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function(){
        if(anterior) anterior();
        ok(window.YT);
      };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
    return apiYT;
  }

  function fonteYT(bloco, id, avisa){
    var alvo = document.createElement('div');
    bloco.insertBefore(alvo, bloco.firstChild);
    var p, pronto = false, querTocar = true;
    carregaYT().then(function(YT){
      p = new YT.Player(alvo, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        playerVars: {autoplay:1, controls:0, disablekb:1, fs:0, rel:0, iv_load_policy:3,
                     playsinline:1, modestbranding:1, cc_load_policy:0},
        events: {
          onReady: function(){
            pronto = true;
            var fr = p.getIframe();
            fr.title = 'Vídeo de apresentação do OrtoFlow';
            fr.setAttribute('tabindex', '-1');
            if(querTocar) p.playVideo();
            // iOS pode barrar o play que chega depois do carregamento da API.
            // se nao comecou, volta o botao para a pessoa tocar mais uma vez
            setTimeout(function(){
              var s = p.getPlayerState();
              if(s === YT.PlayerState.UNSTARTED || s === YT.PlayerState.CUED) avisa('pausado');
            }, 2500);
          },
          onStateChange: function(e){
            var S = YT.PlayerState;
            if(e.data === S.PLAYING) avisa('tocando');
            else if(e.data === S.PAUSED) avisa('pausado');
            else if(e.data === S.ENDED) avisa('fim');
          }
        }
      });
    });
    return {
      tocar: function(){ querTocar = true; if(pronto) p.playVideo(); },
      pausar: function(){ querTocar = false; if(pronto) p.pauseVideo(); },
      tempo: function(){ return pronto ? p.getCurrentTime() : 0; },
      duracao: function(){ return pronto ? p.getDuration() : 0; },
      ir: function(s){ if(pronto) p.seekTo(s, true); },
      mudo: function(v){ if(!pronto) return false; if(v === undefined) return p.isMuted(); v ? p.mute() : p.unMute(); return v; }
    };
  }

  function fonteMP4(bloco, src, avisa){
    var v = document.createElement('video');
    v.src = src;
    v.playsInline = true;
    v.preload = 'auto';
    var capa = bloco.querySelector('.cover');
    if(capa && capa.src) v.poster = capa.src;
    v.addEventListener('playing', function(){ avisa('tocando'); });
    v.addEventListener('pause', function(){ if(!v.ended) avisa('pausado'); });
    v.addEventListener('ended', function(){ avisa('fim'); });
    bloco.insertBefore(v, bloco.firstChild);
    return {
      tocar: function(){ var r = v.play(); if(r && r.catch) r.catch(function(){ avisa('pausado'); }); },
      pausar: function(){ v.pause(); },
      tempo: function(){ return v.currentTime; },
      duracao: function(){ return v.duration || 0; },
      ir: function(s){ v.currentTime = s; },
      mudo: function(m){ if(m !== undefined) v.muted = m; return v.muted; }
    };
  }

  // ---- interface: toque no video, barra fina embaixo ----

  function iniciar(bloco){
    if(bloco.dataset.aberto) return;
    bloco.dataset.aberto = '1';

    var play = bloco.querySelector('.play');
    var estado = 'carregando', relogioId, ociosoId;
    bloco.classList.add('vp-iniciado', 'vp-carregando');

    var tap = document.createElement('button');
    tap.type = 'button';
    tap.className = 'vp-tap';
    tap.setAttribute('aria-label', 'Pausar ou continuar o vídeo');

    var barra = document.createElement('div');
    barra.className = 'vp-barra';
    var bPlay = botao('vp-alterna', 'Pausar', 'pause');
    var trilho = document.createElement('div');
    trilho.className = 'vp-trilho';
    trilho.tabIndex = 0;
    trilho.setAttribute('role', 'slider');
    trilho.setAttribute('aria-label', 'Posição do vídeo');
    trilho.setAttribute('aria-valuemin', '0');
    trilho.innerHTML = '<i><b></b></i>';
    var cheio = trilho.querySelector('b');
    var tempo = document.createElement('span');
    tempo.className = 'vp-tempo';
    tempo.textContent = '0:00';
    var bSom = botao('vp-som', 'Tirar o som', 'som');
    var bTela = botao('vp-tela', 'Tela cheia', 'tela');
    var podeTela = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if(!podeTela) bTela.hidden = true;
    barra.append(bPlay, trilho, tempo, bSom, bTela);
    bloco.append(tap, barra);

    function avisa(novo){
      estado = novo;
      var tocando = novo === 'tocando';
      bloco.classList.remove('vp-carregando');
      bloco.classList.toggle('vp-tocando', tocando);
      if(tocando) bloco.classList.add('vp-comecou');
      bloco.classList.toggle('vp-pausado', !tocando);
      bPlay.innerHTML = svg(tocando ? 'pause' : 'play');
      bPlay.setAttribute('aria-label', tocando ? 'Pausar' : 'Continuar');
      if(play) play.setAttribute('aria-label', novo === 'fim' ? 'Assistir de novo' : 'Continuar o vídeo');
      clearInterval(relogioId);
      if(tocando){ relogioId = setInterval(atualiza, 250); acorda(); }
      else { bloco.classList.remove('vp-ocioso'); atualiza(); }
    }

    var fonte = bloco.dataset.mp4 ? fonteMP4(bloco, bloco.dataset.mp4, avisa)
                                  : fonteYT(bloco, bloco.dataset.yt, avisa);

    // o YouTube demora a refletir um salto feito com o video pausado. o alvo
    // guarda para onde fomos, para a barra responder na hora e para varios
    // toques seguidos na seta somarem em vez de partirem sempre do mesmo ponto
    var alvo = null, alvoId;
    function ir(s){
      alvo = Math.min(Math.max(0, s), fonte.duracao() || s);
      fonte.ir(alvo);
      clearTimeout(alvoId);
      alvoId = setTimeout(function(){ alvo = null; atualiza(); }, 600);
      atualiza();
    }
    function agora(){ return alvo !== null ? alvo : fonte.tempo(); }

    function atualiza(){
      var d = fonte.duracao(), t = agora();
      cheio.style.width = d ? (t / d * 100) + '%' : '0';
      tempo.textContent = relogio(t) + (d ? ' / ' + relogio(d) : '');
      trilho.setAttribute('aria-valuemax', String(Math.round(d)));
      trilho.setAttribute('aria-valuenow', String(Math.round(t)));
      trilho.setAttribute('aria-valuetext', relogio(t) + ' de ' + relogio(d));
    }
    function alterna(){
      if(estado === 'tocando') fonte.pausar();
      else { if(estado === 'fim') ir(0); fonte.tocar(); }
    }
    // a barra some depois de um tempo parada enquanto o video toca
    function acorda(){
      bloco.classList.remove('vp-ocioso');
      clearTimeout(ociosoId);
      ociosoId = setTimeout(function(){
        if(estado === 'tocando' && !barra.contains(document.activeElement)) bloco.classList.add('vp-ocioso');
      }, 2600);
    }

    // toque no video: se a barra estava escondida, o primeiro toque so a mostra
    tap.addEventListener('click', function(){
      if(bloco.classList.contains('vp-ocioso')) return acorda();
      alterna();
    });
    if(play) play.onclick = alterna;
    bPlay.addEventListener('click', alterna);
    bSom.addEventListener('click', function(){
      var m = fonte.mudo(!fonte.mudo());
      bSom.innerHTML = svg(m ? 'mudo' : 'som');
      bSom.setAttribute('aria-label', m ? 'Ligar o som' : 'Tirar o som');
    });
    bTela.addEventListener('click', function(){
      var cheia = document.fullscreenElement || document.webkitFullscreenElement;
      if(cheia) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (bloco.requestFullscreen || bloco.webkitRequestFullscreen).call(bloco);
    });
    bloco.addEventListener('pointermove', acorda);

    // arrastar ou tocar no trilho
    function posicao(e){
      var r = trilho.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * fonte.duracao();
    }
    trilho.addEventListener('pointerdown', function(e){
      trilho.setPointerCapture(e.pointerId);
      ir(posicao(e));
      function move(ev){ ir(posicao(ev)); acorda(); }
      function solta(){ trilho.removeEventListener('pointermove', move); trilho.removeEventListener('pointerup', solta); }
      trilho.addEventListener('pointermove', move);
      trilho.addEventListener('pointerup', solta);
    });
    trilho.addEventListener('keydown', function(e){
      var passo = {ArrowRight:5, ArrowLeft:-5, ArrowUp:5, ArrowDown:-5}[e.key];
      if(passo){ e.preventDefault(); ir(agora() + passo); acorda(); }
    });

    tap.focus({preventScroll:true});
  }

  // a capa ja vem no HTML (a primeira tela pede ela cedo, sem esperar este
  // arquivo). maxresdefault nem sempre existe; quando falta, o YouTube devolve
  // um placeholder de 120x90 ou um erro, e entao caimos para hqdefault, que
  // existe sempre. sem capa no HTML, ela e criada aqui.
  function capa(bloco, id){
    var img = bloco.querySelector('.cover');
    if(!img){
      img = document.createElement('img');
      img.className = 'cover';
      img.alt = '';
      img.decoding = 'async';
      bloco.insertBefore(img, bloco.firstChild);
    }
    // capa propria (data-poster) tem prioridade sobre a miniatura do YouTube
    if(bloco.dataset.poster){ img.src = bloco.dataset.poster; return; }
    if(!id) return;
    var reserva = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    function confere(){ if(img.naturalWidth <= 120 && img.src !== reserva) img.src = reserva; }
    img.addEventListener('error', function(){ if(img.src !== reserva) img.src = reserva; });
    img.addEventListener('load', confere);
    if(!img.getAttribute('src')) img.src = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
    else if(img.complete) confere();
  }

  Array.prototype.forEach.call(blocos, function(bloco){
    var id = bloco.getAttribute('data-yt');
    if(id || bloco.dataset.poster) capa(bloco, id);
    var play = bloco.querySelector('.play');
    if(play) play.onclick = function(){ iniciar(bloco); };
  });
})();

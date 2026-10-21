// barra fixa: aparece depois que o primeiro botão sai da tela e some na seção de oferta
(function(){
  var bar=document.getElementById('sticky');
  var first=document.querySelector('.hero .cta');
  var offer=document.getElementById('oferta');
  if(!bar||!first||!offer) return;
  function upd(){
    var vh=window.innerHeight, f=first.getBoundingClientRect(), o=offer.getBoundingClientRect();
    var pastHero=f.bottom<0, inOffer=o.top<vh*.85 && o.bottom>vh*.15;
    bar.classList.toggle('show', pastHero && !inOffer);
  }
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  upd();
})();

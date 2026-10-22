// o atributo name= nos <details> ja faz o acordeao exclusivo de forma nativa.
// este arquivo existe so para os navegadores antigos que ignoram esse atributo:
// sem ele, os sete cards abririam todos ao mesmo tempo.
(function(){
  if('name' in document.createElement('details')) return;

  var cards = document.querySelectorAll('.faq details[name]');
  Array.prototype.forEach.call(cards, function(card){
    card.addEventListener('toggle', function(){
      if(!card.open) return;
      Array.prototype.forEach.call(cards, function(outro){
        if(outro !== card && outro.open) outro.open = false;
      });
    });
  });
})();

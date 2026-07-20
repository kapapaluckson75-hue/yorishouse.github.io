
(function(){
  var cbtn=document.getElementById('copyUsdt');
  if(!cbtn) return;
  cbtn.addEventListener('click',function(){
    var addr='TBn1Y5ZmSGBdZnJD5HMg2mo8WL3QDh2zzN';
    var prev=cbtn.textContent;
    var done=function(){cbtn.textContent='copied ✦';setTimeout(function(){cbtn.textContent=prev;},1600);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(addr).then(done).catch(done);}else{done();}
  });
})();

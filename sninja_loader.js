if (self === top) {

    console.log('Sninja Starting Loading');
    [
      '958988c62bc0310043ce127c17da15df.cssdbx',
      'https://fonts.googleapis.com/css?family=Open+Sans'
    ].forEach(function(src) {
      var link = document.createElement('link');
      link.href = src;
      link.rel = 'stylesheet';
      link.type = 'text/css'
      document.head.appendChild(link);
    });

    [
      'jQuery-1.11.1.min.jsdbx',
      '//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.10.4/typeahead.bundle.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/2.0.0/handlebars.min.js',
      'sninja.jsdbx'
    ].forEach(function(src) {
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      document.head.appendChild(script);
    });

    setTimeout(function(){
        console.log('Sninja Finished Loading');
    },1);

}
 else {

   window.onkeydown = top.sninja.processEvent;

}
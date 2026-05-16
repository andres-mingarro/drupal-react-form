(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.wfwConnectAos = {
    attach: function (context) {
      once('wfw-connect-aos', 'body', context).forEach(function () {
        // Cascada: cards dentro de grids
        document.querySelectorAll('.grid-template--inner').forEach(function (grid) {
          grid.querySelectorAll('.card').forEach(function (el, index) {
            el.setAttribute('data-aos', 'fade-up');
            el.setAttribute('data-aos-delay', index * 100);
          });
        });

        // Cascada: sister profile details
        document.querySelectorAll('.section-sisters-profile--details').forEach(function (container) {
          container.querySelectorAll('.section-sisters-profile--detail').forEach(function (el, index) {
            el.setAttribute('data-aos-delay', index * 150);
          });
        });

        AOS.init({
          duration: 700,
          easing: 'ease-out-cubic',
          once: true,
          offset: 100,
          startEvent: 'load',
        });
      });
    }
  };
})(Drupal, once);

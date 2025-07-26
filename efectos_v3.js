/* TÍTULO PRINCIPAL CON EFECTO TYPED.JS PARA BORRADO Y ESCRITURA */

  // Esperamos 200 ms después de cargar la página para garantizar
  // que GHL ya montó el bloque Custom HTML con tu <span>
  setTimeout(function() {
    if (typeof Typed !== 'function' || !document.querySelector('#typed-text')) {
      console.warn('Typed.js o #typed-text no están listos aún');
      return;
    }
    new Typed('#typed-text', {
      strings: [
        'leads / clientes',
        'ventas / conversaciones',
        'agendas / pagos y oportunidades'
      ],
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 2000,
      startDelay: 500,
      loop: true,
      smartBackspace: true
    });
  }, 200);


/* ANIMACIONES CUADRÍCULA FUNCIONALIDADES */

  gsap.registerPlugin(ScrollTrigger);

  // Estado inicial (opcional si ya está en CSS)
  gsap.set(".functions-animation1", {
    opacity: 0,
    //y: 60,
    x: -30,
    visibility: "hidden"
  });
  
    // Estado inicial (opcional si ya está en CSS)
  gsap.set(".functions-animation2", {
    opacity: 0,
    //y: 60,
    x: 30,
    visibility: "hidden"
  });

ScrollTrigger.batch(".functions-animation1", {
  start: "top 95%", // antes estaba en 85%
  onEnter: batch => {
    gsap.to(batch, {
      opacity: 1,
      x: 0,
      visibility: "visible",
      stagger: 0.2,
      duration: 1.4,
      ease: "bounce.out"
    });
  },
  once: true
});

ScrollTrigger.batch(".functions-animation2", {
  start: "top 95%", // ajustado también
  onEnter: batch => {
    gsap.to(batch, {
      opacity: 1,
      x: 0,
      visibility: "visible",
      stagger: 0.2,
      duration: 1.4,
      ease: "bounce.out"
    });
  },
  once: true
});

setTimeout(() => {
  ScrollTrigger.refresh(); // recalcula posiciones
}, 500);
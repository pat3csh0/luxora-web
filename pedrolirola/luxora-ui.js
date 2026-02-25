/* =========================================================
   Luxora Lightbox + Swipe + Addons (preload / counter / center thumbs)
   - Requisitos HTML:
     - Contenedor de galería con clase: .lx-gallery-main
     - Imágenes dentro de: .photo-video-gallery-grid-item img
   - Este script crea el lightbox (#lxLightbox) si no existe.
   ========================================================= */

(function () {
  /* -----------------------------
     0) Helpers DOM
  ----------------------------- */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return [].slice.call((root || document).querySelectorAll(sel));
  }

  /* -----------------------------
     1) Crear/asegurar Lightbox en DOM
     - Inserta el HTML del overlay una sola vez
  ----------------------------- */
  function ensureLB() {
    var lb = document.getElementById("lxLightbox");
    if (lb) return lb;

    lb = document.createElement("div");
    lb.id = "lxLightbox";
    lb.innerHTML =
      '<div class="lx-stage" role="dialog" aria-modal="true">' +
      '  <button class="lx-btn lx-close" aria-label="Cerrar">✕</button>' +
      '  <button class="lx-btn lx-prev" aria-label="Anterior">‹</button>' +
      '  <img class="lx-mainimg" alt="">' +
      '  <button class="lx-btn lx-next" aria-label="Siguiente">›</button>' +
      '  <div class="lx-thumbs" aria-label="Miniaturas"></div>' +
      "</div>";

    document.body.appendChild(lb);
    return lb;
  }

  var lb = ensureLB();
  var stage = qs(".lx-stage", lb);
  var lbImg = qs(".lx-mainimg", lb);
  var thumbsWrap = qs(".lx-thumbs", lb);

  /* -----------------------------
     2) Estado interno del Lightbox
  ----------------------------- */
  var open = false;
  var idx = 0;
  var imgs = [];   // lista de <img> de la galería
  var thumbs = []; // lista de <img> miniaturas generadas
  var prevOverflow = null;

  /* -----------------------------
     3) Utilidades: recoger imágenes de la galería
  ----------------------------- */
  function collectImgs(root) {
    return qsa(".photo-video-gallery-grid-item img", root).filter(function (im) {
      return im && (im.currentSrc || im.src);
    });
  }

  /* -----------------------------
     4) Bloqueo/Desbloqueo de scroll de la página
  ----------------------------- */
  function lockScroll() {
    if (prevOverflow === null) prevOverflow = document.documentElement.style.overflow || "";
    document.documentElement.style.overflow = "hidden";
  }
  function unlockScroll() {
    document.documentElement.style.overflow = prevOverflow === null ? "" : prevOverflow;
    prevOverflow = null;
  }

  /* -----------------------------
     5) Miniaturas: marcar activa + centrar activa (scrollIntoView)
  ----------------------------- */
  function markActive() {
    thumbs.forEach(function (t, i) {
      t.classList.toggle("lx-active", i === idx);
    });

    // Centrado de miniatura activa en su carrusel
    var a = thumbs[idx];
    if (a && a.scrollIntoView) {
      try {
        a.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch (e) {
        // fallback para navegadores antiguos
        a.scrollIntoView(true);
      }
    }
  }

  /* -----------------------------
     6) Render de miniaturas (se recrean al abrir)
  ----------------------------- */
  function renderThumbs() {
    thumbsWrap.innerHTML = "";
    thumbs = imgs.map(function (im, n) {
      var t = document.createElement("img");
      t.src = im.currentSrc || im.src;
      t.alt = "Miniatura " + (n + 1);

      // Click en miniatura => ir a esa imagen
      t.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        show(n);
      });

      thumbsWrap.appendChild(t);
      return t;
    });
  }

  /* -----------------------------
     7) Estado cerrado "forzado" (anti-bloqueo)
     - Deja el overlay inerte cuando no está abierto
  ----------------------------- */
  function forceClosedState() {
    lb.classList.remove("lx-on");
    lb.style.display = "none";
    lb.style.pointerEvents = "none";
  }

  /* -----------------------------
     8) Mostrar una imagen en lightbox
     - Actualiza idx, src de la imagen principal y activa el overlay
  ----------------------------- */
  function show(n) {
    if (!imgs.length) return;

    idx = (n + imgs.length) % imgs.length;
    lbImg.src = imgs[idx].currentSrc || imgs[idx].src;

    lb.style.display = "block";
    lb.style.pointerEvents = "auto";
    lb.classList.add("lx-on");

    open = true;
    lockScroll();
    markActive();

    // Aviso para addons (contador/precarga) sin acoplar fuerte
    window.dispatchEvent(new CustomEvent("lx:changed", { detail: { index: idx, total: imgs.length } }));
  }

  /* -----------------------------
     9) Cerrar lightbox
  ----------------------------- */
  function hide() {
    open = false;
    unlockScroll();

    // Limpia imagen principal
    lbImg.src = "";

    forceClosedState();

    // Limpieza visual final (por si el navegador retiene estilos inline)
    requestAnimationFrame(function () {
      lb.style.display = "";
      lb.style.pointerEvents = "";
    });

    window.dispatchEvent(new Event("lx:closed"));
  }

  function next() {
    show(idx + 1);
  }
  function prev() {
    show(idx - 1);
  }

  /* -----------------------------
     10) Controles: botones (X / Prev / Next)
  ----------------------------- */
  qs(".lx-close", stage).addEventListener("click", function (e) {
    e.preventDefault();
    hide();
  });
  qs(".lx-next", stage).addEventListener("click", function (e) {
    e.preventDefault();
    next();
  });
  qs(".lx-prev", stage).addEventListener("click", function (e) {
    e.preventDefault();
    prev();
  });

  /* -----------------------------
     11) Cerrar SOLO al pulsar fondo (overlay)
     - Si clickas fuera del "stage" (el panel interno)
  ----------------------------- */
  lb.addEventListener("click", function (e) {
    if (e.target === lb) hide();
  });

  /* -----------------------------
     12) Teclado (cuando está abierto)
  ----------------------------- */
  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  });

  /* -----------------------------
     13) Puente de eventos (para swipe/addons externos si lo necesitas)
  ----------------------------- */
  window.addEventListener("lx:next", function () {
    var btn = lb.querySelector(".lx-next");
    if (btn) btn.click();
  });
  window.addEventListener("lx:prev", function () {
    var btn = lb.querySelector(".lx-prev");
    if (btn) btn.click();
  });

  /* -----------------------------
     14) Bind de la galería (solo .lx-gallery-main)
     - Captura click en items, abre lightbox y calcula índice correcto
  ----------------------------- */
  function bindGallery() {
    var root = qs(".lx-gallery-main");
    if (!root) return;

    // Evita duplicar bindings
    if (root.dataset.lxBound === "1") return;
    root.dataset.lxBound = "1";

    root.addEventListener(
      "click",
      function (e) {
        var item = e.target.closest(".photo-video-gallery-grid-item");
        if (!item) return;

        var img = item.querySelector("img");
        if (!img) return;

        e.preventDefault();

        try {
          imgs = collectImgs(root);
          if (!imgs.length) return;

          renderThumbs();

          var n = imgs.indexOf(img);
          show(n < 0 ? 0 : n);
        } catch (err) {
          hide();
        }
      },
      true
    );
  }

  /* -----------------------------
     15) Boot con reintentos (por si la galería carga tarde)
  ----------------------------- */
  function boot() {
    forceClosedState();
    bindGallery();
    setTimeout(bindGallery, 800);

    // Rebind “suave” si algún constructor de la página reemplaza nodos
    setTimeout(function () {
      var root = qs(".lx-gallery-main");
      if (root) root.dataset.lxBound = "0";
      bindGallery();
    }, 2000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* =========================================================
     16) SWIPE móvil para el lightbox (izq/der)
     - Gesto natural: deslizar a la izquierda => siguiente
     - Evita interferir con el scroll horizontal de miniaturas
     ========================================================= */
  (function initSwipe() {
    // Ajustes
    var THRESHOLD_X = 40; // mínimo desplazamiento horizontal
    var THRESHOLD_Y = 60; // si se mueve mucho vertical => no es swipe
    var MAX_TIME = 700;   // ms: swipe “rápido”

    var startX = 0,
      startY = 0,
      startT = 0;
    var tracking = false;

    function isOpen() {
      return lb.classList.contains("lx-on");
    }

    function goNext() {
      window.dispatchEvent(new Event("lx:next"));
    }
    function goPrev() {
      window.dispatchEvent(new Event("lx:prev"));
    }

    function onTouchStart(e) {
      if (!isOpen()) return;
      if (e.touches.length !== 1) return;

      // Si el gesto empieza en miniaturas => dejamos scroll de miniaturas
      var thumbsEl = e.target.closest && e.target.closest(".lx-thumbs");
      if (thumbsEl) return;

      tracking = true;
      startT = Date.now();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (!tracking || !isOpen()) return;
      if (e.touches.length !== 1) return;

      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;

      // Si claramente horizontal, prevenimos scroll vertical (sensación “nativa”)
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }

    function onTouchEnd(e) {
      if (!tracking || !isOpen()) return;
      tracking = false;

      var t = Date.now() - startT;
      if (t > MAX_TIME) return;

      var endX = (e.changedTouches && e.changedTouches[0].clientX) || startX;
      var endY = (e.changedTouches && e.changedTouches[0].clientY) || startY;

      var dx = endX - startX;
      var dy = endY - startY;

      if (Math.abs(dy) > THRESHOLD_Y) return;
      if (Math.abs(dx) < THRESHOLD_X) return;

      // Natural: swipe izquierda => siguiente
      if (dx < 0) goNext();
      else goPrev();
    }

    // passive:false en move para poder preventDefault
    lb.addEventListener("touchstart", onTouchStart, { passive: true });
    lb.addEventListener("touchmove", onTouchMove, { passive: false });
    lb.addEventListener("touchend", onTouchEnd, { passive: true });

    // Bonus: pointer events (touch)
    var pStartX = 0,
      pStartY = 0,
      pStartT = 0,
      pTracking = false;

    lb.addEventListener("pointerdown", function (e) {
      if (!isOpen()) return;
      if (e.pointerType !== "touch") return;
      var thumbsEl = e.target.closest && e.target.closest(".lx-thumbs");
      if (thumbsEl) return;

      pTracking = true;
      pStartT = Date.now();
      pStartX = e.clientX;
      pStartY = e.clientY;
    });

    lb.addEventListener("pointerup", function (e) {
      if (!pTracking || !isOpen()) return;
      pTracking = false;

      var t = Date.now() - pStartT;
      if (t > MAX_TIME) return;

      var dx = e.clientX - pStartX;
      var dy = e.clientY - pStartY;

      if (Math.abs(dy) > THRESHOLD_Y) return;
      if (Math.abs(dx) < THRESHOLD_X) return;

      if (dx < 0) goNext();
      else goPrev();
    });
  })();

  /* =========================================================
     17) ADDONS: precarga +/- , contador x/N, centrar miniatura activa
     - Precarga: carga en background la anterior y siguiente
     - Contador: “3 / 12” arriba
     - Centrado: refuerza scrollIntoView sobre la activa
     ========================================================= */
  (function initAddons() {
    if (!thumbsWrap || !lbImg) return;

    // Contador (se crea si no existe)
    var counter = lb.querySelector(".lx-counter");
    if (!counter) {
      counter = document.createElement("div");
      counter.className = "lx-counter";
      counter.textContent = "";
      (stage || lb).appendChild(counter);
    }

    // Cache simple para precargas (url -> Image)
    var preloadCache = new Map();

    function isOpen() {
      return lb.classList.contains("lx-on");
    }

    function getThumbs() {
      return Array.prototype.slice.call(thumbsWrap.querySelectorAll("img"));
    }

    // Permite “full url” si algún día añades data-full, data-src, etc.
    function getFullUrl(thumbImg) {
      return (
        thumbImg.getAttribute("data-full") ||
        (thumbImg.dataset && (thumbImg.dataset.full || thumbImg.dataset.src)) ||
        thumbImg.getAttribute("data-src") ||
        thumbImg.src
      );
    }

    function getActiveIndex(thumbList) {
      var i = thumbList.findIndex(function (t) {
        return t.classList.contains("lx-active");
      });

      // Fallback si no hay clase activa por cualquier motivo
      if (i < 0) {
        var mainSrc = lbImg.getAttribute("src") || "";
        i = thumbList.findIndex(function (t) {
          var u = getFullUrl(t);
          return u === mainSrc || (u && mainSrc && (u.indexOf(mainSrc) !== -1 || mainSrc.indexOf(u) !== -1));
        });
      }
      return i;
    }

    function centerActiveThumb(thumbList, i) {
      if (i < 0 || i >= thumbList.length) return;
      var el = thumbList[i];

      try {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } catch (e) {
        el.scrollIntoView(true);
      }
    }

    function preloadUrl(url) {
      if (!url || preloadCache.has(url)) return;

      var img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;

      preloadCache.set(url, img);

      // Limpieza simple (evitar crecer infinito)
      if (preloadCache.size > 30) {
        var firstKey = preloadCache.keys().next().value;
        preloadCache.delete(firstKey);
      }
    }

    function updateUI() {
      if (!isOpen()) return;

      var thumbList = getThumbs();
      var total = thumbList.length;

      if (!total) {
        counter.textContent = "";
        return;
      }

      var i = getActiveIndex(thumbList);

      // Contador “x / N”
      if (i >= 0) counter.textContent = i + 1 + " / " + total;
      else counter.textContent = total + " fotos";

      // Centrar miniatura activa
      if (i >= 0) centerActiveThumb(thumbList, i);

      // Precarga anterior/siguiente
      if (i >= 0) {
        var p = (i - 1 + total) % total;
        var n = (i + 1) % total;
        preloadUrl(getFullUrl(thumbList[p]));
        preloadUrl(getFullUrl(thumbList[n]));
      }
    }

    // Observa cambios en thumbs o en la imagen principal
    var mo = new MutationObserver(function () {
      window.clearTimeout(updateUI.__t);
      updateUI.__t = window.setTimeout(updateUI, 0);
    });

    mo.observe(thumbsWrap, { subtree: true, attributes: true, attributeFilter: ["class", "src", "data-full", "data-src"] });
    mo.observe(lbImg, { attributes: true, attributeFilter: ["src"] });
    mo.observe(lb, { attributes: true, attributeFilter: ["class"] });

    // También actualizar con nuestro evento de cambio
    window.addEventListener("lx:changed", function () {
      setTimeout(updateUI, 0);
    });

    // Si cierras, limpiamos el contador
    window.addEventListener("lx:closed", function () {
      counter.textContent = "";
    });

    // Primera ejecución
    updateUI();
  })();
})();
/* =======================================================
   FIX: html.lx-menu-open según estado real del overlay (GHL nav-menu-v2)
   - Permite ocultar la hamburguesa cuando el menú está abierto
   - Evita depender de aria-expanded (que a veces no cambia en tablets)
======================================================= */
(function () {
  function getDesktopMenu() {
    return document.querySelector('ul.nav-menu-ul.nav-menu-desktop');
  }

  function isMenuOpen(menuEl) {
    if (!menuEl) return false;

    // Cerrado típico en GHL
    if (menuEl.classList.contains("hide-popup")) return false;

    // Abierto real: overlay forzado (position fixed) y visible
    var cs = window.getComputedStyle(menuEl);
    return cs && cs.position === "fixed" && cs.display !== "none" && cs.visibility !== "hidden";
  }

  function syncHtmlClass() {
    var menuEl = getDesktopMenu();
    var open = isMenuOpen(menuEl);
    document.documentElement.classList.toggle("lx-menu-open", open);
  }

  // Sync inicial
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHtmlClass, { once: true });
  } else {
    syncHtmlClass();
  }

  // Sync por cambios comunes
  window.addEventListener("resize", syncHtmlClass, { passive: true });
  window.addEventListener("orientationchange", syncHtmlClass, { passive: true });

  // Observar cambios del UL (class/style) cuando abre/cierra
  var obs = new MutationObserver(function () {
    syncHtmlClass();
  });

  function attachObserver() {
    var menuEl = getDesktopMenu();
    if (menuEl) {
      obs.disconnect();
      obs.observe(menuEl, { attributes: true, attributeFilter: ["class", "style"] });
      syncHtmlClass();
      return true;
    }
    return false;
  }

  if (!attachObserver()) {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (attachObserver() || tries > 40) clearInterval(t);
    }, 100);
  }

  // Captura de clicks para sincronizar tras el handler nativo
  document.addEventListener(
    "click",
    function () {
      setTimeout(syncHtmlClass, 0);
    },
    true
  );
})();

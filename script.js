(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('a[data-nav]'));

  // Mobile menu
  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  // Smooth scroll for in-page links only; direct /#hash loads keep the instant native jump
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    var target = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (location.hash !== hash) history.pushState(null, '', hash);
    // Move focus like a native anchor jump so keyboard users continue from the target
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  });

  // Header shadow on scroll
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var hasIO = 'IntersectionObserver' in window;

  // Scroll-spy
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');

  // Stagger siblings inside the same grid so cards cascade instead of popping in together
  Array.prototype.forEach.call(reveals, function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    var index = siblings.indexOf(el);
    if (index > 0) el.style.setProperty('--reveal-delay', Math.min(index, 5) * 90 + 'ms');
  });

  // Once the entrance has played, drop the reveal class so each card's own hover transitions apply
  function settle(el) {
    var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
    setTimeout(function () {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
    }, 1000 + delay);
  }

  if (hasIO) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
          settle(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Subtle pointer parallax on the hero composition (fine pointers only, respects reduced motion)
  var heroVisual = document.querySelector('.hero-visual');
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroVisual && canHover && !reduceMotion) {
    var hero = heroVisual.closest('.hero');
    var frame = null;
    hero.addEventListener('pointermove', function (e) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        heroVisual.style.setProperty('--px', x.toFixed(3));
        heroVisual.style.setProperty('--py', y.toFixed(3));
        frame = null;
      });
    });
    hero.addEventListener('pointerleave', function () {
      heroVisual.style.setProperty('--px', 0);
      heroVisual.style.setProperty('--py', 0);
    });
  }

  // Servicios: accessible tabs on desktop, synced accordion on mobile
  var serviceCatalog = document.querySelector('[data-service-catalog]');
  if (serviceCatalog) {
    var serviceTabs = Array.prototype.slice.call(serviceCatalog.querySelectorAll('[data-service-tab]'));
    var servicePanels = Array.prototype.slice.call(serviceCatalog.querySelectorAll('[data-service-panel]'));
    var serviceTriggers = Array.prototype.slice.call(serviceCatalog.querySelectorAll('[data-service-accordion]'));
    var serviceAccordionPanels = Array.prototype.slice.call(serviceCatalog.querySelectorAll('[data-service-accordion-panel]'));

    function setService(name, focusTab) {
      serviceTabs.forEach(function (tab) {
        var active = tab.getAttribute('data-service-tab') === name;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });

      servicePanels.forEach(function (panel) {
        var active = panel.getAttribute('data-service-panel') === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });

      serviceTriggers.forEach(function (trigger) {
        var active = trigger.getAttribute('data-service-accordion') === name;
        trigger.classList.toggle('is-active', active);
        trigger.setAttribute('aria-expanded', String(active));
      });

      serviceAccordionPanels.forEach(function (panel) {
        var active = panel.getAttribute('data-service-accordion-panel') === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    }

    serviceTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        setService(tab.getAttribute('data-service-tab'), false);
      });

      tab.addEventListener('keydown', function (e) {
        var nextIndex = index;
        if (e.key === 'ArrowRight') nextIndex = (index + 1) % serviceTabs.length;
        else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + serviceTabs.length) % serviceTabs.length;
        else if (e.key === 'Home') nextIndex = 0;
        else if (e.key === 'End') nextIndex = serviceTabs.length - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setService(tab.getAttribute('data-service-tab'), false);
          return;
        } else {
          return;
        }

        e.preventDefault();
        setService(serviceTabs[nextIndex].getAttribute('data-service-tab'), true);
      });
    });

    serviceTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        setService(trigger.getAttribute('data-service-accordion'), false);
      });
    });

    setService('marketing', false);
  }

  // Contact form: builds a WhatsApp message with the lead details.
  var form = document.getElementById('contact-form');
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.willValidate) return;
      var field = el.closest('.field');
      var ok = el.checkValidity();
      if (field) field.classList.toggle('has-error', !ok);
      if (!ok && !firstInvalid) firstInvalid = el;
    });

    status.classList.remove('is-success', 'is-error');
    if (firstInvalid) {
      status.textContent = 'Revisa los campos marcados para continuar.';
      status.classList.add('is-error');
      firstInvalid.focus();
      return;
    }

    var data = new FormData(form);
    var message = [
      'Hola Mercamood, quiero cotizar un proyecto.',
      '',
      'Nombre: ' + (data.get('nombre') || ''),
      'Teléfono / WhatsApp: ' + (data.get('telefono') || ''),
      'Correo: ' + (data.get('correo') || ''),
      'Empresa o marca: ' + (data.get('empresa') || 'No especificada'),
      'Servicio de interés: ' + (data.get('servicio') || ''),
      'Cómo nos conoció: ' + (data.get('origen') || 'No especificado'),
      '',
      'Mensaje:',
      data.get('mensaje') || ''
    ].join('\n');
    var whatsappUrl = 'https://wa.me/9515779935?text=' + encodeURIComponent(message);

    status.classList.add('is-success');
    var opened = window.open(whatsappUrl, '_blank', 'noopener');
    if (opened) {
      status.textContent = 'Abrimos WhatsApp con tu mensaje listo para enviar.';
    } else {
      status.textContent = 'Te llevamos a WhatsApp para enviar tu mensaje.';
      window.location.href = whatsappUrl;
    }
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

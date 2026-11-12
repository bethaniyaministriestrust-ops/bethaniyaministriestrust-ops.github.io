(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.querySelector('[data-intro]');
  const introProgress = document.querySelector('[data-intro-progress]');
  const skipIntro = document.querySelector('[data-skip-intro]');
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('.site-nav');
  const introDurationToken = getComputedStyle(document.documentElement).getPropertyValue('--motion-intro').trim();
  const introDurationValue = Number.parseFloat(introDurationToken);
  const introDuration = introDurationToken.endsWith('ms') ? introDurationValue : introDurationValue * 1000;
  let introSkipped = false;
  let introComplete = false;
  let introStartedAt = 0;
  let introElapsed = 0;
  let introFrame = 0;

  document.documentElement.classList.add('has-js');

  const setProgress = (amount) => {
    if (!introProgress) return;
    const progress = Math.max(0, Math.min(1, amount));
    introProgress.style.transform = 'scaleX(' + progress + ')';
  };

  const revealVerse = () => {
    intro?.classList.add('is-revealed');
  };

  const advanceIntro = (now) => {
    introFrame = 0;
    const elapsed = introElapsed + now - introStartedAt;
    const progress = Math.min(1, elapsed / introDuration);
    setProgress(progress);
    if (progress >= 0.7) revealVerse();
    if (progress >= 1) {
      introElapsed = introDuration;
      introComplete = true;
      revealVerse();
      return;
    }
    introFrame = window.requestAnimationFrame(advanceIntro);
  };

  const playIntro = () => {
    if (!intro || introSkipped || introComplete || reducedMotion) return;
    intro.classList.remove('is-paused');
    intro.classList.add('is-playing');
    if (introFrame) return;
    introStartedAt = performance.now();
    introFrame = window.requestAnimationFrame(advanceIntro);
  };

  const pauseIntro = () => {
    if (!intro) return;
    intro.classList.add('is-paused');
    if (!introFrame) return;
    window.cancelAnimationFrame(introFrame);
    introFrame = 0;
    introElapsed += performance.now() - introStartedAt;
  };

  if (intro && !reducedMotion) {
    if ('IntersectionObserver' in window) {
      const introObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) playIntro();
        else pauseIntro();
      }, { threshold: 0.1 });
      introObserver.observe(intro);
    } else {
      playIntro();
    }
  } else {
    pauseIntro();
    revealVerse();
    setProgress(1);
  }

  const closeNavigation = (restoreFocus = false) => {
    if (!navToggle || !header) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.querySelector('.sr-only').textContent = 'Open navigation';
    header.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    if (restoreFocus) navToggle.focus();
  };

  navToggle?.addEventListener('click', () => {
    const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(willOpen));
    navToggle.querySelector('.sr-only').textContent = willOpen ? 'Close navigation' : 'Open navigation';
    header?.classList.toggle('nav-open', willOpen);
    document.body.classList.toggle('nav-open', willOpen);
  });

  nav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNavigation(true);
  });

  document.addEventListener('click', (event) => {
    if (!header?.classList.contains('nav-open')) return;
    if (!header.contains(event.target)) closeNavigation();
  });

  skipIntro?.addEventListener('click', () => {
    introSkipped = true;
    introComplete = true;
    pauseIntro();
    setProgress(1);
    revealVerse();
    const mission = document.querySelector('#mission');
    mission?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
    mission?.querySelector('h2')?.focus({ preventScroll: true });
  });

  let headerTick = false;
  window.addEventListener('scroll', () => {
    if (headerTick) return;
    headerTick = true;
    window.requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 32);
      headerTick = false;
    });
  }, { passive: true });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const sectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector('.site-nav a[href="#' + entry.target.id + '"]');
          if (!link) return;
          if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-30% 0px -58% 0px', threshold: 0 })
    : null;
  document.querySelectorAll('[data-section]').forEach((section) => sectionObserver?.observe(section));

  window.addEventListener('pagehide', pauseIntro, { once: true });
})();

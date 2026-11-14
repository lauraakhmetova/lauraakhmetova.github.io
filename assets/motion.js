(() => {
  'use strict';
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const safeGet = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };

  // Inline SVG keeps the artwork available even when the site is opened from disk.
  const bow = () => `<svg class="bow-art" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g class="bow-tail bow-tail-left"><path class="bow-shape" d="M213 225 C187 258 153 306 112 354 C98 370 88 382 79 390 C109 383 133 381 157 385 C167 403 172 421 174 443 C190 415 213 374 230 334 C247 294 251 261 247 229 Z"/></g>
    <g class="bow-tail bow-tail-right"><path class="bow-shape" d="M254 225 C277 262 307 307 341 350 C356 369 371 383 391 397 C365 391 342 391 320 398 C309 414 301 430 295 449 C280 419 265 386 252 347 C239 310 232 268 233 233 Z"/></g>
    <g class="bow-loop bow-loop-left"><path class="bow-shape" d="M228 203 C198 185 171 146 137 129 C107 114 78 112 62 128 C42 148 53 180 68 200 C89 230 133 242 173 235 C197 231 216 222 230 219 Z"/><path class="bow-crease" d="M88 153 C122 156 162 176 204 205 M97 211 C133 215 169 214 204 211"/></g>
    <g class="bow-loop bow-loop-right"><path class="bow-shape" d="M250 204 C277 180 299 145 333 127 C363 111 393 112 410 129 C431 150 420 182 402 203 C379 230 339 241 301 235 C278 231 262 224 247 219 Z"/><path class="bow-crease" d="M385 153 C352 156 315 178 271 205 M378 211 C342 215 309 214 273 211"/></g>
    <path class="bow-knot bow-shape" d="M225 193 C232 188 245 188 253 194 C260 201 261 215 255 224 C248 230 233 231 225 225 C219 217 219 201 225 193 Z"/>
  </svg>`;

  const inject = (el, extra = '') => { el.innerHTML = `<span class="bow-inner ${extra}">${bow()}</span>`; };
  const heroes = [...document.querySelectorAll('[data-bow="hero"]')];
  heroes.forEach(el => inject(el));
  document.querySelectorAll('[data-bow-variant]').forEach(el => {
    inject(el);
    el.classList.add('bow-preview');
    el.setAttribute('data-motion', el.dataset.bowVariant);
  });
  document.querySelectorAll('.bow-button').forEach(el => {
    const decoration = document.createElement('span');
    decoration.className = 'bow-button-art';
    decoration.setAttribute('aria-hidden', 'true');
    decoration.innerHTML = bow().repeat(5);
    el.prepend(decoration);
  });

  const themeButton = document.querySelector('#theme-toggle');
  const setTheme = (theme) => {
    body.dataset.theme = theme;
    if (themeButton) {
      const pink = theme === 'pink';
      themeButton.setAttribute('aria-pressed', String(pink));
      themeButton.setAttribute('aria-label', pink ? 'Включить тёмную тему' : 'Включить розовую тему');
      themeButton.title = pink ? 'Включить тёмную тему' : 'Включить розовую тему';
    }
  };
  setTheme(safeGet('laura-theme') === 'pink' ? 'pink' : 'dark');
  themeButton?.addEventListener('click', () => {
    const next = body.dataset.theme === 'pink' ? 'dark' : 'pink';
    setTheme(next); safeSet('laura-theme', next);
  });

  const motionButtons = [...document.querySelectorAll('[data-select-motion]')];
  const descriptions = {
    sway: 'Ленты мягко покачиваются.',
    draw: 'Бант постепенно завязывается.',
    follow: 'Бант откликается на движение.'
  };
  motionButtons.forEach(el => {
    const badge = document.createElement('span');
    badge.className = 'motion-selected-label';
    badge.textContent = 'Выбрано';
    badge.setAttribute('aria-hidden', 'true');
    el.append(badge);
    const description = document.createElement('p');
    description.className = 'motion-description';
    description.textContent = descriptions[el.dataset.selectMotion] || '';
    el.after(description);
  });
  const setMotion = (mode) => {
    if (!['sway', 'draw', 'follow'].includes(mode)) mode = 'sway';
    heroes.forEach(el => { el.dataset.motion = mode; });
    motionButtons.forEach(el => {
      const selected = el.dataset.selectMotion === mode;
      el.classList.toggle('is-selected', selected);
      el.setAttribute('aria-pressed', String(selected));
    });
    safeSet('laura-motion', mode);
  };
  setMotion(safeGet('laura-motion') || 'sway');
  motionButtons.forEach(el => el.addEventListener('click', () => setMotion(el.dataset.selectMotion)));

  // Only update while a pointer is interacting; no continuous animation loop.
  const interactives = [...heroes, ...document.querySelectorAll('[data-bow-variant="follow"]')];
  interactives.forEach(el => {
    const move = (x, y) => {
      if (reduce.matches || (el.dataset.bow === 'hero' && el.dataset.motion !== 'follow')) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = Math.max(-1, Math.min(1, (x - rect.left - rect.width / 2) / (rect.width / 2)));
      const dy = Math.max(-1, Math.min(1, (y - rect.top - rect.height / 2) / (rect.height / 2)));
      el.style.setProperty('--bow-x', `${dx * 12}px`);
      el.style.setProperty('--bow-y', `${dy * 10}px`);
      el.style.setProperty('--bow-tilt', `${dx * 9}deg`);
    };
    const reset = () => { el.style.removeProperty('--bow-x'); el.style.removeProperty('--bow-y'); el.style.removeProperty('--bow-tilt'); };
    const target = el.dataset.bow === 'hero' ? document : el;
    const inHero = e => {
      if (target !== document) return true;
      const area = el.parentElement.getBoundingClientRect();
      return e.clientX >= area.left && e.clientX <= area.right && e.clientY >= area.top && e.clientY <= area.bottom;
    };
    target.addEventListener('pointermove', e => { if ((finePointer.matches || e.pointerType === 'touch') && inHero(e)) move(e.clientX, e.clientY); else reset(); }, { passive: true });
    target.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && inHero(e)) move(e.clientX, e.clientY); }, { passive: true });
    target.addEventListener('pointerleave', reset, { passive: true });
    target.addEventListener('pointerup', reset, { passive: true });
    target.addEventListener('pointercancel', reset, { passive: true });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('bow-in-view', entry.isIntersecting);
    }), { rootMargin: '120px' });
    document.querySelectorAll('[data-bow], [data-bow-variant]').forEach(el => observer.observe(el));
    body.classList.add('bow-observed');
  }
  // The page is fully visible by default. Only prepare offscreen elements after
  // the observer is installed; an anchor jump or fast scroll still reveals them.
  if ('IntersectionObserver' in window && !reduce.matches) {
    const targets = [...document.querySelectorAll('.section-head, .project-card, .experience, .about-grid > *, .skill, .contact > *')];
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0, rootMargin: '0px 0px -30px 0px' });
    targets.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      if (rect.bottom <= 0) return;
      el.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 70}ms`);
      el.classList.add('js-reveal');
      revealObserver.observe(el);
    });
    // Fail safe if the observer never delivers (for example after a history jump).
    window.setTimeout(() => targets.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-revealed');
    }), 1500);
  }
  if (!reduce.matches) {
    const loader = document.createElement('div');
    loader.className = 'bow-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = `<div class="bow-loader-mark">${bow()}<span>LAURA</span></div>`;
    body.append(loader);
    window.setTimeout(() => loader.classList.add('is-finished'), 850);
    window.setTimeout(() => loader.remove(), 1350);
  }
})();

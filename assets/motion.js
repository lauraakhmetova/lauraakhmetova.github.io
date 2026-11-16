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

  const heroBow = document.querySelector('[data-bow="hero"]');
  const hero = heroBow?.closest('.hero');
  if (hero && heroBow) {
    heroBow.innerHTML = `<span class="bow-inner">${bow()}</span>`;
    hero.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduce.matches || !heroBow.offsetWidth) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      heroBow.style.setProperty('--bow-x', `${x * 12}px`);
      heroBow.style.setProperty('--bow-y', `${y * 10}px`);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      heroBow.style.removeProperty('--bow-x');
      heroBow.style.removeProperty('--bow-y');
    });
  }

  document.querySelectorAll('.project-card[data-hover-image]').forEach(card => {
    const media = card.querySelector('.project-media');
    const source = card.dataset.hoverImage;
    if (!media || !source || card.dataset.hoverPreview === 'off') return;

    let requested = false;
    let loaded = false;
    let hovering = false;
    let focused = false;

    const update = () => {
      const active = hovering || focused;
      card.classList.toggle('show-project-alt', active && loaded);
      if (!active || requested) return;

      requested = true;
      const image = document.createElement('img');
      image.className = 'project-image project-image-alt';
      image.alt = '';
      image.decoding = 'async';
      image.setAttribute('aria-hidden', 'true');
      image.addEventListener('load', () => {
        loaded = true;
        update();
      }, { once: true });
      image.addEventListener('error', () => {
        image.remove();
        requested = false;
      }, { once: true });
      media.append(image);
      image.src = source;
    };

    card.addEventListener('pointerenter', event => {
      if (!finePointer.matches || event.pointerType === 'touch') return;
      hovering = true;
      update();
    });
    card.addEventListener('pointerleave', () => { hovering = false; update(); });
    card.addEventListener('focus', () => { focused = card.matches(':focus-visible'); update(); });
    card.addEventListener('blur', () => { focused = false; update(); });
  });
})();

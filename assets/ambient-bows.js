(() => {
  'use strict';
  const start = document.querySelector('#experience');
  const footer = document.querySelector('footer');
  if (!start || !footer) return;
  const layer = document.createElement('div');
  layer.className = 'ambient-bows';
  layer.setAttribute('aria-hidden', 'true');
  // The same ribbon outline as the hero, reduced to two offset marks per tile.
  const ribbon = `<path d="M213 225 C187 258 153 306 112 354 C98 370 88 382 79 390 C109 383 133 381 157 385 C167 403 172 421 174 443 C190 415 213 374 230 334 C247 294 251 261 247 229 Z M254 225 C277 262 307 307 341 350 C356 369 371 383 391 397 C365 391 342 391 320 398 C309 414 301 430 295 449 C280 419 265 386 252 347 C239 310 232 268 233 233 Z M228 203 C198 185 171 146 137 129 C107 114 78 112 62 128 C42 148 53 180 68 200 C89 230 133 242 173 235 C197 231 216 222 230 219 Z M250 204 C277 180 299 145 333 127 C363 111 393 112 410 129 C431 150 420 182 402 203 C379 230 339 241 301 235 C278 231 262 224 247 219 Z M225 193 C232 188 245 188 253 194 C260 201 261 215 255 224 C248 230 233 231 225 225 C219 217 219 201 225 193 Z"/>`;
  const pattern = color => `<svg xmlns="http://www.w3.org/2000/svg" width="410" height="400" viewBox="0 0 410 400"><g fill="none" stroke="${color}" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"><g transform="translate(73 38) rotate(-12 9 9) scale(.045)">${ribbon}</g><g transform="translate(282 239) rotate(13 9 9) scale(.037)">${ribbon}</g></g></svg>`;
  const updateTheme = () => {
    const color = document.body.dataset.theme === 'pink' ? '#fffaf5' : '#eab3ca';
    layer.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(pattern(color))}")`;
  };
  const place = () => {
    const height = window.innerHeight;
    const top = Math.max(0, Math.min(height, start.getBoundingClientRect().top));
    const bottom = Math.max(0, Math.min(height, height - footer.getBoundingClientRect().bottom));
    layer.style.setProperty('--ambient-cut-top', `${top}px`);
    layer.style.setProperty('--ambient-cut-bottom', `${bottom}px`);
  };
  document.body.prepend(layer);
  updateTheme();
  place();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(place);
    observer.observe(document.querySelector('main') || start);
    observer.observe(footer);
  }
  window.addEventListener('resize', place, { passive: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendingFrame = 0;
  const updateShift = () => {
    pendingFrame = 0;
    place();
    layer.style.setProperty('--ambient-shift', reducedMotion.matches ? '0px' : `${Math.sin(window.scrollY / 600) * 14}px`);
  };
  const onScroll = () => {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateShift);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  reducedMotion.addEventListener('change', updateShift);
  updateShift();
  new MutationObserver(updateTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
})();

(() => {
  const field = document.querySelector('.bow-field');
  const footer = document.querySelector('footer');
  if (!field) return;

  const measureFooter = () => {
    if (footer) field.style.setProperty('--bow-footer-height', `${footer.getBoundingClientRect().height}px`);
  };
  measureFooter();
  if (footer && 'ResizeObserver' in window) new ResizeObserver(measureFooter).observe(footer);
  window.addEventListener('resize', measureFooter, { passive: true });
  window.addEventListener('load', measureFooter, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(measureFooter);

  if (!('IntersectionObserver' in window)) {
    field.classList.add('is-visible');
    return;
  }
  const observer = new IntersectionObserver(entries => {
    field.classList.toggle('is-visible', entries[0].isIntersecting);
  }, { threshold: 0 });
  observer.observe(field);
})();

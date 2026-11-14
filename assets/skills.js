(() => {
  const panel = document.getElementById('skills');
  if (!panel || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...panel.querySelectorAll('.skill-card')];
  panel.classList.add('skills-animate');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  cards.forEach(card => observer.observe(card));
})();

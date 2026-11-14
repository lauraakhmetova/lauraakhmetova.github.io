document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('.strip-shell');
  const button = document.querySelector('.strip-pause');
  if (!shell || !button) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...shell.querySelectorAll('video')];
  let userPaused = false;
  let inView = false;

  const sync = () => {
    const paused = userPaused || reducedMotion.matches || !inView || document.hidden;
    shell.classList.toggle('is-paused', userPaused || reducedMotion.matches);
    shell.classList.toggle('is-out-of-view', !inView || document.hidden);
    videos.forEach(video => {
      if (paused) video.pause();
      else video.play().catch(() => {});
    });
  };

  button.addEventListener('click', () => {
    userPaused = !userPaused;
    button.setAttribute('aria-pressed', String(userPaused));
    button.textContent = userPaused ? 'Продолжить ленту' : 'Пауза ленты';
    sync();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 });
    observer.observe(shell);
  } else {
    inView = true;
  }
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
  sync();
});

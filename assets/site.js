document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('.strip-shell');
  const button = document.querySelector('.strip-pause');
  const strip = shell?.querySelector('.strip');
  if (!strip || !button) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...strip.querySelectorAll('video')];
  const lookahead = 120;
  const nearbyVideos = new Set();
  const visibleVideos = new Set();
  let userPaused = false;
  let inView = false;

  const sync = () => {
    const motionPaused = userPaused || reducedMotion.matches;
    const outOfView = !inView || document.hidden;
    const paused = motionPaused || outOfView;
    shell.classList.toggle('is-paused', motionPaused);
    shell.classList.toggle('is-out-of-view', outOfView);

    videos.forEach(video => {
      const visible = visibleVideos.has(video);
      if (!paused && (visible || nearbyVideos.has(video)) && video.dataset.src) {
        video.preload = 'auto';
        video.src = video.dataset.src;
        delete video.dataset.src;
      }

      if (paused || !visible) {
        if (!video.paused) video.pause();
      } else if (video.paused) {
        video.play().catch(() => {});
      }
    });
  };

  button.addEventListener('click', () => {
    userPaused = !userPaused;
    button.setAttribute('aria-pressed', String(userPaused));
    button.textContent = userPaused ? 'Продолжить ленту' : 'Пауза ленты';
    sync();
  });

  if (typeof IntersectionObserver === 'function') {
    const stripObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    stripObserver.observe(strip);

    const observeVideos = (intersectingVideos, rootMargin) => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) intersectingVideos.add(target);
          else intersectingVideos.delete(target);
        });
        sync();
      }, { root: strip, rootMargin });
      videos.forEach(video => observer.observe(video));
    };
    observeVideos(nearbyVideos, `0px ${lookahead}px`);
    observeVideos(visibleVideos, '0px');
  } else {
    const measure = () => {
      if (document.hidden) return;

      const stripBounds = strip.getBoundingClientRect();
      inView = stripBounds.bottom > 0 && stripBounds.top < window.innerHeight;
      if (inView) {
        nearbyVideos.clear();
        visibleVideos.clear();
        videos.forEach(video => {
          const { left, right } = video.getBoundingClientRect();
          if (right > stripBounds.left - lookahead && left < stripBounds.right + lookahead) {
            nearbyVideos.add(video);
          }
          if (right > stripBounds.left && left < stripBounds.right) visibleVideos.add(video);
        });
      }
      sync();
    };
    measure();
    window.setInterval(measure, 250);
  }

  document.addEventListener('visibilitychange', sync);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', sync);
  else reducedMotion.addListener(sync);
  sync();
});

document.addEventListener('DOMContentLoaded', () => {
  const strip = document.querySelector('.strip');
  if (!strip) return;

  let drag;
  strip.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !event.target.closest('.strip-track')) return;
    if (strip.scrollWidth <= strip.clientWidth) return;

    drag = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: strip.scrollLeft };
    strip.setPointerCapture(event.pointerId);
    strip.classList.add('is-dragging');
  });

  strip.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    strip.scrollLeft = drag.scrollLeft + drag.startX - event.clientX;
  });

  strip.addEventListener('lostpointercapture', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = undefined;
    strip.classList.remove('is-dragging');
  });

  strip.addEventListener('dragstart', event => event.preventDefault());

  strip.addEventListener('keydown', event => {
    if (event.target !== strip || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (strip.scrollWidth <= strip.clientWidth) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const step = Math.min(strip.clientWidth * 0.75, 360);
        strip.scrollLeft += event.key === 'ArrowLeft' ? -step : step;
        break;
      }
      case 'Home':
        strip.scrollLeft = 0;
        break;
      case 'End':
        strip.scrollLeft = strip.scrollWidth - strip.clientWidth;
        break;
      default:
        return;
    }
    event.preventDefault();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...strip.querySelectorAll('video')];
  const lookahead = 120;
  const nearbyVideos = new Set();
  const visibleVideos = new Set();
  let inView = false;

  const sync = () => {
    const paused = reducedMotion.matches || document.hidden || !inView;

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

  let refresh = sync;
  if (typeof IntersectionObserver === 'function') {
    const stripObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    stripObserver.observe(strip);

    const observeVideos = (intersectingVideos, options) => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) intersectingVideos.add(target);
          else intersectingVideos.delete(target);
        });
        sync();
      }, options);
      videos.forEach(video => observer.observe(video));
    };
    observeVideos(nearbyVideos, { root: strip, rootMargin: `0px ${lookahead}px` });
    observeVideos(visibleVideos);
  } else {
    refresh = () => {
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
    strip.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
  }

  document.addEventListener('visibilitychange', refresh);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', refresh);
  else reducedMotion.addListener(refresh);
  refresh();
});

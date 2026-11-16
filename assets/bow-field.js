(() => {
  const field = document.querySelector('.bow-field');
  const title = field?.querySelector('.bow-field-title');
  const footer = document.querySelector('footer');
  if (!field || !title) return;
  const bows = [...field.querySelectorAll('.field-bow')];
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, pointer = null, frame = 0, layout = [];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const measure = () => {
    if (footer) field.style.setProperty('--bow-footer-height', `${footer.getBoundingClientRect().height}px`);
    const rect = field.getBoundingClientRect(), text = title.getBoundingClientRect();
    const w = rect.width, h = rect.height, pad = 24;
    const safe = { left:text.left-rect.left-pad, right:text.right-rect.left+pad, top:text.top-rect.top-pad, bottom:text.bottom-rect.top+pad };
    let seed = 7319;
    const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
    const placed = [];
    layout = bows.map(el => {
      const size = el.offsetWidth, r = size * .72 + 4;
      if (!size) return null;
      const candidates = [
        {minX:r,maxX:w-r,minY:r,maxY:Math.min(h-r,safe.top-r)},
        {minX:r,maxX:w-r,minY:Math.max(r,safe.bottom+r),maxY:h-r},
        {minX:r,maxX:Math.min(w-r,safe.left-r),minY:Math.max(r,safe.top+r),maxY:Math.min(h-r,safe.bottom-r)},
        {minX:Math.max(r,safe.right+r),maxX:w-r,minY:Math.max(r,safe.top+r),maxY:Math.min(h-r,safe.bottom-r)}
      ].map(b => ({...b, area:Math.max(0,b.maxX-b.minX)*Math.max(0,b.maxY-b.minY)})).filter(b => b.area > 0);
      const area = candidates.reduce((sum,b) => sum+b.area,0);
      let choice = null;
      for (let attempt=0; attempt<160 && area; attempt++) {
        let weight = random()*area, band = candidates[candidates.length-1];
        for (const candidate of candidates) { weight -= candidate.area; if (weight <= 0) { band=candidate; break; } }
        const x=band.minX+random()*(band.maxX-band.minX), y=band.minY+random()*(band.maxY-band.minY);
        if (placed.every(other => Math.hypot(x-other.x,y-other.y) >= r+other.r+7)) { choice={...band,x,y,r}; break; }
      }
      el.style.visibility = choice ? '' : 'hidden';
      if (!choice) return null;
      placed.push(choice);
      el.style.left=`${choice.x}px`; el.style.top=`${choice.y}px`;
      return {el,...choice,cx:choice.x,cy:choice.y};
    }).filter(Boolean);
  };
  const tick = () => {
    frame = 0;
    if (!visible || reduced.matches || !fine.matches) return;
    let moving = false;
    layout.forEach(b => {
      let dx=0, dy=0;
      if (pointer) {
        const vx=b.x-pointer.x, vy=b.y-pointer.y, distance=Math.hypot(vx,vy);
        if (distance < 110) { const push=45*(1-distance/110); const d=distance || 1; dx=(vx || 1)/d*push; dy=vy/d*push; }
      }
      const tx=clamp(b.x+dx,b.minX,b.maxX), ty=clamp(b.y+dy,b.minY,b.maxY);
      b.cx=clamp(b.cx+(tx-b.cx)*.16,b.minX,b.maxX); b.cy=clamp(b.cy+(ty-b.cy)*.16,b.minY,b.maxY);
      b.el.style.left=`${b.cx}px`; b.el.style.top=`${b.cy}px`;
      if (Math.abs(tx-b.cx)>.15 || Math.abs(ty-b.cy)>.15) moving=true;
    });
    if (moving) frame=requestAnimationFrame(tick);
  };
  const wake = () => { if (!frame && visible && fine.matches && !reduced.matches) frame=requestAnimationFrame(tick); };
  field.addEventListener('pointermove', e => { if (!fine.matches || reduced.matches) return; const r=field.getBoundingClientRect(); pointer={x:e.clientX-r.left,y:e.clientY-r.top}; wake(); }, {passive:true});
  field.addEventListener('pointerleave', () => { pointer=null; wake(); }, {passive:true});
  const refresh = () => { if (frame) cancelAnimationFrame(frame); frame=0; pointer=null; measure(); };
  reduced.addEventListener?.('change',refresh); fine.addEventListener?.('change',refresh);
  if ('ResizeObserver' in window) { const ro=new ResizeObserver(refresh); ro.observe(field); ro.observe(title); if (footer) ro.observe(footer); }
  window.addEventListener('resize',refresh,{passive:true}); window.addEventListener('load',refresh,{once:true});
  document.fonts?.ready.then(refresh);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible=entries[0].isIntersecting; if (!visible && frame) {cancelAnimationFrame(frame);frame=0;} }).observe(field);
  else visible=true;
  refresh();
})();

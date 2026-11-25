// The outer pose follows the viewer. The inner rotation lets either face settle upright.
(() => {
  const studio = document.querySelector('.studio');
  const surface = studio.querySelector('.device-space');
  const pose = studio.querySelector('.device-pose');
  const model = studio.querySelector('.device-model');
  const scenery = studio.querySelector('.scenery');
  const chassis = model.querySelector('.chassis');
  const rotate = studio.querySelector('.rotate-device');

  for (let depth = -9; depth <= 9; depth += 1) {
    const slice = document.createElement('i');
    slice.style.setProperty('--depth', depth + 'px');
    const bevel = Math.max(0, Math.abs(depth) - 6) * .45;
    slice.style.inset = bevel + 'px';
    chassis.appendChild(slice);
  }

  let visible = true;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let pointer = null;
  let startX = 0;
  let startTurn = 0;
  let targetTurn = 0;
  let turn = 0;
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  const paused = () => document.documentElement.classList.contains('motion-paused');

  function schedule() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  function render(now) {
    frame = 0;
    const still = paused();
    const dt = previousTime ? Math.min(50, now - previousTime) : 16;
    previousTime = now;
    if (!still) elapsed += dt / 1000;
    const blend = still ? 1 : 1 - Math.exp(-dt / 110);
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    turn += (targetTurn - turn) * blend;
    pose.style.setProperty('--yaw', (-22 + Math.sin(elapsed * .52) * 5 + x * 11) + 'deg');
    pose.style.setProperty('--pitch', (5 + Math.cos(elapsed * .63) * 2 - y * 6) + 'deg');
    pose.style.setProperty('--lift', Math.sin(elapsed * .83) * 6 + 'px');
    model.style.setProperty('--turn', turn + 'deg');
    scenery.style.transform = 'translate(' + (-x * 7) + 'px,' + (-y * 5) + 'px) scale(1.04)';
    if (!still) schedule();
  }

  rotate.addEventListener('click', () => {
    targetTurn = (Math.round(targetTurn / 180) + 1) * 180;
    schedule();
  });
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = event.pointerId;
    startX = event.clientX;
    startTurn = turn;
    surface.setPointerCapture(pointer);
  });
  surface.addEventListener('pointermove', event => {
    if (!event.isPrimary) return;
    if (pointer === event.pointerId) {
      targetTurn = startTurn + (event.clientX - startX) * .7;
      schedule();
    } else if (!paused() && event.pointerType === 'mouse') {
      const rect = surface.getBoundingClientRect();
      targetX = 2 * (event.clientX - rect.left) / rect.width - 1;
      targetY = 2 * (event.clientY - rect.top) / rect.height - 1;
      schedule();
    }
  });
  surface.addEventListener('lostpointercapture', () => { pointer = null; });
  surface.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });

  function restart() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    schedule();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    }).observe(studio);
  }
  new MutationObserver(restart).observe(document.documentElement, {
    attributes: true, attributeFilter: ['class']
  });
  document.addEventListener('visibilitychange', restart);
  schedule();
})();

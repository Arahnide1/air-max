(() => {
  const page = document.documentElement;
  const motion = document.querySelector('.motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let stopped = preference.matches;
  function updateMotion() {
    page.dataset.paused = String(stopped);
    motion.setAttribute('aria-pressed', String(stopped));
    motion.textContent = stopped ? 'Включить движение' : 'Пауза движения';
    window.dispatchEvent(new Event('exhibitionchange'));
  }
  motion.hidden = false;
  motion.addEventListener('click', () => { stopped = !stopped; updateMotion(); });
  preference.addEventListener('change', () => { stopped = preference.matches; updateMotion(); });
  const tracks = [...document.querySelectorAll('.tracks details')];
  tracks.forEach((track, index) => track.addEventListener('toggle', () => {
    if (!track.open) return;
    page.dataset.track = index;
    window.dispatchEvent(new Event('exhibitionchange'));
  }));
  const samples = [
    ['15 заявок на расчёт','При бюджете 30 000 ₽ и 15 заявках на расчёт кухни одна заявка стоит 2 000 ₽. Из этих 15 обращений восемь подходят по региону и бюджету.'],
    ['120 вступлений','Если шесть постов с бесплатным уроком стоят 36 000 ₽ и по ним подписались 120 человек, один подписчик обходится в 300 ₽.'],
    ['18 обращений','При расходах 36 000 ₽ на посты о сезонном обслуживании и 18 обращениях каждое стоит 2 000 ₽. В этом примере девять человек записались в сервис.']
  ];
  const outputs = document.querySelector('#receipt-copy');
  const switches = [...document.querySelectorAll('.case-switch button')];
  switches.forEach((button,index) => button.addEventListener('click', () => {
    page.dataset.sample = index;
    switches.forEach((item,i) => item.setAttribute('aria-pressed', String(i === index)));
    outputs.firstElementChild.textContent = samples[index][0];
    outputs.lastElementChild.textContent = samples[index][1];
    window.dispatchEvent(new Event('exhibitionchange'));
  }));
  document.querySelector('[data-pulse]').addEventListener('click', () => {
    window.dispatchEvent(new Event('hornpulse'));
  });
  const cards = [...document.querySelectorAll('.route-cards article')];
  let queued = false;
  function animatePrints() {
    queued = false;
    const bounds = cards[0].parentElement.getBoundingClientRect();
    if (stopped || (bounds.top < innerHeight && bounds.bottom > 0)) {
      const travel = stopped ? 0 : Math.min(1,Math.max(-1,(bounds.top + bounds.height / 2 - innerHeight / 2) / innerHeight));
      cards.forEach((card,i) => {
        const side = i ? 1 : -1;
        card.style.transform = 'translateY('+ ((i ? 8 : 0) + side * travel * 55) +'px) rotate('+ side * (3 + travel * 6) +'deg) rotateY('+ side * travel * 19 +'deg)';
      });
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(animatePrints); } }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('exhibitionchange', queue);
  updateMotion();
})();

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
    ['15 заявок на расчёт','Из 30 000 ₽ на размещение одна заявка обошлась в 2 000 ₽. Менеджер подтвердил 8 целевых обращений.'],
    ['120 вступлений','Шесть размещений бесплатного урока обошлись в 36 000 ₽. Одно подтверждённое вступление стоило 300 ₽.'],
    ['18 обращений','36 000 ₽ на посты о сезонном обслуживании принесли 18 обращений по 2 000 ₽. Девять клиентов записались в сервис.']
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

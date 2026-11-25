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
    {
      "heading": "15 заявок на расчёт",
      "desc": "Тестируем объявления по городу и ведём на форму расчёта кухни. Менеджер отмечает в CRM обращения с подходящей географией и бюджетом.",
      "stats": [
        [
          "Реклама",
          "30 000 ₽"
        ],
        [
          "Цена заявки",
          "2 000 ₽"
        ],
        [
          "Из них целевых",
          "8"
        ]
      ]
    },
    {
      "heading": "120 вступлений",
      "desc": "Размещаем посты с бесплатным уроком в каналах о карьере и обучении. Для каждого посева используем отдельную ссылку, если по ней видны вступления.",
      "stats": [
        [
          "Реклама",
          "36 000 ₽"
        ],
        [
          "Цена подписки",
          "300 ₽"
        ],
        [
          "Размещений",
          "6"
        ]
      ]
    },
    {
      "heading": "18 обращений",
      "desc": "Тестируем посты про сезонное обслуживание в городских каналах. Звонки и формы сверяем с записями, чтобы понять, какие размещения приводят клиентов.",
      "stats": [
        [
          "Реклама",
          "36 000 ₽"
        ],
        [
          "Цена обращения",
          "2 000 ₽"
        ],
        [
          "Записей",
          "9"
        ]
      ]
    }
  ];
  const outputs = document.querySelector('#receipt-copy');
  const switches = [...document.querySelectorAll('.case-switch button')];
  switches.forEach((button,index) => button.addEventListener('click', () => {
    page.dataset.sample = index;
    switches.forEach((item,i) => item.setAttribute('aria-pressed', String(i === index)));
    const sample = samples[index];
    outputs.querySelector("strong").textContent = sample.heading;
    outputs.querySelector("p").textContent = sample.desc;
    const terms = outputs.querySelectorAll("dt");
    const values = outputs.querySelectorAll("dd");
    sample.stats.forEach(([label, value], i) => {
      terms[i].textContent = label;
      values[i].textContent = value;
    });
    window.dispatchEvent(new Event('exhibitionchange'));
  }));
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

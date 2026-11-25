const brief = document.querySelector('#brief');
const switcher = document.querySelector('.goal-switch');
const goalInputs = [...switcher.querySelectorAll('input')];
const goalSelect = brief.elements.goal;
const goalNames = { site: 'Сайт или услугу', channel: 'Канал в MAX' };
const scenarioCopy = [...document.querySelectorAll('[data-channel]')].map(element => ({
  element,
  site: element.textContent,
  channel: element.dataset.channel
}));

function showGoal(goal) {
  for (const item of scenarioCopy) item.element.textContent = item[goal];
  document.documentElement.dataset.goal = goal;
  for (const input of goalInputs) input.checked = input.value === goal;
}

switcher.addEventListener('change', event => {
  const goal = event.target.value;
  showGoal(goal);
  goalSelect.value = goalNames[goal];
});
function syncFromBrief() {
  const goal = goalSelect.value === goalNames.channel ? 'channel' : 'site';
  showGoal(goal);
  if (goalSelect.value !== goalNames[goal]) {
    for (const input of goalInputs) input.checked = false;
    document.querySelector('#goal-description').textContent =
      'Запустим рекламу сайта и канала. Для каждого направления отдельно посчитаем расходы и стоимость результата.';
  }
}
goalSelect.addEventListener('change', syncFromBrief);
window.addEventListener('pageshow', syncFromBrief);
syncFromBrief();
switcher.hidden = false;

brief.addEventListener('submit', (event) => {
  event.preventDefault();

  const fields = new FormData(brief);
  const goal = fields.get('goal');
  const project = fields.get('project').trim();
  const subject = encodeURIComponent('Реклама в MAX — запрос медиаплана');
  const body = encodeURIComponent(
    `Здравствуйте! Хочу обсудить рекламный запуск в MAX.\n\nЦель: ${goal}\nСайт или канал: ${project || 'укажу позже'}\n\nО проекте и желаемом результате:\n`
  );

  document.querySelector('#mail-status').textContent =
    'Письмо откроется в почтовом приложении. Можно также написать на sale@airws.ru.';
  window.location.href = `mailto:sale@airws.ru?subject=${subject}&body=${body}`;
});

const motionButton = document.querySelector('.motion-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const page = document.documentElement;
const heroVisual = document.querySelector('.hero-visual');
const journey = document.querySelector('.journey-grid');
const journeyStage = journey.querySelector('.journey-stage');
const journeySteps = [...journey.querySelectorAll('.journey-step')];
const compactJourney = window.matchMedia('(max-width: 760px)');
const revealAnimations = new Set();
let motionPaused = false;
let journeyFrame = null;

function syncJourney() {
  journeyFrame = null;
  const viewport = window.innerHeight;
  const bounds = journey.getBoundingClientRect();
  if (bounds.top > viewport || bounds.bottom < 0) return;

  const line = compactJourney.matches
    ? Math.min(viewport * .83, Math.max(viewport * .58, journeyStage.getBoundingClientRect().bottom + 35))
    : viewport * .62;

  let active = journeySteps[0];
  for (const step of journeySteps) {
    if (step.getBoundingClientRect().top <= line) active = step;
  }
  journeyStage.dataset.stage = active.dataset.journeyStep;
}

function scheduleJourney() {
  if (journeyFrame === null) journeyFrame = window.requestAnimationFrame(syncJourney);
}

function updateMotion() {
  const limited = motionPreference.matches;
  page.classList.toggle('motion-ready', !limited);
  page.classList.toggle('motion-paused', motionPaused || limited);
  motionButton.hidden = limited;
  motionButton.textContent = motionPaused ? 'Продолжить анимацию' : 'Пауза анимации';
  if (motionPaused || limited) {
    page.classList.add('hero-entered');
    for (const animation of revealAnimations) animation.cancel();
  }
}

document.querySelector('.hero-note').addEventListener('animationend', (event) => {
  if (event.animationName === 'enter') page.classList.add('hero-entered');
});
motionButton.addEventListener('click', () => {
  motionPaused = !motionPaused;
  updateMotion();
});
motionPreference.addEventListener('change', updateMotion);
updateMotion();
window.addEventListener('scroll', scheduleJourney, { passive: true });
window.addEventListener('resize', scheduleJourney);
scheduleJourney();

if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    page.classList.toggle('motion-out-of-view', !entry.isIntersecting);
  });
  heroObserver.observe(heroVisual);

  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      revealObserver.unobserve(entry.target);
      if (motionPaused || motionPreference.matches) continue;

      const delay = Number(entry.target.dataset.revealDelay || 0);
      const animation = entry.target.animate(
        [{ opacity: .28, transform: 'translateY(15px)' }, { opacity: 1, transform: 'none' }],
        { delay, duration: 480, fill: 'backwards', easing: 'cubic-bezier(.2,.75,.25,1)' }
      );
      revealAnimations.add(animation);
      const clear = () => revealAnimations.delete(animation);
      animation.onfinish = clear;
      animation.oncancel = clear;
    }
  }, { threshold: .15 });

  for (const group of document.querySelectorAll('.placement-grid, .steps, .report-board, .case-grid, .plans')) {
    [...group.children].forEach((item, index) => {
      item.dataset.revealDelay = String(index * 55);
      revealObserver.observe(item);
    });
  }
}

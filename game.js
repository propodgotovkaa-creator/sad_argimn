export const exercises = Object.freeze([
  'Дудочка', 'Иголочка', 'Лопатка', 'Вкусное варенье', 'Парус', 'Дятел',
  'Бегемот', 'Качели', 'Забор', 'Мостик', 'Зубная щётка', 'Грибок', 'Лошадка', 'Чашечка',
]);

const choose = (hint, options, multiple = false) => ({ kind: 'choose', hint, options, multiple });
const place = (hint, plots) => ({ kind: 'place', hint, plots });
const act = (label, effect) => ({ kind: 'act', label, effect });

export const rewards = [
  { id: 'tree', name: 'Дерево', steps: [
    choose('Выбери семечко', ['Розовая яблоня', 'Золотая груша', 'Сиреневая вишня']),
    place('Посади семечко', ['tree-left', 'tree-right']), act('Полить', 'grow'),
  ] },
  { id: 'flowers', name: 'Клумба', steps: [
    choose('Выбери форму', ['Круг', 'Овал', 'Сердечко']),
    place('Найди место для клумбы', ['bed-left', 'bed-right']),
    choose('Выбери цветы', ['Розовые', 'Голубые', 'Белые'], true), act('Полить', 'bloom'),
  ] },
  { id: 'fountain', name: 'Фонтан', steps: [
    choose('Выбери фонтан', ['Ракушка', 'Кувшинка', 'Чаша']),
    place('Поставь фонтан', ['fountain']), act('Зажечь кристалл', 'flow'),
  ] },
  { id: 'pond', name: 'Пруд', steps: [
    choose('Выбери форму пруда', ['Круглый', 'Изогнутый', 'Капелька']),
    place('Выбери место для пруда', ['pond']), act('Налить воду', 'fill'),
    choose('Кто поселится в пруду?', ['Кувшинки', 'Золотые рыбки', 'Кувшинки и рыбки']),
  ] },
  { id: 'house', name: 'Домик феи', steps: [
    choose('Выбери крышу', ['Лепесток', 'Колпачок', 'Лист']),
    choose('Выбери цвет стен', ['Медовый', 'Мятный', 'Сиреневый']),
    choose('Выбери дверь', ['Круглая', 'Арочная', 'Резная']),
    choose('Укрась окно', ['Ставни', 'Занавеска', 'Цветы на подоконнике']),
    place('Поставь домик', ['house']), act('Зажечь свет', 'window'),
  ] },
  { id: 'lights', name: 'Фонарики', steps: [
    choose('Выбери фонарики', ['Жёлуди', 'Колокольчики', 'Звёздочки']),
    place('Расставь фонарики вдоль дорожки', ['lights-left', 'lights-right']), act('Зажечь звезду', 'lamps'),
  ] },
  { id: 'bridge', name: 'Мостик', steps: [
    choose('Выбери мостик', ['Деревянный', 'Каменный', 'Берёзовый']),
    place('Перекинь мостик через ручей', ['stream']), act('Позвать зверька', 'cross'),
  ] },
  { id: 'butterflies', name: 'Бабочки', steps: [
    choose('Выбери бабочек', ['Лимонницы', 'Голубянки', 'Розовые мотыльки']),
    place('Повесь кокон', ['butterfly-left', 'butterfly-right']), act('Коснуться кокона', 'hatch'),
  ] },
  { id: 'animal', name: 'Лесной гость', steps: [
    choose('Выбери лесного гостя', ['Зайчик', 'Ёжик', 'Белочка', 'Оленёнок']),
    place('Выбери уголок', ['animal-left', 'animal-right']), act('Позвать гостя', 'animal'),
  ] },
  { id: 'arch', name: 'Арка', steps: [
    choose('Выбери арку', ['Лозовая', 'Каменная', 'Деревянная']),
    place('Поставь арку над дорожкой', ['arch']), act('Разбудить лозу', 'vine'),
  ] },
  { id: 'decor', name: 'Украшение', steps: [
    choose('Выбери украшение', ['Кристаллы', 'Вазон', 'Грибочки', 'Каменная сова', 'Волшебные камни']),
    place('Укрась поляну', ['decor-left', 'decor-right']), act('Добавить волшебства', 'shimmer'),
  ] },
  { id: 'magic', name: 'Звезда', steps: [
    choose('Выбери звезду', ['Золотая', 'Серебряная', 'Сиреневая']), act('Зажечь звезду', 'wave'),
  ] },
  { id: 'herbs', name: 'Травы', steps: [
    choose('Выбери травы', ['Лаванда', 'Мята', 'Ромашка'], true),
    place('Посади травы', ['herbs-left', 'herbs-right']), act('Напоить росой', 'sprout'),
  ] },
  { id: 'fireflies', name: 'Светлячки', steps: [
    choose('Выбери огоньки', ['Медовые', 'Зелёные', 'Лунные']),
    place('Выбери уголок для огоньков', ['fireflies-left', 'fireflies-right']),
    act('Выпустить светлячков', 'release'),
  ] },
];

export class GardenGame {
  #state = { phase: 'menu', selected: [], index: 0, objects: [] };
  #animationId = 0;
  #rewardOrder = [];

  get state() {
    const s = this.#state;
    const reward = this.#rewardOrder[s.index];
    return structuredClone({
      ...s, exercise: s.selected[s.index] ?? null, reward: reward?.id ?? null,
      step: s.phase === 'garden' ? reward.steps[s.draft.step] : null,
    });
  }

  toggle(id) {
    const s = this.#state;
    if (s.phase !== 'menu' || !Number.isInteger(id) || id < 0 || id >= exercises.length) return false;
    const i = s.selected.indexOf(id);
    if (i < 0) s.selected.push(id); else s.selected.splice(i, 1);
    return true;
  }

  selectAll() {
    const s = this.#state;
    if (s.phase !== 'menu') return false;
    exercises.forEach((_, i) => { if (!s.selected.includes(i)) s.selected.push(i); });
    return true;
  }

  clear() {
    if (this.#state.phase !== 'menu') return false;
    this.#state.selected = [];
    return true;
  }

  move(from, to) {
    const s = this.#state;
    if (s.phase !== 'menu' || ![from, to].every(i => Number.isInteger(i) && i >= 0 && i < s.selected.length)) return false;
    s.selected.splice(to, 0, s.selected.splice(from, 1)[0]);
    return true;
  }

  start() {
    const s = this.#state;
    if (s.phase !== 'menu' || !s.selected.length) return false;
    this.#rewardOrder = rewards.slice(0, s.selected.length);
    // Save the full-garden spell for the last reward when it is offered.
    const magic = this.#rewardOrder.findIndex(r => r.id === 'magic');
    if (magic >= 0) this.#rewardOrder.push(this.#rewardOrder.splice(magic, 1)[0]);
    s.phase = 'exercise';
    return true;
  }

  done() {
    const s = this.#state;
    if (s.phase !== 'exercise') return false;
    s.draft ??= { id: this.#rewardOrder[s.index].id, step: 0, choices: [], effects: [], plot: null };
    s.phase = 'garden';
    return true;
  }

  repeatExercise() {
    if (this.#state.phase !== 'garden') return false;
    this.#state.phase = 'exercise';
    return true;
  }

  choose(value) {
    const s = this.#state;
    if (s.phase !== 'garden') return false;
    const step = this.#rewardOrder[s.index].steps[s.draft.step];
    if (step.kind !== 'choose') return false;
    const choices = step.multiple ? value : [value];
    if (!Array.isArray(choices) || !choices.length ||
      !choices.every(choice => step.options.includes(choice))) return false;
    s.draft.choices.push([...new Set(choices)]);
    this.#advance();
    return true;
  }

  place(plot) {
    const s = this.#state;
    if (s.phase !== 'garden') return false;
    const step = this.#rewardOrder[s.index].steps[s.draft.step];
    if (step.kind !== 'place' || !step.plots.includes(plot) || s.objects.some(o => o.plot === plot)) return false;
    s.draft.plot = plot;
    this.#advance();
    return true;
  }

  activate() {
    const s = this.#state;
    if (s.phase !== 'garden') return null;
    const step = this.#rewardOrder[s.index].steps[s.draft.step];
    if (step.kind !== 'act') return null;
    const animation = { token: ++this.#animationId, effect: step.effect };
    s.animation = animation;
    s.phase = 'animating';
    return { ...animation };
  }

  completeAnimation(token) {
    const s = this.#state;
    if (!s.animation || token !== s.animation.token) return false;
    const { effect } = s.animation;
    delete s.animation;
    if (s.phase === 'finale') {
      s.phase = 'finished';
      return true;
    }
    s.draft.effects.push(effect);
    s.phase = 'garden';
    this.#advance();
    return true;
  }

  #advance() {
    const s = this.#state;
    const { steps } = this.#rewardOrder[s.index];
    if (++s.draft.step < steps.length) return;
    const { step, ...object } = s.draft;
    s.objects.push(object);
    delete s.draft;
    s.phase = ++s.index === s.selected.length ? 'finale' : 'exercise';
    if (s.phase === 'finale') s.animation = { token: ++this.#animationId, effect: 'dusk' };
  }

  viewGarden() {
    if (this.#state.phase !== 'finished') return false;
    this.#state.phase = 'view';
    return true;
  }

  restart() {
    if (!['finished', 'view'].includes(this.#state.phase)) return false;
    this.#state = { phase: 'menu', selected: [], index: 0, objects: [] };
    this.#rewardOrder = [];
    return true;
  }
}

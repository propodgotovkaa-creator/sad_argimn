export const minimumExercises = 5;

export const exercises = Object.freeze([
  'Дудочка', 'Иголочка', 'Лопатка', 'Вкусное варенье', 'Парус', 'Дятел',
  'Бегемот', 'Качели', 'Забор', 'Мостик', 'Зубная щётка', 'Грибок', 'Лошадка', 'Чашечка',
]);

export const rewards = [
  { id:'tree', name:'Дерево', choose:'Выбери дерево', place:'Выбери место для дерева',
    options:['Розовая яблоня','Золотая груша','Сиреневая вишня','Белая яблоня','Медный клён'] },
  { id:'flowers', name:'Цветы', choose:'Выбери один или несколько видов цветов',
    place:'Выбери цветы и укажи, куда их посадить', multiple:true,
    options:['Розовые','Голубые','Белые','Жёлтые','Сиреневые'] },
  { id:'fountain', name:'Фонтан', choose:'Выбери фонтан', place:'Выбери место для фонтана',
    options:['Ракушка','Кувшинка','Чаша','Каменный каскад','Лесной источник'] },
  { id:'pond', name:'Пруд', choose:'Выбери пруд', place:'Выбери место для пруда',
    options:['Круглый','Изогнутый','Капелька','Сердечко','Лесное озерцо'] },
  { id:'house', name:'Домик феи', choose:'Выбери домик для феи', place:'Выбери место для домика',
    options:['Под черепицей','Под листиком','Каменный','Грибной','В старом дубе'] },
  { id:'lights', name:'Фонарики', choose:'Выбери фонарики', place:'Выбери место для фонариков',
    options:['Жёлуди','Колокольчики','Звёздочки'] },
  { id:'bridge', name:'Мостик', choose:'Выбери мостик', place:'Выбери место для мостика',
    options:['Деревянный','Каменный','Берёзовый'] },
  { id:'butterflies', name:'Бабочки', choose:'Выбери бабочку', place:'Укажи, где будет летать бабочка',
    options:['Золотая','Голубая','Розовая','Красная','Белая'] },
  { id:'animal', name:'Лесной гость', choose:'Выбери, кто поселится в саду', place:'Выбери уголок для лесного гостя',
    options:['Зайчик','Ёжик','Белочка','Оленёнок','Лисёнок','Лягушка'] },
  { id:'arch', name:'Арка', choose:'Выбери арку', place:'Выбери место для арки',
    options:['В розах','Деревянная','Каменная'] },
  { id:'decor', name:'Украшение', choose:'Выбери украшение', place:'Выбери место для украшения',
    options:['Кристаллы','Вазон','Грибочки','Каменная сова','Волшебные камни'] },
  { id:'herbs', name:'Травы', choose:'Выбери травы', place:'Выбери место для трав',
    options:['Лаванда','Мята','Ромашка'] },
  { id:'fireflies', name:'Светлячки', choose:'Выбери огоньки', place:'Укажи, где появятся светлячки',
    options:['Медовые','Зелёные','Лунные'] },
  { id:'magic', name:'Звезда', choose:'Выбери звезду', place:'Выбери место для звезды',
    options:['Золотая','Серебряная','Сиреневая'] },
];

const initial = () => ({phase:'menu',selected:[],index:0,objects:[],draft:null,animation:null});

export class GardenGame {
  #state = initial();
  #animationId = 0;

  get state() {
    return structuredClone({
      ...this.#state,
      exercise:this.#state.selected[this.#state.index] ?? null,
    });
  }

  toggle(id) {
    const s = this.#state;
    if (s.phase!=='menu' || !Number.isInteger(id) || id<0 || id>=exercises.length) return false;
    const i = s.selected.indexOf(id);
    if (i<0) s.selected.push(id); else s.selected.splice(i,1);
    return true;
  }

  selectAll() {
    const s = this.#state;
    if (s.phase!=='menu') return false;
    exercises.forEach((_,i) => { if (!s.selected.includes(i)) s.selected.push(i); });
    return true;
  }

  clear() {
    if (this.#state.phase!=='menu') return false;
    this.#state.selected = [];
    return true;
  }

  move(from,to) {
    const s = this.#state;
    if (s.phase!=='menu' || ![from,to].every(i => Number.isInteger(i) && i>=0 && i<s.selected.length)) return false;
    s.selected.splice(to,0,s.selected.splice(from,1)[0]);
    return true;
  }

  start() {
    const s = this.#state;
    if (s.phase!=='menu' || s.selected.length<minimumExercises) return false;
    s.phase='exercise';
    return true;
  }

  done() {
    const s = this.#state;
    if (s.phase!=='exercise') return false;
    s.draft ??= {id:rewards[s.index].id,choices:[],point:null};
    s.phase='garden';
    return true;
  }

  repeatExercise() {
    if (this.#state.phase!=='garden') return false;
    this.#state.phase='exercise';
    return true;
  }

  choose(value) {
    const s = this.#state;
    if (s.phase!=='garden') return false;
    const reward = rewards[s.index];
    if (!reward.options.includes(value)) return false;
    const index=s.draft.choices.indexOf(value);
    if (!reward.multiple) s.draft.choices=[value];
    else if (index===-1) s.draft.choices.push(value);
    else s.draft.choices.splice(index,1);
    return true;
  }

  place(point) {
    const s = this.#state;
    if (s.phase!=='garden' || !s.draft.choices.length || !validPoint(point)) return false;
    s.objects.push({...s.draft,point:[...point]});
    s.draft=null;
    s.phase='placing';
    s.animation={token:++this.#animationId,effect:'place'};
    return true;
  }

  completeAnimation(token) {
    const s = this.#state;
    if (s.animation?.token!==token) return false;
    s.animation=null;
    if (s.phase==='finale') {
      s.phase='finished';
    } else if (++s.index===s.selected.length) {
      s.phase='finale';
      s.animation={token:++this.#animationId,effect:'dusk'};
    } else {
      s.phase='exercise';
    }
    return true;
  }

  viewGarden() {
    if (this.#state.phase!=='finished') return false;
    this.#state.phase='view';
    return true;
  }

  restart() {
    if (!['finished','view'].includes(this.#state.phase)) return false;
    this.#state=initial();
    return true;
  }
}

function validPoint(point) {
  return Array.isArray(point) && point.length===2 &&
    point.every(value=>Number.isFinite(value) && value>=0 && value<=100);
}

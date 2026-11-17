import { GardenGame, exercises, rewards } from './game.js';
import { forest, cards, objects, variants } from './art.js';

const app = document.querySelector('#app');
const game = new GardenGame();
const artwork = { cards, objects, variants };
document.body.style.setProperty('--forest', 'url("' + forest + '")');
const rewardById = Object.fromEntries(rewards.map(reward => [reward.id, reward]));
const plots = {
  'tree-left': [26, 44], 'tree-right': [68, 42],
  'bed-left': [23, 76], 'bed-right': [76, 79],
  fountain: [60, 59], pond: [84, 59], house: [37, 58],
  'lights-left': [39, 80], 'lights-right': [60, 83],
  stream: [57, 47],
  'butterfly-left': [20, 64], 'butterfly-right': [74, 55],
  'animal-left': [13, 72], 'animal-right': [88, 73],
  arch: [49, 73],
  'decor-left': [12, 87], 'decor-right': [89, 89],
  'herbs-left': [29, 91], 'herbs-right': [70, 92],
  'fireflies-left': [14, 48], 'fireflies-right': [86, 45],
  magic: [48, 28],
};
const sizes = {tree:19, flowers:16, fountain:14, pond:17, house:16, lights:13,
  bridge:14, butterflies:10, animal:11, arch:16, decor:11, magic:9, herbs:12, fireflies:11};
const color = {flowers:[0,155,35], lights:[0,76,156], magic:[0,190,260], fireflies:[0,60,168]};
let multiple = [];
let timer = null;

function button(label, handler, {className='', disabled=false, aria=label} = {}) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.className = className;
  element.disabled = disabled;
  element.setAttribute('aria-label', aria);
  element.addEventListener('click', handler);
  return element;
}

function node(tag, className, content) {
  const element = document.createElement(tag);
  element.className = className;
  if (content) element.textContent = content;
  return element;
}

function sprite(sheet, index) {
  const element = node('span', 'sprite');
  element.style.backgroundImage = 'url("' + artwork[sheet] + '")';
  element.style.backgroundPosition = (index % 4) * 100 / 3 + '% ' + Math.floor(index / 4) * 100 / 3 + '%';
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function refresh(change, target) {
  if (change()) render(target);
}

function menu(s) {
  const panel = node('section', 'menu');
  panel.append(node('h1', '', 'Волшебный сад'), node('p', 'instruction', 'Выберите упражнения в нужном порядке'));
  const grid = node('div', 'card-grid');
  exercises.forEach((label, id) => {
    const order = s.selected.indexOf(id);
    const card = button('', () => refresh(() => game.toggle(id), 'exercise-'+id), {className:'card', aria:label});
    card.id = 'exercise-'+id;
    card.setAttribute('aria-pressed', String(order >= 0));
    card.title = label;
    card.append(sprite('cards', id));
    if (order >= 0) card.append(node('span', 'order-tag', String(order+1)));
    grid.append(card);
  });
  panel.append(grid);
  if (s.selected.length > 1) {
    const sequence = node('div', 'sequence');
    sequence.setAttribute('aria-label','Порядок упражнений');
    s.selected.forEach((id, index) => {
      const item = node('div','sequence-item');
      const left = button('‹', () => refresh(() => game.move(index,index-1),'exercise-'+id),
        {disabled:index===0, aria:exercises[id]+' раньше'});
      const right = button('›', () => refresh(() => game.move(index,index+1),'exercise-'+id),
        {disabled:index===s.selected.length-1, aria:exercises[id]+' позже'});
      item.append(left, sprite('cards',id), right);
      sequence.append(item);
    });
    panel.append(sequence);
  }
  const actions = node('div', 'menu-actions');
  const all = button('Выбрать все', () => refresh(() => game.selectAll(),'all'));
  all.id = 'all';
  const clear = button('Сбросить', () => refresh(() => game.clear(),'all'), {disabled:!s.selected.length});
  actions.append(all, clear, button('Начать', () => refresh(() => game.start(),'done'),
    {className:'primary', disabled:!s.selected.length}));
  panel.append(actions);
  return panel;
}

function artFor(object, option) {
  const { id } = object;
  const reward = rewardById[id];
  const first = option ?? reward.steps[0].options.indexOf(object.choices[0]?.[0]);
  const index = Math.max(0, first);
  const variant = {
    tree:[3,4,5], fountain:[0,1,2], butterflies:[null,6,7], animal:[null,8,9,10],
    decor:[null,11,12,13,14],
  }[id]?.[index];
  if (variant != null) return sprite('variants', variant);
  const item = sprite('objects', rewards.indexOf(reward));
  if (color[id]) item.style.filter = 'hue-rotate(' + color[id][index] + 'deg)';
  return item;
}

function effectDots(parent, className, count) {
  const effect = node('span', 'effect '+className);
  for (let i=0; i<count; i++) {
    const dot = node('i', '');
    dot.style.setProperty('--i', i);
    dot.style.setProperty('--n', count);
    effect.append(dot);
  }
  parent.append(effect);
}

function objectLayer(object, s) {
  const point = plots[object.plot ?? object.id];
  if (!point) return null;
  const { id, choices, effects } = object;
  const active = s.draft === object && s.phase === 'animating' ? s.animation.effect : '';
  const element = node('div', 'object '+id+(active ? ' effect-'+active : ''));
  element.style.left = point[0]+'%';
  element.style.top = point[1]+'%';
  element.style.width = sizes[id]+'%';
  element.style.zIndex = point[1];
  element.setAttribute('role','img');
  element.setAttribute('aria-label', [rewardById[id].name, ...choices.flat()].join(', '));
  const ready = s.draft !== object || effects.length || active;
  if (id === 'tree' && !ready) {
    element.append(node('span','seed'));
    return element;
  }
  const drawing = artFor(object);
  const first = rewardById[id].steps[0].options.indexOf(choices[0]?.[0]);
  if (['house','bridge','arch','pond','flowers'].includes(id)) {
    element.classList.add('shape-'+Math.max(0,first));
  }
  if (id === 'house') {
    const settings = choices.slice(1).map((value,index) => rewardById[id].steps[index+1].options.indexOf(value[0]));
    drawing.style.filter = 'hue-rotate('+[0,65,276][settings[0]]+'deg)';
    const roof = node('span','roof roof-'+Math.max(0,first));
    const door = node('span','little-door door-'+settings[1]);
    const window = node('span','little-window window-'+settings[2]+(ready?' lit':''));
    element.append(drawing, roof, door, window);
  } else if (id === 'flowers' && choices[1]?.length) {
    choices[1].forEach((label,index) => {
      const flower = artFor(object,rewardById[id].steps[2].options.indexOf(label));
      flower.classList.add('flower-layer');
      flower.style.setProperty('--offset', (index-(choices[1].length-1)/2)*24+'%');
      element.append(flower);
    });
  } else if (['butterflies','animal','fireflies'].includes(id) && !ready) {
    element.append(node('span','seed'));
  } else {
    element.append(drawing);
  }
  if (id === 'fountain' && ready) effectDots(element,'water',11);
  if (id === 'pond' && ready) {
    effectDots(element,'ripples',3);
    const resident = choices[1]?.[0];
    if (resident?.includes('рыбки')) {
      const fish = sprite('variants',15);
      fish.classList.add('fish');
      element.append(fish);
    }
    if (resident === 'Кувшинки' || resident?.includes('и рыбки')) effectDots(element,'lilies',4);
  }
  if (id === 'bridge' && ready) {
    const guest = sprite('objects',8);
    guest.classList.add('crossing');
    element.append(guest);
  }
  if (id === 'arch' && ready) effectDots(element,'roses',9);
  if (id === 'lights' && ready) effectDots(element,'lamplight',2);
  if (id === 'decor' && ready) effectDots(element,'spark',5);
  if (id === 'butterflies' && ready) drawing.classList.add('flutter');
  if (id === 'animal' && ready) drawing.classList.add('wander');
  if (id === 'fireflies' && ready) effectDots(element,'fireflies',10);
  if (id === 'herbs' && choices[0]?.length) {
    const herb = rewardById[id].steps[0].options.indexOf(choices[0][0]);
    drawing.style.filter = 'hue-rotate('+[0,65,315][herb]+'deg)';
    element.style.width = (8+choices[0].length*2)+'%';
  }
  return element;
}

function garden(s) {
  const scene = node('div','garden');
  const dusk = ['finale','finished','view'].includes(s.phase);
  const enchanted = dusk || s.objects.some(object => object.id==='magic') || s.animation?.effect==='wave';
  scene.classList.toggle('dusk',dusk);
  scene.classList.toggle('enchanted',enchanted);
  scene.classList.toggle('darken',s.phase==='finale');
  scene.append(node('div','landscape'));
  for (const object of [...s.objects, ...(s.draft?.plot || s.draft?.id==='magic' && s.animation ? [s.draft] : [])]) {
    const item = objectLayer(object,s);
    if (item) scene.append(item);
  }
  if (enchanted) effectDots(scene,'glade-lights',23);
  if (dusk) {
    const fairy = sprite('objects',15);
    fairy.classList.add('fairy');
    const home = s.objects.find(object => object.id === 'house');
    if (home) fairy.classList.add('inside');
    fairy.style.setProperty('--fairy-x', (home ? plots[home.plot][0] : 57)+'%');
    fairy.style.setProperty('--fairy-y', (home ? plots[home.plot][1]-9 : 46)+'%');
    scene.append(fairy);
  }
  if (s.animation?.effect==='wave') scene.append(node('div','magic-wave'));
  if (s.step?.kind === 'place') {
    s.step.plots.forEach((plot,index) => {
      const spot = button('', () => refresh(() => game.place(plot), 'next-control'),
        {className:'spot', aria:'Площадка '+(index+1)});
      spot.style.left = plots[plot][0]+'%';
      spot.style.top = plots[plot][1]+'%';
      if (!index) spot.id = 'next-place';
      scene.append(spot);
    });
  }
  return scene;
}

function choiceTray(s) {
  const step = s.step;
  const tray = node('section','tray');
  if (step.kind === 'act') {
    const action = button(step.label, () => refresh(() => game.activate()), {className:'primary'});
    action.id = 'next-control';
    tray.append(action);
    return tray;
  }
  tray.append(node('p','prompt',step.hint));
  if (step.kind === 'place') return tray;
  const options = node('div','options');
  step.options.forEach((option,index) => {
    const select = () => {
      if (!step.multiple) {
        refresh(() => game.choose(option),'next-control');
        return;
      }
      multiple = multiple.includes(option) ? multiple.filter(item => item !== option) : [...multiple, option];
      render('option-'+index);
    };
    const tile = button('',select,{className:'option',aria:option});
    tile.id = index ? 'option-'+index : 'next-control';
    if (step.multiple) {
      tile.id = 'option-'+index;
      tile.setAttribute('aria-pressed', String(multiple.includes(option)));
    }
    if (s.draft.step === 0 || s.reward === 'flowers' && step.multiple) tile.append(artFor(s.draft,index));
    tile.append(node('span','',option));
    options.append(tile);
  });
  if (step.multiple) options.append(button('Готово', () => {
    if (game.choose(multiple)) {
      multiple = [];
      render('next-control');
    }
  },{className:'primary',disabled:!multiple.length}));
  tray.append(options);
  return tray;
}

function play(s) {
  const board = node('section','board');
  const frame = node('div','scene-frame');
  frame.append(garden(s));
  board.append(frame);
  const header = node('header','hud');
  header.append(node('span','progress', Math.min(s.index+1,s.selected.length)+' / '+s.selected.length));
  if (s.phase==='garden') header.append(button('Повторить карточку',
    () => refresh(() => game.repeatExercise(),'done')));
  if (s.phase==='view') header.append(button('Играть ещё',
    () => refresh(() => game.restart(),'exercise-0')));
  board.append(header);
  if (s.phase==='garden') board.append(choiceTray(s));
  if (s.phase==='exercise' || s.phase==='finished') {
    const overlay = node('div','overlay');
    const card = node('section','activity');
    card.setAttribute('role','dialog');
    card.setAttribute('aria-modal','true');
    card.setAttribute('aria-label',s.phase==='exercise'?exercises[s.exercise]:'Готовый сад');
    if (s.phase==='exercise') {
      card.append(sprite('cards',s.exercise));
      const done = button('Готово', () => refresh(() => game.done(),'next-control'), {className:'primary'});
      done.id = 'done';
      card.append(done);
    } else {
      const actions = node('div','final-actions');
      actions.append(button('Посмотреть сад', () => refresh(() => game.viewGarden()), {className:'primary'}),
        button('Играть ещё', () => refresh(() => game.restart(),'exercise-0')));
      card.append(node('h2','','Какой чудесный сад!'),actions);
    }
    overlay.append(card);
    board.append(overlay);
  }
  return board;
}

function render(focusId) {
  const s = game.state;
  app.replaceChildren(s.phase==='menu' ? menu(s) : play(s));
  if (focusId) (document.getElementById(focusId) ?? document.getElementById('next-place') ??
    document.getElementById('option-0'))?.focus({preventScroll:true});
  if (s.animation && !timer) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 60 : s.animation.effect === 'dusk' ? 3300 : 1200;
    timer = setTimeout(() => {
      timer = null;
      refresh(() => game.completeAnimation(s.animation.token),'done');
    },duration);
  }
}
render();

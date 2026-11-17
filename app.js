import { GardenGame, exercises, minimumExercises, rewards } from './game.js';
import { forest, cardSheets, objects, variants, choices, extras, fairyArt, turkeyArt, benches } from './art.js';
import { addWater } from './water.js';

const app = document.querySelector('#app');
const game = new GardenGame();
const artwork = { objects, variants, choices, extras, benches };
const groundAnchor = .88;
document.body.style.setProperty('--forest', 'url("' + forest + '")');
document.body.style.setProperty('--ground-anchor', -groundAnchor*100+'%');
const rewardById = Object.fromEntries(rewards.map(reward => [reward.id, reward]));
const sizes = {tree:19, flowers:16, fountain:14, pond:17, house:16, lights:13,
  bridge:14, animal:9.8, arch:16, decor:11, magic:9, herbs:12, fireflies:11, bench:14};
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

function sprite(sheet, index, columns=4) {
  const element = node('span', 'sprite');
  const tile = 100/(columns-1);
  element.style.backgroundImage = 'url("' + artwork[sheet] + '")';
  element.style.backgroundSize = (columns*100)+'% '+(columns*100)+'%';
  element.style.backgroundPosition = (index%columns)*tile+'% '+Math.floor(index/columns)*tile+'%';
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function cardArt(id) {
  const image=node('span','sprite card-art');
  if(exercises[id]==='Индюк') {
    image.style.backgroundImage='url("'+turkeyArt+'")';
    image.style.backgroundSize='100% 100%';
  } else {
    const frame=id%4;
    image.style.backgroundImage='url("'+cardSheets[Math.floor(id/4)]+'")';
    image.style.backgroundPosition=(frame%2)*100+'% '+Math.floor(frame/2)*100+'%';
  }
  image.setAttribute('aria-hidden','true');
  return image;
}

function refresh(change, target) {
  if (change()) render(target);
}

function menu(s) {
  const panel = node('section', 'menu');
  panel.append(node('h1', '', 'Волшебный сад'), node('p', 'instruction', 'Выберите минимум '+minimumExercises+' упражнений в нужном порядке. За каждое в саду появится один предмет.'));
  const grid = node('div', 'card-grid');
  exercises.forEach((label, id) => {
    const order = s.selected.indexOf(id);
    const card = button('', () => refresh(() => game.toggle(id), 'exercise-'+id), {className:'card', aria:label});
    card.id = 'exercise-'+id;
    card.setAttribute('aria-pressed', String(order >= 0));
    card.title = label;
    card.append(cardArt(id));
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
      item.append(left, cardArt(id), right);
      sequence.append(item);
    });
    panel.append(sequence);
  }
  const actions = node('div', 'menu-actions');
  const all = button('Выбрать все', () => refresh(() => game.selectAll(),'all'));
  all.id = 'all';
  const clear = button('Сбросить', () => refresh(() => game.clear(),'all'), {disabled:!s.selected.length});
  actions.append(all, clear, button('Начать', () => refresh(() => game.start(),'done'),
    {className:'primary', disabled:s.selected.length<minimumExercises}));
  const count=node('p','selection-count','Выбрано: '+s.selected.length+' из '+exercises.length);
  count.setAttribute('aria-live','polite');
  panel.append(actions,count);
  return panel;
}

const extraArt = {
  tree:[['variants',3],['variants',4],['variants',5],['extras',8],['extras',9]],
  flowers:[['choices',3],['choices',7],['choices',11],['extras',6],['extras',7]],
  fountain:[['variants',0],['variants',1],['variants',2],['extras',0],['extras',1]],
  pond:[['choices',4],['choices',5],['choices',6],['extras',4],['extras',5]],
  house:[['choices',0],['choices',1],['choices',2],['extras',2],['extras',3]],
  lights:[['choices',12],['choices',13],['choices',14]],
  bridge:[['choices',8],['choices',9],['choices',10]],
  butterflies:[['objects',7],['variants',6],['variants',7],['extras',10],['extras',11]],
  animal:[['variants',8],['variants',9],['variants',10],['extras',12],['extras',13]],
  arch:[['objects',9],['extras',14],['extras',15]],
  decor:[['objects',10],['variants',11],['variants',12],['variants',13],['variants',14]],
  bench:[['benches',0,2],['benches',1,2],['benches',2,2]],
};
const fallbackArt = { magic:11, herbs:12, fireflies:13 };
const colors = { magic:[0,186,240], herbs:[0,71,315], fireflies:[0,57,168] };

function artFor(id, index) {
  const image=extraArt[id]?.[index];
  if (image) return sprite(...image);
  const item=sprite('objects',fallbackArt[id]);
  item.style.filter='hue-rotate('+colors[id][index]+'deg)';
  return item;
}

function effectDots(parent, className, count) {
  const effect = node('span', 'effect '+className);
  for (let i=0; i<count; i++) {
    const dot = node('i', '');
    dot.style.setProperty('--i', i);
    effect.append(dot);
  }
  parent.append(effect);
}

// Water edges and swim loops are measured on each pond illustration.
const pondWater = [
  {edge:'35% 50%, 57% 46%, 77% 48%, 84% 56%, 73% 64%, 57% 71%, 38% 65%', center:[57,58], radius:[13,5], slope:-.10},
  {edge:'32% 57%, 49% 52%, 63% 45%, 77% 44%, 83% 51%, 71% 60%, 56% 66%, 44% 73%, 30% 68%', center:[54,58], radius:[15,4], slope:-.31},
  {edge:'36% 61%, 42% 52%, 56% 45%, 65% 48%, 72% 61%, 66% 72%, 52% 75%, 37% 71%', center:[54,61], radius:[10,6], slope:-.13},
  {edge:'25% 31%, 40% 28%, 51% 40%, 65% 30%, 80% 31%, 83% 48%, 69% 64%, 53% 80%, 40% 67%, 26% 52%', center:[55,52], radius:[15,8], slope:-.20},
  {edge:'17% 56%, 32% 46%, 54% 42%, 69% 33%, 86% 42%, 87% 61%, 67% 72%, 39% 77%, 24% 67%', center:[53,57], radius:[21,7], slope:-.23},
];

function animatePond(parent, index) {
  const {edge,center:[x,y],radius:[rx,ry],slope}=pondWater[index];
  const water=node('div','pond-water');
  water.style.clipPath='polygon('+edge+')';
  water.style.setProperty('--ripple-x',x+'%');
  water.style.setProperty('--ripple-y',y+'%');
  effectDots(water,'ripples',3);
  const fish=sprite('variants',15);
  fish.classList.add('fish');
  fish.style.left=x+'%';
  fish.style.top=y+'%';
  water.append(fish);
  parent.append(water);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const frames=Array.from({length:49},(_,i)=>{
    const angle=i/48*2*Math.PI;
    const along=Math.cos(angle)*rx;
    const facing=Math.tanh(Math.sin(angle)*7);
    return {
      left:(x+along)+'%',
      top:(y+along*slope+Math.sin(angle)*ry)+'%',
      scale:(facing*.98)+' 1',
    };
  });
  const duration=9800;
  fish.animate(frames,{duration,iterations:Infinity}).currentTime=performance.now()%duration;
}

function objectLayer(object,{ghost=false,arriving=false}={}) {
  const {id,choices,point}=object;
  if(id==='butterflies' && !ghost) return flyingButterfly(object);
  const reward=rewardById[id];
  const element=node('div','object '+id);
  if(id!=='butterflies') element.style.width=sizes[id]+'%';
  position(element,point);
  element.setAttribute('role','img');
  element.setAttribute('aria-label',[reward.name,...choices].join(', '));
  if(ghost) {
    element.classList.add('ghost');
    element.setAttribute('aria-hidden','true');
  }
  const content=node('div','object-content');
  if(arriving && id!=='animal') content.classList.add('arriving');
  element.append(content);
  if(id==='flowers') {
    const bed=sprite('choices',15);
    bed.classList.add('flower-bed');
    content.append(bed);
    choices.forEach((option,i)=>{
      const flower=artFor(id,reward.options.indexOf(option));
      flower.classList.add('planted-flower');
      flower.style.setProperty('--offset', (i-(choices.length-1)/2)*(choices.length>3?17:24)+'%');
      flower.style.setProperty('--height', (i%2)*8+'%');
      content.append(flower);
    });
  } else {
    content.append(artFor(id,reward.options.indexOf(choices[0])));
  }
  if(ghost) return element;
  if(id==='pond') animatePond(content,reward.options.indexOf(choices[0]));
  if(id==='decor') effectDots(content,'spark',4);
  if(id==='fireflies') effectDots(content,'fireflies',10);
  return element;
}

let butterflyStartedAt=null;
const flightStops=[[75,73],[91,46],[77,20],[51,13],[22,25],[9,56],[33,83]];

function flightCoordinate(points, segment, progress, axis) {
  const at=offset=>points[(segment+offset+points.length)%points.length][axis];
  const from=at(0);
  const to=at(1);
  const incoming=(to-at(-1))/2;
  const outgoing=(at(2)-from)/2;
  const t=progress;
  return (2*t**3-3*t**2+1)*from + (t**3-2*t**2+t)*incoming
    + (-2*t**3+3*t**2)*to + (t**3-t**2)*outgoing;
}

function flyingButterfly({id,choices,point}) {
  const butterfly=node('div','object butterfly-flight');
  butterfly.setAttribute('role','img');
  butterfly.setAttribute('aria-label','Бабочка, '+choices[0]);
  const index=rewardById[id].options.indexOf(choices[0]);
  const body=node('div','butterfly-body');
  for(const part of ['left-wing','right-wing','butterfly-center']) {
    const layer=artFor(id,index);
    layer.classList.add(part);
    body.append(layer);
  }
  butterfly.append(body);
  position(butterfly,point);
  butterfly.style.zIndex='108';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return butterfly;

  butterflyStartedAt??=performance.now();
  const route=[point,...flightStops];
  const duration=16000;
  function frame(now) {
    if(!butterfly.isConnected) return;
    const progress=((now-butterflyStartedAt)%duration)/duration*route.length;
    const segment=Math.floor(progress);
    const t=progress-segment;
    const x=flightCoordinate(route,segment,t,0);
    const y=flightCoordinate(route,segment,t,1);
    const dx=flightCoordinate(route,segment,t+.01,0)-x;
    butterfly.style.left=Math.max(3,Math.min(97,x))+'%';
    butterfly.style.top=Math.max(5,Math.min(95,y))+'%';
    body.style.rotate=Math.max(-25,Math.min(25,dx*35))+'deg';
    body.style.scale=String(.68+Math.max(0,Math.min(100,y))*.0045);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return butterfly;
}

function position(element, point) {
  element.style.left=point[0]+'%';
  element.style.top=point[1]+'%';
  element.style.zIndex=String(Math.round(point[1]));
}

const defaultPreview=[54,62];
let previewPoint=defaultPreview;
let lastTouch=null;
let previewIndex=-1;

function enablePlacement(scene,draft) {
  const ghost=objectLayer({...draft,point:previewPoint},{ghost:true});
  const surface=button('',()=>{},{
    className:'placement-surface',aria:'Поставить предмет. Стрелки перемещают примерку, Ввод ставит предмет.',
  });
  surface.id='placement';
  surface.setAttribute('aria-describedby','place-tip');
  const shadow=node('span','placement-shadow');
  surface.append(shadow);
  scene.append(ghost,surface);
  const show=point=>{
    previewPoint=point;
    position(ghost,point);
    ghost.style.zIndex='107';
    position(shadow,point);
  };
  show(previewPoint);

  function pointAt(event) {
    const rect=surface.getBoundingClientRect();
    return [
      Math.max(0,Math.min(100,(event.clientX-rect.left)*100/rect.width)),
      Math.max(0,Math.min(100,(event.clientY-rect.top)*100/rect.height)),
    ];
  }
  let pointerType='mouse';
  surface.addEventListener('pointerdown',event=>{pointerType=event.pointerType});
  surface.addEventListener('pointermove',event=>{
    if(event.pointerType==='mouse') show(pointAt(event));
  });
  surface.addEventListener('keydown',event=>{
    const offsets={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};
    if(!offsets[event.key]) return;
    event.preventDefault();
    show(previewPoint.map((value,i)=>Math.max(0,Math.min(100,value+offsets[event.key][i]))));
  });
  surface.addEventListener('click',event=>{
    const fromKeyboard=event.detail===0;
    const point=fromKeyboard ? previewPoint : pointAt(event);
    if(!fromKeyboard && pointerType!=='mouse') {
      const rect=surface.getBoundingClientRect();
      const near=lastTouch && Math.hypot((point[0]-lastTouch[0])*rect.width/100,
        (point[1]-lastTouch[1])*rect.height/100)<32;
      if(!near) {
        lastTouch=point;
        show(point);
        document.querySelector('#place-tip').textContent='Коснись ещё раз, чтобы поставить.';
        return;
      }
    }
    const placed=fromKeyboard || pointerType==='mouse' ? point : lastTouch;
    lastTouch=null;
    refresh(()=>game.place(placed));
  });
}

function garden(s) {
  const scene=node('div','garden');
  const dusk=['finale','finished','view'].includes(s.phase);
  const enchanted=dusk || s.objects.some(object=>object.id==='magic');
  scene.classList.toggle('dusk',dusk);
  scene.classList.toggle('darken',s.phase==='finale');
  scene.append(node('div','landscape'));
  for(const [i,object] of s.objects.entries()) {
    const arriving=s.phase==='placing' && i===s.objects.length-1;
    scene.append(objectLayer(object,{arriving}));
  }
  if(enchanted) effectDots(scene,'glade-lights',23);
  const fairy=node('span','fairy-flight');
  fairy.setAttribute('aria-hidden','true');
  fairy.style.setProperty('--flight-delay', -(performance.now()/1000 % 13)+'s');
  const wings=node('span','fairy-frames');
  wings.style.backgroundImage='url("'+fairyArt+'")';
  fairy.append(wings);
  scene.append(fairy);
  if(s.phase==='placing' && s.objects.at(-1)?.id==='magic') scene.append(node('div','magic-wave'));

  const fountains=s.objects.filter(object=>object.id==='fountain').map(object=>({
    point:object.point,size:sizes.fountain,variant:rewardById.fountain.options.indexOf(object.choices[0]),
  }));
  addWater(scene,fountains,groundAnchor);
  if(s.phase==='garden' && s.draft.choices.length) enablePlacement(scene,s.draft);
  return scene;
}

function choiceTray(s) {
  const reward=rewardById[s.draft.id];
  const choosing=s.draft.choices.length===0;
  const tray=node('section','tray');
  const prompt=node('p','prompt',choosing ? reward.choose : reward.place);
  const touch=matchMedia('(pointer:coarse)').matches;
  const tip=node('p','place-tip',choosing?'':touch
    ? 'Коснись поляны для примерки, затем коснись того же места ещё раз.'
    : 'Наведи мышь на поляну и щёлкни, чтобы поставить.');
  tip.id='place-tip';
  tip.setAttribute('aria-live','polite');
  tray.append(prompt,tip);
  const options=node('div','options');
  reward.options.forEach((option,index)=>{
    const tile=button('',()=>{
      lastTouch=null;
      refresh(()=>game.choose(option),'option-'+index);
      if(!reward.multiple && matchMedia('(pointer:fine)').matches) {
        document.querySelector('#placement')?.focus({preventScroll:true});
      }
    },{className:'option',aria:option});
    tile.id='option-'+index;
    tile.setAttribute('aria-pressed',String(s.draft.choices.includes(option)));
    tile.append(artFor(reward.id,index),node('span','',option));
    options.append(tile);
  });
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
  if(s.phase==='garden') board.append(choiceTray(s));
  if (s.phase==='exercise' || s.phase==='finished') {
    const overlay = node('div','overlay');
    const card = node('section','activity');
    card.setAttribute('role','dialog');
    card.setAttribute('aria-modal','true');
    card.setAttribute('aria-label',s.phase==='exercise'?exercises[s.exercise]:'Готовый сад');
    if (s.phase==='exercise') {
      card.append(cardArt(s.exercise));
      const done = button('Готово', () => refresh(() => game.done(),'option-0'), {className:'primary'});
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
  if(s.phase==='menu') butterflyStartedAt=null;
  if(s.index!==previewIndex || s.phase==='menu') {
    previewIndex=s.index;
    previewPoint=defaultPreview;
    lastTouch=null;
  }
  app.replaceChildren(s.phase==='menu' ? menu(s) : play(s));
  if (focusId) (document.getElementById(focusId) ?? document.getElementById('option-0'))?.focus({preventScroll:true});
  if (s.animation && !timer) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effect=s.animation.effect;
    const duration = reduced ? 90 : effect==='dusk' ? 2900 : 500;
    timer = setTimeout(() => {
      timer = null;
      refresh(() => game.completeAnimation(s.animation.token),'done');
    },duration);
  }
}
render();

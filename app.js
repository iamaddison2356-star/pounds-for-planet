'use strict';
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav.addEventListener('click', event => { if(event.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); } });
document.addEventListener('keydown', event => {if(event.key === 'Escape') {nav.classList.remove('open'); menu.setAttribute('aria-expanded','false');}});
const amount = document.querySelector('#amount');
const amounts = [...document.querySelectorAll('[data-amount]')];
function updateImpact() {
  if(!amount) return;
  const value = Number(amount.value);
  const valid = amount.value !== '' && amount.validity.valid;
  const label = valid ? value.toLocaleString('en-US') : '—';
  document.querySelector('#pounds').textContent = valid ? '$'+label : label;
  document.querySelector('#button-pounds').textContent = valid ? '$'+label : label;
  amounts.forEach(button => { const selected = valid && Number(button.dataset.amount) === value; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed',String(selected)); });
}
amounts.forEach(button => button.addEventListener('click', () => { amount.value = button.dataset.amount; updateImpact(); }));
amount?.addEventListener('input',updateImpact);
const dialog = document.querySelector('#donation-dialog');
document.querySelector('#donation-form')?.addEventListener('submit', event => { event.preventDefault(); if(!amount.reportValidity()) return; const value = Number(amount.value).toLocaleString('en-US'); document.querySelector('#dialog-amount').textContent = '$'+value; dialog.showModal(); });
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog?.addEventListener('click',event=>{ if(event.target === dialog) { const box = dialog.getBoundingClientRect(); if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
updateImpact();

// Keep scrolling native. Batch visual updates into one frame per scroll event.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.header');
const progress = document.querySelector('.reading-progress');
const coast = document.querySelector('.coast-frame img');
const hero = document.querySelector('.hero-visual');
const badge = document.querySelector('.round-label');
const strip = document.querySelector('.strip-inner');
const how = document.querySelector('#how-it-works');
const steps = [...document.querySelectorAll('.steps article')];
const closing = document.querySelector('.closing');
const navSections = [...nav.querySelectorAll('a[href^="#"]')].map(link => ({link, section:document.querySelector(link.getAttribute('href'))})).filter(item => item.section);
const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min,value));
let scheduled = false;

function paintScroll() {
  scheduled = false;
  const viewport = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const scrollY = window.scrollY;
  const range = document.documentElement.scrollHeight - viewport;
  const heroBox = hero?.getBoundingClientRect();
  const stripBox = strip?.getBoundingClientRect();
  const howBox = how?.getBoundingClientRect();
  const closeBox = closing?.getBoundingClientRect();
  const sectionPositions = navSections.map(item => ({...item, top:item.section.getBoundingClientRect().top}));
  const stepPositions = steps.map(step => step.getBoundingClientRect().top);
  const reduced = motionPreference.matches;
  progress.style.transform = 'scaleX('+clamp(range > 0 ? scrollY/range : 0)+')';
  header.classList.toggle('has-scrolled',scrollY > 20);
  let current = null;
  sectionPositions.forEach(item => { if(item.top <= viewport*.4 && (!current || item.top > current.top)) current=item; });
  navSections.forEach(item => { const active=current?.section === item.section; item.link.classList.toggle('section-active',active); if(active) item.link.setAttribute('aria-current','location'); else item.link.removeAttribute('aria-current'); });

  if(reduced) {
    if(coast) coast.style.transform=''; if(badge) badge.style.transform=''; if(strip) strip.style.transform=''; closing?.style.removeProperty('--closing-shift');
    steps.forEach(step=>step.style.setProperty('--step-progress','1'));
    return;
  }
  // The image moves inside a clipped frame, keeping the content stable.
  if(heroBox && heroBox.bottom > 0 && heroBox.top < viewport) {
    const travel = clamp((viewport*.45-heroBox.top)/(viewport+heroBox.height),-.5,.5);
    coast.style.transform='translate3d(0,'+(travel*65)+'px,0) scale(1.14)';
    const departure = clamp((headerHeight-heroBox.top)/Math.max(1,heroBox.height));
    badge.style.transform='scale('+(1-departure*.35).toFixed(3)+')';
  }
  if(stripBox && stripBox.bottom > 0 && stripBox.top < viewport) {
    const travel=clamp((viewport*.5-stripBox.top)/viewport,-1,1);
    strip.style.transform='translate3d('+(travel*14)+'px,0,0)';
  }
  if(howBox && howBox.bottom > 0 && howBox.top < viewport) {
    const horizontal=window.innerWidth > 480;
    const journey=clamp((viewport*.8-howBox.top)/Math.max(1,howBox.height*.85));
    steps.forEach((step,index)=> {
      const value=horizontal ? clamp(journey*3-index*.55) : clamp((viewport*.83-stepPositions[index])/(viewport*.4));
      step.style.setProperty('--step-progress',value.toFixed(3));
      step.classList.toggle('step-lit',value>.3);
    });
  }
  if(closeBox && closeBox.bottom > 0 && closeBox.top < viewport) {
    closing.style.setProperty('--closing-shift',clamp((viewport*.5-closeBox.top)/viewport,-1,1)*55+'px');
  }
}
function scheduleScroll() { if(!scheduled) { scheduled=true; window.requestAnimationFrame(paintScroll); } }
window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',scheduleScroll,{passive:true});
window.addEventListener('load',scheduleScroll,{once:true});
motionPreference.addEventListener('change',scheduleScroll);
scheduleScroll();

// Reveal on arrival without hiding the content if scripting or motion is unavailable.
const revealItems=[...document.querySelectorAll('.about-intro>div,.mission>div,.section-heading>*,.steps article,.donation-copy,.donation-card,.impact-section .section>div,.faq-section>div,.closing>*,footer>*')];
if('IntersectionObserver' in window) {
  const revealObserver=new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const element=entry.target;
      if(!motionPreference.matches && typeof element.animate === 'function') {
        const stagger=element.parentElement.classList.contains('steps') ? steps.indexOf(element)*110 : 0;
        const distance=window.innerWidth <= 480 ? 18 : 32;
        const animation=element.animate([{opacity:0,transform:'translateY('+distance+'px)'},{opacity:1,transform:'translateY(0)'}],{duration:720,delay:stagger,easing:'cubic-bezier(.2,.65,.25,1)',fill:'backwards'});
        const cancelOnPreference=()=>{if(motionPreference.matches) animation.cancel();};
        motionPreference.addEventListener('change',cancelOnPreference);
        animation.finished.catch(()=>{}).finally(()=>motionPreference.removeEventListener('change',cancelOnPreference));
      }
      revealObserver.unobserve(element);
    });
  },{threshold:.1,rootMargin:'0px 0px -24px 0px'});
  revealItems.forEach(element=>revealObserver.observe(element));
}

// Make changing a donation amount feel immediate without altering the target.
function emphasizeImpact() {
  if(motionPreference.matches) return;
  const result=document.querySelector('.impact-result');
  if(!result || typeof result.animate !== 'function') return;
  result.getAnimations().forEach(animation=>animation.cancel());
  result.animate([{transform:'scale(1)'},{transform:'scale(1.025)',backgroundColor:'#dcefbf'},{transform:'scale(1)'}],{duration:360,easing:'ease-out'});
}
amounts.forEach(button=>button.addEventListener('click',emphasizeImpact));
amount?.addEventListener('change',emphasizeImpact);

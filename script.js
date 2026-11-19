'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=new Map(), pending=null;
const pystr=s=>JSON.stringify(s);
function renderState(highlight=''){ $('#cards').innerHTML=[...state].map(([k,v])=>'<div class="entry '+(k===highlight?'highlight':'')+'"><strong>'+esc(k)+'</strong><span>'+v+' ₸</span></div>').join('')||'<p>Сөздік бос: {}</p>';$('#state-count').textContent='len(shop) = '+state.size; }
function reset(){state=new Map([['дәптер',300],['қалам',150],['сызғыш',200]]);pending=null;renderState();$('#prediction').hidden=true;$('#live-code').textContent='shop = {"дәптер": 300, "қалам": 150, "сызғыш": 200}';$('#live-result').textContent='3 кілт–мән жұбы. Әр тауардың атауы арқылы бағасын табамыз.';}
$('#reset').onclick=reset;
$$('[data-action]').forEach(b=>b.onclick=()=>{
 const key=$('#key').value.trim(), value=Number($('#value').value),action=b.dataset.action;
 if(!key){$('#live-result').textContent='Алдымен кілтті енгізіңіз.';return}
 if(['add','update'].includes(action)&&(!Number.isSafeInteger(value)||value<0||$('#value').value==='')){$('#live-result').textContent='Баға үшін нөл немесе оң бүтін сан енгізіңіз.';return}
 const exists=state.has(key), q=pystr(key);let correct,options,code,result;
 if(action==='add'||action==='update'){correct=exists?'Бар мән өзгереді':'Жаңа элемент қосылады';options=['Жаңа элемент қосылады','Бар мән өзгереді','Элемент жойылады'];code='shop['+q+'] = '+value;result=exists?key+': '+state.get(key)+' → '+value+'. Бар кілттің мәні өзгерді.':key+': '+value+'. Жаңа кілт–мән жұбы қосылды.';}
 else if(action==='get'){correct=exists?String(state.get(key)):'Табылмады';options=[correct,exists?'Табылмады':'KeyError'];code='print(shop.get('+q+', "Табылмады"))';result=correct+'\n'+(exists?'Кілтке сәйкес мән табылды.':'Кілт жоқ, сондықтан әдепкі мәтін қайтарылды.');}
 else if(action==='has'){correct=exists?'True':'False';options=['True','False'];code='print('+q+' in shop)';result=correct+'\nin тек кілттерді тексереді.';}
 else {correct=exists?'Элемент жойылады':'Сөздік өзгермейді';options=['Элемент жойылады','Сөздік өзгермейді'];code='if '+q+' in shop:\n    del shop['+q+']';result=exists?key+' кілті мен мәні жойылды.':'Кілт жоқ. Шарт False, жою орындалмайды.';}
 pending={key,value,action,correct,code,result,chosen:null};$('#live-code').textContent=code;$('#prediction').hidden=false;$('#predict-question').textContent='Осы код орындалса не болады?';$('#predict-feedback').textContent='';$('#apply').disabled=true;
 $('#predict-options').innerHTML=options.map(o=>'<button class="choice">'+esc(o)+'</button>').join('');
 $$('#predict-options button').forEach(btn=>btn.onclick=()=>{pending.chosen=btn.textContent;$$('#predict-options button').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');$('#apply').disabled=false;});
});
$('#apply').onclick=()=>{if(!pending||pending.chosen===null)return;const p=pending;if(p.action==='add'||p.action==='update')state.set(p.key,p.value);if(p.action==='delete')state.delete(p.key);renderState(p.key);$('#live-result').textContent=p.result;$('#predict-feedback').textContent=(p.chosen===p.correct?'Дұрыс болжам. ':'Болжамды қайта қараңыз. ')+'Дұрыс нәтиже: '+p.correct;$('#apply').disabled=true;pending=null;};
$('#projector').onclick=()=>{document.body.classList.toggle('projector');$('#projector').setAttribute('aria-pressed',document.body.classList.contains('projector'));};
let selected='pair',seconds=540,timer=null,endAt=0;
function clock(){$('#clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function stop(){clearInterval(timer);timer=null;$('#start-timer').textContent='Бастау';}
$('#start-timer').onclick=()=>{if(timer){seconds=Math.max(0,Math.ceil((endAt-Date.now())/1000));stop();clock();return}if(seconds<=0)return;endAt=Date.now()+seconds*1000;$('#start-timer').textContent='Кідірту';timer=setInterval(()=>{seconds=Math.max(0,Math.ceil((endAt-Date.now())/1000));clock();if(seconds===0){stop();$('#start-timer').textContent='Уақыт аяқталды';}},250);};
$('#reset-timer').onclick=()=>{stop();seconds=LESSON.tasks.find(t=>t.id===selected).minutes*60;clock();};
function taskView(id){selected=id;const t=LESSON.tasks.find(t=>t.id===id);stop();seconds=t.minutes*60;clock();$$('[data-task]').forEach(b=>b.classList.toggle('active',b.dataset.task===id));
 $('#roles').textContent=id==='pair'?'Код жазушы және тексеруші. Екі әрекеттен кейін рөлдерді ауыстырыңыз.':id==='group'?'Код жазушы, тексеруші, түсіндіруші. 6 минут код, 2 минут бағалау, 2 минут қорғау.':'Әр оқушы өзі орындайды. Қорытындыны мұғалім растайды.';
 $('#task').innerHTML='<h3>'+esc(t.title)+'</h3><pre class="code">'+esc(t.starter)+'</pre><ol>'+t.instructions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p>Кодты Thonny немесе IDLE ішінде орындаңыз. Бағалау: '+t.criteria.length+' балл.</p><details><summary>1-деңгей · Ишара</summary><p>Қосу және өзгерту: d[кілт] = мән. Іздеу: get(). Тексеру: in. Жою: del.</p></details><details><summary>2-деңгей · Кодтың бір бөлігі</summary><pre>'+esc(t.code.slice(0,2).join('\n'))+'</pre></details><details><summary>3-деңгей · Толық шешім және әр жолдың түсіндірмесі</summary><pre class="code">'+esc(t.code.join('\n'))+'</pre><h3>Күтілетін нәтиже</h3><pre>'+esc(t.output)+'</pre>'+t.code.map((line,i)=>'<div class="explain"><b>'+String(i+1).padStart(2,'0')+'</b><div><code>'+esc(line)+'</code>'+esc(t.explain[i])+'</div></div>').join('')+'</details><p><a href="#assessment">Бағалау парағына өту ↗</a></p>';
}
$$('[data-task]').forEach(b=>b.onclick=()=>taskView(b.dataset.task));
let qi=0,score=0,answered=false;
function quizView(){answered=false;const q=LESSON.quiz[qi];$('#quiz-box').innerHTML='<p class="eyebrow">'+(qi+1)+' / '+LESSON.quiz.length+'</p><h3>'+esc(q.question)+'</h3><div class="answers">'+q.answers.map((a,i)=>'<button class="answer" data-i="'+i+'">'+String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div><p id="quiz-feedback" role="status"></p><button id="next-question" hidden>Келесі сұрақ</button>';$$('.answer').forEach(btn=>btn.onclick=()=>{if(answered)return;answered=true;const ok=Number(btn.dataset.i)+1===q.correct;if(ok)score++;btn.classList.add(ok?'correct':'wrong');$$('.answer')[q.correct-1].classList.add('correct');$$('.answer').forEach(b=>b.disabled=true);$('#quiz-feedback').textContent=(ok?'Дұрыс. ':'Қате. ')+q.explain;$('#next-question').hidden=false;});$('#next-question').onclick=()=>{qi++;if(qi<LESSON.quiz.length)quizView();else{$('#quiz-box').innerHTML='<h3>Нәтиже: '+score+' / '+LESSON.quiz.length+'</h3><p>Қателескен әрекеттерді зертханада қайталаңыз.</p>';$('#restart-quiz').hidden=false;}};}
$('#restart-quiz').onclick=()=>{qi=0;score=0;$('#restart-quiz').hidden=true;quizView();};
let reviews={};try{reviews=JSON.parse(localStorage.getItem('dict-reviews')||'{}')}catch(e){}
function saveReview(){const id=$('#rubric-type').value;reviews[id]={checks:$$('#rubric input').map(x=>x.checked),author:$('#author').value,reviewer:$('#reviewer').value,feedback:$('#feedback').value};try{localStorage.setItem('dict-reviews',JSON.stringify(reviews))}catch(e){}$('#rubric-score').textContent='Нәтиже: '+reviews[id].checks.filter(Boolean).length+' / '+reviews[id].checks.length;}
function rubricView(){const id=$('#rubric-type').value,t=LESSON.tasks.find(t=>t.id===id),r=reviews[id]||{};$('#rubric').innerHTML=t.criteria.map((c,i)=>'<label class="checkrow"><input type="checkbox" '+(r.checks?.[i]?'checked':'')+'><span>'+esc(c)+' · 1 балл</span></label>').join('');for(const k of ['author','reviewer','feedback'])$('#'+k).value=r[k]||'';$$('#rubric input').forEach(x=>x.onchange=saveReview);saveReview();}
$('#rubric-type').onchange=rubricView;for(const k of ['author','reviewer','feedback'])$('#'+k).oninput=saveReview;
$('#download-review').onclick=()=>{saveReview();const id=$('#rubric-type').value,t=LESSON.tasks.find(t=>t.id===id),r=reviews[id];const text=[t.title,'Орындаушы: '+r.author,'Бағалаушы: '+r.reviewer,...t.criteria.map((c,i)=>(r.checks[i]?'1':'0')+' — '+c),$('#rubric-score').textContent,'Кері байланыс: '+r.feedback].join('\n');const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Bagalau_'+id+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#print-review').onclick=()=>window.print();
for(const [key,id] of [['mentimeter','menti-link'],['blooket','blooket-link']]){const u=window.LESSON_LINKS?.[key];if(u){try{const parsed=new URL(u);if(parsed.protocol==='https:')$('#'+id).href=parsed.href}catch(e){}}}
reset();taskView('pair');quizView();rubricView();


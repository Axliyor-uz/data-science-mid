import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map(),handlers={};
function element(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(type,cb){handlers[key+':'+type]=cb},scrollIntoView(){}});return elements.get(key);}
const document={querySelector:s=>s.includes(':checked')?(elements.get(s)||null):element(s),querySelectorAll:()=>[],addEventListener:(name,cb)=>{handlers[name]=cb},createElement:()=>({...element('created'),click(){}})};
const storage=new Map(),location={hash:'#home'};
const context=vm.createContext({document,location,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>1,clearTimeout(){},setInterval(){},Blob,URL,console});
context.window=context;context.scrollTo=()=>{};context.addEventListener=(n,cb)=>{handlers['window:'+n]=cb};context.confirm=()=>true;
vm.runInContext(fs.readFileSync('public/content.js','utf8'),context);
vm.runInContext(fs.readFileSync('public/app.js','utf8'),context);
const run=s=>vm.runInContext(s,context),C=context.COURSE;
assert.equal(C.lessons.length,58);assert.equal(C.modules.length,6);assert.equal(C.written.length,6);assert.equal(C.sources.length,8);
assert.equal(new Set(C.lessons.map(l=>l.id)).size,58);
assert.equal(C.lessons.reduce((n,l)=>n+l.quiz.length,0),348);
for(const l of C.lessons){assert(l.html.length>250,l.id+' empty lesson');assert(!l.html.includes('{{FIG:'),'Unresolved figure');assert(l.source.length>15);for(const q of l.quiz){assert.equal(q.options.length,3);assert(q.answer>=0&&q.answer<3);assert.equal(new Set(q.options).size,3);assert(q.explanation.length>30);}}
for(const s of C.sources)assert(fs.existsSync('public/'+s.url));
for(const l of C.lessons)for(const m of l.html.matchAll(/src="([^"]+)"/g))assert(fs.existsSync('public/'+m[1]));
for(const hash of ['home','curriculum','revision','resources',...C.modules.map(m=>'module/'+m.id),...C.lessons.map(l=>'lesson/'+l.id),...C.resources.map(r=>'resource/'+r.id),'exam','missing-route']){location.hash='#'+hash;run('render()');assert(element('#main').innerHTML.length>100,hash);assert(!element('#main').innerHTML.includes('[object Object]'),hash);}
// Every lesson has the new structure and all eight practice questions.
for(const l of C.lessons){
 assert.equal(l.quiz.length,6);assert.equal(l.simple.written.length,2);assert.equal(l.simple.steps.length,3);
 for(const key of ['idea','terms','example','mistake','remember'])assert(l.simple[key].length>15,l.id+' '+key);
 for(const q of l.simple.written){assert(q.prompt.length>25);assert(q.answer.length>50);}
 assert.equal(new Set(l.quiz.map(q=>q.prompt)).size,6,l.id+' duplicate question');
 location.hash='#lesson/'+l.id;run('render()');
 const html=element('#main').innerHTML;
 for(const section of ['lesson-idea','lesson-steps','lesson-example','topic-quiz','written-practice','full-notes'])assert(html.includes('id="'+section+'"'));
 assert.equal((html.match(/data-practice-id=/g)||[]).length,2);
 assert(html.includes('QUESTION 6 OF 6'));assert(html.includes('QUESTION 8 OF 8'));
}
// Independently check key numeric answers and final marks.
function answer(id,index=1){const l=C.lessons.find(l=>l.id===id),q=l.quiz[index];return q.options[q.answer];}
assert.equal(answer('3.3'),'n − 1');assert.equal(answer('3.4'),'214.286 points squared');assert.equal(answer('3.5'),'42.5');assert.equal(answer('3.6'),'28');assert.equal(answer('4.7'),'3.8 from 80 replies');assert.equal(answer('4.9'),'2.8 to 4.4');assert.equal(answer('6.2'),'105 and 45');assert.equal(answer('7.7'),'66%');
run('startExam()');assert.equal(run('state.exam.status'),'active');assert.equal(run('state.exam.deadline-state.exam.started'),120*60*1000);
assert.equal(run('examScore(state.exam)'),0);assert.equal(run('totalScore(state.exam)'),null);
run('mockQuestions.forEach((q,i)=>state.exam.answers[i]=q.answer)');assert.equal(run('examScore(state.exam)'),58);
for(let i=0;i<64;i++){run(`state.exam.index=${i}`);const html=run('examActive()');assert(html.includes(`QUESTION ${i+1} OF 64`));assert(!html.includes('Correct answer:'));}
run('C.written.forEach(w=>{state.exam.written[w.id]="My answer";state.exam.marks[w.id]=7})');assert.equal(run('answeredCount(state.exam)'),64);assert.equal(run('totalScore(state.exam)'),100);
run('finishExam()');assert.equal(run('state.exam.status'),'submitted');assert(run('examResults()').includes('100/100'));assert(run('examResults()').includes('self-awarded'));
assert.equal(run('validImported(state)'),true);assert.equal(run('validImported({...state,completed:["fake"]})'),false);
run('startExam();state.exam.deadline=Date.now()-1;tick()');assert.equal(run('state.exam.status'),'submitted');assert.equal(run('state.exam.expired'),true);assert.equal(run('examScore(state.exam)'),0);
// Exercise actual click handler for quiz feedback, retry and completion.
location.hash='#lesson/2.1';run('render()');
function click(action,id){handlers.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action,id},textContent:'',classList:{toggle(){}}}:null}});}
for(let i=0;i<6;i++)element(`input[name="quiz-${i}"]:checked`).value=String(C.lessons[0].quiz[i].answer);
click('check-quiz','2.1');assert.equal(run('state.quizzes["2.1"].score'),6);assert(element('#quiz-container').innerHTML.includes('Correct'));
click('complete','2.1');assert.equal(run('state.completed.includes("2.1")'),true);
click('retry-quiz','2.1');assert.equal(run('quizDraft["2.1"].checked'),false);
click('bookmark','2.1');assert.equal(run('state.bookmarks.includes("2.1")'),true);
click('bookmark','2.1');assert.equal(run('state.bookmarks.includes("2.1")'),false);
run('searchTerm="leakage";moduleFilter="all"');assert(run('filteredLessons().length')>0);
assert.equal(run('esc("<img src=x onerror=alert(1)>")'),'&lt;img src=x onerror=alert(1)&gt;');
run('state.notes["2.1"]="A saved thought";persist()');assert(JSON.parse(storage.get('ds-study-studio-v1')).notes['2.1']==='A saved thought');
// Older two-question results remain readable and do not count as a six-question result.
run('state.quizzes["2.2"]={answers:C.lessons[1].quiz.slice(0,2).map(q=>q.answer),score:2,attempts:1};state.completed.push("2.2")');
assert.equal(run('validImported(state)'),true);
const oldHTML=run('quizHTML(lessonFor("2.2"))');
assert(oldHTML.includes('earlier 2-question result'));assert(!oldHTML.includes('disabled'));
assert(run('state.completed.includes("2.2")'));
// Do not mark an incomplete quiz; a single error must not allow completion.
location.hash='#lesson/2.3';run('render()');
for(let i=0;i<6;i++)elements.delete(`input[name="quiz-${i}"]:checked`);
click('check-quiz','2.3');assert.equal(run('state.quizzes["2.3"]'),undefined);
assert(element('#quiz-message').textContent.includes('all six'));
for(let i=0;i<6;i++)element(`input[name="quiz-${i}"]:checked`).value=String(C.lessons[2].quiz[i].answer);
element('input[name="quiz-5"]:checked').value=String((C.lessons[2].quiz[5].answer+1)%3);
click('check-quiz','2.3');assert.equal(run('state.quizzes["2.3"].score'),5);
click('complete','2.3');assert.equal(run('state.completed.includes("2.3")'),false);
assert(run('revision()').includes('Describe, compare, predict'));
// Written practice persists, is escaped on display, and is included in valid backups.
handlers.input({target:{id:'practice-0',dataset:{practiceId:'2.1-write-0'},value:'My answer <script>unsafe</script>'}});
assert.equal(run('state.practice["2.1-write-0"]'),'My answer <script>unsafe</script>');
assert.equal(run('validImported(state)'),true);
assert(run('writtenPractice(lessonFor("2.1"))').includes('&lt;script&gt;'));
assert(!run('writtenPractice(lessonFor("2.1"))').includes('<script>unsafe'));
assert.equal(run('validImported({...state,practice:{"bad-key":"value"}})'),false);
assert(JSON.parse(storage.get('ds-study-studio-v1')).practice['2.1-write-0']);
// The expanded bank must not change old exam questions or old answer positions.
const oldRows=fs.readFileSync('questions.txt','utf8').trim().split('\n').map(s=>s.split('|'));
for(const [i,l] of C.lessons.entries()){
 const row=oldRows.find(r=>r[0]===l.id),shift=(i+1)%3;
 assert.equal(l.quiz[1].prompt,row[6]);assert.equal(l.quiz[1].answer,(3-shift)%3);
}
assert.equal(answer('3.3',4),'2');
assert.equal(answer('4.8',4),'It falls from about 1.414 to 0.707');
assert.equal(answer('7.2',3),'19/30, about 63.3%');
assert.equal(answer('7.7',3),'74%');
console.log('PASS: 58 lessons, 348 marked + 116 written questions, sources/assets, every route, numeric keys, 64 exam pages, 100-mark scoring, incomplete grading, expiry, quiz actions, bookmarks, imports, escaping and persistence.');
console.log('Verification boundary: simulated DOM checks only; no real-browser layout test.');

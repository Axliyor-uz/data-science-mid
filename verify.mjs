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
 for(const section of (l.module===6?['topic-quiz','written-practice']:['topic-quiz','written-practice','full-notes']))assert(html.includes('id="'+section+'"'));
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
assert(run('revision()').includes('The claim ladder'));
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
// Notebook routes preserve all source cells, with reciprocal lecture connections.
assert.equal(C.labs.length,4);assert.equal(C.labs.reduce((n,l)=>n+l.sections.length,0),25);
for(const l of C.labs.filter(l=>l.format!=='worked')){
 const nb=JSON.parse(fs.readFileSync('public/'+l.url,'utf8'));
 const content=[...l.setupCells,...l.sections.flatMap(p=>p.content),...l.submissionCells];
 assert.equal(content.length,nb.cells.length);assert.equal(new Set(content.map(c=>c.number)).size,nb.cells.length);
 assert(nb.cells.every(c=>!c.outputs?.length));
 for(const c of content)assert.equal(c.source,Array.isArray(nb.cells[c.number-1].source)?nb.cells[c.number-1].source.join(''):nb.cells[c.number-1].source);
 for(const p of l.sections){
  location.hash='#lab/'+l.id+'/'+p.id;run('render()');const html=element('#main').innerHTML;
  assert(html.includes('Notebook questions and code'));assert(html.includes('data-lab-note="'+l.id+'/'+p.id+'"'));
  for(const id of p.lessons){assert(C.lessons.some(t=>t.id===id));assert(html.includes('href="#lesson/'+id+'"'));assert(run(`lesson(${JSON.stringify(id)})`).includes('href="#lab/'+l.id+'/'+p.id+'"'));}
 }
 location.hash='#lab/'+l.id;run('render()');assert(element('#main').innerHTML.includes('Before submitting'));
}
for(const route of ['labs','lab/9','lab/1/no-such-section']){location.hash='#'+route;run('render()');assert(element('#main').innerHTML.length>100);}
handlers.input({target:{id:'lab-note',dataset:{labNote:'2/part-7'},value:'Reference <script>test</script>'}});
assert(run('labPage("2","part-7")').includes('&lt;script&gt;test'));
click('lab-done','2/part-7');assert(run('state.labDone.includes("2/part-7")'));
assert(run('validImported(state)'));assert(!run('validImported({...state,labDone:["bad"]})'));assert(!run('validImported({...state,labNotes:{"bad":"x"}})'));
click('lab-done','2/part-7');assert(!run('state.labDone.includes("2/part-7")'));
assert(JSON.parse(storage.get('ds-study-studio-v1')).labNotes['2/part-7']);
console.log('PASS: all 87 notebook cells, 20 lab sections, downloads, reciprocal lesson links, lab routes, notes, reviewed state and backup validation.');

// Lab 4 belongs only to the lab navigation; old links and progress remain usable.
assert.equal(run('lectureLessons.length'),53);assert.equal(run('lectureModules.length'),5);
assert(!run('home()').includes('href="#module/6"'));
assert(!run('curriculum()').includes('href="#lesson/6.'));
assert(!run('curriculum()').includes('data-filter="6"'));
assert(run('labsHome()').includes('href="#lab/4"'));
for(const p of C.labs.find(l=>l.id==='4').sections){
 location.hash='#lab/4/'+p.id;run('render()');const html=element('#main').innerHTML;
 assert(html.includes('Worked example and code'));assert(html.includes('QUESTION 8 OF 8'));assert(html.includes('sources/source-6.pdf'));
 for(const id of p.lessons){assert(C.lessons.some(l=>l.id===id));assert(run(`lesson(${JSON.stringify(id)})`).includes('href="#lab/4/'+p.id+'"'));}
 location.hash='#lesson/'+p.practice;run('render()');assert(element('#main').innerHTML.includes('LAB 4'));
}
location.hash='#module/6';run('render()');assert(element('#main').innerHTML.includes('Lecture-to-lab connections'));
location.hash='#lab/4/part-1';run('render()');
handlers.change({target:{name:'quiz-0',value:'1',dataset:{}}});assert.equal(run('quizDraft["6.1"].answers[0]'),1);
assert(run('validImported({...state,completed:["6.1"],notes:{"6.1":"Existing lab notes"}})'));
console.log('PASS: Lab 4 moved into five lab sections; lecture path excludes it; old links, practice and progress preserved.');

for(const l of C.lessons)assert.equal(l.title,l.originalTitle);
assert.equal(C.modules.find(m=>m.id===4).title,'Data Cleaning and Quality');
assert(run('lesson("4.1")').includes('<section id="full-notes">'));
assert(!run('lesson("4.1")').includes('Key words, in plain language'));
console.log('PASS: lecture terminology restored; detailed notes visible; practice and lab structure retained.');

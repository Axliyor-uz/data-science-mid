import fs from 'node:fs';
import path from 'node:path';
import {marked} from 'marked';
const guide=fs.readFileSync('source/guide.md','utf8');
const sources=JSON.parse(fs.readFileSync('source/files.json','utf8'));
const render=s=>marked.parse(s.replace(/\{\{FIG:([^|]+)\|([^}]+)\}\}/g,(_,file,caption)=>`<figure><img src="assets/${file}" alt="${caption.replaceAll('"','&quot;')}" loading="lazy"><figcaption>${caption}</figcaption></figure>`).replace('{{TOC}}',''));
const chapters=[...guide.matchAll(/^# (\d+)\. (.+)\n([\s\S]*?)(?=^# |$(?![\s\S]))/gm)].map(m=>({number:+m[1],title:m[2],text:m[3]}));
const getChapter=n=>chapters.find(c=>c.number===n);
const rows=fs.readFileSync('questions.txt','utf8').trim().split('\n').map(l=>l.split('|'));
if(rows.some(r=>r.length!==11))throw new Error('Question bank field mismatch');
const bank=Object.fromEntries(rows.map((r,i)=>{
 const quiz=[0,1].map((_,j)=>{const b=1+j*5;const opts=[r[b+1],r[b+2],r[b+3]];const shift=(i+j)%3;const options=opts.slice(shift).concat(opts.slice(0,shift));return {id:r[0]+'-'+j,prompt:r[b],options,answer:(3-shift)%3,explanation:r[b+4]};});
 return [r[0],quiz];
}));
const meta={2:['01','Foundations','Ask better questions. Count the right things.','W1 · 60 slides + Lab 1'],3:['02','Describing data','Find the centre. Understand the whole distribution.','W2 · 60 slides + Lab 2'],4:['03','Data quality','Clean with evidence. Keep uncertainty visible.','W3 · 56 slides + registry practice'],5:['04','Features & prediction','Represent data and protect the evaluation boundary.','W4 · 43 slides'],6:['04+','The complete lab','Build a six-feature prediction, one step at a time.','Lab 4 · 7 pages'],7:['05','Exploring & explaining','Compare rates. Unpick composition and confounding.','W5 · 53 slides']};
const modules=Object.entries(meta).map(([num,[label,title,description,source]])=>({id:+num,label,title,description,source,lessons:[]}));
const lessons=[];
for(const chapter of chapters.filter(c=>c.number>=2&&c.number<=7)){
 const source=chapter.text.split('## ')[0].trim();
 for(const m of chapter.text.matchAll(/^## (\d+\.\d+) (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)){
  if(!bank[m[1]])throw new Error('Missing quiz '+m[1]);
  const lesson={id:m[1],module:chapter.number,title:m[2],html:render(m[3]),plain:m[3],source,minutes:Math.max(3,Math.ceil(m[3].split(/\s+/).length/160)+2),quiz:bank[m[1]]};
  lessons.push(lesson);modules.find(g=>g.id===chapter.number).lessons.push(lesson.id);
 }
}
if(lessons.length!==58)throw new Error('Expected 58 lessons, got '+lessons.length);
const examQs=[...getChapter(9).text.matchAll(/^## Q(\d+)\. (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const examAs=[...getChapter(10).text.matchAll(/^## Answer (\d+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const rubrics={2:['Define both row units and the composite registration key (2).','Give 740 then 744 rows and explain the four repeated matches (2).','Use many_to_one and explain the student versus registration denominator (3).'],3:['Mean and median 50; deviations −30, −10, 10, 30 and squared sum 2,000 (2).','Sample variance 666.667 points² and SD 25.820 points, with working (3).','Population-style SD 22.361 and a correct explanation of n versus n−1 (2).'],5:['Remove the confirmed copy; use the verified correction; flag 220; keep verified 47 (4).','Four final rows, three observed scores, mean 80 points (2).','Exact exam-source accuracy check and missingness limitation (1).'],6:['Response rates 90% and 40%; Evening shares 20% and 10% (2).','Pooled observed mean 3.8 with valid n=80 (2).','Within-group response independent of satisfaction for MAR (2).','Hypothetical mean 3.48, below 3.5 (1).'],8:['Quiz unavailable and announced date available at W4 (2).','Median 4; score mean/SD 70/10; login mean/SD 4/2 (2).','Vector [0.8,0,1,0,0] (1).','Explain test leakage and split-before-fit order (2).'],10:['Conditional rates 60/50 and 90/80; pooled 66/74 percent (2).','Explain weights 80:20 versus 20:80 (2).','Common-mix rates 75% versus 65% (1).','Explain remaining nonrandom participation/within-group confounding (2).']};
const written=Object.keys(rubrics).map(n=>{const q=examQs.find(m=>m[1]===n),a=examAs.find(m=>m[1]===n);return {id:'w'+n,title:q[2].replace(' (10 marks)',''),html:render(q[3].replace(/ \(\d\)/g,'')),answer:render(a[2].replace(/ \(\d\)/g,'')),rubric:rubrics[n],marks:7};});
const data={modules,lessons,written,resources:[{id:'roadmap',title:'Your study roadmap',html:render(getChapter(1).text)},{id:'reference',title:'Formula & code reference',html:render(getChapter(8).text)},{id:'traps',title:'Exam traps & reporting templates',html:render(getChapter(11).text)},{id:'sources',title:'Source map & coverage',html:render(getChapter(12).text)}],sources:sources.map((name,i)=>({name,url:`sources/source-${i+1}${path.extname(name)}`}))};
fs.writeFileSync('public/content.js','window.COURSE = '+JSON.stringify(data)+';\n');
console.log(JSON.stringify({lessons:lessons.length,topicQuestions:lessons.length*2,mockObjective:lessons.length,mockWritten:written.length,mockMarks:lessons.length+written.length*7,sources:sources.length}));

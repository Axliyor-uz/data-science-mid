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
const simpleRows=fs.readFileSync('simple-lessons.txt','utf8').trim().split('\n').map(l=>l.split('|'));
if(simpleRows.length!==58||simpleRows.some(r=>r.length!==12))throw new Error('Invalid simplified lesson fields');
const simple=Object.fromEntries(simpleRows.map(r=>[r[0],{title:r[1],idea:r[2],terms:r[3],steps:r[4].split('~'),example:r[5],mistake:r[6],remember:r[7],written:[{prompt:r[8],answer:r[9]},{prompt:r[10],answer:r[11]}]}]));
const extras=fs.readFileSync('extra-questions.txt','utf8').trim().split('\n').map(l=>l.split('|'));
if(extras.length!==232||extras.some(r=>r.length!==7))throw new Error('Invalid extra question fields');
for(const [i,r] of extras.entries()){
 if(!bank[r[0]])throw new Error('Unknown question lesson '+r[0]);
 const opts=r.slice(3,6),shift=(i+1)%3;
 bank[r[0]].push({id:r[0]+'-'+bank[r[0]].length,subtopic:r[1],prompt:r[2],options:opts.slice(shift).concat(opts.slice(0,shift)),answer:(3-shift)%3,explanation:r[6]});
}
const meta={2:['01','Start here','Ask clear questions. Know what each row means.','W1 · 60 slides + Lab 1'],3:['02','Understand numbers','Learn averages, spread, charts and z-scores.','W2 · 60 slides + Lab 2'],4:['03','Clean data','Fix supported errors. Understand missing values.','W3 · 56 slides + Lab 3'],5:['04','Prepare data & predict','Build inputs. Keep training and test separate.','W4 · 43 slides'],6:['04+','A complete worked lab','Follow one prediction example from start to finish.','Lab 4 · 7 pages'],7:['05','Find & explain patterns','Compare groups and explain misleading averages.','W5 · 53 slides']};
const modules=Object.entries(meta).map(([num,[label,title,description,source]])=>({id:+num,label,title,description,source,lessons:[]}));
const lessons=[];
for(const chapter of chapters.filter(c=>c.number>=2&&c.number<=7)){
 const source=chapter.text.split('## ')[0].trim();
 for(const m of chapter.text.matchAll(/^## (\d+\.\d+) (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)){
  if(!bank[m[1]])throw new Error('Missing quiz '+m[1]);
  const s=simple[m[1]];
  if(!s||bank[m[1]].length!==6)throw new Error('Incomplete topic '+m[1]);
  const lesson={id:m[1],module:chapter.number,title:s.title,originalTitle:m[2],simple:s,html:render(m[3]),plain:m[3]+' '+Object.values(s).join(' '),source,minutes:Math.max(5,Math.ceil(m[3].split(/\s+/).length/160)+5),quiz:bank[m[1]]};
  lessons.push(lesson);modules.find(g=>g.id===chapter.number).lessons.push(lesson.id);
 }
}
if(lessons.length!==58)throw new Error('Expected 58 lessons, got '+lessons.length);
const examQs=[...getChapter(9).text.matchAll(/^## Q(\d+)\. (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const examAs=[...getChapter(10).text.matchAll(/^## Answer (\d+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const rubrics={2:['Define both row units and the composite registration key (2).','Give 740 then 744 rows and explain the four repeated matches (2).','Use many_to_one and explain the student versus registration denominator (3).'],3:['Mean and median 50; deviations −30, −10, 10, 30 and squared sum 2,000 (2).','Sample variance 666.667 points² and SD 25.820 points, with working (3).','Population-style SD 22.361 and a correct explanation of n versus n−1 (2).'],5:['Remove the confirmed copy; use the verified correction; flag 220; keep verified 47 (4).','Four final rows, three observed scores, mean 80 points (2).','Exact exam-source accuracy check and missingness limitation (1).'],6:['Response rates 90% and 40%; Evening shares 20% and 10% (2).','Pooled observed mean 3.8 with valid n=80 (2).','Within-group response independent of satisfaction for MAR (2).','Hypothetical mean 3.48, below 3.5 (1).'],8:['Quiz unavailable and announced date available at W4 (2).','Median 4; score mean/SD 70/10; login mean/SD 4/2 (2).','Vector [0.8,0,1,0,0] (1).','Explain test leakage and split-before-fit order (2).'],10:['Conditional rates 60/50 and 90/80; pooled 66/74 percent (2).','Explain weights 80:20 versus 20:80 (2).','Common-mix rates 75% versus 65% (1).','Explain remaining nonrandom participation/within-group confounding (2).']};
const written=Object.keys(rubrics).map(n=>{const q=examQs.find(m=>m[1]===n),a=examAs.find(m=>m[1]===n);return {id:'w'+n,title:q[2].replace(' (10 marks)',''),html:render(q[3].replace(/ \(\d\)/g,'')),answer:render(a[2].replace(/ \(\d\)/g,'')),rubric:rubrics[n],marks:7};});
const labs=JSON.parse(fs.readFileSync('source/labs.json','utf8')).map(lab=>{
 const notebook=JSON.parse(fs.readFileSync(`public/labs/lab-${lab.id}.ipynb`,'utf8'));
 const cells=range=>range.length?notebook.cells.slice(range[0],range[1]+1).map((c,i)=>({number:range[0]+i+1,kind:c.cell_type,source:(Array.isArray(c.source)?c.source.join(''):c.source),html:c.cell_type==='markdown'?render((Array.isArray(c.source)?c.source.join(''):c.source)):''})):[];
 return {...lab,url:`labs/lab-${lab.id}.ipynb`,setupCells:cells(lab.setup),submissionCells:cells(lab.submission),sections:lab.sections.map(section=>({...section,content:cells(section.cells)}))};
});
labs.push({id:'4',week:'4',title:'Prepare data and make predictions',subtitle:'Follow the supplied split from raw records to an honest test result.',duration:'5 guided sections',format:'worked',filename:sources[5],url:'sources/source-6.pdf',setupCells:[],submissionCells:[],dataNote:'Lab 4 is supplied as a PDF instruction sheet. These five sections preserve the existing worked solution to Task 7 (pages 6–7). Open the PDF for all seven original tasks. Run the Python in your own notebook; this site does not execute it.',submitNote:'Follow the original PDF and current course submission instructions. Keep the training/test split fixed, show the fitted parameters and feature order, and report test performance separately from the new student prediction.',sections:lessons.filter(l=>l.module===6).map((l,i)=>({id:'part-'+(i+1),title:l.title,questions:'Task 7 · worked step '+(i+1),practice:l.id,lessons:[['5.1','5.7','5.8'],['5.3','5.9','5.10'],['5.3','5.6','5.11'],['5.2','5.12'],['5.9','5.10']][i],pages:'Lab 4 PDF pp. 6–7 · Task 7',connection:l.simple.idea,task:l.simple.steps.join(' '),evidence:l.simple.remember,trap:l.simple.mistake,content:[{kind:'markdown',html:l.html}]}))});
const data={modules,lessons,written,labs,resources:[{id:'roadmap',title:'Your study roadmap',html:render(getChapter(1).text)},{id:'reference',title:'Formula & code reference',html:render(getChapter(8).text)},{id:'traps',title:'Exam traps & reporting templates',html:render(getChapter(11).text)},{id:'sources',title:'Source map & coverage',html:render(getChapter(12).text)}],sources:sources.map((name,i)=>({name,url:`sources/source-${i+1}${path.extname(name)}`}))};
fs.writeFileSync('public/content.js','window.COURSE = '+JSON.stringify(data)+';\n');
console.log(JSON.stringify({lessons:lessons.length,markedQuestions:lessons.length*6,writtenPractice:lessons.length*2,totalPractice:lessons.length*8,mockMarks:lessons.length+written.length*7,sources:sources.length}));

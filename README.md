# Data Science Study Studio — lecture terminology edition

This complete static website contains 53 lecture topics, four connected laboratories, 464 supplementary practice questions, and a 100-mark mock examination. Lecture terminology and original detailed study-guide headings are restored. Detailed notes are displayed by default. The original notebook questions are preserved. Additional quizzes and the mock are study material, not official examination questions.

Lab 4 remains in Lab work, with five guided sections for Task 7 and a link to the complete original instructions. Existing progress and old links remain compatible.

## Deploy on Vercel

Extract this ZIP and upload its contents to your GitHub repository. The repository root should contain vercel.json, package.json and public/. Import that repository into Vercel. The included configuration uses Framework Other, output directory public, and no build or installation command. No environment variables are needed.

## Edit the website

- public/index.html: page shell and navigation.
- public/styles.css: appearance and responsive layout.
- public/app.js: pages, interactions, quizzes and local progress.
- source/guide.md: detailed lecture notes and original topic headings.
- source/labs.json: Lab 1–3 section mappings and lecture connections.
- public/labs/: study notebooks with saved outputs cleared.
- public/sources/: original course materials and study guide.
- questions.txt and extra-questions.txt: objective questions.
- simple-lessons.txt: retained source of written practice and supporting lab summaries; simplified lecture explanations are no longer the displayed lesson body.
- compile.mjs: generates public/content.js and the Lab 4 section map.
- verify.mjs: content and interaction checks.

After editing source content, run:

```sh
npm install
npm run compile
npm test
```

Commit the regenerated public/content.js. Deployment serves public/ directly, so source changes require compilation before deployment. For a local preview, run python3 -m http.server 8000 --directory public and open http://localhost:8000.

Progress stays in browser local storage. Export progress from the revision desk before moving domains, then import it on your new deployment. Python notebook code runs in Jupyter or Colab, not in the website. Lab 1 CSV dependencies are not bundled. Use your own identity where the notebook requests it.

Validation: simulated DOM tests cover lecture and lab routes, quiz scoring, progress compatibility, source-cell coverage and reciprocal links. No browser visual QA was available for this update.

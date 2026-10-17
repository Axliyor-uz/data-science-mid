# Data Science Study Studio — Vercel-ready website

A complete learning website containing 58 lessons, 464 topic-practice questions (348 automatically marked and 116 written),
worked examples, downloadable course materials, revision notes and bookmarks,
and a timed 100-mark practice final for the supplied Weeks 1–5 materials.

## Deploy using GitHub and Vercel

1. Extract `data-science-vercel.zip`.
2. Create a GitHub repository and upload the **contents** of the extracted
   `data-science-vercel` folder. At the repository root you should see
   `vercel.json`, `package.json`, `README.md` and the `public` folder.
   Upload the actual files, not the ZIP archive.
3. In Vercel, add a new project and import that GitHub repository.
4. Use these settings if asked:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Other |
   | Root Directory | Repository root (the folder containing vercel.json) |
   | Build Command | Empty; no build step |
   | Install Command | Empty; no installation needed to deploy |
   | Output Directory | public |
   | Environment Variables | None |

5. Click **Deploy**, then open the deployment URL Vercel provides.

The included `vercel.json` already specifies the static output folder and skips
build and install commands. If you place this project inside a larger repository,
set Root Directory to this project's folder instead.

## Alternative: deploy from your computer

With Node.js and npm available, open a terminal **inside the extracted project
folder**, then run:

```sh
npx vercel --prod
```

Sign in and follow Vercel's project prompts. Use the static settings above if
asked. This command deploys to your Vercel account; the supplied ZIP itself has
not been deployed to Vercel.

## What each file does

- `public/index.html`: website entry page.
- `public/styles.css`: responsive styling.
- `public/app.js`: lesson navigation, quizzes, notes, progress and exam logic.
- `public/content.js`: all compiled lesson content and question data.
- `public/assets/`: teaching figures.
- `public/sources/`: original lecture PDFs, notebooks and the study guide.
- `vercel.json`: deployment settings.
- `source/guide.md`: editable lesson source.
- `source/files.json`: original source filenames.
- `questions.txt`: original marked question bank.
- `extra-questions.txt`: 232 additional marked questions with explanations.
- `simple-lessons.txt`: simpler lesson text and 116 written self-check questions.
- `compile.mjs`: optional content regeneration script.
- `verify.mjs`: automated content and interaction-logic checks.

All website features run in the browser. No ChatGPT connection, API key,
database or backend is required. Google Fonts is optional; system-font fallbacks
are provided. Hash-based lesson URLs, such as `/#lesson/2.1`, require no server
route rewrites. Keep the complete `public` folder together so download and image
links continue to work.

## Local preview

If Python 3 is installed, run this in the project folder:

```sh
python3 -m http.server 8000 --directory public
```

Then open `http://localhost:8000`. On Windows, `py -m http.server 8000 --directory
public` is an alternative. Stop the server with Ctrl+C.

## Editing

Edit `public/styles.css` for appearance and `public/app.js` for behaviour.
For full lecture notes, edit `source/guide.md`. For simpler lesson text and written practice, edit `simple-lessons.txt`. For marked questions, edit `questions.txt` and `extra-questions.txt`. Then run:

```sh
npm install
npm run compile
npm test
```

Compilation uses the pinned `marked` development dependency and Node.js 20 or
newer. Commit the updated `public/content.js` along with your source changes;
deployment deliberately serves prebuilt static files and does not regenerate
content. Direct edits to `public/content.js` are overwritten by compilation.

Run `npm test` or `node verify.mjs` to check content, scoring, expiry, routes and
saved-state behaviour. The tests use a simulated DOM, not a browser visual test.

## Moving your saved progress

Progress belongs to the browser and website origin, so your Vercel address starts
with fresh progress. To move your existing notes and results:

1. On the original Study Studio site, open **Revision desk → Export progress**.
2. On your Vercel site, open **Revision desk → Import backup**.
3. Select the exported JSON file and confirm replacement of that browser's
   current progress.

Visitors have separate browser-local progress. There is no account-based or
cross-device synchronisation. Export backups before clearing browser storage.
The app itself has no login; visitor access is controlled by your Vercel project
settings. The download links serve the bundled course materials to site visitors.

## Updated learning structure

Every lesson now has a simple main idea, explained key words, three steps, a worked example, a common mistake, and one sentence to remember. Full lecture notes remain in an expandable section. Practice has six marked questions and two written questions with model answers. Saved progress from the earlier two-question version can still be imported; your notes and completed lessons are retained.

## Assessment scope

The mock contains 58 objective questions, one from each lesson's practice bank,
and six written cases worth seven marks each. Objective answers are automatically
marked; written answers use explicit self-marking rubrics. The 120-minute timer
continues when the page is closed and expires on return if the deadline passed.
This is practice for the supplied Weeks 1–5 course pack, not an official final
paper or a guarantee of marks. Later-week materials were not supplied.

## Official deployment references

- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/cli/deploy

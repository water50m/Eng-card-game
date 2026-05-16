<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-deploy-flow -->
# Project deploy flow

When the user asks to finish changes with the project deploy flow, run these steps after verification:

1. `git add .`
2. `git commit`
3. `git push`
4. `ssh gotdev@myserver`
5. `cd ~/apps/Eng-card-game`
6. `deploy`

Use a concise commit message that summarizes the completed change when the user does not provide one.
<!-- END:project-deploy-flow -->

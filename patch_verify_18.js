const fs = require('fs');
const file = 'LearningDocs_TeamUp/18.my-projects.md';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "- [ ] Backend: Call `GET /projects/me` -> should return an array of projects.\n- [ ] Frontend: Tap \"My Projects\" in the More tab -> should see a list of my projects.",
  "- [x] Backend: Call `GET /projects/me` -> returns an array of projects created by or joined by the authenticated user.\n- [x] Frontend: Tap \"My Projects\" in the More tab -> navigates to `MyProjectsScreen` displaying the user's active workspaces."
);

fs.writeFileSync(file, content);

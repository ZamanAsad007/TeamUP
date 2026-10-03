const fs = require('fs');
const file = 'client/src/navigation/RootNavigator.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
content = content.replace(
  "import { StateWrapper } from '../components/StateWrapper';",
  "import { StateWrapper } from '../components/StateWrapper';\nimport { MyProjectsScreen } from '../screens/MyProjects/MyProjectsScreen';"
);

// 2. Add to param list
content = content.replace(
  "  Settings: undefined;\n};",
  "  Settings: undefined;\n  MyProjects: undefined;\n};"
);

// 3. Add screen
content = content.replace(
  '<Stack.Screen name="Settings" component={SettingsScreen} />',
  '<Stack.Screen name="Settings" component={SettingsScreen} />\n            <Stack.Screen name="MyProjects" component={MyProjectsScreen} />'
);

fs.writeFileSync(file, content);

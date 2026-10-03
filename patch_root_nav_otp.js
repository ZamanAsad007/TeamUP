const fs = require('fs');
const file = 'client/src/navigation/RootNavigator.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { RegisterScreen } from '../screens/Auth/RegisterScreen';",
  "import { RegisterScreen } from '../screens/Auth/RegisterScreen';\nimport { VerifyEmailScreen } from '../screens/Auth/VerifyEmailScreen';"
);

content = content.replace(
  "  Register: undefined;",
  "  Register: undefined;\n  VerifyEmail: { email: string };"
);

content = content.replace(
  '<Stack.Screen name="Register" component={RegisterScreen} />',
  '<Stack.Screen name="Register" component={RegisterScreen} />\n            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />'
);

fs.writeFileSync(file, content);

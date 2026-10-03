const fs = require('fs');
const file = 'client/src/screens/Auth/LoginScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useAuth } from '../../context/AuthContext';",
  "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../api/client';"
);

content = content.replace(
  /await login\(email, password\);\s*refreshAuth\(\);/,
  "try {\n        await login(email, password);\n        refreshAuth();\n      } catch (loginErr: any) {\n        if (loginErr.message === 'ACCOUNT_NOT_VERIFIED') {\n          navigation.navigate('VerifyEmail', { email });\n        } else {\n          throw loginErr;\n        }\n      }"
);

fs.writeFileSync(file, content);

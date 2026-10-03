const fs = require('fs');
const file = 'client/src/screens/Auth/RegisterScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useAuth } from '../../context/AuthContext';",
  "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../api/client';"
);

content = content.replace(
  /await register\({\s*email,\s*password,\s*fullName,\s*}\);\s*setRole\('STUDENT'\);\s*refreshAuth\(\);/,
  "await api.post('/auth/register', { email, password, fullName });\n      navigation.navigate('VerifyEmail', { email });"
);

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'server/src/auth/auth.service.spec.ts';
let content = fs.readFileSync(file, 'utf8');

// Add update mock
content = content.replace(
  "    user: {\n      findUnique: jest.fn(),\n      create: jest.fn(),",
  "    user: {\n      findUnique: jest.fn(),\n      create: jest.fn(),\n      update: jest.fn(),"
);

// Fix register test 1
content = content.replace(
  "        findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),",
  "        findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com', isVerified: true }),"
);

// Fix register test 2
content = content.replace(
  /expect\(result\.tokens\.accessToken\)\.toBe\('access_token'\);\s*expect\(result\.tokens\.refreshToken\)\.toBe\('refresh_token'\);\s*expect\(result\.user\.email\)\.toBe\('test@example\.com'\);/m,
  "expect(result.message).toBe('Registration successful. Verification code sent.');\n      expect(result.email).toBe('test@example.com');"
);

// Fix login test 1
content = content.replace(
  "        findUnique: jest.fn().mockResolvedValue({\n          id: 'u1',\n          email: 'test@example.com',\n          password: 'hashedpassword',\n          role: UserRole.STUDENT,\n        }),",
  "        findUnique: jest.fn().mockResolvedValue({\n          id: 'u1',\n          email: 'test@example.com',\n          password: 'hashedpassword',\n          role: UserRole.STUDENT,\n          isVerified: true,\n        }),"
);

// Fix refresh token rotation test mock behavior
content = content.replace(
  "signAsync: jest.fn().mockResolvedValue('access_token'),",
  "signAsync: jest.fn().mockImplementation((payload) => {\n          if (payload.jti) return Promise.resolve('new_refresh_token');\n          return Promise.resolve('new_access_token');\n        }),"
);

fs.writeFileSync(file, content);

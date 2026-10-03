const fs = require('fs');
const file = 'client/src/api/authService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /register: async \(data: RegisterData\): Promise<AuthResponse> => \{[\s\S]*?return response;\n  \},/,
  "register: async (data: RegisterData): Promise<{ message: string; email: string }> => {\n    return api.post('/auth/register', data);\n  },"
);

const newMethods = "  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {\n    return api.post('/auth/verify-otp', { email, code });\n  },\n\n  resendOtp: async (email: string): Promise<{ message: string }> => {\n    return api.post('/auth/resend-otp', { email });\n  },\n\n  logout:";

content = content.replace("  logout:", newMethods);

fs.writeFileSync(file, content);

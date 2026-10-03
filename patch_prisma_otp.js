const fs = require('fs');
const file = 'server/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  updatedAt DateTime @updatedAt\n\n  // Relations",
  "  updatedAt DateTime @updatedAt\n\n  isVerified   Boolean   @default(false)\n  otpCode      String?\n  otpExpiresAt DateTime?\n\n  // Relations"
);

fs.writeFileSync(file, content);

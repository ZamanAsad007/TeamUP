const fs = require('fs');
const file = 'server/src/auth/auth.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// Add new imports
content = content.replace(
  "import { RegisterDto } from './dto/register.dto';",
  "import { RegisterDto } from './dto/register.dto';\nimport { VerifyOtpDto, ResendOtpDto } from './dto/verify-otp.dto';"
);

// Add verify-otp and resend-otp endpoints
const newEndpoints = `
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }
`;

content = content.replace(
  /export class AuthController \{/m,
  "export class AuthController {\n" + newEndpoints
);

fs.writeFileSync(file, content);

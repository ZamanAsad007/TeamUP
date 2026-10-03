const fs = require('fs');
const file = 'server/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add generateOtp and sendOtpEmail
const otpHelpers = `
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpEmail(email: string, code: string): Promise<void> {
    console.log(\`[MOCK EMAIL SERVICE] Sending OTP \${code} to \${email}\`);
    // In a real app, integrate Nodemailer or Resend here.
  }
`;

content = content.replace(
  "  private hashToken(token: string): string {",
  otpHelpers + "\n  private hashToken(token: string): string {"
);

// 2. Modify Register
const newRegister = `
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      if (!existing.isVerified) {
        const otpCode = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { otpCode, otpExpiresAt },
        });
        await this.sendOtpEmail(existing.email, otpCode);
        return { message: 'Verification code sent', email: existing.email };
      }
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const fullName = dto.fullName?.trim() || dto.email.split('@')[0];
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        isVerified: false,
        otpCode,
        otpExpiresAt,
        profile: {
          create: {
            fullName,
          },
        },
      },
    });

    await this.sendOtpEmail(user.email, otpCode);
    return { message: 'Registration successful. Verification code sent.', email: user.email };
  }`;

content = content.replace(
  /async register\(dto: RegisterDto\): Promise<AuthResponse> \{[\s\S]*?return \{\s*tokens,\s*user: \{\s*id: user\.id,\s*email: user\.email,\s*role: user\.role,\s*\},\s*\};\s*\}/m,
  newRegister
);

// 3. Modify Login
const newLogin = `
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      const otpCode = this.generateOtp();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });
      await this.sendOtpEmail(user.email, otpCode);
      throw new UnauthorizedException('ACCOUNT_NOT_VERIFIED');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }`;

content = content.replace(
  /async login\(dto: LoginDto\): Promise<AuthResponse> \{[\s\S]*?return \{\s*tokens,\s*user: \{\s*id: user\.id,\s*email: user\.email,\s*role: user\.role,\s*\},\s*\};\s*\}/m,
  newLogin
);

// 4. Add verifyOtp and resendOtp methods
const verifyResendMethods = `
  async verifyOtp(dto: { email: string; code: string }): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    if (user.otpCode !== dto.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification code expired');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    const tokens = await this.generateTokens(updatedUser.id, updatedUser.email, updatedUser.role);

    return {
      tokens,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }

  async resendOtp(dto: { email: string }): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    await this.sendOtpEmail(user.email, otpCode);
    return { message: 'Verification code resent successfully' };
  }
`;

content = content.replace(
  /async refreshTokens/m,
  verifyResendMethods + '\n  async refreshTokens'
);

fs.writeFileSync(file, content);

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { ActivityLogService } from './activity-log.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiresIn: string | number;
  private readonly jwtAccessExpiresIn: string | number;
  private readonly jwtRefreshSecret: string;
  private readonly bcryptRounds: number;
  private readonly jwtAccessSecret: string;

  constructor(
    private readonly UsersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    private readonly ActivityLogService: ActivityLogService,
  ) {
    this.refreshTokenExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.jwtAccessExpiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    this.jwtRefreshSecret = this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-secret');
    this.bcryptRounds = parseInt(this.config.get<string>('BCRYPT_ROUNDS', '10'), 10);
    this.jwtAccessSecret = this.config.get<string>('JWT_SECRET', 'access-secret');
  }

  async register(dto: RegisterUserDto) {
    const user = await this.UsersService.create(dto as CreateUserDto);
    const tokens = await this.getTokens(
      user.id,
      user.firstName ?? '',
      user.lastName ?? '',
      user.email,
      user.role,
    );
    await this.saveHashedRefreshToken(user.id, tokens.refreshToken);
    return {
      user: user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto, userAgent: string, ip: string) {
    const user = await this.UsersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.getTokens(
      user.id,
      user.firstName ?? '',
      user.lastName ?? '',
      user.email,
      user.role,
    );

    await this.saveHashedRefreshToken(user.id, tokens.refreshToken);
    await this.UsersService.updateLastLogin(user.id);
    await this.ActivityLogService.logActivity(user.id, 'login', ip, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, userAgent: string, ip: string) {
    await this.UsersService.updateInternal(userId, { hashedRefreshToken: null });
    await this.ActivityLogService.logActivity(userId, 'logout', ip, userAgent);
    return { success: true };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.UsersService.findOneWithRefreshToken(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isValid) {
      await this.UsersService.updateInternal(userId, { hashedRefreshToken: null });
      throw new UnauthorizedException('Refresh token invalid');
    }

    // Rotate refresh token
    const tokens = await this.getTokens(
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.role,
    );
    await this.saveHashedRefreshToken(user.id, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async sendVerificationEmail(userId: string, email: string, firstName: string) {
    const payload = {
      sub: userId,
      firstName,
      email,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_VERIFY_EMAIL_SECRET'),
      expiresIn: this.config.get<string>(
        'JWT_VERIFY_EMAIL_EXPIRES_IN',
        '1h',
      ) as JwtSignOptions['expiresIn'],
    });
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.mailService.sendVerification(email, link, firstName);
  }

  async verifyEmail(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        firstName: string;
      }>(token, {
        secret: this.config.get<string>('JWT_VERIFY_EMAIL_SECRET'),
      });

      const user = await this.UsersService.findOne(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.verified) {
        return { message: 'Email already verified', email: decoded.email };
      }

      await this.UsersService.updateInternal(decoded.sub, {
        verified: true,
      });

      return { message: 'Email verified successfully', email: decoded.email };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async sendResetPasswordEmail(email: string) {
    const user = await this.UsersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email');

    const payload = {
      sub: user.id,
      email: user.email,
      type: 'reset-password',
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_RESET_PASSWORD_SECRET'),
      expiresIn: this.config.get<string>(
        'JWT_RESET_PASSWORD_EXPIRES_IN',
        '1h',
      ) as JwtSignOptions['expiresIn'],
    });

    const hashedToken = await bcrypt.hash(token, this.bcryptRounds);
    const expiresIn = this.config.get<string>('JWT_RESET_PASSWORD_EXPIRES_IN', '1h');
    const expiryDate = new Date();

    if (expiresIn.endsWith('h')) {
      expiryDate.setHours(expiryDate.getHours() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('m')) {
      expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('d')) {
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiresIn));
    } else {
      expiryDate.setHours(expiryDate.getHours() + 1);
    }

    await this.UsersService.updateInternal(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpiry: expiryDate,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.mailService.sendResetPassword(email, link);

    return { success: true, message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        type: string;
      }>(token, {
        secret: this.config.get<string>('JWT_RESET_PASSWORD_SECRET'),
      });

      if (decoded.type !== 'reset-password') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.UsersService.findByEmail(decoded.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.passwordResetToken || !user.passwordResetExpiry) {
        throw new UnauthorizedException('No password reset request found');
      }

      if (new Date() > user.passwordResetExpiry) {
        await this.UsersService.updateInternal(user.id, {
          passwordResetToken: null,
          passwordResetExpiry: null,
        });
        throw new UnauthorizedException('Reset token has expired');
      }

      const isValidToken = await bcrypt.compare(token, user.passwordResetToken);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);

      await this.UsersService.updateInternal(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        hashedRefreshToken: null,
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid or expired reset token';
      throw new UnauthorizedException(errorMessage);
    }
  }

  private async getTokens(
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
  ) {
    const payload = {
      sub: userId,
      firstName,
      lastName,
      email,
      role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtAccessSecret,
        expiresIn: this.jwtAccessExpiresIn as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: this.refreshTokenExpiresIn as JwtSignOptions['expiresIn'],
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveHashedRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, this.bcryptRounds);
    await this.UsersService.updateInternal(userId, { hashedRefreshToken: hashed });
  }
}

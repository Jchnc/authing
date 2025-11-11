import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { RegisterUserDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

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

  async login(dto: LoginDto) {
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

  async logout(userId: string) {
    await this.UsersService.update(userId, { hashedRefreshToken: null });
    return { success: true };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.UsersService.findOneWithRefreshToken(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isValid) {
      await this.UsersService.update(userId, { hashedRefreshToken: null });
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
    await this.UsersService.update(userId, { hashedRefreshToken: hashed });
  }
}

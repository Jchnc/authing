import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { inDays, inMinutes } from 'src/utils/time.util';

@Injectable()
export class TwoFAService {
  private readonly twoFABcryptRounds: number;
  private readonly twoFAExpiry: number;
  private readonly twoFAMaxAttempts: number;
  private readonly twoFAOTPLength: number;
  private readonly twoFATokenBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    this.twoFABcryptRounds = parseInt(this.config.get<string>('TWOFA_BCRYPT_ROUNDS', '12'), 10);
    this.twoFAExpiry = parseInt(this.config.get<string>('TWOFA_EXPIRY', '5'), 10);
    this.twoFAMaxAttempts = parseInt(this.config.get<string>('TWOFA_MAX_ATTEMPTS', '5'), 10);
    this.twoFAOTPLength = parseInt(this.config.get<string>('TWOFA_OTP_LENGTH', '6'), 10);
    this.twoFATokenBytes = parseInt(this.config.get<string>('TWOFA_TOKEN_BYTES', '32'), 10);
  }
  private generateOTP(): string {
    const len = this.twoFAOTPLength;
    const min = Math.pow(10, len - 1);
    const max = Math.pow(10, len) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
  }
  private generateDeviceToken(): string {
    return crypto.randomBytes(this.twoFATokenBytes).toString('hex');
  }

  /**
   * Sends a code to a user
   * @param userId The user id to send the code to
   * @param email The email of the user to send the code to
   */
  async sendCode(userId: string, email: string) {
    const code = this.generateOTP();
    const codeHash = await bcrypt.hash(code, this.twoFABcryptRounds);

    await this.prisma.twoFactorCode.upsert({
      where: { userId },
      update: {
        codeHash,
        expiresAt: inMinutes(this.twoFAExpiry),
        attempts: 0,
      },
      create: {
        userId,
        codeHash,
        expiresAt: inMinutes(this.twoFAExpiry),
        attempts: 0,
      },
    });
    await this.mailService.sendTwofa(email, code);
  }

  /**
   * Verifies a user’s two-factor authentication code.
   *
   * Behavior:
   * - Ensures there is an active OTP for the user.
   * - Automatically removes expired codes and rejects the verification.
   * - Enforces a maximum number of allowed attempts; exceeding it invalidates the OTP.
   * - Compares the provided code against the stored hash.
   * - Removes the OTP entry after successful verification.
   *
   * @param userId The ID of the user whose code is being verified.
   * @param code   The OTP provided by the user.
   * @returns True if the code is valid and verification succeeds.
   * @throws UnauthorizedException if:
   *   - No OTP exists for the user.
   *   - The OTP is expired.
   *   - Too many failed attempts were made.
   *   - The provided code is invalid.
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const entry = await this.prisma.twoFactorCode.findUnique({
      where: { userId },
    });

    if (!entry) {
      throw new UnauthorizedException('No OTP generated');
    }

    // Basic brute-force protection
    if (entry.attempts >= this.twoFAMaxAttempts) {
      // Remove stale OTP
      await this.prisma.twoFactorCode.delete({ where: { userId } });
      throw new UnauthorizedException('Too many attempts, request a new code');
    }

    // Clean expired code
    if (entry.expiresAt < new Date()) {
      await this.prisma.twoFactorCode.delete({ where: { userId } });
      throw new UnauthorizedException('OTP expired');
    }

    // Validate code
    const match = await bcrypt.compare(code, entry.codeHash);
    if (!match) {
      await this.prisma.twoFactorCode.update({
        where: { userId },
        data: { attempts: entry.attempts + 1 },
      });
      throw new UnauthorizedException('Invalid code');
    }

    // Valid → remove OTP
    await this.prisma.twoFactorCode.delete({
      where: { userId },
    });

    return true;
  }

  /**
   * Creates a trusted device for a user
   * @param userId The user id to create the trusted device for
   * @param userAgent The user agent of the device
   * @param days The number of days the trusted device should be valid for
   * @returns The raw token of the trusted device
   */
  async createTrustedDevice(userId: string, userAgent: string, days: number) {
    const rawToken = this.generateDeviceToken();
    const tokenHash = await bcrypt.hash(rawToken, this.twoFABcryptRounds);

    await this.prisma.trustedDevice.create({
      data: {
        userId,
        userAgent,
        deviceTokenHash: tokenHash,
        expiresAt: inDays(days),
      },
    });
    return rawToken;
  }

  /**
   * Validates a trusted device token
   * @param userId The user id to validate the token for
   * @param token The token to validate
   * @param userAgent The user agent to validate
   * @returns True if the token is valid, false otherwise
   */
  async validateTrustedDevice(userId: string, token: string, userAgent: string) {
    const entries = await this.prisma.trustedDevice.findMany({
      where: { userId },
    });

    for (const entry of entries) {
      if (entry.expiresAt < new Date()) continue;
      if (entry.userAgent !== userAgent) continue;

      const match = await bcrypt.compare(token, entry.deviceTokenHash);
      if (match) return true;
    }

    return false;
  }
}

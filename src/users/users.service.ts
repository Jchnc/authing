import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Role } from '../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10);
  }

  private readonly userSelectFields = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    verified: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
  };

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.prisma.$transaction(async (tx) => {
      const email = createUserDto.email.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(createUserDto.password, this.bcryptRounds);

      const userCount = await tx.user.count();

      const isFirstUser = userCount === 0;
      const role: Role = isFirstUser ? Role.ADMIN : (createUserDto.role ?? Role.USER);

      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: createUserDto.firstName?.trim() ?? null,
          lastName: createUserDto.lastName?.trim() ?? null,
          role,
          verified: role === Role.ADMIN,
        },
      });

      return this.toResponseDto(createdUser);
    });
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: this.userSelectFields,
    });

    return this.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: email.toLowerCase().trim() },
      select: this.userSelectFields,
    });

    return this.toResponseDto(user);
  }

  async findByEmailWithPassword(email: string) {
    return await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findOneWithRefreshToken(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(
    page = 0,
    limit = 10,
    search = '',
    orderBy: 'asc' | 'desc' = 'desc',
    role?: Role,
  ): Promise<{ data: UserResponseDto[]; pagination: any }> {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { email: { contains: searchLower } },
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: orderBy === 'asc' ? 'asc' : 'desc' },
        take: limit,
        skip: page * limit,
        select: this.userSelectFields,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Return empty array if no users found (no error)
    return {
      data: users.map((user) => this.toResponseDto(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    let passwordToUpdate: string | undefined = undefined;
    if (updateUserDto.password !== undefined) {
      passwordToUpdate = await bcrypt.hash(updateUserDto.password, this.bcryptRounds);
    }

    const data: Prisma.UserUpdateInput = {
      email: updateUserDto.email?.toLowerCase().trim(),
      firstName: updateUserDto.firstName?.trim(),
      lastName: updateUserDto.lastName?.trim(),
      ...(passwordToUpdate && { password: passwordToUpdate }),
    };

    if (updateUserDto.hashedRefreshToken !== undefined) {
      data.hashedRefreshToken = updateUserDto.hashedRefreshToken;
    }

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelectFields,
    });

    return this.toResponseDto(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  private toResponseDto(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
    isActive: boolean;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

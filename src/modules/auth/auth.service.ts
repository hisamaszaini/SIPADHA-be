import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto, RegisterDto, WargaRegisterDto } from './dto/auth.dto';
import { hash, verify } from './auth.util';
import { TokenPair } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  // REGISTER USER
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.prisma.user.create({
      data: {
        noHp: dto.noHp,
        email: dto.email,
        username: dto.username,
        password: await hash(dto.password),
        role: dto.role,
      },
    });

    const { password, refreshToken, ...userData } = user;
    return { message: 'User created', data: userData };
  }

  async registerWarga(dto: WargaRegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const nikExists = await this.prisma.penduduk.findUnique({
      where: { nik: dto.nik },
    });

    if (nikExists) throw new ConflictException('NIK already registered');

    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          noHp: dto.noHp,
          email: dto.email,
          username: dto.username,
          password: await hash(dto.password),
          role: 'WARGA',
        },
      });

      await tx.penduduk.update({
        where: { nik: dto.nik },
        data: { userId: user.id },
      });

      return user;
    });

    const { password, refreshToken, ...userData } = user;
    return { message: 'User created', data: userData };
  }

  // LOGIN
  async login(dto: LoginDto): Promise<{ message: string; data: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await verify(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { message: 'Login successful', data: tokens };
  }

  // REFRESH TOKEN - MODIFIED
  async refresh(refreshToken: string) {
    try {
      console.log('[SERVICE] Incoming refreshToken (raw):', refreshToken);

      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      console.log('[SERVICE] Decoded JWT payload:', payload);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      console.log('[SERVICE] User from DB:', user?.id, user?.email);

      if (!user || !user.refreshToken) {
        console.warn('[SERVICE] User not found or refreshToken missing in DB');
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await verify(refreshToken, user.refreshToken);
      console.log('[SERVICE] bcrypt.compare result:', isValid);

      if (!isValid) {
        console.warn('[SERVICE] Refresh token does not match hash in DB');
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      console.log('[SERVICE] New tokens generated:', tokens);

      await this.updateRefreshToken(user.id, tokens.refreshToken);
      console.log('[SERVICE] Refresh token updated in DB');

      return { message: 'Token refreshed', data: tokens };
    } catch (e) {
      console.error('[SERVICE] Refresh error:', e.message);
      throw new UnauthorizedException('Refresh failed');
    }
  }

  // LOGOUT
  async logout(userId: number): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // VALIDATE USER BY ID
  async validateUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });
  }

  // PRIVATE HELPERS
  private async generateTokens(
    sub: number,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub, email, role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      { sub },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES') || '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashed = await hash(refreshToken);
    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: { refreshToken: hashed },
    });
  }
}
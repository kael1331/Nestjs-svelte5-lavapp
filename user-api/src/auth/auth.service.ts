import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = '133806765476-l4vlgdm105bauerb58l1u0t8g8k020u3.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findOneByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.password) {
      throw new UnauthorizedException('Este usuario no tiene contraseña establecida (inicia sesión con Google)');
    }

    const isMatch = await bcryptjs.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      carWashId: user.carWash?.id || null,
      isServiceActive: user.carWash?.isServiceActive || false,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async googleLogin(token: string): Promise<{ access_token: string }> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Token de Google inválido');
      }

      const { sub: googleId, email, name } = payload;

      let user = await this.usersService.findOneByGoogleId(googleId);

      if (!user) {
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
          user = await this.usersService.updateGoogleId(existingUser.id, googleId);
        } else {
          user = await this.usersService.createOAuthUser({
            name: name || 'Usuario de Google',
            email,
            googleId,
          });
        }
      }

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        carWashId: user.carWash?.id || null,
        isServiceActive: user.carWash?.isServiceActive || false,
      };
      return {
        access_token: await this.jwtService.signAsync(jwtPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Error al verificar autenticación con Google');
    }
  }

  async revokeToken(token: string): Promise<void> {
    const exists = await this.isTokenRevoked(token);
    if (!exists) {
      const revoked = this.revokedTokenRepository.create({ token });
      await this.revokedTokenRepository.save(revoked);
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const found = await this.revokedTokenRepository.findOneBy({ token });
    return !!found;
  }
}


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { SafeUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async buildAuthResponse(user: SafeUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }

  async register(registerUserDto: RegisterUserDto) {
    await this.usersService.ensureEmailIsFree(registerUserDto.email);

    const passwordHash = await bcrypt.hash(registerUserDto.password, 10);
    const user = await this.usersService.create({
      name: registerUserDto.name,
      email: registerUserDto.email,
      passwordHash,
      role: registerUserDto.role,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  async me(userId: string) {
    return this.usersService.getSafeById(userId);
  }
}

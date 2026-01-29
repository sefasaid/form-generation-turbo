import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../strategy/jwt.strategy';
import { PrismaService } from '@repo/prisma';
import * as bcrypt from 'bcrypt';
import { UserCredentialsDto } from '../dto/user-login.dto';
import { UserLoginResponseDto } from '../dto/user-login-response.dto';
import { User } from '@repo/prisma';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ) { }

    async login(userCredentials: UserCredentialsDto): Promise<UserLoginResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: {
                username: userCredentials.username,
            },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if (!(await bcrypt.compareSync(userCredentials.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
        };

        return {
            token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }

    async verifyToken(token: string): Promise<User> {
        try {
            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production' });
            if (!decoded.sub || !decoded.username) {
                throw new UnauthorizedException('Invalid token payload');
            }
            const user = await this.prisma.user.findUnique({
                where: {
                    id: decoded.sub,
                },
            });
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid token', error as Error);
        }
    }

}

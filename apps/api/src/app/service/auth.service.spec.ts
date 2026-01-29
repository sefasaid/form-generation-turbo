import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@repo/prisma';
import { User } from '@repo/prisma';
import { UserCredentialsDto } from '../dto/user-login.dto';
import * as bcrypt from 'bcrypt';
// Mock bcrypt
jest.mock('bcrypt', () => ({
    compareSync: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    describe('login', () => {
        const mockUser: User = {
            id: 'user-1',
            username: 'testuser',
            password: 'hashedPassword',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        const mockCredentials: UserCredentialsDto = {
            username: 'testuser',
            password: 'password123',
        };

        it('should return token and user when credentials are valid', async () => {
            const mockToken = 'mock-jwt-token';

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
            mockJwtService.sign.mockReturnValue(mockToken);

            const result = await service.login(mockCredentials);

            expect(result).toEqual({
                token: mockToken,
                user: {
                    id: mockUser.id,
                    username: mockUser.username,
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    username: 'testuser',
                },
            });
            expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: 'user-1',
                username: 'testuser',
            });
        });

        it('should throw UnauthorizedException when user is not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.login({ username: 'invalid', password: 'invalid' })).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login({ username: 'invalid', password: 'invalid' })).rejects.toThrow(
                'Invalid credentials',
            );
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    username: 'invalid',
                },
            });
            expect(bcrypt.compareSync).not.toHaveBeenCalled();
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when password is incorrect', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

            await expect(service.login(mockCredentials)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(mockCredentials)).rejects.toThrow(
                'Invalid credentials',
            );
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    username: 'testuser',
                },
            });
            expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });
    });

    describe('verifyToken', () => {
        const mockUser: User = {
            id: 'user-1',
            username: 'testuser',
            password: 'hashedPassword',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };

        const mockToken = 'valid-token';
        const mockDecoded = {
            sub: 'user-1',
            username: 'testuser',
        };

        it('should return user when token is valid', async () => {
            mockJwtService.verify.mockReturnValue(mockDecoded);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.verifyToken(mockToken);

            expect(result).toEqual(mockUser);
            expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            });
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'user-1',
                },
            });
        });

        it('should throw UnauthorizedException when token is invalid', async () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(service.verifyToken('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.verifyToken('invalid-token')).rejects.toThrow(
                'Invalid token',
            );
            expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
        });


        it('should throw UnauthorizedException when user is not found', async () => {
            mockJwtService.verify.mockReturnValue(mockDecoded);
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.verifyToken(mockToken)).rejects.toThrow(
                UnauthorizedException,
            );

            expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            });
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'user-1',
                },
            });
        });


    });
});

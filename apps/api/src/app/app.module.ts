import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';
import { PrismaModule } from '@repo/prisma';
import { EvaluateBranchService } from './service/evaluate-branch.service';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { SocketService } from './service/socket.service';
import { SocketGateway } from './gateway/socket.gateway';
@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController, AdminController, AuthController],
  providers: [
    AppService,
    EvaluateBranchService,
    AdminService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    SocketService,
    SocketGateway
  ],
})
export class AppModule { }

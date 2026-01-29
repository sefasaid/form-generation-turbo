import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly authService: AuthService) {
        super();
    }
    override async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        try {
            const user = await this.authService.verifyToken(token);
            request.user = user;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token', error as Error);
        }
    }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SocketId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-socket-id'] as string | undefined;
  },
);

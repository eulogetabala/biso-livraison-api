import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const { req, res } = gqlCtx.getContext<{ req: Record<string, unknown>; res: Record<string, unknown> }>();
      return { req, res };
    }

    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}

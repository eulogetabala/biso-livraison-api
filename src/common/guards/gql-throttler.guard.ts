import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

/** Express-like stub when GraphQL context has no `res` (rate-limit headers skipped). */
function stubResponse(): Response {
  const stub = { header: () => stub };
  return stub as unknown as Response;
}

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<{ req?: Request; res?: Response }>();
      const req = ctx.req ?? ({ ip: 'unknown', headers: {} } as Request);
      const res = ctx.res ?? stubResponse();
      return { req, res };
    }

    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}

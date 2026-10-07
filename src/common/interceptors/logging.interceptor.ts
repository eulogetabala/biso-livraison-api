import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Cet intercepteur est global : il voit aussi les requêtes REST (ex. /health).
    // On ne logue donc que les opérations GraphQL pour éviter les faux
    // « GraphQL unknown unknown ».
    if (context.getType<string>() !== 'graphql') {
      return next.handle();
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const info = gqlCtx.getInfo<GraphQLResolveInfo>();
    const operationType = info?.operation?.operation ?? 'unknown';
    const fieldName = info?.fieldName ?? 'unknown';

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(`${operationType} ${fieldName} - ${duration}ms`);
        },
        error: (err: Error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${operationType} ${fieldName} - ${duration}ms - ${err.message}`,
          );
        },
      }),
    );
  }
}

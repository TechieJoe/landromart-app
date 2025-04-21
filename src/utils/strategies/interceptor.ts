// common/interceptors/cache.interceptor.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
  
  @Injectable()
  export class CustomCacheInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string | undefined {
      const request = context.switchToHttp().getRequest();
      return request.url; // Cache by full URL
    }
  }
  
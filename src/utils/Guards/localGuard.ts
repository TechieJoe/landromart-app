import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

@Injectable()
export class localGuard extends AuthGuard('local'){
    
    async canActivate(context: ExecutionContext){
        
        const result =  (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request)
        return result;
    }
}


@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    console.log('🛡️ Session:', request.session);
    console.log('🛡️ Authenticated:', request.isAuthenticated?.());

    return request.isAuthenticated?.() || !!request.session?.passport?.user;
  }
}


import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    
    constructor(){
        super({            
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req.cookies.jwt]),
            ignoreExpiration: false,
            secretOrKey: 'evan'
        })
    }

    async validate(payload){
        
        return {userid: payload.sub, name: payload.name}
    }
}
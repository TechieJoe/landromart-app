import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { UserService } from "src/service/user.service";
import { loginDto } from "../dtos/loginDto";

@Injectable()
export class localStrategy extends PassportStrategy(Strategy){

    constructor(@Inject("USER_SERVICE") private userService: UserService ){
        super({
            usernameField: 'email'
        })
    }

    async validate(email: string, password: string){
        console.log('passport')
        const user = await this.userService.validate(email, password);
        if(user){

         //   console.log(user)
            return user;
        }
        throw new UnauthorizedException()

    }
}
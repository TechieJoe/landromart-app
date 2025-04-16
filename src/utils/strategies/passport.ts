import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "src/service/auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('AUTH_SERVICE') private authService: AuthService) {
    super({
      usernameField: 'email', // Use 'email' as the field instead of 'username'
    });
  }

  // This method is called by Passport during the authentication process
  async validate(email: string, password: string): Promise<any> {
    console.log('Passport validation started'); // Debugging message

    // Find the user & admin by email
    const user = await this.authService.findOneByEmail(email);
    // If user is found and password is correct
    if (user) {
      console.log('User validated successfully'); // Debugging message
      return user; // Attach the user object to req.user
    }

    // Throw UnauthorizedException if validation fails
    throw new UnauthorizedException('Invalid email or password');
  }
}
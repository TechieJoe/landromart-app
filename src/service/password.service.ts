import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import * as nodemailer from 'nodemailer';
import { encodedPwd } from 'src/utils/bcrypt';
import * as crypto from 'crypto';
import { ForgotPasswordDto } from 'src/utils/dtos/password';


@Injectable()
export class passwordService {

    constructor(@Inject("USER_SERVICE") private userService: UserService ) {}
    
    async forgotPassword(ForgotPasswordDto: ForgotPasswordDto): Promise<void> {

      const {email} = ForgotPasswordDto;

        const user = await this.userService.findOneByEmail(email);
        if (!user) {
          throw new BadRequestException('User not found with this email.');
        }
    
        // Generate reset token and expiration date (1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date();
        tokenExpiration.setHours(tokenExpiration.getHours() + 1);
    
        // Update user with reset token and expiration date
        await this.userService.updateResetToken(user._id, resetToken, tokenExpiration);
    
        // Send reset token via email
        await this.sendResetPasswordEmail(email, resetToken);
        console.log(email, resetToken)
      }
    
      // Reset password logic
      async resetPassword(resetToken: string, newPassword: string): Promise<void> {
        const user = await this.userService.findOneByResetToken(resetToken);
    
        if (!user || user.resetTokenExpiration < new Date()) {
          throw new BadRequestException('Invalid or expired token.');
        }
    
        // Hash the new password and update user
        const hashedPassword = encodedPwd(newPassword)
        await this.userService.updatePassword(user._id, hashedPassword);
    
        // Clear the reset token and expiration after successful password reset
        await this.userService.clearResetToken(user._id);
      }
    
      // Send email using PostGrid
      private async sendResetPasswordEmail(email: string, resetToken: string): Promise<void> {
        const resetUrl = `http://127.0.0.1:1000/user-controller/reset-password/${resetToken}`;
        
        // Set up Nodemailer transport with PostGrid SMTP
        const transporter = nodemailer.createTransport({
          service: 'PostGrid', // PostGrid SMTP service
          auth: {
            user: "test_sk_a1Dxn7pkfzh3mPzLPBAAnE", // PostGrid username (API key)
            pass: "********", // PostGrid secret (password)
          },
        });
    
        const mailOptions = {
          from: 'kelechijoseph@gmail.com',
          to: email,
          subject: 'Reset your password',
          html: `<p>Click the link to reset your password: <a href="${resetUrl}">Reset Password</a></p>`,
        };
    
        await transporter.sendMail(mailOptions);
    }

}

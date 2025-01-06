import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { user } from 'src/utils/schemas/user';
import { encodedPwd } from 'src/utils/bcrypt';

@Injectable()
export class authService {
  private mandrillApiUrl: string;
  private mandrillApiKey: string;

  constructor(
    @InjectModel(user.name) private readonly userModel: Model<user>,
    private readonly configService: ConfigService,
  ) {
    this.mandrillApiUrl = this.configService.get<string>('MANDRILL_API_URL');
    this.mandrillApiKey = this.configService.get<string>('MANDRILL_API_KEY');
  }

  // --- User Authentication Logic ---

  // Request Password Reset
  async requestPasswordReset(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiry (1 hour)
    user.resetToken = token;
    user.resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    // Send reset email
    const resetLink = `http://user-controller/reset-password/${token}`;
    const subject = 'Password Reset Request';
    const htmlContent = `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;

    await this.sendEmail(email, subject, htmlContent);
    return { message: 'Password reset link sent to your email.' };
  }

  // Reset Password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // Ensure token is valid
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired token');
    }

    // Hash new password and save
    const hashedPassword = await encodedPwd(newPassword)
    user.password = hashedPassword;

    // Clear reset token
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    return { message: 'Password has been reset successfully.' };
  }

  // --- Email Sending Logic Using Mandrill ---

  async sendEmail(to: string, subject: string, htmlContent: string) {
    const payload = {
      key: this.mandrillApiKey,
      message: {
        from_email: 'kelechijoseph985@gmail.com', // Your email
        to: [{ email: to, type: 'to' }],
        subject,
        html: htmlContent,
      },
    };

    try {
      const response = await axios.post(this.mandrillApiUrl, payload);
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, InternalServerErrorException, NotFoundException, Param, Patch, Post, Put, Query, Render, Req, Request, Res, Session, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { extname } from 'path';
import { AuthenticatedGuard, localGuard } from 'src/utils/Guards/localGuard';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { signupDto } from 'src/utils/dtos/signupDto';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authService } from 'src/service/auth.service';
import { UserService } from 'src/service/user.service';

@Controller('laundromart-app')
export class UserController {
  constructor(
    @Inject("USER_SERVICE") private userService: UserService,
    @Inject("AUTH_SERVICE") private authService: authService,
  ) {}

  @Render('signup')
  @Get('signup.ejs')
  register() {}

  @Post('signup')
  async signup(
    @Body() signupDto: signupDto,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: Record<string, any>
  ) {
    try {
      const user = await this.userService.createUser(signupDto, session);
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Signup succeeded, but automatic login failed' });
        }
        return res.redirect('home');
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ message: error.message });
    }
  }

  @Render('login')
  @Get('login.ejs')
  signin() {}

  @UseGuards(localGuard)
  @Post('login')
  async login(
    @Request() req,
    @Res() res: Response,
    @Session() session: Record<string, any>
  ) {
    try {
      const { email, password } = req.body;
      const user = await this.userService.validate(email, password);
      if (!user) {
        return res.render('login', { error: 'Invalid email or password' });
      }
      session.userId = user._id;
      req.session.email = email;
      return res.redirect('home');
    } catch (error) {
      console.error('Login error:', error.message);
      return res.render('login', { error: 'An error occurred during login' });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Render('home')
  @Get('home')
  home() {}

  @Render('fPwd')
  @Get('fPwd.ejs')
  fPwd() {}

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Render('resetPwd')
  @Get('fPwd.ejs')
  resetPwd() {}

  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Render('service')
  @Get('service')
  service() {}

  @UseGuards(AuthenticatedGuard)
  @Render('order')
  @Get('order.html')
  order(@Req() req: Request) {}

  @Post('order')
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const userId = req.session.userId;
      const userEmail = req.session.email;
      if (!userId || !userEmail) {
        throw new Error('User ID or email missing from session');
      }

      createOrderDto.email = userEmail;
      createOrderDto.userId = userId;
      const orderId = uuidv4(); 
      createOrderDto.orderId = orderId;
      const { orders, grandTotal } = createOrderDto;

      if (!orders || !grandTotal) {
        throw new Error('Missing order details or grand total');
      }

      const order = await this.userService.createOrder(createOrderDto);
      const paymentUrl = await this.userService.initializeTransaction(userEmail, grandTotal);
      if (!paymentUrl) {
        throw new Error('Failed to initialize Paystack transaction');
      }
      return res.json({ authorizationUrl: paymentUrl });
    } catch (error) {
      console.error('Error placing order:', error);
      return res.status(500).json({ message: 'Failed to place order, please try again', error: error.message });
    }
  }

  @Get('callback')
  async handlePaymentRedirect(@Query('reference') reference: string, @Res() res: Response) {
    try {
      if (!reference) {
        throw new HttpException('No reference found in query parameters', HttpStatus.BAD_REQUEST);
      }
      const result = await this.userService.verifyTransaction(reference);
      if (result.data.status === 'success') {
        await this.userService.updateTransactionStatus(reference, 'successful');
        return res.redirect('home');
      } else {
        throw new HttpException('Transaction verification failed', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.error('Failed to handle payment redirect:', error);
      return res.status(500).json({ message: 'Failed to handle payment redirect' });
    }
  }

  @Render('notification')
    @Get('notification')
    async getUserNotifications( @Request() req ) {
      const userId = req.session.userId;
       console.log(userId)
      const notifications = await this.userService.getUserNotifications(userId);
      return { notifications }
    }
  
    // Mark a notification as read
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
      return this.userService.markAsRead(id);
    }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req, file, cb) => {
          const filename = uuidv4() + extname(file.originalname);
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
    })
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.session.userId;
    const imageUrl = `/uploads/profile-pictures/${file.filename}`;
    await this.userService.updateProfilePicture(userId, imageUrl);
    return { message: 'Profile picture uploaded successfully', imageUrl };
  }

  @UseGuards(AuthenticatedGuard)
  @Render('profile')
  @Get('profile')
  async getProfilePage(@Request() req): Promise<any> {
    const userId = req.session.userId;
    const user = await this.userService.getProfile(userId);
    return { user };
  }

  @Put('update')
  async updateProfile(@Body() UpdateProfileDto: UpdateProfileDto, @Request() req) {
    const userId = req.session.userId;
    await this.userService.updateProfile(userId, UpdateProfileDto);
    return { message: 'Profile updated successfully' };
  }

  @UseGuards(AuthenticatedGuard)
  @Render('order_history')
  @Get('order_history')
  async fetchOrders(@Req() req) {
    const userId = req.session.userId;
    const orders = await this.userService.getOrders(userId);
    return { orders };
  }

  @UseGuards(AuthenticatedGuard)  
  @Post('logout')
  logout(@Req() req, @Res() res: Response): void {
    req.logout((err) => {
      if (err) {
        return res.status(500).send('Logout failed');
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('signup');
      });
    });
  }

}

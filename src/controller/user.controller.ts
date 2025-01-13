import { Body, Controller, Get, HttpException, HttpStatus, Inject, Param, Patch, Post, Put, Query, Render, Req, Request, Res, Session, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { extname } from 'path';
import { AuthenticatedGuard, localGuard } from '../utils/Guards/localGuard';
import { UpdateProfileDto } from '../utils/dtos/profile'; // Corrected import path
import { signupDto } from '../utils/dtos/signupDto'; // Corrected import path
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../service/user.service'; // Corrected import path
import * as crypto from 'crypto';
import { CreateOrderDto } from '../utils/dtos/order'; // Corrected import path

@Controller()
export class UserController {
  constructor(
    @Inject("USER_SERVICE") private userService: UserService,
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
      return res.render('login', { error: 'An error occurred during login' });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Render('home')
  @Get('home')
  home() {}


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
      const reference = crypto.randomBytes(16).toString('hex');
      createOrderDto.reference = reference
      const { orders, grandTotal } = createOrderDto;

      if (!orders || !grandTotal) {
        throw new Error('Missing order details or grand total');
      }

      const order = await this.userService.createOrder(createOrderDto);
      const paymentUrl = await this.userService.initializeTransaction(createOrderDto);
      if (!paymentUrl) {
        throw new Error('Failed to initialize Paystack transaction');
      }
      return res.json({ authorizationUrl: paymentUrl });
    } catch (error) {
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
      return res.status(500).json({ message: 'Failed to handle payment redirect' });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Render('notification') // Specify the view to render
  @Get('notification')
  async getUserNotifications(@Request() req) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        // Just return an object for rendering
        return { notifications: [] }; 
      }
  
      const notifications = await this.userService.getUserNotifications(userId);
      console.log('Notifications:', notifications); // Log notifications for debugging
      // Return the notifications object for rendering in the view
      return { notifications };
    } catch (error) {
      return { notifications: [] }; // Handle error gracefully
    }
  }

  @Put('update')
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
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    const userId = req.session.userId;
    const profilePicture = file ? `/uploads/profile-pictures/${file.filename}` : undefined;
    const updatedUser = await this.userService.updateProfile(userId, updateProfileDto, profilePicture);
    return { message: 'Profile updated successfully', user: updatedUser };
  }

  @UseGuards(AuthenticatedGuard)
  @Render('profile')
  @Get('profile')
  async getProfilePage(@Request() req): Promise<any> {
    const userId = req.session.userId;
    const user = await this.userService.getProfile(userId);
    return { user };
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

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, Param, Patch, Post, Put, Query, Render, Req, Request, Res, Session, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthenticatedGuard, localGuard } from '../utils/Guards/localGuard';
import { UpdateProfileDto } from '../utils/dtos/profile'; // Corrected import path
import { signupDto } from '../utils/dtos/signupDto'; // Corrected import path
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { CreateOrderDto } from '../utils/dtos/order'; // Corrected import path
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { AuthService } from 'src/service/auth.service';
import { OrderService } from 'src/service/order.service';
import { NotificationService } from 'src/service/notification.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
export class UserController {
  constructor(
    @Inject("AUTH_SERVICE") private authService: AuthService,
    @Inject("NOTIFICATION_SERVICE") private notificationService: NotificationService,
    @Inject("ORDER_SERVICE") private orderService: OrderService,

    private configService: ConfigService
  ) {
    // Initialize Paystack secret key
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
  }

  private readonly paystackSecretKey: string;

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
      const user = await this.authService.createUser(signupDto, session);
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
      const user = req.user; // localGuard already validated this
      session.userId = user._id;
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.render('login', { error: 'Login failed' });
        }
        return res.redirect('home');
      });
    } catch (error) {
      return res.render('login', { error: 'Login error' });
    }
  }
  
  @Get('home')
  //@UseGuards(AuthenticatedGuard)
  @Render('home')
  home(@Req() req) {
    console.log('Session:', req.session);
    console.log('Authenticated:', req.isAuthenticated?.());
    return {};
  }
  
  @UseInterceptors(CacheInterceptor)
  @Render('service')
  @Get('service')
  service() {}

  //@UseGuards(AuthenticatedGuard)
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
      createOrderDto.orderId = uuidv4(); 
      createOrderDto.reference = crypto.randomBytes(16).toString('hex');
  
      const { orders, grandTotal } = createOrderDto;
      if (!orders || !grandTotal) {
        throw new Error('Missing order details or grand total');
      }
  
      await this.orderService.createOrder(createOrderDto);
      const paymentUrl = await this.orderService.initializeTransaction(createOrderDto);
  
      if (!paymentUrl) {
        throw new Error('Failed to initialize Paystack transaction');
      }
  
      return res.json({ authorizationUrl: paymentUrl });
    } catch (error) {
      return res.status(500).json({
        message: 'Failed to place order, please try again',
        error: error.message,
      });
    }
  }

  @Get('callback')
  async handlePaymentRedirect(@Query('reference') reference: string, @Res() res: Response) {
    try {
      if (!reference) {
        throw new HttpException('No reference found in query parameters', HttpStatus.BAD_REQUEST);
      }
      const result = await this.orderService.verifyTransaction(reference);
      if (result.data.status === 'success') {
        await this.orderService.updateTransactionStatus(reference, 'successful');
        return res.redirect('home');
      } else {
        throw new HttpException('Transaction verification failed', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      return res.status(500).json({ message: 'Failed to handle payment redirect' });
    }
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
  const secret = this.paystackSecretKey;

  // Validate Paystack signature
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const signature = req.headers['x-paystack-signature'];
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const event: { event: string; data: any } = JSON.parse(req.body as any);
  const metadata = event?.data?.metadata;
  const reference = event?.data?.reference;

  if (event.event === 'charge.success') {
    console.log('💰 Payment successful for:', metadata?.sourceApp);

    const app = metadata?.sourceApp;

    // Route by app identifier
    if (app === 'laundromart') {
      await this.orderService.handleWebhookEvent(event);
    } else {
      console.warn('❗ Unrecognized app source:', app);
    }

    return res.send('Webhook handled');
  }

  return res.send('Unhandled event');
}

  @UseInterceptors(CacheInterceptor) 
  @UseGuards(AuthenticatedGuard)
  @Render('notification')
  @Get('notification')
  async getUserNotifications(@Request() req) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return { notifications: [] }; 
      }
  
      const notifications = await this.notificationService.getUserNotifications(userId);
      // Return the notifications object for rendering in the view
      return { notifications };
    } catch (error) {
      return { notifications: [] }; // Handle error gracefully
    }
  }

  @Put('update')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'profile-pictures', // Cloudinary folder
          resource_type: 'image', // Ensures only images are handled
          format: async () => 'png', // Optional: Always store images as PNG
          public_id: (req, file) =>
            `${Date.now()}_${file.originalname.split('.')[0]}`, // Custom public ID
        } as any, // <--- Fix type checking
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

    const profilePicture = file ? file.path : undefined;

    const updatedUser = await this.authService.updateProfile(
      userId,
      updateProfileDto,
      profilePicture
    );

    return { message: 'Profile updated successfully', user: updatedUser };
  }

  @UseInterceptors(CacheInterceptor)
  @UseGuards(AuthenticatedGuard)
  @Render('profile')
  @Get('profile')
  async getProfilePage(@Request() req): Promise<any> {
    const userId = req.session.userId;
    const user = await this.authService.getProfile(userId);
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

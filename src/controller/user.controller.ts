import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Inject, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, Render, Req, Request, Res, Session, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Model } from 'mongoose';
import { extname } from 'path';
import { passwordService } from 'src/service/password.service';
import { UserService } from 'src/service/user.service';
import { jwtGuard } from 'src/utils/Guards/jwt';
import { AuthenticatedGuard, localGuard } from 'src/utils/Guards/localGuard';
import { RolesGuard } from 'src/utils/Guards/roles';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { ForgotPasswordDto, ResetPasswordDto } from 'src/utils/dtos/password';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { signupDto } from 'src/utils/dtos/signupDto';
import { User } from 'src/utils/schemas/user';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Controller('user-controller')
export class UserController {

  constructor(@Inject("USER_SERVICE") private userService: UserService, @Inject("PASSWORD_SERVICE") private passwordService: passwordService, @InjectModel(User.name) private userModel: Model<User>){}

  @Render('signup')
  @Get('signup')
  register(){}

  @Post('signup')
  @Render('signup')  // Use this decorator to render the signup page
  async signup(@Body() signupDto: signupDto) {
    try {
      await this.userService.createUser(signupDto);

      // If signup is successful, render success message
      return { message: 'User created successfully! Please log in.' };
    } catch (error) {
      // Catch BadRequestException or other errors and pass to the view
      if (error instanceof BadRequestException) {
        return { error: error.message }; // Show "Email already exists" message
      }
      console.error('Signup error:', error.message);
      return { error: 'Failed to create user. Please try again.' };
    }
  }


  @Render('login')
  @Get('login')
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
     
     // Validate user and retrieve their information
     const user = await this.userService.validate(email, password);
     
     if (!user) {
       // If user is not valid, render login page with an error
       return res.render('login', { error: 'Invalid email or password' });
     }
     
     // Store the user ID in the session
     session.userId = user._id;
     
     // Optionally store email as well
     req.session.email = email;
 
     // Redirect to the service page after successful login
     return res.redirect('service'); 
   } catch (error) {
     console.error('Login error:', error.message);
     return res.render('login', { error: 'An error occurred during login' });
   }
 }
 

   @Render('home')
  @Get('home')
  home(){}

  @Render('fPwd')
  @Get('fPwd.ejs')
  fPwd(){}
  

  @Post('forgot-password')
  async forgotPassword(@Req() req, @Body() ForgotPasswordDto: ForgotPasswordDto) {

   // const email = req.session.email;
   // console.log(email)

   // ForgotPasswordDto.email = email

    return await this.passwordService.forgotPassword(ForgotPasswordDto);
  }
  
  @Render("resetPwd")
  @Get('reset-password')  
  rPwd(){}

  @Post('reset-password/:resetToken')
  async resetPassword(
    @Param('resetToken') resetToken: string,  // Extract token from the URL
    @Body('newPassword') newPassword: string
  ) {
    return this.passwordService.resetPassword(resetToken, newPassword);
  }


  @UseGuards(AuthenticatedGuard)
  @Render('service')
  @Get('service')
  service() {}


  @UseGuards(AuthenticatedGuard)
  @Render('order')
  @Get('order.html')
  order( @Req() req: Request) {}
  
  @Post('order')
  async createOrder(
    @Body() createOrderDto: CreateOrderDto, 
    @Request() req, 
     @Res() res: Response,
  ) {
    try {

      // Retrieve userId and email from session
      const userId = req.session.userId;
      const userEmail = req.session.email;
    
      if (!userId || !userEmail) {
        throw new Error('User ID or email missing from session');
      }
    
      const orderId = new Date().getTime().toString(); // Generate a unique order ID
    
      // Assign the userId, email, and orderId to the createOrderDto
      createOrderDto.userId = userId;
      createOrderDto.email = userEmail;
      createOrderDto.orderId = orderId;
    
      const { orders, grandTotal } = createOrderDto;
    
      if (!orders || !grandTotal) {
        throw new Error('Missing order details or grand total');
      }
    
      // Save the order to the database
      const order = await this.userService.createOrder(createOrderDto);
      //console.log('Order created:', order);
    
      // Initialize the transaction with Paystack
      const paymentUrl = await this.userService.initializeTransaction(userEmail, grandTotal, userId, orderId);
    
      if (!paymentUrl) {
        throw new Error('Failed to initialize Paystack transaction');
      }

      // Redirect user to the Paystack payment page
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

      // Log reference for debugging
      console.log('Paystack redirect reference:', reference);

      // Verify the transaction with Paystack
      const result = await this.userService.verifyTransaction(reference);

      // If the transaction is verified successfully, update your database
      if (result.data.status === 'success') {
        console.log('Transaction verified successfully:', result.data);

        // Update transaction status in your database
        await this.userService.updateTransactionStatus(reference, 'successful');

        // Redirect user to a success page or return a response
        return res.redirect('home');  // Redirect to a success page

      } else {
        throw new HttpException('Transaction verification failed', HttpStatus.BAD_REQUEST);
      }

    } catch (error) {
      console.error('Failed to handle payment redirect:', error);
      return res.status(500).json({ message: 'Failed to handle payment redirect' });
    }
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
    }),
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.session.userId;
    const imageUrl = `/uploads/profile-pictures/${file.filename}`;
    await this.userService.updateProfilePicture(userId, imageUrl);
    return { message: 'Profile picture uploaded successfully', imageUrl };
  }


  @UseGuards(AuthenticatedGuard)
  @Render('profile')
  @Get('profiles')
  async getProfilePage(@Request() req): Promise<any> {

    const userId = req.session.userId;  // Ensure `userId` is available in session
    console.log(userId)
    const user = await this.userService.getProfile(userId);
     // Render the profile page using a template engine
    return { user };

  }
 
 @Put('update')
  async updateProfile(@Body() UpdateProfileDto: UpdateProfileDto, @Request() req) {
    const userId = req.session.userId;
    await this.userService.updateProfile(userId, UpdateProfileDto);
    return { message: 'Profile updated successfully' };
  }

 // @Render('order_history')
  @Get('order_history.ejs')
  async fetchOrders(@Req() req, @Res() res: Response){
    
    const userId = req.session.userId;
    console.log(userId)
    const orders = await this.userService.getOrders(userId);
    console.log(orders)
    res.render('order_history',{orders: orders})
  }

  
  @UseGuards(AuthenticatedGuard)
  @Render('transaction_history')
  @Get('transaction_history.ejs')
  async fetchTransactions(@Req() req){
    
    const userId = req.session.userId;
    const transactions = await this.userService.getTransactions(userId)
    return{transactions}
  }

  @Get('receipt')
  async getUserReceipt(@Req() req, @Res() res: Response) {
    const userId = req.session.userId; // Assuming `userId` is attached to req.user via the JWT strategy

    try {
      const receipt = await this.userService.getUserReceipt(userId);
      return res.render('receipt', { receipt });
      } catch (error) {
      throw new NotFoundException(`Receipt for User with ID ${userId} not found`);
    }
  }

  @Post('logout')
  logout(@Req() req, @Res() res: Response): void {
    req.logout((err) => {
      if (err) {
        return res.status(500).send('Logout failed');
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('signup'); // Redirect user to the login page after logout
      });
    });
  } 
}

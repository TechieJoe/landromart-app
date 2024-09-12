import { Body, Controller, Get, HttpException, HttpStatus, Inject, InternalServerErrorException, Param, Post, Query, Render, Req, Request, Res, Session, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { passwordService } from 'src/service/password.service';
import { UserService } from 'src/service/user.service';
import { jwtGuard } from 'src/utils/Guards/jwt';
import { AuthenticatedGuard, localGuard } from 'src/utils/Guards/localGuard';
import { RolesGuard } from 'src/utils/Guards/roles';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { ForgotPasswordDto, ResetPasswordDto } from 'src/utils/dtos/password';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { signupDto } from 'src/utils/dtos/signupDto';


@Controller('user-controller')
export class UserController {

  constructor(@Inject("USER_SERVICE") private userService: UserService, @Inject("PASSWORD_SERVICE") private passwordService: passwordService){}

  @Render('signup')
  @Get('signup')
  register(){}

  @Post('signup')
  signup(@Body() signupDto: signupDto){
    return this.userService.createUser(signupDto)
  }


  @Render('login')
  @Get('login')
  signin() {}

  @UseGuards(localGuard)
  @Post('login')
  async login(@Request() req, @Res() res: Response,
  @Session() session: Record<string, any>) {

    const{ email, password } = req.body;

    session.userId = req.user._id;  // Store _id as userId in the session
    //return { message: 'Logged in successfully', userId: req.user._id };

    req.session.email = email;  // Store email in session

    // return { msg: "logged in "}
    return res.render('service'); // or res.redirect('/service') if needed

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

  @Render('service')
  @Get('service')
  service() {}


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
  @UseInterceptors(FileInterceptor('file', UserService.multerOptions))
  uploadProfilePicture(@UploadedFile() file, @Res() res: Response) {
    if (!file) {
      return res.status(400).send('File upload failed');
    }
    return res.status(200).send({
      message: 'File uploaded successfully',
      filePath: `/uploads/${file.filename}`,
    });
  }

  @Render('profile')
  @Get('profiles')
  async getProfilePage(@Request() req): Promise<any> {

    const userId = req.session.userId;  // Ensure `userId` is available in session
    console.log(userId)
    const user = await this.userService.getProfile(userId);
     // Render the profile page using a template engine
    return { user };

  }
 
  @Post('update')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto): Promise<any> {

    const userId = req.session.userId;  // Ensure `userId` is available in session
    await this.userService.updateProfile(userId, updateProfileDto);
     // Redirect to profile page or show a success message
    return { success: true };
     
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

  @Render('transaction_history')
  @Get('transaction_history.ejs')
  async fetchTransactions(@Req() req){
    
    const userId = req.session.userId;
    const transactions = await this.userService.getTransactions(userId)
    return{transactions}
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

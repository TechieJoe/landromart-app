import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from 'src/utils/dtos/order';
import { signupDto } from 'src/utils/dtos/signupDto';
import axios from 'axios';
import { UpdateProfileDto } from 'src/utils/dtos/profile';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Notification } from '../utils/schemas/notification'; // Corrected import path
import { comparePwd, encodedPwd } from '../utils/bcrypt'; // Corrected import path
import { user } from '../utils/schemas/user'; // Corrected import path
import { Order } from '../utils/schemas/order'; // Corrected import path
import { Model } from 'mongoose';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(user.name) private userModel: Model<user>,
  ) {}

  async createUser(signupDto: signupDto, session: any) {
    const { name, email, password } = signupDto;

    // Check if the email already exists in the database
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hash = encodedPwd(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hash
    });

    // Store userId and email in session
    session.userId = user._id;
    session.email = user.email;

    return user;
  }

  async validate(email: string, password: string){
    const user = await this.userModel.findOne({email});
    if(user && comparePwd(password, user.password)){
      const { _id, email } = user;
      return { _id, email };
    }
    return null;
  }



  async getProfile(userId: string): Promise<user> {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto, profilePicture?: string): Promise<user> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    // Create an update object with only the fields that are present in the updateProfileDto
    const updateData: any = {};
    if (updateProfileDto.name) updateData.name = updateProfileDto.name;
    if (updateProfileDto.email) updateData.email = updateProfileDto.email;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).exec();
    return updatedUser;
  }


  async findOneByEmail(email: string): Promise<user | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByResetToken(resetToken: string): Promise<user | undefined> {
    return this.userModel.findOne({ resetToken }).exec();
  }

  async updateResetToken(userId: string, resetToken: string, expiration: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetToken,
      resetTokenExpiration: expiration,
    }).exec();
  }

  async clearResetToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetToken: null,
      resetTokenExpiration: null,
    }).exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
  }
  async getall(){
    return await this.userModel.find()
  }

  async getUserById(id: string): Promise<user> {
    return await this.userModel.findById(id).exec();
  }

}

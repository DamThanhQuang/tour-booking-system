import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export enum UserGroup {
    ADMIN = 'Admin',
    BUSINESS = 'Business',
    USER = 'User',
}

export class SignUpDto {
    @IsNotEmpty({message: 'Username is required'})
    @IsString()
    @MinLength(3, {message: 'Username must be at least 3 characters long'})
    username: string;

    @IsNotEmpty({message: 'Email is required'})
    @IsEmail({}, {message: 'Invalid email format'})
    email: string;

    @IsNotEmpty({message: 'Password is required'})
    @IsString()
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
    })
    password: string;

    @IsOptional()
    @IsEnum(UserGroup, {message: 'Invalid user group'})
    userGroup?: UserGroup;
}
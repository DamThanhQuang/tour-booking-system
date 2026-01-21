import { IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
    @IsNotEmpty({message: 'Username is required'})
    @IsString()
    email: string;

    @IsNotEmpty({message: 'Password is required'})
    @IsString()
    password: string;
}
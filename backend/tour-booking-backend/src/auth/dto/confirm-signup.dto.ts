import { IsNotEmpty, IsString, Length } from "class-validator";

export class ConfirmSignUpDto {
    @IsNotEmpty({message: 'Username is required'})
    @IsString()
    username: string;

    @IsNotEmpty({message: 'Confirmation code is required'})
    @IsString()
    @Length(6, 6, {message: 'Confirmation code must be 6 digits'})
    code: string;
}
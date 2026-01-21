import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/signup.dto";
import { ConfirmSignUpDto } from "./dto/confirm-signup.dto";
import { SignInDto } from "./dto/signin.dto";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  /**
   * POST /auth/confirm-signup
   */
  @Post('confirm-signup')
  @HttpCode(HttpStatus.OK)
  async confirmSignUp(@Body() confirmSignUpDto: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(confirmSignUpDto);
  }

  /**
   * POST /auth/signin
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({passthrough: true}) response: Response,
  ) {
    const result = await this.authService.signIn(signInDto);

    // Set refresh token in HttpOnly cookie
    response.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    return {
      success: true,
      message: 'Sign in successful',
      tokens: {
        accessToken: result.data.accessToken,
        idToken: result.data.idToken,
        expriseIn: result.data.expiresIn,
        tokenType: result.data.tokenType,
      }
    }
  }

  /**
   * Get refresh token from cookie => new accessToken
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: Request,
    @Res({passthrough: true}) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const result = await this.authService.refreshToken(refreshToken);

    return {
      success: true,
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: result.data.accessToken,
        idToken: result.data.idToken,
        expriseIn: result.data.expiresIn,
      }
    }
  }

  /**
   * Get user info from access token
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUser(@Req() request: Request) {
    return {
      success: true,
      user: request['user'],
    };
  }
}
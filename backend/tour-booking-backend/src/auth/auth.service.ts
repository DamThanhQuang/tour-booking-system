import { AdminAddUserToGroupCommand, CognitoIdentityProviderClient, ConfirmSignUpCommand, GetUserCommand, InitiateAuthCommand, SignUpCommand} from "@aws-sdk/client-cognito-identity-provider";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SignUpDto, UserGroup } from "./dto/signup.dto";
import { ConfirmSignUpDto } from "./dto/confirm-signup.dto";
import { SignInDto } from "./dto/signin.dto";
import { createHmac } from "crypto";

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor(private configService: ConfigService) {
    // Initialize Cognito client for backend ↔ AWS Cognito communication
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.getOrThrow<string>('cognito.region'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('cognito.accessKeyId'),
        secretAccessKey: this.configService.getOrThrow<string>('cognito.secretAccessKey'),
      },
    });

    this.userPoolId = this.configService.getOrThrow<string>('cognito.userPoolId');
    this.clientId = this.configService.getOrThrow<string>('cognito.clientId');
    this.clientSecret = this.configService.getOrThrow<string>('cognito.clientSecret');
  }  

  /**
   * Caculate Secret Hash for Cognito 
   */
  async caculateSecretHash(username: string) {
    const message = username + this.clientId;
    const hmac = createHmac('sha256', this.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  /**
   * Sign up a new user
   */
  async signUp(signUpDto: SignUpDto) {
    try {
      const {username, email, password, userGroup = UserGroup.USER} = signUpDto;

      const secretHash = await this.caculateSecretHash(email);

      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: username,
        Password: password,
        SecretHash: secretHash,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'custom:userGroup', Value: userGroup },
        ],
      });

      const response = await this.cognitoClient.send(command);

      try {
        await this.addUserToGroup(username, userGroup);
      } catch (error) {
        throw new BadRequestException('User created but failed to assign group');
      }

      return {
        success: true,
        message: 'Sign up successful. Please check your email for verification code.',
        data: {
          username,
          userSub: response.UserSub,
          userConfirmed: response.UserConfirmed,
          userGroup,
        },
      };
    } catch (error) {
      if (error.name === 'UsernameExistsException') {
        throw new ConflictException('Username already exists');
      } else if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Password does not meet requirements');
      } else if (error.name === 'InvalidParameterException') {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error.message || 'Sign up failed');
    }
  }

  /**
   * Add user to a specific Cognito User Pool group
   */
  async addUserToGroup(username: string, groupName: UserGroup) {
    try {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: groupName,
      });

      await this.cognitoClient.send(command);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to add user to group');
    }
  }

  async confirmSignUp(confirmSignUpDto: ConfirmSignUpDto) {
    try {
      const { username, code } = confirmSignUpDto;

      const secretHash = await this.caculateSecretHash(username);

      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code,
        SecretHash: secretHash,
      });

      await this.cognitoClient.send(command);

      return {
        success: true,
        message: 'User confirmed successfully. You can now sign in.',
      };
    } catch (error) {
      console.error('Confirm sign up error:', error);

      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('Invalid confirmation code');
      } else if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException('Confirmation code has expired');
      } else if (error.name === 'UserNotFoundException') {
        throw new BadRequestException('User not found');
      }

      throw new BadRequestException(error.message || 'Confirmation failed');
    }
  }

  async signIn(signInDto: SignInDto) {
    try {
      const { email, password } = signInDto;

      const secretHash = await this.caculateSecretHash(email);

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
          throw new UnauthorizedException('Authentication failed');
      }
      return {
        success: true,
        message: 'Sign in successful',
        data: {
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
          tokenType: response.AuthenticationResult.TokenType,
        },
      }
    } catch (error) {
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid email or password');
      } else if (error.name === 'UserNotConfirmedException') {
        throw new UnauthorizedException('User email not confirmed');
      } else if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('User not found');
      }

      throw new UnauthorizedException(error.message || 'Sign in failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });
      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Token refresh failed');
      }

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
          tokenType: response.AuthenticationResult.TokenType,
        },
      }
    } catch (error) {
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid or expired refresh token');
      } else if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('User not found');
      }

      throw new UnauthorizedException(error.message || 'Token refresh failed');
    }
  }

  async getUserFromAccessToken(accessToken: string) {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);

      // Parse user attributes
      const userAttributes = response.UserAttributes;

      if (!userAttributes) {
        throw new UnauthorizedException('Invalid access token');
      }

      const attributes = userAttributes.reduce(
        (acc, attr) => {
          if (attr.Name && attr.Value) {
            acc[attr.Name] = attr.Value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      return {
        username: response.Username,
        email: attributes['email'],
        emailVerified: attributes['email_verified'] === 'true',
        userGroup: attributes['custom:userGroup'] || UserGroup.USER,
        sub: attributes['sub'],
      };
    } catch (error) {
      console.error('Get user from token error:', error);

      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      throw new UnauthorizedException(error.message || 'Failed to get user info');
    }
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const region = configService.getOrThrow('cognito.region');
    const userPoolId = configService.getOrThrow('cognito.userPoolId');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      algorithms: ['RS256'],

      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    if (payload.token_use !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      sub: payload.sub,
      username: payload.username, 
      email: payload.email,
      groups: payload['cognito:groups'] || [], 
      clientId: payload.client_id,
    };
  }
}

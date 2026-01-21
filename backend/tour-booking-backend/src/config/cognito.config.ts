import { registerAs } from "@nestjs/config";

export default registerAs('cognito', () => ({
    region: process.env.AWS_REGION, 
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    issuer: process.env.COGNITO_ISSUER,
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}));
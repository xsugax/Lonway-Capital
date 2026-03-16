import * as speakeasy from 'speakeasy';
export declare function generate2FASecret(userId: string): speakeasy.GeneratedSecret;
export declare function verify2FAToken(secret: string, token: string): boolean;
//# sourceMappingURL=twofa.d.ts.map
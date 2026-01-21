let accessToken: string | null = null;
let idToken: string | null = null;

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getAccessToken = (): string | null => {
    return accessToken;
};

export const setIdToken = (token: string) => {
    idToken = token;
}; 

export const getIdToken = (): string | null => {
    return idToken;
};

export const clearTokens = () => {
    accessToken = null;
    idToken = null;
};

export const hasTokens = (): boolean => {
    return !!accessToken;
};
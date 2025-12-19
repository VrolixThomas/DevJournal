export interface IElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  openAuthWindow: (url: string) => Promise<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>;
  onAuthTokens: (callback: (tokens: { access_token: string; refresh_token: string }) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

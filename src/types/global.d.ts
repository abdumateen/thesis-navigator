declare global {
  interface Window {
    navigateToAuth: (redirectUrl: string) => void;
  }
}

export {};
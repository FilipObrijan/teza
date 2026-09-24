declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: 'seller' | 'distributor' | 'admin';
      };
    }
  }
}

export {};

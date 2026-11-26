export interface AuthUser {
  id: string;
  email?: string;
  demo: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId: string;
    }
  }
}

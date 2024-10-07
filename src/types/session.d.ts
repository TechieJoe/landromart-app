// session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}


export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

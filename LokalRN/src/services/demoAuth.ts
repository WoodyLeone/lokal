import { AuthResponse, UserSession } from '../types';

// Demo user credentials
const DEMO_USERS = [
  {
    id: 'demo-user-1',
    email: 'demo@lokal.com',
    password: 'demo123',
    username: 'demo_user',
    name: 'Demo User'
  },
  {
    id: 'demo-user-2', 
    email: 'test@lokal.com',
    password: 'test123',
    username: 'test_user',
    name: 'Test User'
  }
];

// In-memory session storage for demo mode
let currentSession: UserSession | null = null;

export class DemoAuthService {
  // Sign up (creates a new demo user)
  static async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = DEMO_USERS.find(user => user.email === email);
    if (existingUser) {
      return { 
        data: null, 
        error: { message: 'User already exists with this email' } 
      };
    }

    // Create new demo user
    const newUser = {
      id: `demo-user-${Date.now()}`,
      email,
      password,
      username,
      name: username
    };

    DEMO_USERS.push(newUser);

    // Create session
    const session = {
      user: {
        id: newUser.id,
        email: newUser.email,
        user_metadata: { username: newUser.username }
      },
      session: {
        access_token: `demo-token-${Date.now()}`,
        refresh_token: `demo-refresh-${Date.now()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    };

    currentSession = session;
    return { data: session, error: null };
  }

  // Sign in
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔧 Demo auth sign in attempt:', { email, password });
    console.log('🔧 Available demo users:', DEMO_USERS.map(u => ({ email: u.email, password: u.password })));
    
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      console.log('🔧 Demo auth: User not found');
      return { 
        data: null, 
        error: { message: 'Invalid login credentials' } 
      };
    }

    // Create session
    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { username: user.username }
      },
      session: {
        access_token: `demo-token-${Date.now()}`,
        refresh_token: `demo-refresh-${Date.now()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    };

    currentSession = session;
    return { data: session, error: null };
  }

  // Sign out
  static async signOut(): Promise<{ error: any }> {
    currentSession = null;
    return { error: null };
  }

  // Get current user
  static async getCurrentUser(): Promise<UserSession> {
    return currentSession || { user: null, session: null };
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return currentSession !== null;
  }

  // Get demo credentials for easy testing
  static getDemoCredentials() {
    return {
      email: 'demo@lokal.com',
      password: 'demo123'
    };
  }
} 
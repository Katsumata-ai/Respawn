/**
 * Whop Client - Browser-side SDK wrapper
 * Used for client-side operations in Whop Apps
 * Based on Whop SDK documentation
 */

export interface WhopUser {
  id: string;
  email: string;
  username: string;
  profilePicUrl?: string;
}

export interface WhopAccessResult {
  hasAccess: boolean;
  accessLevel: 'admin' | 'customer' | 'no_access';
}

export interface WhopCompany {
  id: string;
  name: string;
  slug: string;
}

export interface WhopExperience {
  id: string;
  name: string;
  companyId: string;
}

export class WhopClient {
  private static instance: WhopClient;

  private constructor() {}

  static getInstance(): WhopClient {
    if (!WhopClient.instance) {
      WhopClient.instance = new WhopClient();
    }
    return WhopClient.instance;
  }

  // Get current user from Whop context
  async getCurrentUser(): Promise<WhopUser | null> {
    try {
      // This will be called from the browser context
      // The Whop SDK will provide user data
      const response = await fetch('/api/whop/user');
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Validate if user has access to the app
   * Checks if user has paid the €10 fee
   */
  async validateAccess(): Promise<WhopAccessResult> {
    try {
      // Extract token from URL query params (Whop dev mode)
      const params = new URLSearchParams(window.location.search);
      const token = params.get('whop-dev-user-token');

      const url = new URL('/api/whop/validate-access', window.location.origin);
      if (token) {
        url.searchParams.set('whop-dev-user-token', token);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        return { hasAccess: false, accessLevel: 'no_access' };
      }
      return response.json();
    } catch (error) {
      console.error('Failed to validate access:', error);
      return { hasAccess: false, accessLevel: 'no_access' };
    }
  }

  /**
   * Check if user is admin of the community
   */
  async isAdmin(): Promise<boolean> {
    try {
      const access = await this.validateAccess();
      return access.accessLevel === 'admin';
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  // Get company info
  async getCompany(): Promise<WhopCompany | null> {
    try {
      const response = await fetch('/api/whop/company');
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to get company:', error);
      return null;
    }
  }
}

export const whopClient = WhopClient.getInstance();


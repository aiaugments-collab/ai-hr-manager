
## 🎯 **SSO Integration Plan**

Based on the guide and your current Stack Auth setup, here's how we'll implement auto-login from your main dashboard:

### **Current Setup Analysis:**
- Your app uses **Stack Auth** for authentication with Next.js
- Stack Auth is configured with `tokenStore: "nextjs-cookie"` 
- After sign-in, users redirect to `/dashboard`
- You have team-based routing with slugs (`/dashboard/[teamId]`)
- The main dashboard is at `localhost:3000`, your app runs on `localhost:3001`

### **Implementation Plan:**

1. **Create SSO API Endpoint** (`/api/auth/sso`)
   - Accept JWT token from main dashboard
   - Validate token using the provided secret
   - Extract user information (userId, email, name, role)
   - Integrate with Stack Auth to create/authenticate user
   - Redirect to appropriate dashboard team

2. **Environment Configuration**
   - Add the SSO JWT secret to your `.env.local`
   - Configure the platform URL

3. **Stack Auth Integration Strategy**
   - Use Stack Auth's server-side APIs to sign in users programmatically
   - Create users in Stack Auth if they don't exist
   - Handle team assignment/creation for SSO users
   - Maintain session using Stack Auth's cookie system

4. **User Flow:**
   - User clicks your app in main dashboard (localhost:3000)
   - Main dashboard generates JWT with user info
   - User gets redirected to `localhost:3001/api/auth/sso?token=JWT_HERE`
   - Your SSO endpoint validates JWT and signs user into Stack Auth
   - User gets redirected to their dashboard with proper team context

### **Key Integration Points:**

- **Stack Auth User Creation**: We'll need to use Stack Auth's server APIs to create/authenticate users
- **Team Management**: Automatically create or assign users to appropriate teams
- **Session Handling**: Let Stack Auth handle the session cookies (no custom session management needed)
- **Error Handling**: Graceful fallback to normal sign-in if SSO fails

### **Files We'll Need to Create/Modify:**

1. `app/api/auth/sso/route.ts` - New SSO endpoint
2. `.env.local` - Add SSO configuration
3. Possibly enhance team management for SSO users

Would you like me to start implementing this plan? The implementation will seamlessly integrate with your existing Stack Auth setup and maintain all your current authentication patterns.
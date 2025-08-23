# Developer Integration Guide

## 🎯 **Overview**

This guide explains how to integrate external AI/business applications with our augment dashboard platform using our simple SSO system. The platform acts as a central hub that manages user authentication and seamlessly launches external applications.

## 🏗️ **System Architecture**

### **Dashboard Platform (this codebase)**
- **Purpose**: Central user authentication and app launcher
- **Port**: `localhost:3000` (production: your domain)
- **Technology**: Next.js, Firebase Auth, MongoDB
- **Role**: Manages users, subscriptions, and launches external apps

### **External AI Modules**
- **Purpose**: Independent applications (AI HR, CRM, etc.)
- **Ports**: `localhost:3001`, `3002`, `3003`, etc.
- **Technology**: Any (React, Vue, Python, etc.)
- **Role**: Handle business logic and provide specialized functionality

---

## 🔐 **SSO Authentication Flow**

### **Simple 4-Step Process:**

1. **User clicks app** in dashboard → Platform generates JWT token
2. **Platform redirects** user to `{APP_URL}?token={jwt}`
3. **External app receives token** → Validates JWT → Extracts user info
4. **External app logs user in** → Shows their personalized dashboard

### **JWT Token Structure:**
```json
{
  "userId": "platform-user-id",
  "email": "user@example.com", 
  "name": "John Doe",
  "role": "member",
  "targetApp": "ai-hr",
  "expiresAt": 1704067200000
}
```

### **Shared Configuration:**
- **JWT Secret**: `45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f`
- **Platform URL**: `http://localhost:3000` (or your production domain)

---

## 👨‍💻 **For Dashboard Developers**

### **Adding a New App Module**

#### **1. Set Environment Variable**
Add your app's base URL to `.env`:
```bash
# Add this line
MY_NEW_APP_URL=http://localhost:3009
```

#### **2. Create App Module Structure**
Create: `lib/apps/modules/my-new-app/`
```
my-new-app/
├── index.ts              # Main module export
├── metadata.ts           # App information & features
├── landing-page.tsx      # Beautiful landing page
└── launch-handler.ts     # SSO launch logic
```

#### **3. Implement Required Files**

**`metadata.ts`** - App information:
```typescript
import { AppMetadata } from '../../types';

export const myNewAppMetadata: AppMetadata = {
  name: 'My New App',
  slug: 'my-new-app',
  description: 'Description of what your app does',
  shortDescription: 'Brief one-liner for cards',
  icon: 'Brain', // Lucide React icon name
  color: 'bg-purple-500',
  category: 'ai', // ai, business, hr, sales, etc.
  
  features: [
    'Key Feature 1',
    'Key Feature 2',
    'Key Feature 3'
  ],
  
  tags: ['AI', 'Automation', 'Analytics'],
  website: process.env.MY_NEW_APP_URL || 'http://localhost:3009',
  supportUrl: `${process.env.MY_NEW_APP_URL || 'http://localhost:3009'}/support`,
  
  integrationStatus: 'ready',
  popularity: 85,
  rating: 4.5,
  isPopular: true,
  isFeatured: false,
  launchInNewTab: true,
  status: 'active'
};
```

**`launch-handler.ts`** - Simple SSO launch:
```typescript
import { LaunchContext, LaunchResult } from '../../types';
import { generateSecureAppToken } from '@/lib/sso/token-generator';

export async function launchMyNewApp(context: LaunchContext): Promise<LaunchResult> {
  try {
    // Get app URL from environment
    const appUrl = process.env.MY_NEW_APP_URL;
    if (!appUrl) {
      return {
        success: false,
        error: 'App URL not configured. Please set MY_NEW_APP_URL in environment variables.'
      };
    }

    // Generate JWT token
    const tokenData = generateSecureAppToken({
      userId: context.user.id,
      email: context.user.email,
      name: context.user.name || context.user.email,
      role: 'member',
      targetApp: 'my-new-app',
      permissions: [],
      expirationMinutes: 5
    });

    // Simple redirect to app with token
    const redirectUrl = `${appUrl}?token=${encodeURIComponent(tokenData.token)}`;

    return {
      success: true,
      redirectUrl,
      message: 'Launching My New App...'
    };

  } catch (error) {
    console.error('App launch error:', error);
    return {
      success: false,
      error: 'Failed to launch application'
    };
  }
}
```

**`landing-page.tsx`** - Beautiful marketing page:
```typescript
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppModuleProps } from '../../types';
import { Brain } from 'lucide-react'; // Your app icon
import {
  LandingHeader,
  HeroSection,
  StatsSection,
  FeaturesSection,
  CTASection,
  LandingFooter
} from '../../base/landing-components';

export function MyNewAppLandingPage(props: AppModuleProps) {
  const router = useRouter();

  const handleLaunch = () => {
    router.push('/app/my-new-app/launch');
  };

  // Define your app's features, stats, testimonials, etc.
  const stats = [
    { value: "80%", label: "Efficiency Increase", color: "purple" },
    { value: "50%", label: "Time Saved", color: "blue" }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Feature",
      description: "Description of what this feature does",
      color: "purple"
    }
    // ... more features
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <LandingHeader
        title="My New App"
        hasAccess={props.hasAccess}
        onLaunch={handleLaunch}
        launchText="Launch App"
        accentColor="purple"
      />

      <HeroSection
        icon={Brain}
        title="My New"
        subtitle="App"
        description="Transform your workflow with our innovative solution..."
        hasAccess={props.hasAccess}
        onLaunch={handleLaunch}
        launchText="Launch App Now"
        accentColor="purple"
      />

      <StatsSection stats={stats} />
      <FeaturesSection features={features} accentColor="purple" />
      <CTASection
        title="Ready to Transform Your Workflow?"
        hasAccess={props.hasAccess}
        onLaunch={handleLaunch}
        accentColor="purple"
      />

      <LandingFooter appName="My New App" />
    </div>
  );
}
```

**`index.ts`** - Module export:
```typescript
import { AppModule } from '../../types';
import { myNewAppMetadata } from './metadata';
import { launchMyNewApp } from './launch-handler';
import { MyNewAppLandingPage } from './landing-page';

export const myNewAppModule: AppModule = {
  metadata: myNewAppMetadata,
  accessRequirements: {
    requiresPlan: true,     // Set to false for free apps
    minimumPlanLevel: 1     // 0=free, 1=starter, 2=pro, 3=enterprise
  },
  landingPage: MyNewAppLandingPage,
  launchHandler: launchMyNewApp
};

export default myNewAppModule;
```

#### **4. Register the Module**
Add to `lib/apps/initialize-registry.ts`:
```typescript
import { myNewAppModule } from './modules/my-new-app';

export function initializeAppRegistry() {
  // ... existing registrations
  appRegistry.registerApp('my-new-app', myNewAppModule);
}
```

#### **5. Test Your Integration**
1. Start dashboard: `npm run dev` (port 3000)
2. Start your app: (port 3009 or whatever you set)
3. Visit: `http://localhost:3000/app/my-new-app`
4. Click launch and verify SSO works

---

## 🤖 **For AI Module Developers**

### **Setting Up Your External App**

#### **1. Receive Integration Details**
You'll get:
- **JWT Secret**: `45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f`
- **Platform URL**: `http://localhost:3000`
- **Your App Port**: e.g., `3001` for AI HR
- **SSO Documentation**: This guide + simple SSO guide

#### **2. Implement SSO Endpoint**

**Any Backend (Node.js example):**
```javascript
const jwt = require('jsonwebtoken');

app.get('/', (req, res) => {
  const token = req.query.token;
  
  try {
    // Validate JWT with shared secret
    const payload = jwt.verify(token, '45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f');
    
    // Extract user info
    const { userId, email, name, role } = payload;
    
    // Create or update user in your database
    let user = await User.findOne({ platformUserId: userId });
    if (!user) {
      user = await User.create({
        platformUserId: userId,
        email,
        name,
        role
      });
    }
    
    // Log user in (create session/JWT/whatever you use)
    req.session.userId = user.id;
    
    // Redirect to your app's dashboard
    res.redirect('/dashboard');
    
  } catch (error) {
    res.status(401).send('Invalid token - redirecting to platform');
  }
});
```

**React/Frontend Framework:**
```javascript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  // Send to your backend for validation
  fetch('/api/auth/sso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // User logged in, redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      // Invalid token
      window.location.href = 'http://localhost:3000';
    }
  });
}
```

#### **3. Handle User Management**

**Important Notes:**
- Store `platformUserId` as the unique identifier
- Keep user data synced (email, name) from JWT payload
- Implement your own team/workspace management
- Handle user roles based on your app's needs

#### **4. Development Setup**

**Environment Variables (.env):**
```bash
# JWT validation
SSO_JWT_SECRET=45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f
PLATFORM_URL=http://localhost:3000

# Your app config
PORT=3001
NODE_ENV=development
```

**Production Environment:**
```bash
SSO_JWT_SECRET=45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f
PLATFORM_URL=https://yourdashboard.com
PORT=80
NODE_ENV=production
```

---

## 🚀 **Deployment Guide**

### **Development Environment**
```bash
# Dashboard Platform
http://localhost:3000

# External Apps
AI HR Manager:          http://localhost:3001
CRM:                   http://localhost:3002
Human Resources:       http://localhost:3003
Digital Signature:     http://localhost:3004
# ... etc
```

### **Production Environment**

**Dashboard Platform**: `https://yourdomain.com`

**External Apps Options:**

1. **Subdomains**:
   ```
   AI_HR_APP_URL=https://aihr.yourdomain.com
   CRM_APP_URL=https://crm.yourdomain.com
   ```

2. **Different Domains**:
   ```
   AI_HR_APP_URL=https://aihrmanager.com
   CRM_APP_URL=https://yourcrm.com
   ```

3. **Paths**:
   ```
   AI_HR_APP_URL=https://yourdomain.com/aihr
   CRM_APP_URL=https://yourdomain.com/crm
   ```

---

## 📋 **Development Checklist**

### **Dashboard Developers:**
- [ ] Add app URL to `.env`
- [ ] Create module directory structure
- [ ] Implement metadata.ts with app details
- [ ] Create beautiful landing page
- [ ] Implement simple launch handler
- [ ] Export module in index.ts
- [ ] Register in initialize-registry.ts
- [ ] Test SSO integration locally
- [ ] Verify landing page displays correctly

### **AI Module Developers:**
- [ ] Receive JWT secret and integration details
- [ ] Set up JWT validation in your app
- [ ] Implement SSO endpoint to handle `?token=jwt`
- [ ] Store platformUserId as unique identifier
- [ ] Create user dashboard/main app interface
- [ ] Test token validation with sample JWT
- [ ] Test full SSO flow with dashboard
- [ ] Handle error cases (invalid/expired tokens)
- [ ] Prepare for production deployment

---

## 🔧 **Troubleshooting**

### **Common Issues:**

**"App URL not configured"**
- Check `.env` has `{APP_NAME}_URL` variable
- Restart development server after adding env vars

**"Invalid token"**
- Verify JWT secret matches exactly (no extra quotes/spaces)
- Check token hasn't expired (5 minutes default)
- Ensure token is being passed correctly in URL

**"Failed to launch application"**
- Check external app is running on specified port
- Verify network connectivity between apps
- Check console logs for detailed error messages

**Landing page not showing**
- Verify module is registered in `initialize-registry.ts`
- Check for TypeScript/import errors
- Ensure all required files exist

---

## 📚 **Additional Resources**

- **Simple SSO Guide**: `docs/simple-sso-guide.md`
- **App Architecture**: `lib/apps/base/plan.md`
- **Example Implementation**: `lib/apps/modules/ai-hr/`
- **JWT Documentation**: [jwt.io](https://jwt.io)

---

## 💡 **Best Practices**

1. **Keep it Simple**: Don't overcomplicate the SSO flow
2. **Environment Variables**: Always use env vars for URLs/secrets
3. **Error Handling**: Provide clear error messages for users
4. **Security**: Never expose JWT secrets in frontend code
5. **User Experience**: Make SSO transitions seamless
6. **Documentation**: Document any custom configuration needs
7. **Testing**: Test both development and production scenarios

---

## 🤝 **Getting Help**

- Review existing module implementations in `lib/apps/modules/`
- Check the simple SSO guide for basic implementation
- Test with minimal setup first, then add complexity
- Ensure all environment variables are properly configured

Happy coding! 🚀

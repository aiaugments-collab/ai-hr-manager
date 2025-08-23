# AI HR Manager - Dashboard Integration Guide

## 🎯 **Overview**

This guide shows how to add the AI HR Manager app to your main dashboard platform for seamless SSO integration.

## 📋 **App Details**

### **App Information:**
- **App Name**: AI HR Manager
- **App URL**: `http://localhost:3001`
- **SSO Endpoint**: `http://localhost:3001/api/auth/sso`
- **Description**: Complete AI-powered HR management system with candidate tracking, document management, and AI assistant

### **App Features:**
- 📊 **Dashboard Analytics**: Team performance metrics and hiring stats
- 👥 **Candidate Management**: Resume parsing, scoring, and tracking
- 📄 **Document Management**: Upload, search, and organize HR documents
- 🤖 **AI Assistant**: Chat with AI about candidates and HR processes
- ⚙️ **Team Settings**: User management and team configuration

## 🔧 **Integration Steps**

### **1. Add App to Your Platform**

In your dashboard platform, create a new app entry with these details:

```json
{
  "name": "AI HR Manager",
  "description": "Complete AI-powered HR management system",
  "url": "http://localhost:3001",
  "ssoEndpoint": "http://localhost:3001/api/auth/sso",
  "category": "HR & Recruiting",
  "icon": "👥", // or use a custom icon
  "features": [
    "Candidate Management",
    "Resume Parsing", 
    "AI Assistant",
    "Document Management",
    "Analytics Dashboard"
  ]
}
```

### **2. SSO Configuration**

The AI HR Manager app is already configured with the SSO settings:

- **JWT Secret**: `45ebba4385dba30e7c60a589f780b6b19b1bf89dc04091fc138410282791114f`
- **Platform URL**: `http://localhost:3000`
- **SSO Endpoint**: `http://localhost:3001/api/auth/sso`

### **3. User Flow**

When a user clicks the AI HR Manager app in your dashboard:

1. Generate JWT token with user info:
```json
{
  "userId": "platform-user-id",
  "email": "user@example.com",
  "name": "John Doe", 
  "role": "member",
  "expiresAt": 1704067200000
}
```

2. Redirect user to: `http://localhost:3001/api/auth/sso?token=JWT_HERE`

3. The app will:
   - Validate the JWT token
   - Create/authenticate user in the app
   - Create a team for the user if needed
   - Redirect to their personalized dashboard

### **4. App Structure**

Users will land on their team dashboard at:
```
http://localhost:3001/dashboard/{team-slug}/
```

Available pages:
- **Overview**: `/dashboard/{team-slug}/` - Analytics and recent activity
- **Candidates**: `/dashboard/{team-slug}/candidates` - Candidate management
- **Documents**: `/dashboard/{team-slug}/documents` - Document library
- **Assistant**: `/dashboard/{team-slug}/assistant` - AI chat interface
- **Settings**: `/dashboard/{team-slug}/settings` - Team configuration

## 🎨 **App Display**

### **Recommended App Card:**
```
┌─────────────────────────────────┐
│ 👥 AI HR Manager                │
│                                 │
│ Complete AI-powered HR          │
│ management system               │
│                                 │
│ • Candidate Management          │
│ • AI Assistant                  │
│ • Document Processing           │
│ • Analytics Dashboard           │
│                                 │
│ [Launch App] ──────────────────► │
└─────────────────────────────────┘
```

### **Category**: HR & Recruiting
### **Tags**: AI, HR, Candidates, Documents, Analytics

## ✅ **Testing the Integration**

1. **Add the app** to your dashboard platform
2. **Configure SSO** with the provided JWT secret
3. **Test user flow**:
   - Click the app from dashboard
   - Verify JWT token generation
   - Confirm redirect to SSO endpoint
   - Check successful authentication
   - Verify landing on team dashboard

## 🔧 **Technical Requirements**

- **App runs on**: Port 3001 (configured to always use this port)
- **JWT Algorithm**: HS256
- **Token Expiration**: Configurable (recommend 1-24 hours)
- **Error Handling**: Failed SSO redirects to sign-in page

## 📞 **Support**

If you encounter any issues during integration:
- Check JWT token format and expiration
- Verify the SSO endpoint is accessible
- Ensure the JWT secret matches exactly
- Test with sample user data first

The app includes comprehensive logging for debugging SSO issues.

---

**Ready to integrate!** 🚀 The AI HR Manager app is fully configured and ready to be added to your dashboard platform.

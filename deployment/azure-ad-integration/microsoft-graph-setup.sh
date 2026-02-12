#!/bin/bash
# Microsoft Graph API Integration for Azure AD Authentication
# Uses credentials from .env for automated setup
# Configures OAuth2/OIDC for Fleet Management System

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Microsoft Graph API Integration Setup ===${NC}"
echo "Starting: $(date)"

PROJECT_ROOT="/home/azure-vm/fleet-management"
source "$PROJECT_ROOT/.env"

# Verify required environment variables
REQUIRED_VARS=(
  "MICROSOFT_GRAPH_CLIENT_ID"
  "MICROSOFT_GRAPH_CLIENT_SECRET"
  "MICROSOFT_GRAPH_TENANT_ID"
  "AZURE_AD_APP_ID"
  "AZURE_AD_REDIRECT_URI"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗ Missing environment variable: $var${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ All required environment variables present${NC}"

# Install Microsoft Graph SDK
echo -e "\n${YELLOW}Installing Microsoft Graph SDK...${NC}"
cd "$PROJECT_ROOT/api"
npm install --save @microsoft/microsoft-graph-client @azure/msal-node isomorphic-fetch

# Create Microsoft Graph service
echo -e "\n${YELLOW}Creating Microsoft Graph service...${NC}"
cat > "$PROJECT_ROOT/api/src/services/microsoft-graph.service.ts" << 'TS'
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import 'isomorphic-fetch';

class MicrosoftGraphService {
  private client: Client;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.MICROSOFT_GRAPH_TENANT_ID!,
      process.env.MICROSOFT_GRAPH_CLIENT_ID!,
      process.env.MICROSOFT_GRAPH_CLIENT_SECRET!
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    this.client = Client.initWithMiddleware({
      authProvider: authProvider
    });
  }

  /**
   * Get user profile from Azure AD
   */
  async getUserProfile(userPrincipalName: string) {
    try {
      const user = await this.client
        .api(`/users/${userPrincipalName}`)
        .select('id,displayName,mail,jobTitle,department,officeLocation,mobilePhone')
        .get();

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get all users in a department
   */
  async getUsersByDepartment(department: string) {
    try {
      const users = await this.client
        .api('/users')
        .filter(`department eq '${department}'`)
        .select('id,displayName,mail,jobTitle,department')
        .get();

      return users.value;
    } catch (error) {
      console.error('Error fetching users by department:', error);
      throw error;
    }
  }

  /**
   * Get user's manager
   */
  async getUserManager(userPrincipalName: string) {
    try {
      const manager = await this.client
        .api(`/users/${userPrincipalName}/manager`)
        .select('id,displayName,mail,jobTitle')
        .get();

      return manager;
    } catch (error) {
      console.error('Error fetching manager:', error);
      return null;
    }
  }

  /**
   * Get user's direct reports
   */
  async getDirectReports(userPrincipalName: string) {
    try {
      const reports = await this.client
        .api(`/users/${userPrincipalName}/directReports`)
        .select('id,displayName,mail,jobTitle')
        .get();

      return reports.value;
    } catch (error) {
      console.error('Error fetching direct reports:', error);
      return [];
    }
  }

  /**
   * Send email via Microsoft Graph
   */
  async sendEmail(from: string, to: string[], subject: string, body: string) {
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      },
      saveToSentItems: true
    };

    try {
      await this.client
        .api(`/users/${from}/sendMail`)
        .post(message);

      console.log(`Email sent successfully to ${to.join(', ')}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(userPrincipalName: string, event: any) {
    try {
      const newEvent = await this.client
        .api(`/users/${userPrincipalName}/events`)
        .post(event);

      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Get user's calendar availability
   */
  async getUserAvailability(userPrincipalName: string, startTime: string, endTime: string) {
    const requestBody = {
      schedules: [userPrincipalName],
      startTime: {
        dateTime: startTime,
        timeZone: 'Pacific Standard Time'
      },
      endTime: {
        dateTime: endTime,
        timeZone: 'Pacific Standard Time'
      },
      availabilityViewInterval: 60
    };

    try {
      const availability = await this.client
        .api('/me/calendar/getSchedule')
        .post(requestBody);

      return availability;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }
}

export default new MicrosoftGraphService();
TS

# Create Azure AD authentication middleware
echo -e "\n${YELLOW}Creating Azure AD authentication middleware...${NC}"
cat > "$PROJECT_ROOT/api/src/middleware/azure-ad-auth.middleware.ts" << 'TS'
import { Request, Response, NextFunction } from 'express';
import { ConfidentialClientApplication, AuthorizationCodeRequest } from '@azure/msal-node';
import jwt from 'jsonwebtoken';

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_APP_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_GRAPH_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET!
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

/**
 * Azure AD OAuth2/OIDC Authentication Middleware
 */
export const azureAdAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Validate issuer
    const payload: any = decoded.payload;
    const expectedIssuer = `https://login.microsoftonline.com/${process.env.MICROSOFT_GRAPH_TENANT_ID}/v2.0`;

    if (payload.iss !== expectedIssuer) {
      return res.status(401).json({ error: 'Invalid token issuer' });
    }

    // Attach user info to request
    req.user = {
      id: payload.oid,
      email: payload.preferred_username || payload.email,
      name: payload.name,
      roles: payload.roles || []
    };

    next();
  } catch (error) {
    console.error('Azure AD authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = (req.user as any)?.roles || [];

    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
TS

# Create OAuth callback route
echo -e "\n${YELLOW}Creating OAuth callback route...${NC}"
cat > "$PROJECT_ROOT/api/src/routes/auth.routes.ts" << 'TS'
import { Router, Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import jwt from 'jsonwebtoken';

const router = Router();

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_APP_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_GRAPH_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET!
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

/**
 * OAuth2 login redirect
 */
router.get('/auth/login', (req: Request, res: Response) => {
  const authCodeUrlParameters = {
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: process.env.AZURE_AD_REDIRECT_URI!
  };

  cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
    res.redirect(response);
  }).catch((error) => {
    console.error(error);
    res.status(500).send('Error initiating authentication');
  });
});

/**
 * OAuth2 callback
 */
router.get('/auth/callback', async (req: Request, res: Response) => {
  const tokenRequest = {
    code: req.query.code as string,
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: process.env.AZURE_AD_REDIRECT_URI!
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);

    // Create session token
    const sessionToken = jwt.sign(
      {
        userId: response.account?.localAccountId,
        email: response.account?.username,
        name: response.account?.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${sessionToken}`);
  } catch (error) {
    console.error('Token acquisition error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * Logout
 */
router.get('/auth/logout', (req: Request, res: Response) => {
  const logoutUri = `https://login.microsoftonline.com/${process.env.MICROSOFT_GRAPH_TENANT_ID}/oauth2/v2.0/logout`;
  res.redirect(logoutUri);
});

/**
 * Get current user profile
 */
router.get('/auth/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
TS

# Update main app.ts to use Azure AD auth
echo -e "\n${YELLOW}Updating app.ts to use Azure AD authentication...${NC}"
cat >> "$PROJECT_ROOT/api/src/app.ts" << 'TS'

// Azure AD Authentication
import authRoutes from './routes/auth.routes';
import { azureAdAuth, requireRole } from './middleware/azure-ad-auth.middleware';

// Add auth routes
app.use('/api/v1', authRoutes);

// Protect all API routes with Azure AD (except public routes)
app.use('/api/v1', (req, res, next) => {
  // Skip authentication for public routes
  const publicRoutes = ['/auth/login', '/auth/callback', '/health', '/ready'];

  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  return azureAdAuth(req, res, next);
});

// Example: Protect admin routes with role check
app.use('/api/v1/admin/*', requireRole(['Admin', 'FleetManager']));
TS

echo -e "\n${GREEN}✓ Microsoft Graph integration complete${NC}"

# Create test script
echo -e "\n${YELLOW}Creating test script...${NC}"
cat > "$PROJECT_ROOT/test-graph-api.sh" << 'TEST'
#!/bin/bash
# Test Microsoft Graph API integration

echo "Testing Microsoft Graph API..."

# Test 1: Get user profile
curl -X GET "http://localhost:5000/api/v1/graph/users/andrew.m@capitaltechalliance.com" \
  -H "Authorization: Bearer $GRAPH_TOKEN"

# Test 2: Get department users
curl -X GET "http://localhost:5000/api/v1/graph/departments/Fleet/users" \
  -H "Authorization: Bearer $GRAPH_TOKEN"

# Test 3: Send email
curl -X POST "http://localhost:5000/api/v1/graph/send-email" \
  -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["user@example.com"],
    "subject": "Fleet Management System - Test Email",
    "body": "<h1>Test Email</h1><p>This is a test email from Fleet Management System.</p>"
  }'
TEST

chmod +x "$PROJECT_ROOT/test-graph-api.sh"

echo -e "\n${GREEN}=== Microsoft Graph Integration Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure Azure AD app registration is configured:"
echo "   - Client ID: $MICROSOFT_GRAPH_CLIENT_ID"
echo "   - Tenant ID: $MICROSOFT_GRAPH_TENANT_ID"
echo "   - Redirect URI: $AZURE_AD_REDIRECT_URI"
echo ""
echo "2. Grant API permissions in Azure AD:"
echo "   - User.Read.All"
echo "   - Mail.Send"
echo "   - Calendars.ReadWrite"
echo ""
echo "3. Test the integration:"
echo "   ./test-graph-api.sh"
echo ""
echo "Completed: $(date)"

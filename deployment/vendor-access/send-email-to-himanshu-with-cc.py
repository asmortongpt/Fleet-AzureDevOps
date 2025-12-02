#!/usr/bin/env python3
"""
Send onboarding email to Himanshu with CC to team
"""

import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# Email configuration from .env
EMAIL_HOST = "smtp.office365.com"
EMAIL_PORT = 587
EMAIL_USER = "sara@capitaltechalliance.com"
EMAIL_PASS = "A514b124l214$"

# Recipients
TO_EMAIL = "Himanshu.badola.proff@gmail.com"
CC_EMAILS = [
    "Krishna@capitaltechalliance.com",
    "Danny@capitaltechalliance.com",
    "Manit@capitaltechalliance.com",
    "andrew@capitaltechalliance.com"  # Add your email here if different
]

SUBJECT = "Fleet Management System - Developer Access & Onboarding"

# Email body
BODY = """Hi Himanshu,

Welcome to the Fleet Management System project! I'm excited to have you on board.

═══════════════════════════════════════════════════════════════════════

🔐 AZURE DEVOPS ACCESS

You should receive a separate invitation email from Microsoft Azure DevOps shortly.

When you receive it:
1. Click "Accept invitation"
2. Sign in with your Gmail account (Himanshu.badola.proff@gmail.com)
3. You'll have access to the code repository

Repository: https://dev.azure.com/CapitalTechAlliance/FleetManagement

═══════════════════════════════════════════════════════════════════════

☸️ KUBERNETES CLUSTER ACCESS

Attached is your access package (himanshu-access-package.tar.gz).

To set up:

# Extract the package
tar -xzf himanshu-access-package.tar.gz
cd himanshu-access-package

# Read the quick start guide
cat START_HERE.md

# Set up Kubernetes access
export KUBECONFIG=/path/to/vendor-kubeconfig.yaml

# Test your access
kubectl get pods -n fleet-dev
kubectl get pods -n fleet-staging

═══════════════════════════════════════════════════════════════════════

✅ YOUR ACCESS LEVELS

Development Environment (fleet-dev):
  ✅ Full access - Deploy, debug, modify resources
  ✅ View logs, exec into pods, port-forward
  ✅ Create/update/delete pods, deployments, services

Staging Environment (fleet-staging):
  ✅ Read-only access - View resources and logs
  ⚠️  Cannot modify deployments or resources
  ✅ Good for testing before production

Production Environment:
  ❌ No access - This is locked down for security
  ⚠️  Only core team can access production

Azure DevOps:
  ✅ Clone repository
  ✅ Create branches and commits
  ✅ Submit pull requests (all changes must be reviewed)
  ✅ View/update work items

═══════════════════════════════════════════════════════════════════════

📚 DOCUMENTATION INCLUDED

The access package includes:

1. START_HERE.md - Quick start guide
2. VENDOR_ONBOARDING.md - Complete onboarding (12,000 words)
   - System architecture
   - Technology stack
   - Local development setup
   - Deployment procedures
   - Testing guidelines

3. AZURE_DEVOPS_ACCESS.md - Git workflow guide
   - Branch naming conventions
   - Pull request process
   - Code review guidelines
   - Commit message standards

4. SECURITY_GUIDELINES.md - Security requirements
   - Secure coding practices
   - Data protection requirements
   - Secrets management
   - Incident response

═══════════════════════════════════════════════════════════════════════

🚀 QUICK START GUIDE

Once you've set everything up:

1. Clone the repository:
git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
cd Fleet

2. Set up Kubernetes access:
export KUBECONFIG=/path/to/vendor-kubeconfig.yaml
kubectl config current-context  # Should show: fleet-vendor-context

3. Deploy to development:
./deployment/scripts/deploy-dev.sh

4. Check your deployment:
kubectl get pods -n fleet-dev
kubectl logs -f <pod-name> -n fleet-dev

═══════════════════════════════════════════════════════════════════════

🔒 IMPORTANT SECURITY NOTES

1. Keep the kubeconfig file secure
   - Do NOT commit it to git
   - Do NOT share it with anyone
   - Store it in a secure location

2. Follow security guidelines
   - Read SECURITY_GUIDELINES.md carefully
   - Never expose secrets or credentials
   - Use environment variables for sensitive data

3. All production changes require approval
   - Create pull requests for all changes
   - Wait for code review before merging
   - Never force-push to main branch

═══════════════════════════════════════════════════════════════════════

📞 TEAM CONTACTS

Primary Team (CC'd on this email):
- Krishna: Krishna@capitaltechalliance.com
- Danny: Danny@capitaltechalliance.com
- Manit: Manit@capitaltechalliance.com
- Andrew: andrew@capitaltechalliance.com

For technical questions, deployment issues, or access problems, feel free to reach out to any of us.

═══════════════════════════════════════════════════════════════════════

📞 NEED HELP?

Questions? Issues? Need clarification?

Reply to this email (team is CC'd) and we'll be happy to help!

Looking forward to working with you!

Best regards,
Capital Tech Alliance Fleet Management Team

═══════════════════════════════════════════════════════════════════════

P.S. - Don't forget to accept the Azure DevOps invitation when you receive it!
"""

def send_email():
    """Send email with attachment and CC recipients"""

    print("📧 Sending onboarding email to Himanshu...")
    print(f"   To: {TO_EMAIL}")
    print(f"   CC: {', '.join(CC_EMAILS)}")

    # Create message
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USER
    msg['To'] = TO_EMAIL
    msg['Cc'] = ', '.join(CC_EMAILS)
    msg['Subject'] = SUBJECT

    # Add body
    msg.attach(MIMEText(BODY, 'plain'))

    # Attach the access package
    attachment_path = "/Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access/himanshu-access-package.tar.gz"

    try:
        with open(attachment_path, 'rb') as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename=himanshu-access-package.tar.gz'
            )
            msg.attach(part)
        print(f"✅ Attached: himanshu-access-package.tar.gz")
    except FileNotFoundError:
        print(f"⚠️  Warning: Could not find attachment at {attachment_path}")
        print("   Email will be sent without attachment")

    # Combine To and CC for sending
    all_recipients = [TO_EMAIL] + CC_EMAILS

    # Send email
    try:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)

        text = msg.as_string()
        server.sendmail(EMAIL_USER, all_recipients, text)
        server.quit()

        print(f"\n✅ Email sent successfully!")
        print(f"   To: {TO_EMAIL}")
        print(f"   CC: {', '.join(CC_EMAILS)}")
        print(f"   Subject: {SUBJECT}")
        return True

    except Exception as e:
        print(f"\n❌ Error sending email: {e}")
        print("\n📝 Email preview (you can send manually):")
        print("=" * 70)
        print(f"To: {TO_EMAIL}")
        print(f"CC: {', '.join(CC_EMAILS)}")
        print(f"From: {EMAIL_USER}")
        print(f"Subject: {SUBJECT}")
        print(f"Attachment: himanshu-access-package.tar.gz")
        print("=" * 70)
        print("\nFull email body saved to: /tmp/himanshu-email-body.txt")

        # Save full body to file for manual sending
        with open("/tmp/himanshu-email-body.txt", "w") as f:
            f.write(f"To: {TO_EMAIL}\n")
            f.write(f"CC: {', '.join(CC_EMAILS)}\n")
            f.write(f"Subject: {SUBJECT}\n")
            f.write(f"Attachment: himanshu-access-package.tar.gz\n")
            f.write("\n" + "="*70 + "\n\n")
            f.write(BODY)

        print("Full email content saved for manual sending!")
        return False

if __name__ == "__main__":
    send_email()

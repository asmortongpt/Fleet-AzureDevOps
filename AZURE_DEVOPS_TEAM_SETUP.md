# Azure DevOps Team Setup Guide

**Date:** 2025-11-09
**Status:** READY TO EXECUTE
**Time Required:** 10 minutes

---

## Overview

This guide will walk you through adding all team members to Azure DevOps Fleet Management project.

**Team Members to Add:**
1. Himanshu Badola - himanshu.badola.proff@gmail.com (External Vendor - Developer)
2. Krishna - Krishna@capitaltechalliance.com (Core Team)
3. Danny - Danny@capitaltechalliance.com (Core Team)
4. Manit - Manit@capitaltechalliance.com (Core Team)

---

## STEP 1: Enable External Guest Access (2 minutes)

**Why?** Himanshu uses a Gmail account, which requires external guest access to be enabled.

### Actions:

1. Open your browser and navigate to:
   ```
   https://dev.azure.com/CapitalTechAlliance/_settings/policy
   ```

2. Sign in with your Capital Tech Alliance account

3. Scroll to the **"User Policy"** section

4. Find and **toggle ON** these two settings:
   - ✅ **"Allow team and project administrators to invite new users"**
   - ✅ **"Allow requests to access application user access"** (or similar external access setting)

5. Find the **"Guest access"** or **"External users"** section

6. **Toggle ON**:
   - ✅ **"External guest access"** or **"Allow invitations to be sent to any domain"**

7. Click **"Save"** at the top of the page

8. You should see a confirmation message

---

## STEP 2: Add Core Team Members (3 minutes)

Now add Krishna, Danny, and Manit (all @capitaltechalliance.com emails).

### Actions:

1. Navigate to:
   ```
   https://dev.azure.com/CapitalTechAlliance/_settings/users
   ```

2. Click **"Add users"** button (top right)

3. **For Krishna:**
   - Email: `Krishna@capitaltechalliance.com`
   - Access level: **Basic**
   - Add to projects: **FleetManagement**
   - Azure DevOps Groups: **Contributors**
   - Click **"Add"**

4. **Repeat for Danny:**
   - Email: `Danny@capitaltechalliance.com`
   - Access level: **Basic**
   - Add to projects: **FleetManagement**
   - Azure DevOps Groups: **Contributors**
   - Click **"Add"**

5. **Repeat for Manit:**
   - Email: `Manit@capitaltechalliance.com`
   - Access level: **Basic**
   - Add to projects: **FleetManagement**
   - Azure DevOps Groups: **Contributors**
   - Click **"Add"**

**Expected Result:** Krishna, Danny, and Manit will each receive an invitation email from Azure DevOps.

---

## STEP 3: Add External Vendor (Himanshu) (2 minutes)

Now that external access is enabled, add Himanshu.

### Actions:

1. Still on the users page:
   ```
   https://dev.azure.com/CapitalTechAlliance/_settings/users
   ```

2. Click **"Add users"** button again

3. **For Himanshu:**
   - Email: `Himanshu.badola.proff@gmail.com`
   - Access level: **Basic**
   - Add to projects: **FleetManagement**
   - Azure DevOps Groups: **Contributors**
   - Click **"Add"**

4. You may see a warning about external users - click **"Continue"** or **"Add anyway"**

**Expected Result:** Himanshu will receive an invitation email from Azure DevOps.

---

## STEP 4: Verify Access (2 minutes)

Confirm all users were added successfully.

### Actions:

1. On the users page, you should now see all 5 users:
   - andrew@capitaltechalliance.com (you)
   - Krishna@capitaltechalliance.com
   - Danny@capitaltechalliance.com
   - Manit@capitaltechalliance.com
   - Himanshu.badola.proff@gmail.com (marked as "Guest" or "External")

2. Each user should have:
   - ✅ Status: **Pending** (until they accept invitation)
   - ✅ Access level: **Basic**
   - ✅ Project: **FleetManagement**

3. Navigate to the repository to verify permissions:
   ```
   https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
   ```

4. Click **"Settings"** → **"Security"**

5. Verify **"Contributors"** group includes all users

---

## STEP 5: What Happens Next

### For Each Team Member:

1. **They receive an email** from Microsoft Azure DevOps with subject like:
   - "You've been invited to join CapitalTechAlliance organization"

2. **They click "Accept invitation"** in the email

3. **They sign in** with their respective accounts:
   - Krishna, Danny, Manit: Use Capital Tech Alliance Microsoft account
   - Himanshu: Use his Gmail account (will create guest account)

4. **They gain access** to:
   - FleetManagement project
   - Fleet repository
   - Ability to clone, create branches, submit pull requests
   - View work items and boards

### Repository Access:

All team members will be able to:
- ✅ Clone the repository
- ✅ Create feature branches
- ✅ Commit code changes
- ✅ Submit pull requests
- ✅ View and comment on PRs
- ✅ View work items
- ⚠️ Cannot force-push to main branch (protected)
- ⚠️ Cannot delete branches (protected)

---

## Troubleshooting

### Issue: "External guest access is disabled"
**Solution:** Make sure you completed STEP 1 and enabled external guest access in organization settings.

### Issue: "User already exists"
**Solution:** The user may have already been invited. Check the users list.

### Issue: Can't find the security settings
**Solution:** Make sure you're signed in with an account that has organization administrator permissions.

### Issue: Himanshu doesn't receive invitation email
**Solution:**
1. Check spam folder
2. Resend invitation from Azure DevOps users page
3. Verify email address is spelled correctly: `Himanshu.badola.proff@gmail.com`

---

## Summary Checklist

Before considering this complete, verify:

- [ ] External guest access enabled in organization policy
- [ ] Krishna@capitaltechalliance.com added to FleetManagement
- [ ] Danny@capitaltechalliance.com added to FleetManagement
- [ ] Manit@capitaltechalliance.com added to FleetManagement
- [ ] Himanshu.badola.proff@gmail.com added to FleetManagement
- [ ] All users show as "Pending" or "Active" in users list
- [ ] All users have "Basic" access level
- [ ] All users are in "Contributors" group
- [ ] Repository security settings show Contributors group

---

## Repository Details

**Organization:** CapitalTechAlliance
**Project:** FleetManagement
**Repository:** Fleet
**Repository URL:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
**Size:** 19 MB
**Branch Protection:** main branch is protected

---

## Next Steps After This Setup

Once all team members have accepted their invitations:

1. **Send Himanshu the onboarding email** with Kubernetes access package
   - See: `/Users/andrewmorton/Documents/GitHub/Fleet/SEND_EMAIL_NOW.md`

2. **Team members can clone the repository:**
   ```bash
   git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
   cd Fleet
   ```

3. **Team members should review documentation:**
   - `/docs/PROJECT_HANDOFF.md` - Complete project overview
   - `/docs/USER_STORIES.md` - Feature requirements
   - `deployment/vendor-access/VENDOR_ONBOARDING.md` - Technical setup

---

**Last Updated:** 2025-11-09
**Created By:** Fleet Management System Setup

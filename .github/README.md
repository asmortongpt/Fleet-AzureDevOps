# GitHub Configuration

**Last Updated**: November 20, 2025
**CI/CD Platform**: Azure DevOps Only

---

## ⚠️ GitHub Actions DISABLED

**All GitHub Actions workflows have been removed.**

### Why?
- **Single deployment platform**: Azure DevOps Pipelines only
- **Enterprise requirements**: Better compliance, security, and Azure integration
- **Avoid conflicts**: Prevent duplicate deployments
- **Simplify maintenance**: One CI/CD platform to manage

---

## 📁 GitHub Repository Role

This GitHub repository serves as:
- ✅ **Source code backup/mirror**
- ✅ **Code review platform** (optional)
- ✅ **Issue tracking** (optional)
- ❌ **NOT for CI/CD or deployments**

---

## 🚀 Deployment Process

**All deployments happen through Azure DevOps:**
- Azure DevOps Repository: `dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet`
- Pipeline Dashboard: `https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build`

**To deploy:**
1. Push code to Azure DevOps: `git push origin <branch>`
2. Azure Pipelines automatically build, test, and deploy
3. Monitor deployment in Azure DevOps UI

---

## 📋 What's in this .github directory?

- ✅ `dependabot.yml` - Automated dependency updates (kept)
- ✅ `README.md` - This file
- ❌ `workflows/` - DELETED (was 15 workflow files)

---

## 🔄 Need to Restore GitHub Actions?

If you need to restore the workflows (not recommended):
```bash
# They were backed up before deletion
git log --all --full-history -- ".github/workflows/*"
```

Or see `DEPLOYMENT_STRATEGY.md` in the root directory for complete documentation.

---

## 📚 Documentation

See root directory documentation:
- `DEPLOYMENT_STRATEGY.md` - Full deployment strategy explanation
- `AZURE_DEPLOYMENT_STATUS.md` - Azure deployment status
- `FINAL_100_PERCENT_CONFIDENCE_SCORE.md` - Production readiness report

---

**For deployment questions, refer to Azure DevOps Pipelines.**

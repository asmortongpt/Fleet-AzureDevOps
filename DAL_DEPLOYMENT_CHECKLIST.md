# DAL Production Deployment Checklist

Use this checklist to safely deploy the Data Access Layer to production.

## 📋 Pre-Deployment (Development)

### Database Setup
- [ ] Migration file reviewed: `031_database_users_and_security.sql`
- [ ] Migration tested in development database
- [ ] Database users created successfully
- [ ] User permissions verified with test queries
- [ ] Connection tests passed for all user types

### Code Changes
- [ ] All DAL files reviewed and tested
- [ ] Example implementations work correctly
- [ ] Unit tests created for repositories
- [ ] Integration tests created for routes
- [ ] Code review completed
- [ ] No breaking changes to existing routes

### Environment Configuration
- [ ] `.env.development` updated with new variables
- [ ] Database passwords generated (32+ characters)
- [ ] SSL certificates obtained (if needed)
- [ ] Connection pool sizes validated
- [ ] Health check interval configured

### Testing
- [ ] All repository CRUD operations tested
- [ ] Transaction commit/rollback tested
- [ ] Error handling tested
- [ ] Connection pool limits tested
- [ ] Query logging verified
- [ ] Performance benchmarks established
- [ ] Load testing completed

## 🚀 Deployment (Staging)

### Pre-Deployment
- [ ] Staging database backup created
- [ ] Deployment plan documented
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Maintenance window scheduled (if needed)

### Database Migration
- [ ] Connect to staging database
  ```bash
  psql -U fleetadmin -h staging-db.postgres.database.azure.com -d fleetdb
  ```

- [ ] Run migration script
  ```sql
  \i api/db/migrations/031_database_users_and_security.sql
  ```

- [ ] Set secure passwords
  ```sql
  ALTER ROLE fleet_webapp_user PASSWORD '<from-key-vault>';
  ALTER ROLE fleet_readonly_user PASSWORD '<from-key-vault>';
  ```

- [ ] Verify users created
  ```sql
  SELECT rolname, rolcanlogin, rolconnlimit
  FROM pg_roles
  WHERE rolname LIKE 'fleet_%';
  ```

- [ ] Test permissions
  ```bash
  # Test webapp user can read/write
  psql -U fleet_webapp_user -h staging-db -d fleetdb -c "SELECT * FROM vendors LIMIT 1;"
  psql -U fleet_webapp_user -h staging-db -d fleetdb -c "INSERT INTO vendors (tenant_id, name) VALUES ('test', 'test');"

  # Test webapp user CANNOT drop tables
  psql -U fleet_webapp_user -h staging-db -d fleetdb -c "DROP TABLE vendors;" # Should fail

  # Test readonly user can read only
  psql -U fleet_readonly_user -h staging-db -d fleetdb -c "SELECT * FROM vendors LIMIT 1;" # Should work
  psql -U fleet_readonly_user -h staging-db -d fleetdb -c "INSERT INTO vendors (tenant_id, name) VALUES ('test', 'test');" # Should fail
  ```

### Azure Key Vault Setup
- [ ] Create secrets in Azure Key Vault
  ```bash
  az keyvault secret set --vault-name fleet-secrets-staging --name db-webapp-username --value fleet_webapp_user
  az keyvault secret set --vault-name fleet-secrets-staging --name db-webapp-password --value '<secure-password>'
  az keyvault secret set --vault-name fleet-secrets-staging --name db-readonly-username --value fleet_readonly_user
  az keyvault secret set --vault-name fleet-secrets-staging --name db-readonly-password --value '<secure-password>'
  ```

- [ ] Verify secrets stored correctly
  ```bash
  az keyvault secret list --vault-name fleet-secrets-staging --query "[?contains(id, 'db-')].name"
  ```

### Application Deployment
- [ ] Update environment variables in staging
- [ ] Deploy application code
- [ ] Verify `initializeDatabase()` called in startup
- [ ] Check application logs for connection success
- [ ] Test health endpoint: `/api/health/database`

### Verification
- [ ] Connection manager initialized successfully
- [ ] All three pools created (admin, webapp, readonly)
- [ ] Health checks passing
- [ ] Pool statistics available
- [ ] Query logging working (if enabled)
- [ ] Existing routes still work (backward compatibility)
- [ ] New DAL routes work correctly

### Testing
- [ ] Smoke tests passed
- [ ] End-to-end tests passed
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] No errors in application logs
- [ ] No errors in database logs

## 🏭 Deployment (Production)

### Pre-Deployment
- [ ] **Staging deployment successful for 48+ hours**
- [ ] Production database backup created
- [ ] Backup verified and tested
- [ ] Change management approval obtained
- [ ] Deployment window scheduled (off-peak hours)
- [ ] On-call engineer assigned
- [ ] Rollback plan ready
- [ ] Team briefed on deployment

### Database Migration
- [ ] Connect to production database
  ```bash
  psql -U fleetadmin -h prod-db.postgres.database.azure.com -d fleetdb
  ```

- [ ] Create database backup
  ```sql
  -- Backup is automatic in Azure, but verify
  SELECT * FROM pg_stat_database WHERE datname = 'fleetdb';
  ```

- [ ] Run migration (during maintenance window)
  ```sql
  \i api/db/migrations/031_database_users_and_security.sql
  ```

- [ ] Set production passwords from Key Vault
  ```sql
  ALTER ROLE fleet_webapp_user PASSWORD '<from-production-key-vault>';
  ALTER ROLE fleet_readonly_user PASSWORD '<from-production-key-vault>';
  ```

- [ ] Verify users
  ```sql
  SELECT rolname, rolcanlogin, rolconnlimit FROM pg_roles WHERE rolname LIKE 'fleet_%';
  ```

- [ ] Test connections (same as staging)

### Azure Key Vault Setup (Production)
- [ ] Create secrets in production Key Vault
  ```bash
  az keyvault secret set --vault-name fleet-secrets-prod --name db-webapp-username --value fleet_webapp_user
  az keyvault secret set --vault-name fleet-secrets-prod --name db-webapp-password --value '<secure-password>'
  az keyvault secret set --vault-name fleet-secrets-prod --name db-readonly-username --value fleet_readonly_user
  az keyvault secret set --vault-name fleet-secrets-prod --name db-readonly-password --value '<secure-password>'
  ```

- [ ] Grant Managed Identity access to Key Vault
  ```bash
  az keyvault set-policy --name fleet-secrets-prod \
    --object-id <managed-identity-object-id> \
    --secret-permissions get list
  ```

### Application Deployment
- [ ] Deploy to production (blue-green or canary)
- [ ] Monitor application startup logs
- [ ] Verify database initialization
- [ ] Check health endpoints
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor database connections

### Post-Deployment Verification
- [ ] All health checks green
- [ ] Database connections healthy
- [ ] Pool statistics normal
- [ ] Query performance normal
- [ ] Error rates normal
- [ ] User traffic flowing normally
- [ ] No customer complaints
- [ ] Monitoring dashboards green

## 📊 Monitoring Setup

### Application Insights
- [ ] Query performance metrics configured
- [ ] Slow query alerts set up (>1s)
- [ ] Connection pool alerts configured
- [ ] Error rate alerts configured
- [ ] Custom dashboard created

### Database Monitoring
- [ ] Azure Database for PostgreSQL monitoring enabled
- [ ] Connection count alerts set (>80% of limit)
- [ ] Query performance insights enabled
- [ ] Long-running query alerts configured
- [ ] Failed login attempt alerts enabled

### Custom Alerts
- [ ] Alert: Connection pool exhaustion (waiting > 5)
- [ ] Alert: Slow queries (>1s)
- [ ] Alert: High error rate (>1% of requests)
- [ ] Alert: Database user permission errors
- [ ] Alert: Connection timeouts

## 🔍 Post-Deployment Monitoring (First 48 Hours)

### Hour 1
- [ ] Check application logs every 5 minutes
- [ ] Monitor database connections
- [ ] Watch for errors
- [ ] Verify query performance
- [ ] Check pool statistics

### Hour 2-4
- [ ] Check logs every 15 minutes
- [ ] Monitor connection pool usage
- [ ] Review slow query log
- [ ] Check error rates
- [ ] Verify no customer issues

### Hour 4-24
- [ ] Check logs every hour
- [ ] Review daily metrics
- [ ] Analyze query patterns
- [ ] Optimize if needed
- [ ] Document any issues

### Day 2-7
- [ ] Daily log review
- [ ] Weekly performance report
- [ ] Identify optimization opportunities
- [ ] Plan for full route migration
- [ ] Update documentation

## 🔄 Rollback Plan

### If Issues Detected

**Immediate Rollback (Application)**
1. Revert application deployment
2. Restart services
3. Verify services healthy
4. Monitor for 30 minutes

**Database Rollback (If Necessary)**
1. Connect to database as admin
2. Run rollback script from migration file
3. Verify users removed
4. Restore admin-only connections
5. Update application environment variables
6. Redeploy previous application version

### Rollback Script
```sql
-- ONLY USE IF ROLLBACK IS NECESSARY
-- Revoke permissions
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM fleet_webapp_user;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM fleet_readonly_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM fleet_readonly_user;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM fleet_readonly_user;

-- Drop roles (CAUTION: Only if no active connections)
DROP ROLE IF EXISTS fleet_webapp_user;
DROP ROLE IF EXISTS fleet_readonly_user;

-- Drop audit table
DROP TABLE IF EXISTS db_user_audit;
```

## 📝 Post-Deployment Tasks

### Documentation
- [ ] Update deployment runbook
- [ ] Document lessons learned
- [ ] Update architecture diagrams
- [ ] Update team wiki
- [ ] Record deployment metrics

### Communication
- [ ] Notify team of successful deployment
- [ ] Update stakeholders
- [ ] Schedule retrospective
- [ ] Share performance metrics
- [ ] Celebrate success! 🎉

### Future Planning
- [ ] Plan route migration schedule
- [ ] Schedule training sessions
- [ ] Plan performance optimization
- [ ] Schedule security audit
- [ ] Plan for scaling improvements

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] All health checks passing for 24+ hours
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Customer support reports no issues
- [ ] Monitoring and alerts working
- [ ] Team trained on new system
- [ ] Documentation updated
- [ ] Rollback plan tested
- [ ] Deployment documented
- [ ] Stakeholders notified

## 📞 Emergency Contacts

- **On-Call Engineer**: [Name, Phone, Slack]
- **Database Admin**: [Name, Phone, Slack]
- **DevOps Lead**: [Name, Phone, Slack]
- **CTO/Technical Lead**: [Name, Phone, Slack]

## 📚 Resources

- Implementation Summary: `/home/user/Fleet/DAL_IMPLEMENTATION_SUMMARY.md`
- Quick Start Guide: `/home/user/Fleet/DAL_QUICK_START.md`
- Full Documentation: `/home/user/Fleet/api/src/services/dal/README.md`
- Migration Script: `/home/user/Fleet/api/db/migrations/031_database_users_and_security.sql`
- Example Routes: `/home/user/Fleet/api/src/routes/*.dal-example.ts`

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Sign-off**: _____________

**Production Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

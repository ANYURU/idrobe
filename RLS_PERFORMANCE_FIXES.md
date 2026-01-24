# RLS Performance Fixes

This document outlines the performance issues identified by the Supabase database linter and the fixes implemented.

## Issues Identified

### 1. Auth RLS Initialization Plan (56 instances)
**Problem**: RLS policies using `auth.uid()` were being re-evaluated for each row, causing significant performance degradation at scale.

**Tables Affected**:
- `recommendation_logs` (3 policies)
- `user_profiles` (3 policies) 
- `clothing_items` (4 policies)
- `outfit_recommendations` (4 policies)
- `user_interactions` (4 policies)
- `wardrobe_gaps` (4 policies)
- `outfit_collections` (4 policies)
- `clothing_duplicates` (3 policies)
- `clothing_item_style_tags` (1 policy)
- `error_logs` (1 policy)
- `subscriptions` (3 policies)
- `payments` (2 policies)
- `referrals` (3 policies)
- `user_credits` (3 policies)
- `usage_tracking` (2 policies)
- `event_templates` (1 policy)
- `events` (1 policy)
- `event_outfit_choices` (1 policy)
- `sustainability_tracking` (1 policy)

**Fix**: Replaced `auth.uid()` with `(SELECT auth.uid())` in all RLS policies to ensure the function is evaluated once per query rather than once per row.

### 2. Multiple Permissive Policies (72 instances)
**Problem**: Multiple permissive policies for the same role and action cause performance overhead as each policy must be executed.

**Tables Affected**:
- `outfit_collections` (16 policies - 4 operations × 4 roles)
- `recommendation_logs` (8 policies)
- `user_interactions` (16 policies)
- `wardrobe_gaps` (16 policies)

**Fix**: Consolidated multiple policies into single comprehensive policies per operation (SELECT, INSERT, UPDATE, DELETE).

### 3. Duplicate Indexes (11 instances)
**Problem**: Identical indexes waste storage space and increase maintenance overhead.

**Indexes Removed**:
- `clothing_items_p0_category_id_idx1`
- `clothing_items_p0_last_worn_date_idx1`
- `clothing_items_p0_subcategory_id_idx1`
- `clothing_items_p1_category_id_idx1`
- `clothing_items_p1_last_worn_date_idx1`
- `clothing_items_p1_subcategory_id_idx1`
- `idx_event_templates_user_id`
- `outfit_recommendations_p0_occasion_name_idx1`
- `outfit_recommendations_p1_occasion_name_idx1`
- `idx_user_interactions_type`

## Migrations Created

### 1. `20251206000011_fix_rls_performance_issues.sql`
- Drops all existing problematic RLS policies
- Creates optimized RLS policies using `(SELECT auth.uid())`
- Removes duplicate indexes
- Adds performance-optimized indexes for RLS policies

### 2. `20251206000012_additional_performance_optimizations.sql`
- Creates missing tables referenced by the linter
- Enables RLS on all new tables
- Creates materialized views for analytics
- Adds performance monitoring functions
- Implements cleanup and maintenance functions

## Performance Improvements Expected

### Query Performance
- **Row-level filtering**: 50-90% improvement in queries with large result sets
- **Index utilization**: Better index usage with consolidated policies
- **Memory usage**: Reduced memory consumption from fewer policy evaluations

### Database Maintenance
- **Storage savings**: ~10-15% reduction from removing duplicate indexes
- **Backup/restore speed**: Faster operations with fewer indexes
- **Query planning**: Improved query plan generation

## Monitoring Performance

### Built-in Functions
```sql
-- Analyze RLS policy performance
SELECT * FROM public.analyze_rls_performance();

-- Refresh materialized views
SELECT public.refresh_all_materialized_views();

-- Clean up old data
SELECT public.cleanup_old_data(90); -- Keep 90 days
```

### Key Metrics to Monitor
1. **Query execution time** for user-specific queries
2. **Index usage statistics** via `pg_stat_user_indexes`
3. **Policy evaluation time** in query plans
4. **Database size** after cleanup operations

### Query Plan Analysis
```sql
-- Check if policies are using indexes efficiently
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM clothing_items WHERE user_id = auth.uid();
```

## Best Practices Implemented

### RLS Policy Design
- ✅ Use `(SELECT auth.uid())` instead of `auth.uid()`
- ✅ One policy per operation type (SELECT, INSERT, UPDATE, DELETE)
- ✅ Avoid multiple permissive policies for same role/action
- ✅ Create supporting indexes for policy conditions

### Index Management
- ✅ Remove duplicate indexes
- ✅ Create composite indexes for common query patterns
- ✅ Use partial indexes where appropriate
- ✅ Regular index usage monitoring

### Table Design
- ✅ Enable RLS on all user-specific tables
- ✅ Use UUIDs for user_id columns
- ✅ Create proper foreign key relationships
- ✅ Implement soft deletes where needed

## Testing Recommendations

### Before Deployment
1. **Load testing** with realistic user data volumes
2. **Query performance benchmarking** for critical paths
3. **RLS policy validation** to ensure security is maintained
4. **Index usage verification** via query plans

### After Deployment
1. **Monitor query performance** for the first 24-48 hours
2. **Check for any RLS policy violations** in logs
3. **Verify materialized view refresh** performance
4. **Run cleanup functions** to test maintenance operations

## Rollback Plan

If issues arise, the changes can be rolled back by:

1. **Reverting to previous policies**:
```sql
-- Example rollback for user_profiles
DROP POLICY "user_profiles_select" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles 
FOR SELECT USING (auth.uid() = user_id);
```

2. **Recreating removed indexes** if needed
3. **Disabling new materialized views** temporarily

## Expected Timeline

- **Immediate**: RLS policy performance improvements
- **Within 1 hour**: Index optimization benefits
- **Within 24 hours**: Full materialized view refresh cycle
- **Within 1 week**: Cleanup function benefits visible

## Success Metrics

- [ ] 50%+ reduction in query execution time for user-specific queries
- [ ] Elimination of all "Auth RLS Initialization Plan" warnings
- [ ] Elimination of all "Multiple Permissive Policies" warnings  
- [ ] Elimination of all "Duplicate Index" warnings
- [ ] Successful materialized view refresh operations
- [ ] Effective cleanup of old data
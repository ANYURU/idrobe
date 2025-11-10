drop function if exists "public"."sync_trends"();

drop materialized view if exists "public"."user_wardrobe_analytics";

create materialized view "public"."user_wardrobe_analytics" as  SELECT u.user_id,
    count(DISTINCT ci.id) AS total_items,
    count(DISTINCT ci.category_id) AS category_diversity,
    avg(ci.sustainability_score) AS avg_sustainability,
    sum(ci.times_worn) AS total_wears,
    max(ci.created_at) AS last_item_added
   FROM (user_profiles u
     LEFT JOIN clothing_items ci ON (((u.user_id = ci.user_id) AND (ci.is_archived = false) AND (ci.deleted_at IS NULL))))
  GROUP BY u.user_id;


CREATE UNIQUE INDEX idx_user_analytics_user_id ON public.user_wardrobe_analytics USING btree (user_id);




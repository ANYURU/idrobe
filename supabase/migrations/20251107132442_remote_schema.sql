create extension if not exists "fuzzystrmatch" with schema "extensions";

create extension if not exists "http" with schema "extensions";


drop policy "Service role can manage trends" on "public"."seasonal_trends";

drop policy "Anyone can view trend keywords" on "public"."trend_keywords";

drop policy "Service role can manage keywords" on "public"."trend_keywords";

drop policy "Service role can manage sync jobs" on "public"."trend_sync_jobs";

revoke delete on table "public"."category_creation_log" from "anon";

revoke insert on table "public"."category_creation_log" from "anon";

revoke references on table "public"."category_creation_log" from "anon";

revoke select on table "public"."category_creation_log" from "anon";

revoke trigger on table "public"."category_creation_log" from "anon";

revoke truncate on table "public"."category_creation_log" from "anon";

revoke update on table "public"."category_creation_log" from "anon";

revoke delete on table "public"."category_creation_log" from "authenticated";

revoke insert on table "public"."category_creation_log" from "authenticated";

revoke references on table "public"."category_creation_log" from "authenticated";

revoke select on table "public"."category_creation_log" from "authenticated";

revoke trigger on table "public"."category_creation_log" from "authenticated";

revoke truncate on table "public"."category_creation_log" from "authenticated";

revoke update on table "public"."category_creation_log" from "authenticated";

revoke delete on table "public"."category_creation_log" from "service_role";

revoke insert on table "public"."category_creation_log" from "service_role";

revoke references on table "public"."category_creation_log" from "service_role";

revoke select on table "public"."category_creation_log" from "service_role";

revoke trigger on table "public"."category_creation_log" from "service_role";

revoke truncate on table "public"."category_creation_log" from "service_role";

revoke update on table "public"."category_creation_log" from "service_role";

revoke delete on table "public"."clothing_categories" from "anon";

revoke insert on table "public"."clothing_categories" from "anon";

revoke references on table "public"."clothing_categories" from "anon";

revoke select on table "public"."clothing_categories" from "anon";

revoke trigger on table "public"."clothing_categories" from "anon";

revoke truncate on table "public"."clothing_categories" from "anon";

revoke update on table "public"."clothing_categories" from "anon";

revoke delete on table "public"."clothing_categories" from "authenticated";

revoke insert on table "public"."clothing_categories" from "authenticated";

revoke references on table "public"."clothing_categories" from "authenticated";

revoke select on table "public"."clothing_categories" from "authenticated";

revoke trigger on table "public"."clothing_categories" from "authenticated";

revoke truncate on table "public"."clothing_categories" from "authenticated";

revoke update on table "public"."clothing_categories" from "authenticated";

revoke delete on table "public"."clothing_categories" from "service_role";

revoke insert on table "public"."clothing_categories" from "service_role";

revoke references on table "public"."clothing_categories" from "service_role";

revoke select on table "public"."clothing_categories" from "service_role";

revoke trigger on table "public"."clothing_categories" from "service_role";

revoke truncate on table "public"."clothing_categories" from "service_role";

revoke update on table "public"."clothing_categories" from "service_role";

revoke delete on table "public"."clothing_duplicates" from "anon";

revoke insert on table "public"."clothing_duplicates" from "anon";

revoke references on table "public"."clothing_duplicates" from "anon";

revoke select on table "public"."clothing_duplicates" from "anon";

revoke trigger on table "public"."clothing_duplicates" from "anon";

revoke truncate on table "public"."clothing_duplicates" from "anon";

revoke update on table "public"."clothing_duplicates" from "anon";

revoke delete on table "public"."clothing_duplicates" from "authenticated";

revoke insert on table "public"."clothing_duplicates" from "authenticated";

revoke references on table "public"."clothing_duplicates" from "authenticated";

revoke select on table "public"."clothing_duplicates" from "authenticated";

revoke trigger on table "public"."clothing_duplicates" from "authenticated";

revoke truncate on table "public"."clothing_duplicates" from "authenticated";

revoke update on table "public"."clothing_duplicates" from "authenticated";

revoke delete on table "public"."clothing_duplicates" from "service_role";

revoke insert on table "public"."clothing_duplicates" from "service_role";

revoke references on table "public"."clothing_duplicates" from "service_role";

revoke select on table "public"."clothing_duplicates" from "service_role";

revoke trigger on table "public"."clothing_duplicates" from "service_role";

revoke truncate on table "public"."clothing_duplicates" from "service_role";

revoke update on table "public"."clothing_duplicates" from "service_role";

revoke delete on table "public"."clothing_item_style_tags" from "anon";

revoke insert on table "public"."clothing_item_style_tags" from "anon";

revoke references on table "public"."clothing_item_style_tags" from "anon";

revoke select on table "public"."clothing_item_style_tags" from "anon";

revoke trigger on table "public"."clothing_item_style_tags" from "anon";

revoke truncate on table "public"."clothing_item_style_tags" from "anon";

revoke update on table "public"."clothing_item_style_tags" from "anon";

revoke delete on table "public"."clothing_item_style_tags" from "authenticated";

revoke insert on table "public"."clothing_item_style_tags" from "authenticated";

revoke references on table "public"."clothing_item_style_tags" from "authenticated";

revoke select on table "public"."clothing_item_style_tags" from "authenticated";

revoke trigger on table "public"."clothing_item_style_tags" from "authenticated";

revoke truncate on table "public"."clothing_item_style_tags" from "authenticated";

revoke update on table "public"."clothing_item_style_tags" from "authenticated";

revoke delete on table "public"."clothing_item_style_tags" from "service_role";

revoke insert on table "public"."clothing_item_style_tags" from "service_role";

revoke references on table "public"."clothing_item_style_tags" from "service_role";

revoke select on table "public"."clothing_item_style_tags" from "service_role";

revoke trigger on table "public"."clothing_item_style_tags" from "service_role";

revoke truncate on table "public"."clothing_item_style_tags" from "service_role";

revoke update on table "public"."clothing_item_style_tags" from "service_role";

revoke delete on table "public"."clothing_items" from "anon";

revoke insert on table "public"."clothing_items" from "anon";

revoke references on table "public"."clothing_items" from "anon";

revoke select on table "public"."clothing_items" from "anon";

revoke trigger on table "public"."clothing_items" from "anon";

revoke truncate on table "public"."clothing_items" from "anon";

revoke update on table "public"."clothing_items" from "anon";

revoke delete on table "public"."clothing_items" from "authenticated";

revoke insert on table "public"."clothing_items" from "authenticated";

revoke references on table "public"."clothing_items" from "authenticated";

revoke select on table "public"."clothing_items" from "authenticated";

revoke trigger on table "public"."clothing_items" from "authenticated";

revoke truncate on table "public"."clothing_items" from "authenticated";

revoke update on table "public"."clothing_items" from "authenticated";

revoke delete on table "public"."clothing_items" from "service_role";

revoke insert on table "public"."clothing_items" from "service_role";

revoke references on table "public"."clothing_items" from "service_role";

revoke select on table "public"."clothing_items" from "service_role";

revoke trigger on table "public"."clothing_items" from "service_role";

revoke truncate on table "public"."clothing_items" from "service_role";

revoke update on table "public"."clothing_items" from "service_role";

revoke delete on table "public"."clothing_items_p0" from "anon";

revoke insert on table "public"."clothing_items_p0" from "anon";

revoke references on table "public"."clothing_items_p0" from "anon";

revoke select on table "public"."clothing_items_p0" from "anon";

revoke trigger on table "public"."clothing_items_p0" from "anon";

revoke truncate on table "public"."clothing_items_p0" from "anon";

revoke update on table "public"."clothing_items_p0" from "anon";

revoke delete on table "public"."clothing_items_p0" from "authenticated";

revoke insert on table "public"."clothing_items_p0" from "authenticated";

revoke references on table "public"."clothing_items_p0" from "authenticated";

revoke select on table "public"."clothing_items_p0" from "authenticated";

revoke trigger on table "public"."clothing_items_p0" from "authenticated";

revoke truncate on table "public"."clothing_items_p0" from "authenticated";

revoke update on table "public"."clothing_items_p0" from "authenticated";

revoke delete on table "public"."clothing_items_p0" from "service_role";

revoke insert on table "public"."clothing_items_p0" from "service_role";

revoke references on table "public"."clothing_items_p0" from "service_role";

revoke select on table "public"."clothing_items_p0" from "service_role";

revoke trigger on table "public"."clothing_items_p0" from "service_role";

revoke truncate on table "public"."clothing_items_p0" from "service_role";

revoke update on table "public"."clothing_items_p0" from "service_role";

revoke delete on table "public"."clothing_items_p1" from "anon";

revoke insert on table "public"."clothing_items_p1" from "anon";

revoke references on table "public"."clothing_items_p1" from "anon";

revoke select on table "public"."clothing_items_p1" from "anon";

revoke trigger on table "public"."clothing_items_p1" from "anon";

revoke truncate on table "public"."clothing_items_p1" from "anon";

revoke update on table "public"."clothing_items_p1" from "anon";

revoke delete on table "public"."clothing_items_p1" from "authenticated";

revoke insert on table "public"."clothing_items_p1" from "authenticated";

revoke references on table "public"."clothing_items_p1" from "authenticated";

revoke select on table "public"."clothing_items_p1" from "authenticated";

revoke trigger on table "public"."clothing_items_p1" from "authenticated";

revoke truncate on table "public"."clothing_items_p1" from "authenticated";

revoke update on table "public"."clothing_items_p1" from "authenticated";

revoke delete on table "public"."clothing_items_p1" from "service_role";

revoke insert on table "public"."clothing_items_p1" from "service_role";

revoke references on table "public"."clothing_items_p1" from "service_role";

revoke select on table "public"."clothing_items_p1" from "service_role";

revoke trigger on table "public"."clothing_items_p1" from "service_role";

revoke truncate on table "public"."clothing_items_p1" from "service_role";

revoke update on table "public"."clothing_items_p1" from "service_role";

revoke delete on table "public"."clothing_subcategories" from "anon";

revoke insert on table "public"."clothing_subcategories" from "anon";

revoke references on table "public"."clothing_subcategories" from "anon";

revoke select on table "public"."clothing_subcategories" from "anon";

revoke trigger on table "public"."clothing_subcategories" from "anon";

revoke truncate on table "public"."clothing_subcategories" from "anon";

revoke update on table "public"."clothing_subcategories" from "anon";

revoke delete on table "public"."clothing_subcategories" from "authenticated";

revoke insert on table "public"."clothing_subcategories" from "authenticated";

revoke references on table "public"."clothing_subcategories" from "authenticated";

revoke select on table "public"."clothing_subcategories" from "authenticated";

revoke trigger on table "public"."clothing_subcategories" from "authenticated";

revoke truncate on table "public"."clothing_subcategories" from "authenticated";

revoke update on table "public"."clothing_subcategories" from "authenticated";

revoke delete on table "public"."clothing_subcategories" from "service_role";

revoke insert on table "public"."clothing_subcategories" from "service_role";

revoke references on table "public"."clothing_subcategories" from "service_role";

revoke select on table "public"."clothing_subcategories" from "service_role";

revoke trigger on table "public"."clothing_subcategories" from "service_role";

revoke truncate on table "public"."clothing_subcategories" from "service_role";

revoke update on table "public"."clothing_subcategories" from "service_role";

revoke delete on table "public"."discount_codes" from "anon";

revoke insert on table "public"."discount_codes" from "anon";

revoke references on table "public"."discount_codes" from "anon";

revoke select on table "public"."discount_codes" from "anon";

revoke trigger on table "public"."discount_codes" from "anon";

revoke truncate on table "public"."discount_codes" from "anon";

revoke update on table "public"."discount_codes" from "anon";

revoke delete on table "public"."discount_codes" from "authenticated";

revoke insert on table "public"."discount_codes" from "authenticated";

revoke references on table "public"."discount_codes" from "authenticated";

revoke select on table "public"."discount_codes" from "authenticated";

revoke trigger on table "public"."discount_codes" from "authenticated";

revoke truncate on table "public"."discount_codes" from "authenticated";

revoke update on table "public"."discount_codes" from "authenticated";

revoke delete on table "public"."discount_codes" from "service_role";

revoke insert on table "public"."discount_codes" from "service_role";

revoke references on table "public"."discount_codes" from "service_role";

revoke select on table "public"."discount_codes" from "service_role";

revoke trigger on table "public"."discount_codes" from "service_role";

revoke truncate on table "public"."discount_codes" from "service_role";

revoke update on table "public"."discount_codes" from "service_role";

revoke delete on table "public"."error_logs" from "anon";

revoke insert on table "public"."error_logs" from "anon";

revoke references on table "public"."error_logs" from "anon";

revoke select on table "public"."error_logs" from "anon";

revoke trigger on table "public"."error_logs" from "anon";

revoke truncate on table "public"."error_logs" from "anon";

revoke update on table "public"."error_logs" from "anon";

revoke delete on table "public"."error_logs" from "authenticated";

revoke insert on table "public"."error_logs" from "authenticated";

revoke references on table "public"."error_logs" from "authenticated";

revoke select on table "public"."error_logs" from "authenticated";

revoke trigger on table "public"."error_logs" from "authenticated";

revoke truncate on table "public"."error_logs" from "authenticated";

revoke update on table "public"."error_logs" from "authenticated";

revoke delete on table "public"."error_logs" from "service_role";

revoke insert on table "public"."error_logs" from "service_role";

revoke references on table "public"."error_logs" from "service_role";

revoke select on table "public"."error_logs" from "service_role";

revoke trigger on table "public"."error_logs" from "service_role";

revoke truncate on table "public"."error_logs" from "service_role";

revoke update on table "public"."error_logs" from "service_role";

revoke delete on table "public"."event_outfit_choices" from "anon";

revoke insert on table "public"."event_outfit_choices" from "anon";

revoke references on table "public"."event_outfit_choices" from "anon";

revoke select on table "public"."event_outfit_choices" from "anon";

revoke trigger on table "public"."event_outfit_choices" from "anon";

revoke truncate on table "public"."event_outfit_choices" from "anon";

revoke update on table "public"."event_outfit_choices" from "anon";

revoke delete on table "public"."event_outfit_choices" from "authenticated";

revoke insert on table "public"."event_outfit_choices" from "authenticated";

revoke references on table "public"."event_outfit_choices" from "authenticated";

revoke select on table "public"."event_outfit_choices" from "authenticated";

revoke trigger on table "public"."event_outfit_choices" from "authenticated";

revoke truncate on table "public"."event_outfit_choices" from "authenticated";

revoke update on table "public"."event_outfit_choices" from "authenticated";

revoke delete on table "public"."event_outfit_choices" from "service_role";

revoke insert on table "public"."event_outfit_choices" from "service_role";

revoke references on table "public"."event_outfit_choices" from "service_role";

revoke select on table "public"."event_outfit_choices" from "service_role";

revoke trigger on table "public"."event_outfit_choices" from "service_role";

revoke truncate on table "public"."event_outfit_choices" from "service_role";

revoke update on table "public"."event_outfit_choices" from "service_role";

revoke delete on table "public"."event_templates" from "anon";

revoke insert on table "public"."event_templates" from "anon";

revoke references on table "public"."event_templates" from "anon";

revoke select on table "public"."event_templates" from "anon";

revoke trigger on table "public"."event_templates" from "anon";

revoke truncate on table "public"."event_templates" from "anon";

revoke update on table "public"."event_templates" from "anon";

revoke delete on table "public"."event_templates" from "authenticated";

revoke insert on table "public"."event_templates" from "authenticated";

revoke references on table "public"."event_templates" from "authenticated";

revoke select on table "public"."event_templates" from "authenticated";

revoke trigger on table "public"."event_templates" from "authenticated";

revoke truncate on table "public"."event_templates" from "authenticated";

revoke update on table "public"."event_templates" from "authenticated";

revoke delete on table "public"."event_templates" from "service_role";

revoke insert on table "public"."event_templates" from "service_role";

revoke references on table "public"."event_templates" from "service_role";

revoke select on table "public"."event_templates" from "service_role";

revoke trigger on table "public"."event_templates" from "service_role";

revoke truncate on table "public"."event_templates" from "service_role";

revoke update on table "public"."event_templates" from "service_role";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke select on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke delete on table "public"."events" from "authenticated";

revoke insert on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "authenticated";

revoke select on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke update on table "public"."events" from "authenticated";

revoke delete on table "public"."events" from "service_role";

revoke insert on table "public"."events" from "service_role";

revoke references on table "public"."events" from "service_role";

revoke select on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke update on table "public"."events" from "service_role";

revoke delete on table "public"."exchange_rates" from "anon";

revoke insert on table "public"."exchange_rates" from "anon";

revoke references on table "public"."exchange_rates" from "anon";

revoke select on table "public"."exchange_rates" from "anon";

revoke trigger on table "public"."exchange_rates" from "anon";

revoke truncate on table "public"."exchange_rates" from "anon";

revoke update on table "public"."exchange_rates" from "anon";

revoke delete on table "public"."exchange_rates" from "authenticated";

revoke insert on table "public"."exchange_rates" from "authenticated";

revoke references on table "public"."exchange_rates" from "authenticated";

revoke select on table "public"."exchange_rates" from "authenticated";

revoke trigger on table "public"."exchange_rates" from "authenticated";

revoke truncate on table "public"."exchange_rates" from "authenticated";

revoke update on table "public"."exchange_rates" from "authenticated";

revoke delete on table "public"."exchange_rates" from "service_role";

revoke insert on table "public"."exchange_rates" from "service_role";

revoke references on table "public"."exchange_rates" from "service_role";

revoke select on table "public"."exchange_rates" from "service_role";

revoke trigger on table "public"."exchange_rates" from "service_role";

revoke truncate on table "public"."exchange_rates" from "service_role";

revoke update on table "public"."exchange_rates" from "service_role";

revoke delete on table "public"."fit_preferences" from "anon";

revoke insert on table "public"."fit_preferences" from "anon";

revoke references on table "public"."fit_preferences" from "anon";

revoke select on table "public"."fit_preferences" from "anon";

revoke trigger on table "public"."fit_preferences" from "anon";

revoke truncate on table "public"."fit_preferences" from "anon";

revoke update on table "public"."fit_preferences" from "anon";

revoke delete on table "public"."fit_preferences" from "authenticated";

revoke insert on table "public"."fit_preferences" from "authenticated";

revoke references on table "public"."fit_preferences" from "authenticated";

revoke select on table "public"."fit_preferences" from "authenticated";

revoke trigger on table "public"."fit_preferences" from "authenticated";

revoke truncate on table "public"."fit_preferences" from "authenticated";

revoke update on table "public"."fit_preferences" from "authenticated";

revoke delete on table "public"."fit_preferences" from "service_role";

revoke insert on table "public"."fit_preferences" from "service_role";

revoke references on table "public"."fit_preferences" from "service_role";

revoke select on table "public"."fit_preferences" from "service_role";

revoke trigger on table "public"."fit_preferences" from "service_role";

revoke truncate on table "public"."fit_preferences" from "service_role";

revoke update on table "public"."fit_preferences" from "service_role";

revoke delete on table "public"."outfit_collections" from "anon";

revoke insert on table "public"."outfit_collections" from "anon";

revoke references on table "public"."outfit_collections" from "anon";

revoke select on table "public"."outfit_collections" from "anon";

revoke trigger on table "public"."outfit_collections" from "anon";

revoke truncate on table "public"."outfit_collections" from "anon";

revoke update on table "public"."outfit_collections" from "anon";

revoke delete on table "public"."outfit_collections" from "authenticated";

revoke insert on table "public"."outfit_collections" from "authenticated";

revoke references on table "public"."outfit_collections" from "authenticated";

revoke select on table "public"."outfit_collections" from "authenticated";

revoke trigger on table "public"."outfit_collections" from "authenticated";

revoke truncate on table "public"."outfit_collections" from "authenticated";

revoke update on table "public"."outfit_collections" from "authenticated";

revoke delete on table "public"."outfit_collections" from "service_role";

revoke insert on table "public"."outfit_collections" from "service_role";

revoke references on table "public"."outfit_collections" from "service_role";

revoke select on table "public"."outfit_collections" from "service_role";

revoke trigger on table "public"."outfit_collections" from "service_role";

revoke truncate on table "public"."outfit_collections" from "service_role";

revoke update on table "public"."outfit_collections" from "service_role";

revoke delete on table "public"."outfit_recommendations" from "anon";

revoke insert on table "public"."outfit_recommendations" from "anon";

revoke references on table "public"."outfit_recommendations" from "anon";

revoke select on table "public"."outfit_recommendations" from "anon";

revoke trigger on table "public"."outfit_recommendations" from "anon";

revoke truncate on table "public"."outfit_recommendations" from "anon";

revoke update on table "public"."outfit_recommendations" from "anon";

revoke delete on table "public"."outfit_recommendations" from "authenticated";

revoke insert on table "public"."outfit_recommendations" from "authenticated";

revoke references on table "public"."outfit_recommendations" from "authenticated";

revoke select on table "public"."outfit_recommendations" from "authenticated";

revoke trigger on table "public"."outfit_recommendations" from "authenticated";

revoke truncate on table "public"."outfit_recommendations" from "authenticated";

revoke update on table "public"."outfit_recommendations" from "authenticated";

revoke delete on table "public"."outfit_recommendations" from "service_role";

revoke insert on table "public"."outfit_recommendations" from "service_role";

revoke references on table "public"."outfit_recommendations" from "service_role";

revoke select on table "public"."outfit_recommendations" from "service_role";

revoke trigger on table "public"."outfit_recommendations" from "service_role";

revoke truncate on table "public"."outfit_recommendations" from "service_role";

revoke update on table "public"."outfit_recommendations" from "service_role";

revoke delete on table "public"."outfit_recommendations_p0" from "anon";

revoke insert on table "public"."outfit_recommendations_p0" from "anon";

revoke references on table "public"."outfit_recommendations_p0" from "anon";

revoke select on table "public"."outfit_recommendations_p0" from "anon";

revoke trigger on table "public"."outfit_recommendations_p0" from "anon";

revoke truncate on table "public"."outfit_recommendations_p0" from "anon";

revoke update on table "public"."outfit_recommendations_p0" from "anon";

revoke delete on table "public"."outfit_recommendations_p0" from "authenticated";

revoke insert on table "public"."outfit_recommendations_p0" from "authenticated";

revoke references on table "public"."outfit_recommendations_p0" from "authenticated";

revoke select on table "public"."outfit_recommendations_p0" from "authenticated";

revoke trigger on table "public"."outfit_recommendations_p0" from "authenticated";

revoke truncate on table "public"."outfit_recommendations_p0" from "authenticated";

revoke update on table "public"."outfit_recommendations_p0" from "authenticated";

revoke delete on table "public"."outfit_recommendations_p0" from "service_role";

revoke insert on table "public"."outfit_recommendations_p0" from "service_role";

revoke references on table "public"."outfit_recommendations_p0" from "service_role";

revoke select on table "public"."outfit_recommendations_p0" from "service_role";

revoke trigger on table "public"."outfit_recommendations_p0" from "service_role";

revoke truncate on table "public"."outfit_recommendations_p0" from "service_role";

revoke update on table "public"."outfit_recommendations_p0" from "service_role";

revoke delete on table "public"."outfit_recommendations_p1" from "anon";

revoke insert on table "public"."outfit_recommendations_p1" from "anon";

revoke references on table "public"."outfit_recommendations_p1" from "anon";

revoke select on table "public"."outfit_recommendations_p1" from "anon";

revoke trigger on table "public"."outfit_recommendations_p1" from "anon";

revoke truncate on table "public"."outfit_recommendations_p1" from "anon";

revoke update on table "public"."outfit_recommendations_p1" from "anon";

revoke delete on table "public"."outfit_recommendations_p1" from "authenticated";

revoke insert on table "public"."outfit_recommendations_p1" from "authenticated";

revoke references on table "public"."outfit_recommendations_p1" from "authenticated";

revoke select on table "public"."outfit_recommendations_p1" from "authenticated";

revoke trigger on table "public"."outfit_recommendations_p1" from "authenticated";

revoke truncate on table "public"."outfit_recommendations_p1" from "authenticated";

revoke update on table "public"."outfit_recommendations_p1" from "authenticated";

revoke delete on table "public"."outfit_recommendations_p1" from "service_role";

revoke insert on table "public"."outfit_recommendations_p1" from "service_role";

revoke references on table "public"."outfit_recommendations_p1" from "service_role";

revoke select on table "public"."outfit_recommendations_p1" from "service_role";

revoke trigger on table "public"."outfit_recommendations_p1" from "service_role";

revoke truncate on table "public"."outfit_recommendations_p1" from "service_role";

revoke update on table "public"."outfit_recommendations_p1" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."plan_limits" from "anon";

revoke insert on table "public"."plan_limits" from "anon";

revoke references on table "public"."plan_limits" from "anon";

revoke select on table "public"."plan_limits" from "anon";

revoke trigger on table "public"."plan_limits" from "anon";

revoke truncate on table "public"."plan_limits" from "anon";

revoke update on table "public"."plan_limits" from "anon";

revoke delete on table "public"."plan_limits" from "authenticated";

revoke insert on table "public"."plan_limits" from "authenticated";

revoke references on table "public"."plan_limits" from "authenticated";

revoke select on table "public"."plan_limits" from "authenticated";

revoke trigger on table "public"."plan_limits" from "authenticated";

revoke truncate on table "public"."plan_limits" from "authenticated";

revoke update on table "public"."plan_limits" from "authenticated";

revoke delete on table "public"."plan_limits" from "service_role";

revoke insert on table "public"."plan_limits" from "service_role";

revoke references on table "public"."plan_limits" from "service_role";

revoke select on table "public"."plan_limits" from "service_role";

revoke trigger on table "public"."plan_limits" from "service_role";

revoke truncate on table "public"."plan_limits" from "service_role";

revoke update on table "public"."plan_limits" from "service_role";

revoke delete on table "public"."recommendation_logs" from "anon";

revoke insert on table "public"."recommendation_logs" from "anon";

revoke references on table "public"."recommendation_logs" from "anon";

revoke select on table "public"."recommendation_logs" from "anon";

revoke trigger on table "public"."recommendation_logs" from "anon";

revoke truncate on table "public"."recommendation_logs" from "anon";

revoke update on table "public"."recommendation_logs" from "anon";

revoke delete on table "public"."recommendation_logs" from "authenticated";

revoke insert on table "public"."recommendation_logs" from "authenticated";

revoke references on table "public"."recommendation_logs" from "authenticated";

revoke select on table "public"."recommendation_logs" from "authenticated";

revoke trigger on table "public"."recommendation_logs" from "authenticated";

revoke truncate on table "public"."recommendation_logs" from "authenticated";

revoke update on table "public"."recommendation_logs" from "authenticated";

revoke delete on table "public"."recommendation_logs" from "service_role";

revoke insert on table "public"."recommendation_logs" from "service_role";

revoke references on table "public"."recommendation_logs" from "service_role";

revoke select on table "public"."recommendation_logs" from "service_role";

revoke trigger on table "public"."recommendation_logs" from "service_role";

revoke truncate on table "public"."recommendation_logs" from "service_role";

revoke update on table "public"."recommendation_logs" from "service_role";

revoke delete on table "public"."referrals" from "anon";

revoke insert on table "public"."referrals" from "anon";

revoke references on table "public"."referrals" from "anon";

revoke select on table "public"."referrals" from "anon";

revoke trigger on table "public"."referrals" from "anon";

revoke truncate on table "public"."referrals" from "anon";

revoke update on table "public"."referrals" from "anon";

revoke delete on table "public"."referrals" from "authenticated";

revoke insert on table "public"."referrals" from "authenticated";

revoke references on table "public"."referrals" from "authenticated";

revoke select on table "public"."referrals" from "authenticated";

revoke trigger on table "public"."referrals" from "authenticated";

revoke truncate on table "public"."referrals" from "authenticated";

revoke update on table "public"."referrals" from "authenticated";

revoke delete on table "public"."referrals" from "service_role";

revoke insert on table "public"."referrals" from "service_role";

revoke references on table "public"."referrals" from "service_role";

revoke select on table "public"."referrals" from "service_role";

revoke trigger on table "public"."referrals" from "service_role";

revoke truncate on table "public"."referrals" from "service_role";

revoke update on table "public"."referrals" from "service_role";

revoke delete on table "public"."seasonal_trend_categories" from "anon";

revoke insert on table "public"."seasonal_trend_categories" from "anon";

revoke references on table "public"."seasonal_trend_categories" from "anon";

revoke select on table "public"."seasonal_trend_categories" from "anon";

revoke trigger on table "public"."seasonal_trend_categories" from "anon";

revoke truncate on table "public"."seasonal_trend_categories" from "anon";

revoke update on table "public"."seasonal_trend_categories" from "anon";

revoke delete on table "public"."seasonal_trend_categories" from "authenticated";

revoke insert on table "public"."seasonal_trend_categories" from "authenticated";

revoke references on table "public"."seasonal_trend_categories" from "authenticated";

revoke select on table "public"."seasonal_trend_categories" from "authenticated";

revoke trigger on table "public"."seasonal_trend_categories" from "authenticated";

revoke truncate on table "public"."seasonal_trend_categories" from "authenticated";

revoke update on table "public"."seasonal_trend_categories" from "authenticated";

revoke delete on table "public"."seasonal_trend_categories" from "service_role";

revoke insert on table "public"."seasonal_trend_categories" from "service_role";

revoke references on table "public"."seasonal_trend_categories" from "service_role";

revoke select on table "public"."seasonal_trend_categories" from "service_role";

revoke trigger on table "public"."seasonal_trend_categories" from "service_role";

revoke truncate on table "public"."seasonal_trend_categories" from "service_role";

revoke update on table "public"."seasonal_trend_categories" from "service_role";

revoke delete on table "public"."seasonal_trends" from "anon";

revoke insert on table "public"."seasonal_trends" from "anon";

revoke references on table "public"."seasonal_trends" from "anon";

revoke select on table "public"."seasonal_trends" from "anon";

revoke trigger on table "public"."seasonal_trends" from "anon";

revoke truncate on table "public"."seasonal_trends" from "anon";

revoke update on table "public"."seasonal_trends" from "anon";

revoke delete on table "public"."seasonal_trends" from "authenticated";

revoke insert on table "public"."seasonal_trends" from "authenticated";

revoke references on table "public"."seasonal_trends" from "authenticated";

revoke select on table "public"."seasonal_trends" from "authenticated";

revoke trigger on table "public"."seasonal_trends" from "authenticated";

revoke truncate on table "public"."seasonal_trends" from "authenticated";

revoke update on table "public"."seasonal_trends" from "authenticated";

revoke delete on table "public"."seasonal_trends" from "service_role";

revoke insert on table "public"."seasonal_trends" from "service_role";

revoke references on table "public"."seasonal_trends" from "service_role";

revoke select on table "public"."seasonal_trends" from "service_role";

revoke trigger on table "public"."seasonal_trends" from "service_role";

revoke truncate on table "public"."seasonal_trends" from "service_role";

revoke update on table "public"."seasonal_trends" from "service_role";

revoke delete on table "public"."seasons" from "anon";

revoke insert on table "public"."seasons" from "anon";

revoke references on table "public"."seasons" from "anon";

revoke select on table "public"."seasons" from "anon";

revoke trigger on table "public"."seasons" from "anon";

revoke truncate on table "public"."seasons" from "anon";

revoke update on table "public"."seasons" from "anon";

revoke delete on table "public"."seasons" from "authenticated";

revoke insert on table "public"."seasons" from "authenticated";

revoke references on table "public"."seasons" from "authenticated";

revoke select on table "public"."seasons" from "authenticated";

revoke trigger on table "public"."seasons" from "authenticated";

revoke truncate on table "public"."seasons" from "authenticated";

revoke update on table "public"."seasons" from "authenticated";

revoke delete on table "public"."seasons" from "service_role";

revoke insert on table "public"."seasons" from "service_role";

revoke references on table "public"."seasons" from "service_role";

revoke select on table "public"."seasons" from "service_role";

revoke trigger on table "public"."seasons" from "service_role";

revoke truncate on table "public"."seasons" from "service_role";

revoke update on table "public"."seasons" from "service_role";

revoke delete on table "public"."style_tags" from "anon";

revoke insert on table "public"."style_tags" from "anon";

revoke references on table "public"."style_tags" from "anon";

revoke select on table "public"."style_tags" from "anon";

revoke trigger on table "public"."style_tags" from "anon";

revoke truncate on table "public"."style_tags" from "anon";

revoke update on table "public"."style_tags" from "anon";

revoke delete on table "public"."style_tags" from "authenticated";

revoke insert on table "public"."style_tags" from "authenticated";

revoke references on table "public"."style_tags" from "authenticated";

revoke select on table "public"."style_tags" from "authenticated";

revoke trigger on table "public"."style_tags" from "authenticated";

revoke truncate on table "public"."style_tags" from "authenticated";

revoke update on table "public"."style_tags" from "authenticated";

revoke delete on table "public"."style_tags" from "service_role";

revoke insert on table "public"."style_tags" from "service_role";

revoke references on table "public"."style_tags" from "service_role";

revoke select on table "public"."style_tags" from "service_role";

revoke trigger on table "public"."style_tags" from "service_role";

revoke truncate on table "public"."style_tags" from "service_role";

revoke update on table "public"."style_tags" from "service_role";

revoke delete on table "public"."subscription_plans" from "anon";

revoke insert on table "public"."subscription_plans" from "anon";

revoke references on table "public"."subscription_plans" from "anon";

revoke select on table "public"."subscription_plans" from "anon";

revoke trigger on table "public"."subscription_plans" from "anon";

revoke truncate on table "public"."subscription_plans" from "anon";

revoke update on table "public"."subscription_plans" from "anon";

revoke delete on table "public"."subscription_plans" from "authenticated";

revoke insert on table "public"."subscription_plans" from "authenticated";

revoke references on table "public"."subscription_plans" from "authenticated";

revoke select on table "public"."subscription_plans" from "authenticated";

revoke trigger on table "public"."subscription_plans" from "authenticated";

revoke truncate on table "public"."subscription_plans" from "authenticated";

revoke update on table "public"."subscription_plans" from "authenticated";

revoke delete on table "public"."subscription_plans" from "service_role";

revoke insert on table "public"."subscription_plans" from "service_role";

revoke references on table "public"."subscription_plans" from "service_role";

revoke select on table "public"."subscription_plans" from "service_role";

revoke trigger on table "public"."subscription_plans" from "service_role";

revoke truncate on table "public"."subscription_plans" from "service_role";

revoke update on table "public"."subscription_plans" from "service_role";

revoke delete on table "public"."subscriptions" from "anon";

revoke insert on table "public"."subscriptions" from "anon";

revoke references on table "public"."subscriptions" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke trigger on table "public"."subscriptions" from "anon";

revoke truncate on table "public"."subscriptions" from "anon";

revoke update on table "public"."subscriptions" from "anon";

revoke delete on table "public"."subscriptions" from "authenticated";

revoke insert on table "public"."subscriptions" from "authenticated";

revoke references on table "public"."subscriptions" from "authenticated";

revoke select on table "public"."subscriptions" from "authenticated";

revoke trigger on table "public"."subscriptions" from "authenticated";

revoke truncate on table "public"."subscriptions" from "authenticated";

revoke update on table "public"."subscriptions" from "authenticated";

revoke delete on table "public"."subscriptions" from "service_role";

revoke insert on table "public"."subscriptions" from "service_role";

revoke references on table "public"."subscriptions" from "service_role";

revoke select on table "public"."subscriptions" from "service_role";

revoke trigger on table "public"."subscriptions" from "service_role";

revoke truncate on table "public"."subscriptions" from "service_role";

revoke update on table "public"."subscriptions" from "service_role";

revoke delete on table "public"."supported_currencies" from "anon";

revoke insert on table "public"."supported_currencies" from "anon";

revoke references on table "public"."supported_currencies" from "anon";

revoke select on table "public"."supported_currencies" from "anon";

revoke trigger on table "public"."supported_currencies" from "anon";

revoke truncate on table "public"."supported_currencies" from "anon";

revoke update on table "public"."supported_currencies" from "anon";

revoke delete on table "public"."supported_currencies" from "authenticated";

revoke insert on table "public"."supported_currencies" from "authenticated";

revoke references on table "public"."supported_currencies" from "authenticated";

revoke select on table "public"."supported_currencies" from "authenticated";

revoke trigger on table "public"."supported_currencies" from "authenticated";

revoke truncate on table "public"."supported_currencies" from "authenticated";

revoke update on table "public"."supported_currencies" from "authenticated";

revoke delete on table "public"."supported_currencies" from "service_role";

revoke insert on table "public"."supported_currencies" from "service_role";

revoke references on table "public"."supported_currencies" from "service_role";

revoke select on table "public"."supported_currencies" from "service_role";

revoke trigger on table "public"."supported_currencies" from "service_role";

revoke truncate on table "public"."supported_currencies" from "service_role";

revoke update on table "public"."supported_currencies" from "service_role";

revoke delete on table "public"."sustainability_tracking" from "anon";

revoke insert on table "public"."sustainability_tracking" from "anon";

revoke references on table "public"."sustainability_tracking" from "anon";

revoke select on table "public"."sustainability_tracking" from "anon";

revoke trigger on table "public"."sustainability_tracking" from "anon";

revoke truncate on table "public"."sustainability_tracking" from "anon";

revoke update on table "public"."sustainability_tracking" from "anon";

revoke delete on table "public"."sustainability_tracking" from "authenticated";

revoke insert on table "public"."sustainability_tracking" from "authenticated";

revoke references on table "public"."sustainability_tracking" from "authenticated";

revoke select on table "public"."sustainability_tracking" from "authenticated";

revoke trigger on table "public"."sustainability_tracking" from "authenticated";

revoke truncate on table "public"."sustainability_tracking" from "authenticated";

revoke update on table "public"."sustainability_tracking" from "authenticated";

revoke delete on table "public"."sustainability_tracking" from "service_role";

revoke insert on table "public"."sustainability_tracking" from "service_role";

revoke references on table "public"."sustainability_tracking" from "service_role";

revoke select on table "public"."sustainability_tracking" from "service_role";

revoke trigger on table "public"."sustainability_tracking" from "service_role";

revoke truncate on table "public"."sustainability_tracking" from "service_role";

revoke update on table "public"."sustainability_tracking" from "service_role";

revoke delete on table "public"."trend_keywords" from "anon";

revoke insert on table "public"."trend_keywords" from "anon";

revoke references on table "public"."trend_keywords" from "anon";

revoke select on table "public"."trend_keywords" from "anon";

revoke trigger on table "public"."trend_keywords" from "anon";

revoke truncate on table "public"."trend_keywords" from "anon";

revoke update on table "public"."trend_keywords" from "anon";

revoke delete on table "public"."trend_keywords" from "authenticated";

revoke insert on table "public"."trend_keywords" from "authenticated";

revoke references on table "public"."trend_keywords" from "authenticated";

revoke select on table "public"."trend_keywords" from "authenticated";

revoke trigger on table "public"."trend_keywords" from "authenticated";

revoke truncate on table "public"."trend_keywords" from "authenticated";

revoke update on table "public"."trend_keywords" from "authenticated";

revoke delete on table "public"."trend_keywords" from "service_role";

revoke insert on table "public"."trend_keywords" from "service_role";

revoke references on table "public"."trend_keywords" from "service_role";

revoke select on table "public"."trend_keywords" from "service_role";

revoke trigger on table "public"."trend_keywords" from "service_role";

revoke truncate on table "public"."trend_keywords" from "service_role";

revoke update on table "public"."trend_keywords" from "service_role";

revoke delete on table "public"."trend_sync_jobs" from "anon";

revoke insert on table "public"."trend_sync_jobs" from "anon";

revoke references on table "public"."trend_sync_jobs" from "anon";

revoke select on table "public"."trend_sync_jobs" from "anon";

revoke trigger on table "public"."trend_sync_jobs" from "anon";

revoke truncate on table "public"."trend_sync_jobs" from "anon";

revoke update on table "public"."trend_sync_jobs" from "anon";

revoke delete on table "public"."trend_sync_jobs" from "authenticated";

revoke insert on table "public"."trend_sync_jobs" from "authenticated";

revoke references on table "public"."trend_sync_jobs" from "authenticated";

revoke select on table "public"."trend_sync_jobs" from "authenticated";

revoke trigger on table "public"."trend_sync_jobs" from "authenticated";

revoke truncate on table "public"."trend_sync_jobs" from "authenticated";

revoke update on table "public"."trend_sync_jobs" from "authenticated";

revoke delete on table "public"."trend_sync_jobs" from "service_role";

revoke insert on table "public"."trend_sync_jobs" from "service_role";

revoke references on table "public"."trend_sync_jobs" from "service_role";

revoke select on table "public"."trend_sync_jobs" from "service_role";

revoke trigger on table "public"."trend_sync_jobs" from "service_role";

revoke truncate on table "public"."trend_sync_jobs" from "service_role";

revoke update on table "public"."trend_sync_jobs" from "service_role";

revoke delete on table "public"."usage_tracking" from "anon";

revoke insert on table "public"."usage_tracking" from "anon";

revoke references on table "public"."usage_tracking" from "anon";

revoke select on table "public"."usage_tracking" from "anon";

revoke trigger on table "public"."usage_tracking" from "anon";

revoke truncate on table "public"."usage_tracking" from "anon";

revoke update on table "public"."usage_tracking" from "anon";

revoke delete on table "public"."usage_tracking" from "authenticated";

revoke insert on table "public"."usage_tracking" from "authenticated";

revoke references on table "public"."usage_tracking" from "authenticated";

revoke select on table "public"."usage_tracking" from "authenticated";

revoke trigger on table "public"."usage_tracking" from "authenticated";

revoke truncate on table "public"."usage_tracking" from "authenticated";

revoke update on table "public"."usage_tracking" from "authenticated";

revoke delete on table "public"."usage_tracking" from "service_role";

revoke insert on table "public"."usage_tracking" from "service_role";

revoke references on table "public"."usage_tracking" from "service_role";

revoke select on table "public"."usage_tracking" from "service_role";

revoke trigger on table "public"."usage_tracking" from "service_role";

revoke truncate on table "public"."usage_tracking" from "service_role";

revoke update on table "public"."usage_tracking" from "service_role";

revoke delete on table "public"."user_credits" from "anon";

revoke insert on table "public"."user_credits" from "anon";

revoke references on table "public"."user_credits" from "anon";

revoke select on table "public"."user_credits" from "anon";

revoke trigger on table "public"."user_credits" from "anon";

revoke truncate on table "public"."user_credits" from "anon";

revoke update on table "public"."user_credits" from "anon";

revoke delete on table "public"."user_credits" from "authenticated";

revoke insert on table "public"."user_credits" from "authenticated";

revoke references on table "public"."user_credits" from "authenticated";

revoke select on table "public"."user_credits" from "authenticated";

revoke trigger on table "public"."user_credits" from "authenticated";

revoke truncate on table "public"."user_credits" from "authenticated";

revoke update on table "public"."user_credits" from "authenticated";

revoke delete on table "public"."user_credits" from "service_role";

revoke insert on table "public"."user_credits" from "service_role";

revoke references on table "public"."user_credits" from "service_role";

revoke select on table "public"."user_credits" from "service_role";

revoke trigger on table "public"."user_credits" from "service_role";

revoke truncate on table "public"."user_credits" from "service_role";

revoke update on table "public"."user_credits" from "service_role";

revoke delete on table "public"."user_interactions" from "anon";

revoke insert on table "public"."user_interactions" from "anon";

revoke references on table "public"."user_interactions" from "anon";

revoke select on table "public"."user_interactions" from "anon";

revoke trigger on table "public"."user_interactions" from "anon";

revoke truncate on table "public"."user_interactions" from "anon";

revoke update on table "public"."user_interactions" from "anon";

revoke delete on table "public"."user_interactions" from "authenticated";

revoke insert on table "public"."user_interactions" from "authenticated";

revoke references on table "public"."user_interactions" from "authenticated";

revoke select on table "public"."user_interactions" from "authenticated";

revoke trigger on table "public"."user_interactions" from "authenticated";

revoke truncate on table "public"."user_interactions" from "authenticated";

revoke update on table "public"."user_interactions" from "authenticated";

revoke delete on table "public"."user_interactions" from "service_role";

revoke insert on table "public"."user_interactions" from "service_role";

revoke references on table "public"."user_interactions" from "service_role";

revoke select on table "public"."user_interactions" from "service_role";

revoke trigger on table "public"."user_interactions" from "service_role";

revoke truncate on table "public"."user_interactions" from "service_role";

revoke update on table "public"."user_interactions" from "service_role";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

revoke delete on table "public"."waitlist_archive" from "anon";

revoke insert on table "public"."waitlist_archive" from "anon";

revoke references on table "public"."waitlist_archive" from "anon";

revoke select on table "public"."waitlist_archive" from "anon";

revoke trigger on table "public"."waitlist_archive" from "anon";

revoke truncate on table "public"."waitlist_archive" from "anon";

revoke update on table "public"."waitlist_archive" from "anon";

revoke delete on table "public"."waitlist_archive" from "authenticated";

revoke insert on table "public"."waitlist_archive" from "authenticated";

revoke references on table "public"."waitlist_archive" from "authenticated";

revoke select on table "public"."waitlist_archive" from "authenticated";

revoke trigger on table "public"."waitlist_archive" from "authenticated";

revoke truncate on table "public"."waitlist_archive" from "authenticated";

revoke update on table "public"."waitlist_archive" from "authenticated";

revoke delete on table "public"."waitlist_archive" from "service_role";

revoke insert on table "public"."waitlist_archive" from "service_role";

revoke references on table "public"."waitlist_archive" from "service_role";

revoke select on table "public"."waitlist_archive" from "service_role";

revoke trigger on table "public"."waitlist_archive" from "service_role";

revoke truncate on table "public"."waitlist_archive" from "service_role";

revoke update on table "public"."waitlist_archive" from "service_role";

revoke delete on table "public"."wardrobe_gaps" from "anon";

revoke insert on table "public"."wardrobe_gaps" from "anon";

revoke references on table "public"."wardrobe_gaps" from "anon";

revoke select on table "public"."wardrobe_gaps" from "anon";

revoke trigger on table "public"."wardrobe_gaps" from "anon";

revoke truncate on table "public"."wardrobe_gaps" from "anon";

revoke update on table "public"."wardrobe_gaps" from "anon";

revoke delete on table "public"."wardrobe_gaps" from "authenticated";

revoke insert on table "public"."wardrobe_gaps" from "authenticated";

revoke references on table "public"."wardrobe_gaps" from "authenticated";

revoke select on table "public"."wardrobe_gaps" from "authenticated";

revoke trigger on table "public"."wardrobe_gaps" from "authenticated";

revoke truncate on table "public"."wardrobe_gaps" from "authenticated";

revoke update on table "public"."wardrobe_gaps" from "authenticated";

revoke delete on table "public"."wardrobe_gaps" from "service_role";

revoke insert on table "public"."wardrobe_gaps" from "service_role";

revoke references on table "public"."wardrobe_gaps" from "service_role";

revoke select on table "public"."wardrobe_gaps" from "service_role";

revoke trigger on table "public"."wardrobe_gaps" from "service_role";

revoke truncate on table "public"."wardrobe_gaps" from "service_role";

revoke update on table "public"."wardrobe_gaps" from "service_role";

alter table "public"."seasonal_trends" drop constraint "seasonal_trends_popularity_score_check";

alter table "public"."seasonal_trends" drop constraint "seasonal_trends_trend_score_check";

alter table "public"."trend_keywords" drop constraint "trend_keywords_keyword_key";

alter table "public"."trend_keywords" drop constraint "trend_keywords_trend_direction_check";

alter table "public"."trend_sync_jobs" drop constraint "trend_sync_jobs_status_check";

drop function if exists "public"."find_similar_items"(target_embedding vector, target_user_id uuid, similarity_threshold numeric, limit_count integer);

drop type "public"."http_header";

drop type "public"."http_request";

drop type "public"."http_response";

drop function if exists "public"."update_trend_scores"();

alter table "public"."trend_keywords" drop constraint "trend_keywords_pkey";

alter table "public"."trend_sync_jobs" drop constraint "trend_sync_jobs_pkey";

drop index if exists "public"."idx_seasonal_trends_external_source";

drop index if exists "public"."idx_seasonal_trends_last_synced";

drop index if exists "public"."idx_seasonal_trends_trend_score";

drop index if exists "public"."idx_trend_keywords_category";

drop index if exists "public"."idx_trend_sync_jobs_next_run";

drop index if exists "public"."idx_trend_sync_jobs_status";

drop index if exists "public"."trend_keywords_keyword_key";

drop index if exists "public"."trend_keywords_pkey";

drop index if exists "public"."trend_sync_jobs_pkey";

drop table "public"."trend_keywords";

drop table "public"."trend_sync_jobs";

alter table "public"."category_creation_log" enable row level security;

alter table "public"."clothing_items" alter column "embedding" set data type extensions.vector(768) using "embedding"::extensions.vector(768);

alter table "public"."seasonal_trends" drop column "external_source";

alter table "public"."seasonal_trends" drop column "keywords";

alter table "public"."seasonal_trends" drop column "last_synced_at";

alter table "public"."seasonal_trends" drop column "popularity_score";

alter table "public"."seasonal_trends" drop column "sync_metadata";

alter table "public"."seasonal_trends" drop column "trend_score";

drop extension if exists "fuzzystrmatch";

drop extension if exists "http";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.find_similar_items(target_embedding extensions.vector, target_user_id uuid, similarity_threshold numeric DEFAULT 0.7, limit_count integer DEFAULT 10)
 RETURNS TABLE(item_id uuid, name text, category_name text, similarity_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, extensions'
AS $function$
BEGIN 
    RETURN QUERY
SELECT
    ci.id,
    ci.name,
    cc.name,
    (1 - (ci.embedding <=> target_embedding)) :: DECIMAL(3, 2) as similarity
FROM
    public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
WHERE
    ci.user_id = target_user_id
    AND ci.is_archived = FALSE
    AND ci.deleted_at IS NULL
    AND (1 - (ci.embedding <=> target_embedding)) >= similarity_threshold
ORDER BY
    ci.embedding <=> target_embedding
LIMIT
    limit_count;
END;
$function$
;

create or replace view "public"."user_wardrobe_analytics_secure" as  SELECT user_id,
    total_items,
    category_diversity,
    avg_sustainability,
    total_wears,
    last_item_added
   FROM user_wardrobe_analytics
  WHERE (user_id = ( SELECT auth.uid() AS uid));


CREATE OR REPLACE FUNCTION public.add_trending_categories_to_trend(trend_id uuid, category_names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    category_name TEXT;
    category_id UUID;
BEGIN
    FOREACH category_name IN ARRAY category_names
    LOOP
        -- Find or create category
        SELECT id INTO category_id 
        FROM public.clothing_categories 
        WHERE name = category_name;
        
        IF category_id IS NULL THEN
            INSERT INTO public.clothing_categories (name, source) 
            VALUES (category_name, 'trend_analysis') 
            RETURNING id INTO category_id;
        END IF;
        
        -- Link to trend (ignore if already exists)
        INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
        VALUES (trend_id, category_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update the array column for backward compatibility
    UPDATE public.seasonal_trends 
    SET trending_category_ids = (
        SELECT array_agg(stc.category_id)
        FROM public.seasonal_trend_categories stc
        WHERE stc.trend_id = add_trending_categories_to_trend.trend_id
    )
    WHERE id = add_trending_categories_to_trend.trend_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analyze_rls_performance()
 RETURNS TABLE(table_name text, policy_name text, estimated_cost numeric, recommendation text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        p.policyname::TEXT,
        0::NUMERIC as estimated_cost,
        CASE 
            WHEN p.qual LIKE '%auth.uid()%' THEN 'Consider using (SELECT auth.uid()) for better performance'
            WHEN COUNT(*) OVER (PARTITION BY t.tablename, p.cmd) > 1 THEN 'Multiple permissive policies detected - consider consolidation'
            ELSE 'Policy looks optimized'
        END::TEXT as recommendation
    FROM pg_policies p
    JOIN pg_tables t ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
    AND p.permissive = 'PERMISSIVE';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_wardrobe_diversity(target_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DECLARE diversity_score DECIMAL;

BEGIN
SELECT
    (
        COUNT(DISTINCT category_id) * 10 + COUNT(DISTINCT primary_color) * 5 + COUNT(DISTINCT subcategory_id) * 3 + CASE
            WHEN array_length(array_agg(DISTINCT season_name), 1) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items,
    LATERAL unnest(season_names) AS season_name
WHERE
    user_id = target_user_id
    AND is_archived = FALSE
    AND deleted_at IS NULL;

RETURN LEAST(diversity_score, 1.0);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.check_category_creation_rate_limit(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check if user has created more than 10 categories in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM public.category_creation_log
    WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN recent_count < 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_usage_limit(target_user_id uuid, usage_type_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    period_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get usage limit for user's current plan
    usage_limit := get_user_plan_limits(target_user_id, usage_type_param);
    
    -- Unlimited usage (-1)
    IF usage_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Determine period start based on usage type
    IF usage_type_param LIKE '%_week' THEN
        period_start := date_trunc('week', NOW());
    ELSIF usage_type_param LIKE '%_month' THEN
        period_start := date_trunc('month', NOW());
    ELSE
        period_start := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- Total usage
    END IF;
    
    -- Get current usage count
    SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
    FROM usage_tracking
    WHERE user_id = target_user_id 
    AND usage_type = usage_type_param
    AND period_start >= period_start;
    
    RETURN current_usage < usage_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_data(days_to_keep integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old error logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        DELETE FROM public.error_logs 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    -- Clean up old recommendation logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recommendation_logs') THEN
        DELETE FROM public.recommendation_logs 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    -- Clean up old usage tracking data (keep aggregated monthly data)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
        DELETE FROM public.usage_tracking 
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
        AND usage_date < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months');
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.clothing_item_style_tags cist
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clothing_items ci 
        WHERE ci.id = cist.clothing_item_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.convert_currency(amount numeric, from_currency text, to_currency text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$ DECLARE conversion_rate DECIMAL(12, 6);

converted_amount DECIMAL(10, 2);

BEGIN IF from_currency = to_currency THEN RETURN amount;

END IF;

SELECT
    rate INTO conversion_rate
FROM
    public.exchange_rates
WHERE
    base_currency = from_currency
    AND target_currency = to_currency
    AND valid_until > NOW()
    AND is_active = TRUE
ORDER BY
    fetched_at DESC
LIMIT
    1;

IF conversion_rate IS NULL THEN RETURN amount;

END IF;

converted_amount := amount * conversion_rate;

RETURN ROUND(converted_amount, 2);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN
INSERT INTO
    public.user_profiles (user_id, created_at, updated_at)
VALUES
    (NEW.id, NOW(), NOW());

RETURN NEW;

EXCEPTION
WHEN OTHERS THEN RAISE LOG 'Error creating user profile for user %: %',
NEW.id,
SQLERRM;

RAISE;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.find_or_create_category(category_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\s\-]', '', 'g')));
    
    SELECT id INTO category_id FROM public.clothing_categories WHERE lower(name) = clean_name;
    
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, TRUE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_or_create_subcategory(subcategory_name text, parent_category_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DECLARE subcategory_id UUID;

clean_name TEXT;

is_common_subcategory BOOLEAN := FALSE;

common_subcategories TEXT [] := ARRAY [
        't-shirt', 'shirt', 'blouse', 'tank-top', 'sweater', 'hoodie', 'cardigan', 'polo',
        'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers', 'chinos',
        'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'oxfords', 'slippers',
        'jacket', 'coat', 'blazer', 'vest', 'windbreaker', 'parka',
        'dress', 'gown', 'sundress', 'maxi-dress', 'mini-dress'
    ];

BEGIN IF subcategory_name IS NULL
OR trim(subcategory_name) = '' THEN RETURN NULL;

END IF;

clean_name := lower(
    trim(
        regexp_replace(subcategory_name, '[^a-zA-Z0-9\\s\\-]', '', 'g')
    )
);

is_common_subcategory := clean_name = ANY(common_subcategories);

SELECT
    id INTO subcategory_id
FROM
    public.clothing_subcategories
WHERE
    lower(name) = clean_name
    AND category_id = parent_category_id;

IF subcategory_id IS NOT NULL
AND is_common_subcategory THEN
UPDATE
    public.clothing_subcategories
SET
    is_active = TRUE
WHERE
    id = subcategory_id
    AND NOT is_active;

END IF;

IF subcategory_id IS NULL THEN
INSERT INTO
    public.clothing_subcategories (name, category_id, is_active, source)
VALUES
    (
        clean_name,
        parent_category_id,
        is_common_subcategory,
        CASE
            WHEN is_common_subcategory THEN 'system'
            ELSE 'ai_suggested'
        END
    ) RETURNING id INTO subcategory_id;

END IF;

RETURN subcategory_id;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_converted_amount(amount numeric, from_currency text, to_currency text, target_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    user_currency TEXT;
    converted_amount DECIMAL(10,2);
    display_currency TEXT;
BEGIN
    -- Get user's preferred currency if user_id provided
    IF target_user_id IS NOT NULL THEN
        SELECT preferred_currency INTO user_currency
        FROM user_profiles 
        WHERE user_id = target_user_id;
        display_currency := COALESCE(user_currency, to_currency);
    ELSE
        display_currency := to_currency;
    END IF;
    
    -- Convert amount
    converted_amount := convert_currency(amount, from_currency, display_currency);
    
    -- Return both original and converted
    RETURN jsonb_build_object(
        'original_amount', amount,
        'original_currency', from_currency,
        'converted_amount', converted_amount,
        'display_currency', display_currency,
        'is_converted', (from_currency != display_currency)
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_trending_categories_for_season(target_season text, target_year integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN RETURN (
        SELECT
            json_agg(
                json_build_object(
                    'id',
                    cc.id,
                    'name',
                    cc.name,
                    'trend_description',
                    st.trend_description
                )
            )
        FROM
            public.seasonal_trends st
            JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
            JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE
            st.season_name = target_season
            AND st.year = target_year
            AND CURRENT_DATE BETWEEN st.valid_from
            AND st.valid_until
    );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_user_plan_limits(target_user_id uuid, limit_type_param text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    limit_value INTEGER;
BEGIN
    SELECT pl.limit_value INTO limit_value
    FROM subscriptions s
    JOIN plan_limits pl ON s.plan_id = pl.plan_id
    WHERE s.user_id = target_user_id 
    AND s.status IN ('active', 'trialing')
    AND pl.limit_type = limit_type_param
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Default to free plan limits if no active subscription
    IF limit_value IS NULL THEN
        SELECT pl.limit_value INTO limit_value
        FROM subscription_plans sp
        JOIN plan_limits pl ON sp.id = pl.plan_id
        WHERE sp.name = 'Free' 
        AND pl.limit_type = limit_type_param;
    END IF;
    
    RETURN COALESCE(limit_value, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_preferred_currency(target_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE
    user_currency TEXT;
BEGIN
    -- This will work after migration 20251202000003 adds the column
    SELECT COALESCE(preferred_currency, 'USD') INTO user_currency
    FROM user_profiles
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(user_currency, 'USD');
EXCEPTION WHEN undefined_column THEN
    -- Fallback if column doesn't exist yet
    RETURN 'USD';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_sustainability_score(target_user_id uuid, metric_type_param text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    avg_score DECIMAL;
BEGIN
    SELECT AVG(value) INTO avg_score
    FROM sustainability_tracking
    WHERE user_id = target_user_id 
    AND metric_type = metric_type_param
    AND period_start >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN COALESCE(avg_score, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_waitlist_bonus(user_email text, new_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DECLARE waitlist_record RECORD;

BEGIN -- Check if waitlist_archive table exists
IF NOT EXISTS (
    SELECT
        1
    FROM
        information_schema.tables
    WHERE
        table_name = 'waitlist_archive'
) THEN RETURN FALSE;

END IF;

SELECT
    * INTO waitlist_record
FROM
    public.waitlist_archive
WHERE
    email = user_email
    AND migrated_at IS NULL;

IF FOUND THEN
INSERT INTO
    public.user_credits (
        user_id,
        credit_type,
        amount,
        currency,
        description,
        expires_at
    )
VALUES
    (
        new_user_id,
        'bonus',
        10.00,
        'USD',
        'Waitlist early access bonus - auto-applies to next payment',
        NOW() + INTERVAL '6 months'
    );

UPDATE
    public.waitlist_archive
SET
    migrated_at = NOW()
WHERE
    id = waitlist_record.id;

RETURN TRUE;

END IF;

RETURN FALSE;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    UPDATE event_templates 
    SET use_count = use_count + 1 
    WHERE id = template_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_error(target_user_id uuid, error_type text, error_message text, error_context jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.error_logs (user_id, error_type, error_message, context)
    VALUES (target_user_id, error_type, error_message, error_context);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_enum_value(input_value text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
BEGIN
    RETURN LOWER(TRIM(REPLACE(REPLACE(input_value, ' ', '-'), '_', '-')));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_categories()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    similar_count INTEGER;
BEGIN
    -- Check for similar category names (basic similarity)
    SELECT COUNT(*) INTO similar_count
    FROM public.clothing_categories
    WHERE is_active = TRUE
    AND (
        lower(name) = lower(NEW.name) OR
        levenshtein(lower(name), lower(NEW.name)) <= 2
    );
    
    IF similar_count > 0 THEN
        RAISE EXCEPTION 'Similar category already exists: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    view_record RECORD;
    refresh_count INTEGER := 0;
BEGIN
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', 
                          view_record.schemaname, view_record.matviewname);
            refresh_count := refresh_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Try non-concurrent refresh as fallback
                BEGIN
                    EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', 
                                  view_record.schemaname, view_record.matviewname);
                    refresh_count := refresh_count + 1;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE LOG 'Failed to refresh materialized view %.%: %', 
                                 view_record.schemaname, view_record.matviewname, SQLERRM;
                END;
        END;
    END LOOP;
    
    RETURN refresh_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_wardrobe_analytics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_wardrobe_analytics') THEN
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_wardrobe_analytics;
        EXCEPTION
            WHEN OTHERS THEN
                REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
        END;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_analytics_refresh()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Try to refresh the materialized view
    BEGIN
        REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
        
        -- Log successful refresh
        INSERT INTO public.error_logs (error_type, error_message, context)
        VALUES ('INFO', 'Analytics materialized view refreshed successfully', '{"timestamp": "' || NOW() || '"}');
    EXCEPTION
        WHEN insufficient_privilege THEN
            -- Log the permission issue but don't fail
            INSERT INTO public.error_logs (error_type, error_message, context)
            VALUES ('WARNING', 'Analytics refresh skipped due to permissions', '{"timestamp": "' || NOW() || '"}');
        WHEN OTHERS THEN
            -- Log other errors but don't fail
            INSERT INTO public.error_logs (error_type, error_message, context)
            VALUES ('ERROR', 'Analytics refresh failed: ' || SQLERRM, '{"timestamp": "' || NOW() || '"}');
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_subscription_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- Update user_profiles when subscription changes
    UPDATE user_profiles 
    SET 
        current_plan_id = NEW.plan_id,
        subscription_status = NEW.status,
        plan_expires_at = NEW.current_period_end
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.validate_ai_clothing_analysis(analysis_json jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
BEGIN
    -- Check required fields exist
    IF NOT (analysis_json ? 'name' AND 
            analysis_json ? 'primary_color' AND 
            analysis_json ? 'ai_confidence_score') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate confidence score range
    IF (analysis_json->>'ai_confidence_score')::DECIMAL NOT BETWEEN 0 AND 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validate name length
    IF length(analysis_json->>'name') > 200 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_currency_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN IF NEW.preferred_currency IS NOT NULL
    AND NEW.preferred_currency != 'USD'
    AND NOT EXISTS (
        SELECT
            1
        FROM
            public.supported_currencies
        WHERE
            code = NEW.preferred_currency
            AND is_active = TRUE
    ) THEN RAISE LOG 'Invalid preferred currency %, using USD instead',
    NEW.preferred_currency;

NEW.preferred_currency := 'USD';

END IF;

IF NEW.billing_currency IS NOT NULL
AND NEW.billing_currency != 'USD'
AND NOT EXISTS (
    SELECT
        1
    FROM
        public.supported_currencies
    WHERE
        code = NEW.billing_currency
        AND is_active = TRUE
) THEN RAISE LOG 'Invalid billing currency %, using USD instead',
NEW.billing_currency;

NEW.billing_currency := 'USD';

END IF;

RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.validate_item_currency()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    -- Check if currency exists in supported_currencies
    IF NEW.currency IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.currency AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid currency code: %', NEW.currency;
    END IF;
    
    RETURN NEW;
END;
$function$
;

create policy "category_log_delete"
on "public"."category_creation_log"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "category_log_insert"
on "public"."category_creation_log"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "category_log_select"
on "public"."category_creation_log"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "category_log_update"
on "public"."category_creation_log"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "delete_own"
on "public"."clothing_items_p0"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "insert_own"
on "public"."clothing_items_p0"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "select_own"
on "public"."clothing_items_p0"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "update_own"
on "public"."clothing_items_p0"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_insert_own"
on "public"."clothing_items_p1"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_select_own"
on "public"."clothing_items_p1"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_update_own"
on "public"."clothing_items_p1"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_insert_own"
on "public"."outfit_recommendations_p0"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_select_own"
on "public"."outfit_recommendations_p0"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "users_can_update_own"
on "public"."outfit_recommendations_p0"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "recommendations_delete_own"
on "public"."outfit_recommendations_p1"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "recommendations_insert_own"
on "public"."outfit_recommendations_p1"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "recommendations_select_own"
on "public"."outfit_recommendations_p1"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "recommendations_update_own"
on "public"."outfit_recommendations_p1"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));





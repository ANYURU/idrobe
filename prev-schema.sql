

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."check_email_exists"("email_to_check" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = email_to_check
  );
$$;


ALTER FUNCTION "public"."check_email_exists"("email_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_referral_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Function logic here
END;
$$;


ALTER FUNCTION "public"."get_referral_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan_type, onboarding_completed)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'basic',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_referral_source"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- No action needed; referral_source will remain NULL if not provided
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_referral_source"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_referral_source"("referral_source_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Function logic here
    -- Example: Update a referral source in a table
    UPDATE referral_sources
    SET source = 'new_source'
    WHERE id = referral_source_id;
END;
$$;


ALTER FUNCTION "public"."set_referral_source"("referral_source_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_referral_source"("referral_source_id" bigint, "new_source" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check if the referral source exists
    IF EXISTS (SELECT 1 FROM public.referral_sources WHERE id = referral_source_id) THEN
        -- Update the referral source
        UPDATE public.referral_sources
        SET source = new_source
        WHERE id = referral_source_id;
        
        -- Optionally log the update
        INSERT INTO public.referral_logs (referral_source_id, updated_at)
        VALUES (referral_source_id, NOW());
    ELSE
        RAISE EXCEPTION 'Referral source with ID % does not exist', referral_source_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."set_referral_source"("referral_source_id" bigint, "new_source" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "description" "text",
    "outfit_suggestion_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location" "text"
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_name" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "location" "text",
    "special_notes" "text",
    "mood_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "suggestion_id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_money_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "transaction_id" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'KES'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "failure_reason" "text"
);


ALTER TABLE "public"."mobile_money_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outfit_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "outfit_suggestion_id" "uuid",
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "outfit_feedback_feedback_check" CHECK (("feedback" = ANY (ARRAY['love'::"text", 'neutral'::"text", 'dislike'::"text"])))
);


ALTER TABLE "public"."outfit_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outfit_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "outfit_title" "text" NOT NULL,
    "outfit_description" "text" NOT NULL,
    "outfit_items" "jsonb" NOT NULL,
    "weather_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."outfit_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outfit_suggestions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "date" "date",
    "outfit" "jsonb",
    "weather" "text",
    "calendar_event" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "feedback" "text",
    "outfit_items" "jsonb",
    "style_notes" "text",
    "weather_data" "jsonb",
    "confidence_score" integer DEFAULT 85,
    "trend_alignment" "text",
    CONSTRAINT "outfit_suggestions_feedback_check" CHECK (("feedback" = ANY (ARRAY['love'::"text", 'neutral'::"text", 'dislike'::"text"])))
);


ALTER TABLE "public"."outfit_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preferences" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preference_key" "text" NOT NULL,
    "preference_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."preferences" OWNER TO "postgres";


ALTER TABLE "public"."preferences" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."preferences_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "plan" "text" DEFAULT 'basic'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "onboarding_completed" boolean DEFAULT false,
    "location" "text",
    "plan_limits" "jsonb" DEFAULT '{"daily_looks": 1, "wardrobe_slots": 10}'::"jsonb",
    "gender" "text",
    "preferred_styles" "text"[],
    "color_preferences" "text"[],
    "weather_tolerance" "text",
    "style_preferences_completed" boolean DEFAULT false,
    "must_haves" "text"[] DEFAULT '{}'::"text"[],
    "dislikes" "text"[] DEFAULT '{}'::"text"[],
    "birthday" "date",
    "clothing_lifestyle_tags" "text"[] DEFAULT '{}'::"text"[],
    "pinterest_board_url" "text",
    "plan_type" "text" DEFAULT 'basic'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."style_inputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "source" "text",
    "image_url" "text",
    "video_url" "text",
    "tags" "text"[],
    "ai_rating" "text",
    "item_type" "text",
    "color" "text",
    "mood" "text",
    "trend" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "style_inputs_source_check" CHECK (("source" = ANY (ARRAY['upload'::"text", 'pinterest'::"text", 'instagram'::"text", 'scanner'::"text"])))
);


ALTER TABLE "public"."style_inputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "stripe_customer_id" "text",
    "subscribed" boolean DEFAULT false NOT NULL,
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_end" timestamp with time zone,
    "plan_limits" "jsonb" DEFAULT '{"daily_looks": 1, "wardrobe_slots": 10}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text" DEFAULT 'stripe'::"text",
    "mobile_money_provider" "text",
    "phone_number" "text",
    "mobile_transaction_id" "text",
    "currency" "text" DEFAULT 'USD'::"text"
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sustainability_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" integer DEFAULT 1,
    "related_item_id" "uuid",
    "week_start" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sustainability_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."temp_signup_tracking" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "referral_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."temp_signup_tracking" OWNER TO "postgres";


ALTER TABLE "public"."temp_signup_tracking" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."temp_signup_tracking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recommendation_id" "uuid",
    "feedback_type" "text" NOT NULL,
    "feedback_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preference_type" "text" NOT NULL,
    "preference_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "username" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "referred_by" "text" DEFAULT 'https://idrobetech.com/landing'::"text"
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wardrobe_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "image_url" "text",
    "type" "text",
    "color" "text",
    "tags" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."wardrobe_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_money_transactions"
    ADD CONSTRAINT "mobile_money_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outfit_feedback"
    ADD CONSTRAINT "outfit_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outfit_recommendations"
    ADD CONSTRAINT "outfit_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outfit_suggestions"
    ADD CONSTRAINT "outfit_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_inputs"
    ADD CONSTRAINT "style_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sustainability_metrics"
    ADD CONSTRAINT "sustainability_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."temp_signup_tracking"
    ADD CONSTRAINT "temp_signup_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wardrobe_items"
    ADD CONSTRAINT "wardrobe_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_calendar_events_date" ON "public"."calendar_events" USING "btree" ("date");



CREATE INDEX "idx_calendar_events_location" ON "public"."calendar_events" USING "btree" ("location");



CREATE INDEX "idx_calendar_events_user_id" ON "public"."calendar_events" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_money_transactions_transaction_id" ON "public"."mobile_money_transactions" USING "btree" ("transaction_id");



CREATE INDEX "idx_mobile_money_transactions_user_id" ON "public"."mobile_money_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_id" ON "public"."wardrobe_items" USING "btree" ("user_id");



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_referred_by" ON "public"."waitlist" USING "btree" ("referred_by");



CREATE OR REPLACE TRIGGER "set_referral_source_trigger" BEFORE INSERT ON "public"."waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."set_referral_source"();



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_outfit_suggestion_id_fkey" FOREIGN KEY ("outfit_suggestion_id") REFERENCES "public"."outfit_suggestions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "public"."outfit_suggestions"("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."mobile_money_transactions"
    ADD CONSTRAINT "mobile_money_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outfit_feedback"
    ADD CONSTRAINT "outfit_feedback_outfit_suggestion_id_fkey" FOREIGN KEY ("outfit_suggestion_id") REFERENCES "public"."outfit_suggestions"("id");



ALTER TABLE ONLY "public"."outfit_recommendations"
    ADD CONSTRAINT "outfit_recommendations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outfit_recommendations"
    ADD CONSTRAINT "outfit_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outfit_suggestions"
    ADD CONSTRAINT "outfit_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."style_inputs"
    ADD CONSTRAINT "style_inputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sustainability_metrics"
    ADD CONSTRAINT "sustainability_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."temp_signup_tracking"
    ADD CONSTRAINT "temp_signup_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "public"."outfit_recommendations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wardrobe_items"
    ADD CONSTRAINT "wardrobe_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow users to delete their own profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow users to insert their own profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow users to update their own profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow users to view their own profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Anyone can join waitlist" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Edge functions can update mobile money transactions" ON "public"."mobile_money_transactions" FOR UPDATE USING (true);



CREATE POLICY "Edge functions can update subscriptions" ON "public"."subscribers" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only authenticated users can view waitlist" ON "public"."waitlist" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can access their outfit suggestions" ON "public"."outfit_suggestions" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can access their wardrobe items" ON "public"."wardrobe_items" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own calendar events" ON "public"."calendar_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own feedback" ON "public"."user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own metrics" ON "public"."sustainability_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own mobile money transactions" ON "public"."mobile_money_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own outfit suggestions" ON "public"."outfit_suggestions" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can create their own preferences" ON "public"."preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own recommendations" ON "public"."outfit_recommendations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own style inputs" ON "public"."style_inputs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own sustainability metrics" ON "public"."sustainability_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own calendar events" ON "public"."calendar_events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own feedback" ON "public"."user_feedback" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own metrics" ON "public"."sustainability_metrics" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own preferences" ON "public"."preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own preferences" ON "public"."user_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own recommendations" ON "public"."outfit_recommendations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own signup tracking" ON "public"."temp_signup_tracking" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own style inputs" ON "public"."style_inputs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own wardrobe items" ON "public"."wardrobe_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own subscription" ON "public"."subscribers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own signup tracking" ON "public"."temp_signup_tracking" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own wardrobe items" ON "public"."wardrobe_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own signup tracking" ON "public"."temp_signup_tracking" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send/view feedback" ON "public"."feedback" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own subscription" ON "public"."subscribers" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("email" = "auth"."email"()))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("email" = "auth"."email"())));



CREATE POLICY "Users can update their own calendar events" ON "public"."calendar_events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own feedback" ON "public"."user_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own metrics" ON "public"."sustainability_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own outfit suggestions" ON "public"."outfit_suggestions" FOR UPDATE USING ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can update their own preferences" ON "public"."preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own recommendations" ON "public"."outfit_recommendations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own signup tracking" ON "public"."temp_signup_tracking" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own style inputs" ON "public"."style_inputs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own sustainability metrics" ON "public"."sustainability_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own wardrobe items" ON "public"."wardrobe_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own calendar events" ON "public"."calendar_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own events" ON "public"."events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own feedback" ON "public"."user_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own metrics" ON "public"."sustainability_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own mobile money transactions" ON "public"."mobile_money_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own outfit suggestions" ON "public"."outfit_suggestions" FOR SELECT USING ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can view their own preferences" ON "public"."preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own recommendations" ON "public"."outfit_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own style inputs" ON "public"."style_inputs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own sustainability metrics" ON "public"."sustainability_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wardrobe items" ON "public"."wardrobe_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own_feedback" ON "public"."outfit_feedback" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_outfits" ON "public"."outfit_suggestions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."mobile_money_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outfit_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outfit_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outfit_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_feedback" ON "public"."outfit_feedback" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_own_outfits" ON "public"."outfit_suggestions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_own_subscription" ON "public"."subscribers" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("email" = "auth"."email"())));



ALTER TABLE "public"."style_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sustainability_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."temp_signup_tracking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_outfits" ON "public"."outfit_suggestions" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wardrobe_items" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_referral_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_referral_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referral_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_referral_source"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_referral_source"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_referral_source"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint, "new_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint, "new_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_referral_source"("referral_source_id" bigint, "new_source" "text") TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_money_transactions" TO "anon";
GRANT ALL ON TABLE "public"."mobile_money_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_money_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."outfit_feedback" TO "anon";
GRANT ALL ON TABLE "public"."outfit_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."outfit_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."outfit_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."outfit_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."outfit_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."outfit_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."outfit_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."outfit_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."preferences" TO "anon";
GRANT ALL ON TABLE "public"."preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."preferences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."preferences_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."preferences_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."preferences_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."style_inputs" TO "anon";
GRANT ALL ON TABLE "public"."style_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."style_inputs" TO "service_role";



GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."sustainability_metrics" TO "anon";
GRANT ALL ON TABLE "public"."sustainability_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."sustainability_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."temp_signup_tracking" TO "anon";
GRANT ALL ON TABLE "public"."temp_signup_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_signup_tracking" TO "service_role";



GRANT ALL ON SEQUENCE "public"."temp_signup_tracking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."temp_signup_tracking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."temp_signup_tracking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."wardrobe_items" TO "anon";
GRANT ALL ON TABLE "public"."wardrobe_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wardrobe_items" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;

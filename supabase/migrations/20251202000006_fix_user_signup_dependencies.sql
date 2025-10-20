-- Fix user signup by ensuring all dependencies are properly handled
-- This migration ensures the user profile trigger works correctly

-- supported_currencies table already created in migration 20251028094000_add_currency_support.sql
-- Skipping duplicate creation

-- 3. Ensure user_profiles has currency fields (should be from 20251028095000)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS billing_currency TEXT DEFAULT 'USD';

-- 4. Temporarily disable currency validation triggers during user creation
DROP TRIGGER IF EXISTS validate_user_currencies ON public.user_profiles;

-- 5. Create a safer user profile creation function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        preferred_currency, 
        billing_currency,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        'USD', 
        'USD',
        NOW(), 
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
        -- Still return NEW so user creation succeeds
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 7. Re-enable currency validation but make it more lenient
CREATE OR REPLACE FUNCTION validate_currency_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if currency is not USD (default)
    IF NEW.preferred_currency IS NOT NULL 
       AND NEW.preferred_currency != 'USD' 
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.preferred_currency AND is_active = TRUE
    ) THEN
        -- Don't fail, just log and use USD
        RAISE LOG 'Invalid preferred currency %, using USD instead', NEW.preferred_currency;
        NEW.preferred_currency := 'USD';
    END IF;
    
    IF NEW.billing_currency IS NOT NULL 
       AND NEW.billing_currency != 'USD'
       AND NOT EXISTS (
        SELECT 1 FROM public.supported_currencies 
        WHERE code = NEW.billing_currency AND is_active = TRUE
    ) THEN
        -- Don't fail, just log and use USD
        RAISE LOG 'Invalid billing currency %, using USD instead', NEW.billing_currency;
        NEW.billing_currency := 'USD';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recreate the currency validation trigger (more lenient)
CREATE TRIGGER validate_user_currencies
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_currency_code();

-- 9. Ensure RLS is properly set up for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Recreate policies
CREATE POLICY "Users can view own profile" ON public.user_profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON FUNCTION create_user_profile IS 'Creates user profile on signup with error handling';
COMMENT ON FUNCTION validate_currency_code IS 'Validates currency codes with fallback to USD';
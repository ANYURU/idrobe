-- ============================================================================
-- CURRENCY SUPPORT FOR INTERNATIONAL USERS
-- Add currency fields and exchange rate caching
-- ============================================================================

-- Common currency codes for validation (create first)
CREATE TABLE public.supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999
);

-- Exchange rates table for currency conversion caching
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    provider TEXT DEFAULT 'exchangerate-api', -- API provider used
    rate_date DATE DEFAULT CURRENT_DATE, -- Date for daily rates
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    update_frequency TEXT DEFAULT 'daily', -- 'daily', 'hourly', '15min', 'realtime'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency conversion function
CREATE OR REPLACE FUNCTION convert_currency(
    amount DECIMAL(10,2),
    from_currency TEXT,
    to_currency TEXT
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    conversion_rate DECIMAL(12,6);
    converted_amount DECIMAL(10,2);
BEGIN
    -- If same currency, return original amount
    IF from_currency = to_currency THEN
        RETURN amount;
    END IF;
    
    -- Get latest exchange rate
    SELECT rate INTO conversion_rate
    FROM exchange_rates
    WHERE base_currency = from_currency 
    AND target_currency = to_currency
    AND valid_until > NOW()
    AND is_active = TRUE
    ORDER BY fetched_at DESC
    LIMIT 1;
    
    -- If no rate found, return original amount (fallback)
    IF conversion_rate IS NULL THEN
        RETURN amount;
    END IF;
    
    -- Calculate converted amount
    converted_amount := amount * conversion_rate;
    
    RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Function to get user's preferred currency
CREATE OR REPLACE FUNCTION get_user_preferred_currency(target_user_id UUID)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- Indexes for performance
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_until) WHERE is_active = TRUE;
CREATE INDEX idx_exchange_rates_fetched ON exchange_rates(fetched_at DESC);

-- Unique constraint: one rate per currency pair per day
CREATE UNIQUE INDEX idx_exchange_rates_daily_unique 
ON exchange_rates(base_currency, target_currency, rate_date);

-- Insert common currencies (prioritizing African currencies)
INSERT INTO public.supported_currencies (code, name, symbol, display_order) VALUES
-- Major Global Currencies
('USD', 'US Dollar', '$', 1),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 3),

-- African Currencies (Priority)
('ZAR', 'South African Rand', 'R', 4),
('NGN', 'Nigerian Naira', '₦', 5),
('KES', 'Kenyan Shilling', 'KSh', 6),
('GHS', 'Ghanaian Cedi', '₵', 7),
('EGP', 'Egyptian Pound', '£', 8),
('MAD', 'Moroccan Dirham', 'د.م.', 9),
('TND', 'Tunisian Dinar', 'د.ت', 10),
('ETB', 'Ethiopian Birr', 'Br', 11),
('UGX', 'Ugandan Shilling', 'USh', 12),
('TZS', 'Tanzanian Shilling', 'TSh', 13),
('RWF', 'Rwandan Franc', 'FRw', 14),
('ZMW', 'Zambian Kwacha', 'ZK', 15),
('BWP', 'Botswana Pula', 'P', 16),
('MUR', 'Mauritian Rupee', '₨', 17),
('AOA', 'Angolan Kwanza', 'Kz', 18),
('MZN', 'Mozambican Metical', 'MT', 19),
('NAD', 'Namibian Dollar', 'N$', 20),
('SZL', 'Swazi Lilangeni', 'L', 21),
('LSL', 'Lesotho Loti', 'L', 22),
('MWK', 'Malawian Kwacha', 'MK', 23),
('ZWL', 'Zimbabwean Dollar', 'Z$', 24),
('BIF', 'Burundian Franc', 'FBu', 25),
('DJF', 'Djiboutian Franc', 'Fdj', 26),
('ERN', 'Eritrean Nakfa', 'Nfk', 27),
('GMD', 'Gambian Dalasi', 'D', 28),
('GNF', 'Guinean Franc', 'FG', 29),
('LRD', 'Liberian Dollar', 'L$', 30),
('MGA', 'Malagasy Ariary', 'Ar', 31),
('MLI', 'Malian Franc', 'CFA', 32),
('SLL', 'Sierra Leonean Leone', 'Le', 33),
('SOS', 'Somali Shilling', 'S', 34),
('SDP', 'Sudanese Pound', '£', 35),
('STD', 'São Tomé and Príncipe Dobra', 'Db', 36),
('SVC', 'Salvadoran Colón', '₡', 37),
('CVE', 'Cape Verdean Escudo', '$', 38),
('KMF', 'Comorian Franc', 'CF', 39),
('SCR', 'Seychellois Rupee', '₨', 40),

-- West/Central African CFA Franc (shared currency)
('XOF', 'West African CFA Franc', 'CFA', 41),
('XAF', 'Central African CFA Franc', 'FCFA', 42),

-- Other Major Currencies
('JPY', 'Japanese Yen', '¥', 50),
('CAD', 'Canadian Dollar', 'C$', 51),
('AUD', 'Australian Dollar', 'A$', 52),
('CHF', 'Swiss Franc', 'CHF', 53),
('CNY', 'Chinese Yuan', '¥', 54),
('INR', 'Indian Rupee', '₹', 55),
('BRL', 'Brazilian Real', 'R$', 56),
('MXN', 'Mexican Peso', '$', 57),
('SGD', 'Singapore Dollar', 'S$', 58),
('HKD', 'Hong Kong Dollar', 'HK$', 59),
('NOK', 'Norwegian Krone', 'kr', 60),
('SEK', 'Swedish Krona', 'kr', 61),
('DKK', 'Danish Krone', 'kr', 62),
('PLN', 'Polish Zloty', 'zł', 63),
('CZK', 'Czech Koruna', 'Kč', 64),
('HUF', 'Hungarian Forint', 'Ft', 65),
('RUB', 'Russian Ruble', '₽', 66),
('KRW', 'South Korean Won', '₩', 67),
('THB', 'Thai Baht', '฿', 68),
('MYR', 'Malaysian Ringgit', 'RM', 69),
('IDR', 'Indonesian Rupiah', 'Rp', 70),
('PHP', 'Philippine Peso', '₱', 71),
('VND', 'Vietnamese Dong', '₫', 72),
('TRY', 'Turkish Lira', '₺', 73),
('ILS', 'Israeli Shekel', '₪', 74),
('AED', 'UAE Dirham', 'د.إ', 75);

COMMENT ON TABLE exchange_rates IS 'Cached currency exchange rates for international pricing display';
COMMENT ON TABLE public.supported_currencies IS 'List of supported currencies with display information';
COMMENT ON FUNCTION convert_currency IS 'Converts amounts between currencies using cached exchange rates';
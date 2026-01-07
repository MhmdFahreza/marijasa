-- Migration: Add user_favorites table
-- Run this in your Supabase SQL Editor

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(vendor_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one user can only favorite a vendor once
    UNIQUE(user_id, vendor_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_vendor_id ON public.user_favorites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_favorites_updated_at
    BEFORE UPDATE ON public.user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.user_favorites IS 'Stores user favorite vendors';
COMMENT ON COLUMN public.user_favorites.favorite_id IS 'Unique identifier for the favorite';
COMMENT ON COLUMN public.user_favorites.user_id IS 'Reference to the user who favorited';
COMMENT ON COLUMN public.user_favorites.vendor_id IS 'Reference to the favorited vendor';
COMMENT ON COLUMN public.user_favorites.created_at IS 'When the favorite was added';
COMMENT ON COLUMN public.user_favorites.updated_at IS 'When the favorite was last updated';

-- Grant necessary permissions (adjust based on your RLS policies)
-- This is a basic example, adjust based on your security requirements
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
    ON public.user_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
    ON public.user_favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Create a function to get favorite count for a user
CREATE OR REPLACE FUNCTION get_user_favorites_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.user_favorites
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a function to check if a vendor is favorited
CREATE OR REPLACE FUNCTION is_vendor_favorited(p_user_id UUID, p_vendor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_favorites
        WHERE user_id = p_user_id
        AND vendor_id = p_vendor_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
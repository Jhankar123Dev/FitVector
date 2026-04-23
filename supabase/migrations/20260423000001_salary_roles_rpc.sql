-- Fix get_salary_aggregation to use ILIKE for fuzzy role/location matching
-- and cast MIN/MAX to NUMERIC to match return type declaration.
DROP FUNCTION IF EXISTS get_salary_aggregation(text,text,integer,integer);

CREATE OR REPLACE FUNCTION get_salary_aggregation(
  p_role TEXT,
  p_location TEXT DEFAULT NULL,
  p_exp_min INT DEFAULT 0,
  p_exp_max INT DEFAULT 99
)
RETURNS TABLE (
  sample_size BIGINT,
  median_salary NUMERIC,
  p25_salary NUMERIC,
  p75_salary NUMERIC,
  min_salary NUMERIC,
  max_salary NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC,
    MIN(sr.total_compensation)::NUMERIC,
    MAX(sr.total_compensation)::NUMERIC
  FROM salary_reports sr
  WHERE sr.role_title ILIKE '%' || p_role || '%'
    AND sr.experience_years >= p_exp_min
    AND sr.experience_years <= p_exp_max
    AND (p_location IS NULL OR sr.location ILIKE '%' || p_location || '%');
END;
$$;

-- Return distinct role titles for the salary search UI
CREATE OR REPLACE FUNCTION get_salary_roles()
RETURNS TABLE (role_title TEXT)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT DISTINCT role_title FROM salary_reports ORDER BY role_title;
$$;

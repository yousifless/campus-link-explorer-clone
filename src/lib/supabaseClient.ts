
// This file re-exports the standard Supabase client from the integrations folder
// to maintain backward compatibility with components using this import path

import { supabase } from '@/integrations/supabase/client';

export { supabase };

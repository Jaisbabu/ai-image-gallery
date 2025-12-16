const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is missing');
}

/**
 * Admin client
 * - BYPASSES RLS
 * - REQUIRED for storage delete
 * - NEVER expose to frontend
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * User-scoped client
 * - Enforces RLS
 * - Uses user's JWT
 */
const createUserClient = (accessToken) => {
  if (!accessToken) {
    throw new Error('createUserClient called without accessToken');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

module.exports = {
  supabaseAdmin,
  createUserClient
};


// const { createClient } = require('@supabase/supabase-js');

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseServiceKey) {
//   throw new Error('Missing Supabase environment variables');
// }

// // Service role client for admin operations
// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// // Create a client with user's JWT for RLS
// const createUserClient = (accessToken) => {
//   return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
//     global: {
//       headers: {
//         Authorization: `Bearer ${accessToken}`
//       }
//     }
//   });
// };

// module.exports = {
//   supabaseAdmin,
//   createUserClient
// };

// src/lib/supabaseHelper.js

/**
 * A safe wrapper for Supabase queries
 * Gives clear error messages instead of confusing stack traces
 *
 * @param {Promise} queryPromise - The Supabase query promise
 * @param {string} action - Description of the action (for logging)
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function safeQuery(queryPromise, action = "Supabase query") {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      console.error(`❌ Error during ${action}:`, error.message);
      return { data: null, error };
    }

    console.log(`✅ Success: ${action}`, data);
    return { data, error: null };

  } catch (err) {
    console.error(`🔥 Unexpected error during ${action}:`, err);
    return { data: null, error: err };
  }
}

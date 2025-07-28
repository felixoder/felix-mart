import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables for debugging
    const clientId = Deno.env.get("CASHFREE_CLIENT_ID")
    const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET")
    const environment = Deno.env.get("ENVIRONMENT")
    
    console.log('🔍 Environment Debug:')
    console.log('  - Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET')
    console.log('  - Client Secret:', clientSecret ? `${clientSecret.substring(0, 8)}...` : 'NOT SET')
    console.log('  - Environment:', environment || 'NOT SET')
    
    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          client_id_set: !!clientId,
          client_secret_set: !!clientSecret,
          environment: environment || 'not_set',
          client_id_preview: clientId ? `${clientId.substring(0, 8)}...` : 'not_set'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Debug error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  name?: string;
  role: 'reader' | 'writer' | 'admin';
  orgSlug: string;
}

serve(async (req) => {
  console.log('Edge function started - Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating admin client...');
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Creating regular client...');
    // Create regular client for current user verification
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        }
      }
    );

    console.log('Verifying current user...');
    // Verify current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { email, name, role, orgSlug }: CreateUserRequest = requestBody;
    console.log(`Admin ${user.email} creating user ${email} with role ${role} for org ${orgSlug}`);

    console.log('Looking up organization...');
    console.log('Querying orgs table for slug:', orgSlug);
    
    // Get organization using admin client
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('id')
      .eq('slug', orgSlug)
      .single();

    console.log('Organization query result:', { data: org, error: orgError });

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Organization found:', org);

    console.log('Checking admin permissions for user:', user.id, 'in org:', org.id);
    // Verify current user is admin of this org
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('org_members')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .single();

    console.log('Membership query result:', { data: membership, error: membershipError });

    if (!membership || membership.role !== 'admin') {
      console.error('User is not admin of this org');
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Admin verification passed. Checking if user already exists...');
    // Check if user already exists
    const { data: existingUser, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    });
    
    console.log('User existence check result:', { data: existingUser, error: listUsersError });
    
    let newUser;
    if (existingUser.users && existingUser.users.length > 0) {
      console.log('User already exists, checking membership...');
      // User exists, find the correct user by email
      const existingUserData = existingUser.users.find(user => user.email === email);
      
      if (!existingUserData) {
        console.log('No user found with email:', email);
        // This shouldn't happen given our filter, but handle it gracefully
        return new Response(JSON.stringify({ error: 'User lookup failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Existing user data:', { id: existingUserData.id, email: existingUserData.email });
      
      const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
        .from('org_members')
        .select('*')
        .eq('org_id', org.id)
        .eq('user_id', existingUserData.id)
        .single();

      console.log('Existing membership check:', { data: existingMembership, error: membershipCheckError });

      if (existingMembership) {
        console.log('User is already a member of this organization');
        return new Response(JSON.stringify({ error: 'User is already a member of this organization' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('User exists but is not a member, will add to org');
      newUser = existingUserData;
    } else {
      // Create new user with invite
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: name ? { full_name: name } : undefined,
        redirectTo: `${req.headers.get('origin')}/auth/login`
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return new Response(JSON.stringify({ error: 'Failed to create user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      newUser = createUserData.user;
    }

    // Add user to organization
    const { error: memberError } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: newUser.id,
        role: role
      });

    if (memberError) {
      console.error('Error adding user to organization:', memberError);
      return new Response(JSON.stringify({ error: 'Failed to add user to organization' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the action
    await supabaseAdmin
      .from('change_logs')
      .insert({
        entity: 'org_member',
        entity_id: newUser.id,
        action: 'invite',
        actor: user.email,
        org_id: org.id,
        after: {
          email: email,
          role: role,
          user_id: newUser.id
        }
      });

    console.log(`Successfully created/invited user ${email} with role ${role}`);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        email: email,
        role: role,
        status: (existingUser.users && existingUser.users.length > 0) ? 'existing' : 'invited'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-create-user function:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
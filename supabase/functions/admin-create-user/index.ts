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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Create regular client for current user verification
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        }
      }
    );

    // Verify current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role, orgSlug }: CreateUserRequest = await req.json();
    console.log(`Admin ${user.email} creating user ${email} with role ${role} for org ${orgSlug}`);

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('id')
      .eq('slug', orgSlug)
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify current user is admin of this org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      console.error('User is not admin of this org');
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    let newUser;
    if (existingUser.user) {
      // User exists, check if already member of org
      const { data: existingMembership } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', org.id)
        .eq('user_id', existingUser.user.id)
        .single();

      if (existingMembership) {
        return new Response(JSON.stringify({ error: 'User is already a member of this organization' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      newUser = existingUser.user;
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
    const { error: memberError } = await supabase
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
    await supabase
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
        status: existingUser.user ? 'existing' : 'invited'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-create-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
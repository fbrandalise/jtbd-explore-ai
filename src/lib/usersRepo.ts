import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  role: 'reader' | 'writer' | 'admin';
  org_id: string;
  org_name: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  role: 'reader' | 'writer' | 'admin';
  created_at: string;
}

export class UsersRepository {
  private defaultOrgSlug = 'default';

  // Get current user's profile and role
  async getMyProfile(): Promise<{ profile: UserProfile | null; error: any }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      console.log('🔍 Session data:', session.session?.user?.id, session.session?.user?.email);
      
      if (!session.session?.user) {
        console.log('❌ No session found');
        return { profile: null, error: null };
      }

      console.log('🔍 Querying org_members for user:', session.session.user.id);
      
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          id,
          role,
          created_at,
          org_id,
          orgs!inner (
            slug,
            name
          )
        `)
        .eq('user_id', session.session.user.id)
        .eq('orgs.slug', this.defaultOrgSlug)
        .maybeSingle();

      console.log('🔍 Query result:', { data, error });

      if (error || !data) {
        console.error('❌ Error fetching user profile:', error);
        return { profile: null, error };
      }

      const profile: UserProfile = {
        id: session.session.user.id,
        email: session.session.user.email!,
        role: data.role as 'reader' | 'writer' | 'admin',
        org_id: data.org_id,
        org_name: data.orgs.name,
        created_at: data.created_at
      };

      console.log('✅ Profile loaded successfully:', profile);
      return { profile, error: null };
    } catch (error) {
      console.error('❌ Exception in getMyProfile:', error);
      return { profile: null, error };
    }
  }

  // Get current user's role for specific org
  async getMyRole(orgSlug: string = this.defaultOrgSlug): Promise<{ role: string | null; error: any }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return { role: null, error: null };
      }

      const { data, error } = await supabase
        .from('org_members')
        .select('role, orgs!inner (slug)')
        .eq('user_id', session.session.user.id)
        .eq('orgs.slug', orgSlug)
        .single();

      if (error) return { role: null, error };

      return { role: data.role, error: null };
    } catch (error) {
      return { role: null, error };
    }
  }

  // List all members of the organization
  async listMembers(orgSlug: string = this.defaultOrgSlug): Promise<{ members: OrgMember[]; error: any }> {
    try {
      // Get org ID first
      const { data: orgData, error: orgError } = await supabase
        .from('orgs')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (orgError || !orgData) {
        return { members: [], error: orgError };
      }

      const { data, error } = await supabase
        .from('org_members')
        .select('id, user_id, role, created_at')
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false });

      if (error) return { members: [], error };

      // Get user emails from auth metadata (this is a limitation - we can't directly query auth.users)
      // In a real app, you'd store user emails in a profiles table
      const members: OrgMember[] = data.map(member => ({
        id: member.id,
        user_id: member.user_id,
        email: 'user@example.com', // Placeholder - in real app, get from profiles table
        role: member.role as 'reader' | 'writer' | 'admin',
        created_at: member.created_at
      }));

      return { members, error: null };
    } catch (error) {
      return { members: [], error };
    }
  }

  // Add a member to the organization
  async addMember(email: string, role: 'reader' | 'writer' | 'admin', orgSlug: string = this.defaultOrgSlug): Promise<{ success: boolean; error: any }> {
    try {
      // Get org ID
      const { data: orgData, error: orgError } = await supabase
        .from('orgs')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (orgError || !orgData) {
        return { success: false, error: orgError };
      }

      // Note: In a real implementation, you'd need to:
      // 1. Create user in auth.users (requires service role)
      // 2. Send invitation email
      // For now, we'll assume the user exists and add them to org_members
      
      // This is a simplified version - you'd need the actual user_id
      const { error } = await supabase
        .from('org_members')
        .insert({
          org_id: orgData.id,
          user_id: 'placeholder-user-id', // In real app, get from auth.users by email
          role
        });

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Update member role
  async updateMemberRole(memberId: string, role: 'reader' | 'writer' | 'admin'): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('org_members')
        .update({ role })
        .eq('id', memberId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Remove member from organization
  async removeMember(memberId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export const usersRepo = new UsersRepository();
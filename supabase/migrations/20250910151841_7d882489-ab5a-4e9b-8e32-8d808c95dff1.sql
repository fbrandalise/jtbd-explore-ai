-- Create default super admin user
-- This will create a default admin user that can access the application

DO $$
DECLARE
    admin_user_id uuid;
    default_org_id uuid;
BEGIN
    -- Get the default organization ID
    SELECT id INTO default_org_id FROM public.orgs WHERE slug = 'default' LIMIT 1;
    
    -- Check if default org exists, if not create it
    IF default_org_id IS NULL THEN
        INSERT INTO public.orgs (slug, name) 
        VALUES ('default', 'Organização Padrão') 
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Check if super admin already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@jtbd.app' 
    LIMIT 1;
    
    -- Only create if doesn't exist
    IF admin_user_id IS NULL THEN
        -- Create the super admin user in auth.users
        -- Note: In production, you should change this email and password
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@jtbd.app',
            crypt('admin123', gen_salt('bf')), -- Default password: admin123
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Super Admin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Add the user to default organization as admin
        INSERT INTO public.org_members (org_id, user_id, role)
        VALUES (default_org_id, admin_user_id, 'admin')
        ON CONFLICT (org_id, user_id) DO NOTHING;
        
        -- Log the creation
        INSERT INTO public.change_logs (
            entity,
            entity_id,
            action,
            actor,
            org_id,
            after
        ) VALUES (
            'org_member',
            admin_user_id,
            'create_super_admin',
            'system',
            default_org_id,
            jsonb_build_object(
                'email', 'admin@jtbd.app',
                'role', 'admin',
                'type', 'super_admin'
            )
        );
        
        RAISE NOTICE 'Super admin user created successfully with email: admin@jtbd.app and password: admin123';
    ELSE
        -- User already exists, ensure they are admin in default org
        INSERT INTO public.org_members (org_id, user_id, role)
        VALUES (default_org_id, admin_user_id, 'admin')
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Super admin user already exists: admin@jtbd.app';
    END IF;
END $$;

-- Create a function to reset super admin password if needed
CREATE OR REPLACE FUNCTION public.reset_super_admin_password(new_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Only allow this if called by an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reset the super admin password';
    END IF;
    
    -- Get super admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@jtbd.app';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Super admin user not found';
    END IF;
    
    -- Update password
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    RETURN 'Super admin password updated successfully';
END;
$$;
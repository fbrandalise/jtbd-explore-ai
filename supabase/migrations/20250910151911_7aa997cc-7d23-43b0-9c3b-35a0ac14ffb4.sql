-- Create default super admin user (simplified version)
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
        
        RAISE NOTICE 'Super admin user created successfully with email: admin@jtbd.app and password: admin123';
    ELSE
        -- User already exists, ensure they are admin in default org
        INSERT INTO public.org_members (org_id, user_id, role)
        VALUES (default_org_id, admin_user_id, 'admin')
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Super admin user already exists: admin@jtbd.app';
    END IF;
END $$;
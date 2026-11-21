-- Run in the hosted Supabase project's SQL editor after review.
-- Public avatars contain only user-selected profile pictures; writes are owner-only.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('avatars','avatars',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY tracksense_avatar_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='avatars' AND name=auth.uid()::text || '/avatar.jpg');
CREATE POLICY tracksense_avatar_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='avatars' AND name=auth.uid()::text || '/avatar.jpg')
WITH CHECK (bucket_id='avatars' AND name=auth.uid()::text || '/avatar.jpg');
CREATE POLICY tracksense_avatar_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='avatars' AND name=auth.uid()::text || '/avatar.jpg');
CREATE POLICY tracksense_avatar_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='avatars' AND name=auth.uid()::text || '/avatar.jpg');

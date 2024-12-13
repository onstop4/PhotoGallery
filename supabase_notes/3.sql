CREATE POLICY "Give users access to own folder 1io9m69_0" ON storage.objects FOR SELECT TO public USING (((bucket_id = 'photos'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));

CREATE POLICY "Give users access to own folder 1io9m69_1" ON storage.objects FOR INSERT TO public WITH CHECK (((bucket_id = 'photos'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));

CREATE POLICY "Give users access to own folder 1io9m69_2" ON storage.objects FOR DELETE TO public USING (((bucket_id = 'photos'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));
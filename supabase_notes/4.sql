DROP FUNCTION IF EXISTS get_album_name_by_access_key(uuid);

CREATE
OR REPLACE FUNCTION get_album_name_by_access_key (p_access_key UUID) RETURNS TEXT AS $$
DECLARE
    album_name text;
BEGIN
    SELECT name into album_name
    FROM public.album
    WHERE access_key = p_access_key
      AND is_public = true
    LIMIT 1;

    RETURN album_name;
END;
$$ LANGUAGE plpgsql
security definer set search_path = '';

DROP FUNCTION IF Exists get_photos_by_access_key(uuid);

CREATE
OR REPLACE FUNCTION get_photos_by_access_key (p_access_key UUID) RETURNS TABLE (id integer, uri text, date_taken timestamptz) AS $$
BEGIN
    perform set_config('public_album.access_key', p_access_key::text, true);
    RETURN QUERY
    SELECT photo.id as id, photo.uri as uri, photo.date_taken as date_taken
    FROM public.photo
    JOIN public.albumphoto ON photo.id = albumphoto.photo_id
    JOIN public.album ON albumphoto.album_id = album.id
    WHERE album.access_key = p_access_key
      AND album.is_public = true;
END;
$$ LANGUAGE plpgsql
security definer set search_path = '';

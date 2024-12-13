ALTER TABLE albumphoto
ADD CONSTRAINT unique_photo_album UNIQUE (photo_id, album_id);
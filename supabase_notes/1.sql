DROP TABLE IF EXISTS AlbumPhoto;
DROP TABLE IF EXISTS Photo;
DROP TABLE IF EXISTS Album;

create table Photo (
  id serial primary key,
  user_id uuid references auth.users on delete cascade not null,
  uri text not null default false,
  date_taken timestamp with time zone not null
);

create table Album (
  id serial primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  is_public boolean not null
);

create table AlbumPhoto (
  id serial,
  photo_id integer not null references Photo(id) on delete cascade,
  album_id integer not null references Album(id) on delete cascade,
  primary key (id, photo_id, album_id)
);

ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE album ENABLE ROW LEVEL SECURITY;
ALTER TABLE albumphoto ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_insert_policy ON Photo FOR INSERT
WITH
  CHECK (user_id = auth.uid());

CREATE POLICY photo_select_policy ON Photo FOR
SELECT
  USING (user_id = auth.uid());

CREATE POLICY photo_update_policy ON Photo
FOR UPDATE
  USING (user_id = auth.uid())
WITH
  CHECK (user_id = auth.uid());

CREATE POLICY photo_delete_policy ON Photo FOR DELETE USING (user_id = auth.uid());

CREATE POLICY album_insert_policy ON Album FOR INSERT
WITH
  CHECK (user_id = auth.uid());

CREATE POLICY album_select_policy ON Album FOR
SELECT
  USING (user_id = auth.uid());

CREATE POLICY album_update_policy ON Album
FOR UPDATE
  USING (user_id = auth.uid())
WITH
  CHECK (user_id = auth.uid());

CREATE POLICY album_delete_policy ON Album FOR DELETE USING (user_id = auth.uid());

CREATE POLICY albumphoto_insert_policy ON AlbumPhoto FOR INSERT
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        Album
      WHERE
        Album.id = album_id
        AND Album.user_id = auth.uid()
    )
  );

CREATE POLICY albumphoto_select_policy ON AlbumPhoto FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        Album
      WHERE
        Album.id = album_id
        AND Album.user_id = auth.uid()
    )
  );

CREATE POLICY albumphoto_update_policy ON AlbumPhoto
FOR UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        Album
      WHERE
        Album.id = album_id
        AND Album.user_id = auth.uid()
    )
  )
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        Album
      WHERE
        Album.id = album_id
        AND Album.user_id = auth.uid()
    )
  );

CREATE POLICY albumphoto_delete_policy ON AlbumPhoto FOR DELETE USING (
  EXISTS (
    SELECT
      1
    FROM
      Album
    WHERE
      Album.id = album_id
      AND Album.user_id = auth.uid()
  )
);
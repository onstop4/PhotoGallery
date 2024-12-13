# Supabase Notes

My app relies on Supabase's Row Level Security to ensure that users can only access their own photos and albums. This is both for security (since I don't want one user to access another user's private photos and albums) and for my own convenience (so I don't have to filter out other users' data whenever the database is queried).

This directory contains the code I used to create my Supabase tables, functions, and RLS policies. The filenames identify the order in which the code was run (if I remembered correctly).

## How Public Albums Work

One part of my app that was difficult to implement was public albums. I needed a way for users to access other users' photos and albums so long as they have the correct access key. This was difficult since I couldn't easily send the access key as part of an ordinary query. Instead, I wrote custom Postgres functions that accepted the key as an argument and then queried the database. Unfortunately, this doesn't work when trying to generate signed URLs for the photos in Supabase storage. To deal with that issue, I wrote code to modify the user's metadata whenever they request the photos in storage. Then, when they tell Supabase to generate the signed URLs, another RLS policy will allow the user with the correct metadata to access the image.

# Photo Gallery App

This is a photo gallery app I wrote for my Mobile Web Content and Development class (CS 641) at Pace University. It can run on mobile devices as well as web browsers. Users can upload photos to their accounts, combine photos into albums, and then share their public albums with other users by providing them with an access key.
Mobile users can also store photos and albums on their devices without having to sign in. Users can even take new photos using the cameras on their devices.

The app was built using TypeScript and React Native (using the Expo framework). The online/backend portion of this app was built using Supabase. The [supabase_notes](supabase_notes/) directory contains some information about how I configured the database, storage, and Row Level Security policies.

## Installation

To try this app, clone the repository and run the following commands in the new directory. The first installs the required packages, and the second runs the server:

```
npm i
npx expo android
```

You can then access the application either by navigating to the URL printed to the console or by scanning the QR code using the Expo Go app for Android. However, in order for the Supabase functionality to work, you will need to create a Supabase project and configure the database using the details I provided in the [supabase_notes](supabase_notes/) directory. Then, you will have to set two environment variables before running `npx expo android`:

* EXPO_PUBLIC_SUPABASEURL should equal the project URL.
* EXPO_PUBLIC_SUPABASEANONKEY should equal the project `anon` key.

You can find these details [here](https://supabase.com/dashboard/project/_/settings/api).
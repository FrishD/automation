const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Load user model
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: "608453700589-al1a5mj0gc4gq2og07chsmege85bdi5p.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:5000/api/google-calendar/auth/google/callback", // This is the callback URL registered with Google
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // If user exists, update their tokens
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken || user.googleRefreshToken; // Keep old refresh token if new one isn't provided
          await user.save();
          done(null, user);
        } else {
          // If not, create new user in DB
          user = await new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
          }).save();
          done(null, user);
        }
      } catch (err) {
        done(err, null);
      }
    }
  )
);

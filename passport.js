// const passport = require("passport");
// const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

// const GoogleStrategy = require("passport-google-oauth20").Strategy;

// passport.serializeUser(function (user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function (user, done) {
//   done(null, user);
// });

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     function (accessToken, refreshToken, profile, done) {
//       // User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       console.log(profile, done);
//       return done(err, profile);
//       // });
//     }
//   )
// );

// module.export = passport;

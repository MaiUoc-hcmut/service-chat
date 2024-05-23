const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const axios = require('axios');

// to authorize user using jwt
const jwtConfig = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Authorization'),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};
passport.use(
    new JWTStrategy(jwtConfig, async (payload: any, done: any) => {
        try {
            const teacherId = payload.id;
            const teacher = await axios.get(`${process.env.BASE_URL_LOCAL}/teacher/get-teacher-by-id/${teacherId}`);
            if (!teacher) {
                done(new Error('User not found!'), false);
            }
            // success case
            return done(null, teacher);
        } catch (err) {
            done(err, false);
        }
    })
);


passport.use(
    'user-jwt',
    new JWTStrategy(jwtConfig, async (payload: any, done: any) => {
        try {
            const id = payload.id;
            done(null, id);
        } catch (err) {
            done(err, false);
        }
    })
);


passport.use(
    'student-jwt',
    new JWTStrategy(jwtConfig, async (payload: any, done: any) => {
        try {
            const studentId = payload.id;
            const student = await axios.get(`${process.env.BASE_URL_LOCAL}/student/${studentId}`);
            if (!student) {
                done(new Error('User not found!'), false);
            }
            // success case
            return done(null, student);
        } catch (err) {
            done(err, false);
        }
    })
);
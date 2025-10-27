const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const Flow = require('../models/Flow');

// --- Authentication Routes ---
router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
});

// --- Middleware & Helpers ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error("JWT verification error:", err);
                return res.sendStatus(403);
            }
            try {
                const user = await User.findById(decoded.id);
                if (!user) {
                    console.error("Authenticated user not found in database for ID:", decoded.id);
                    return res.sendStatus(401);
                }
                req.user = user;
                next();
            } catch (dbError) {
                console.error("Database error fetching user in JWT middleware:", dbError);
                res.status(500).send('Database error.');
            }
        });
    } else {
        res.sendStatus(401);
    }
};

const getOAuth2Client = (user) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken
    });

    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
        }
        user.googleAccessToken = tokens.access_token;
        await user.save();
    });

    return oauth2Client;
};

// --- API Endpoints ---
router.get('/calendars', authenticateJWT, async (req, res) => {
    try {
        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.calendarList.list();
        res.json(response.data.items);
    } catch (error) {
        console.error("Error fetching Google Calendar list:", error);
        res.status(500).send('Failed to fetch calendar list.');
    }
});

router.post('/availability', authenticateJWT, async (req, res) => {
    const { flowId, startDate } = req.body;
    try {
        const flow = await Flow.findById(flowId);
        if (!flow || !flow.googleCalendar) return res.status(404).send('Flow or calendar settings not found.');

        const settings = flow.googleCalendar;
        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const busyTimesResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [{ id: settings.calendarId || 'primary' }],
            },
        });

        const busySlots = busyTimesResponse.data.calendars[settings.calendarId || 'primary'].busy;
        const availableSlots = [];
        const { startTime, endTime, meetingDuration, breakTime } = settings;

        for (let day = 0; day < 7; day++) {
            let currentSlotStart = new Date(start);
            currentSlotStart.setDate(currentSlotStart.getDate() + day);
            const [startHour, startMinute] = startTime.split(':').map(Number);
            currentSlotStart.setHours(startHour, startMinute, 0, 0);

            const dayEnd = new Date(currentSlotStart);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            dayEnd.setHours(endHour, endMinute, 0, 0);

            while (currentSlotStart < dayEnd) {
                const currentSlotEnd = new Date(currentSlotStart.getTime() + meetingDuration * 60000);
                if (currentSlotEnd > dayEnd) break;

                const isOverlapping = busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return (currentSlotStart < busyEnd && currentSlotEnd > busyStart);
                });

                if (!isOverlapping) {
                    availableSlots.push({ start: currentSlotStart.toISOString(), end: currentSlotEnd.toISOString() });
                }
                currentSlotStart.setTime(currentSlotEnd.getTime() + (breakTime || 0) * 60000);
            }
        }
        res.json({ availableSlots });
    } catch (error) {
        res.status(500).send('Failed to calculate availability.');
    }
});

router.post('/create-event', authenticateJWT, async (req, res) => {
    const { flowId, startTime, endTime, summary, description, attendees } = req.body;
    try {
        const flow = await Flow.findById(flowId);
        if (!flow || !flow.googleCalendar) return res.status(404).send('Flow or calendar settings not found.');

        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = {
            summary, description,
            start: { dateTime: startTime, timeZone: 'America/Los_Angeles' }, // Should ideally get timezone from user settings
            end: { dateTime: endTime, timeZone: 'America/Los_Angeles' },
            attendees: attendees ? attendees.filter(e => e).map(email => ({ email })) : [],
        };

        const response = await calendar.events.insert({
            calendarId: flow.googleCalendar.calendarId || 'primary',
            resource: event,
        });
        res.status(201).json(response.data);
    } catch (error) {
        res.status(500).send('Failed to create event.');
    }
});

module.exports = router;

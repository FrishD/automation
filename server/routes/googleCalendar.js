const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const Flow = require('../models/Flow'); // Import the Flow model

// ... (passport and auth routes remain the same)

// Middleware to verify JWT and attach user to request
const authenticateJWT = (req, res, next) => {
    // ... (implementation remains the same)
};

const getOAuth2Client = (user) => {
    // ... (implementation remains the same)
};

// Endpoint to get the list of calendars
router.get('/calendars', authenticateJWT, async (req, res) => {
    // ... (implementation remains the same)
});

// Endpoint to find available time slots
router.post('/availability', authenticateJWT, async (req, res) => {
    const { flowId, startDate } = req.body;

    try {
        const flow = await Flow.findById(flowId);
        if (!flow || !flow.googleCalendar) {
            return res.status(404).send('Flow or calendar settings not found.');
        }

        const settings = flow.googleCalendar;
        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7); // Check for the next 7 days

        // Get busy times from Google Calendar
        const busyTimesResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [{ id: settings.calendarId || 'primary' }],
            },
        });

        const busySlots = busyTimesResponse.data.calendars[settings.calendarId || 'primary'].busy;

        // --- Availability Calculation Logic ---
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

                // Check for overlap with busy slots
                const isOverlapping = busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    // Check if currentSlot overlaps with busy slot
                    return (currentSlotStart < busyEnd && currentSlotEnd > busyStart);
                });

                if (!isOverlapping) {
                    availableSlots.push({
                        start: currentSlotStart.toISOString(),
                        end: currentSlotEnd.toISOString(),
                    });
                }

                currentSlotStart.setTime(currentSlotEnd.getTime() + (breakTime || 0) * 60000);
            }
        }

        res.json({ availableSlots });

    } catch (error) {
        console.error('Error calculating availability:', error);
        res.status(500).send('Failed to calculate availability.');
    }
});


// Endpoint to create a new event
router.post('/create-event', authenticateJWT, async (req, res) => {
    // ... (implementation remains the same)
});


module.exports = router;

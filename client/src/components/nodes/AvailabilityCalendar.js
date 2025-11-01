import React from 'react';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityCalendar = ({ availability, onAvailabilityChange }) => {
    // Deep copy and sort availability for consistent rendering
    const sortedAvailability = JSON.parse(JSON.stringify(availability)).sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));

    const dayHasRule = (day) => sortedAvailability.some(rule => rule.day === day);

    const toggleDay = (day) => {
        let newAvailability;
        if (dayHasRule(day)) {
            // Remove all rules for this day
            newAvailability = sortedAvailability.filter(rule => rule.day !== day);
        } else {
            // Add a default rule for this day
            newAvailability = [...sortedAvailability, { day, slots: [{ start: '09:00', end: '17:00' }] }];
        }
        onAvailabilityChange(newAvailability);
    };

    const addSlot = (day) => {
        const newAvailability = JSON.parse(JSON.stringify(sortedAvailability));
        const dayRule = newAvailability.find(rule => rule.day === day);
        dayRule.slots.push({ start: '09:00', end: '10:00' });
        onAvailabilityChange(newAvailability);
    };

    const removeSlot = (day, slotIndex) => {
        const newAvailability = JSON.parse(JSON.stringify(sortedAvailability));
        const dayRule = newAvailability.find(rule => rule.day === day);
        if (dayRule) {
            dayRule.slots.splice(slotIndex, 1);
            if (dayRule.slots.length === 0) {
                // If the last slot is removed, disable the day
                const ruleIndex = newAvailability.findIndex(rule => rule.day === day);
                newAvailability.splice(ruleIndex, 1);
            }
            onAvailabilityChange(newAvailability);
        }
    };

    const handleSlotChange = (day, slotIndex, field, value) => {
        const newAvailability = JSON.parse(JSON.stringify(sortedAvailability));
        const dayRule = newAvailability.find(rule => rule.day === day);
        if (dayRule) {
            dayRule.slots[slotIndex][field] = value;
            onAvailabilityChange(newAvailability);
        }
    };

    return (
        <div className="border border-shadow-depth rounded-lg p-3 bg-white">
            <div className="grid grid-cols-7 gap-2 text-center">
                {daysOfWeek.map(day => (
                    <div
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`p-2 rounded-full cursor-pointer font-semibold text-sm transition-all ${dayHasRule(day) ? 'bg-primary text-white' : 'bg-secondary-background text-dark-text hover:bg-accent hover:text-white'}`}
                    >
                        {day.charAt(0)}
                    </div>
                ))}
            </div>
            <div className="mt-4 space-y-3">
                {sortedAvailability.length > 0 ? (
                    sortedAvailability.map(({ day, slots }) => (
                        <div key={day} className="grid grid-cols-[80px_1fr] items-start gap-3">
                            <span className="font-semibold text-sm pt-2">{day}</span>
                            <div className="space-y-2">
                                {slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="time" value={slot.start} onChange={(e) => handleSlotChange(day, index, 'start', e.target.value)} className="nodrag w-full p-2 border border-shadow-depth rounded-md text-sm" />
                                        <span className="text-muted-gray">-</span>
                                        <input type="time" value={slot.end} onChange={(e) => handleSlotChange(day, index, 'end', e.target.value)} className="nodrag w-full p-2 border border-shadow-depth rounded-md text-sm" />
                                        <button onClick={() => removeSlot(day, index)} className="text-muted-gray hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => addSlot(day)} className="text-sm font-semibold text-primary hover:underline pt-1">+ Add time slot</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted-gray p-4">Select a day above to set its availability.</p>
                )}
            </div>
        </div>
    );
};

export default AvailabilityCalendar;

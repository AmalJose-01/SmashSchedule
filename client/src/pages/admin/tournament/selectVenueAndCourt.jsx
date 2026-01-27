import React, { useState } from 'react';

export default function selectVenueAndCourt() {
    const [selectedVenue, setSelectedVenue] = useState('');
    const [selectedCourts, setSelectedCourts] = useState([]);

    // Sample data - replace with your actual data
    const venues = [
        { id: 1, name: 'Venue A', courts: ['Court 1', 'Court 2', 'Court 3'] },
        { id: 2, name: 'Venue B', courts: ['Court A', 'Court B'] },
        { id: 3, name: 'Venue C', courts: ['Court X', 'Court Y', 'Court Z'] },
    ];

    const currentCourts = venues.find(v => v.name === selectedVenue)?.courts || [];

    const handleVenueChange = (e) => {
        setSelectedVenue(e.target.value);
        setSelectedCourts([]);
    };

    const handleCourtChange = (court) => {
        setSelectedCourts(prev =>
            prev.includes(court)
                ? prev.filter(c => c !== court)
                : [...prev, court]
        );
    };

    return (
        <div className="container p-4">
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Venue</label>
                <select
                    value={selectedVenue}
                    onChange={handleVenueChange}
                    className="w-full p-2 border border-gray-300 rounded"
                >
                    <option value="">-- Choose a Venue --</option>
                    {venues.map(venue => (
                        <option key={venue.id} value={venue.name}>
                            {venue.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedVenue && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Select Courts</label>
                    <div className="space-y-2">
                        {currentCourts.map(court => (
                            <div key={court} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={court}
                                    checked={selectedCourts.includes(court)}
                                    onChange={() => handleCourtChange(court)}
                                    className="mr-2"
                                />
                                <label htmlFor={court} className="cursor-pointer">
                                    {court}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedCourts.length > 0 && (
                <div className="p-3 bg-gray-100 rounded">
                    <strong>Selected Courts:</strong> {selectedCourts.join(', ')}
                </div>
            )}
        </div>
    );
}
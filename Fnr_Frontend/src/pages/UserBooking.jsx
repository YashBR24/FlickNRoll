import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserBooking = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  // Sample data for activities and facilities
  const activities = [
    { id: 1, name: 'Pickleball (Synthetic)', price: 300, facilities: 5, sessions: 4 },
  ];

  const facilities = [
    { id: 1, name: 'Court 1', price: 300, available: true },
    { id: 2, name: 'Court 2', price: 300, available: true },
    { id: 3, name: 'Court 3', price: 300, available: true },
    { id: 4, name: 'Court 4', price: 300, available: true },
    { id: 5, name: 'Court 5', price: 300, available: true },
  ];

  // Pricing logic: ₹500/hour, ₹250/half-hour
  const getPrice = (duration) => (duration === 1 ? 500 : 250);

  // Sample booked slots (e.g., 9:00 PM - 10:00 PM for all courts)
  const bookedSlots = [
    { date: '2025-03-10', time: '09:00 PM', courts: [1, 2, 3, 4, 5] },
    { date: '2025-03-10', time: '09:30 PM', courts: [1, 2, 3, 4, 5] },
  ];

  // Slot times for the day
  const slotTimes = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
    '11:00 PM', '11:30 PM',
  ];

  const isSlotBooked = (date, time, courtId) => {
    return bookedSlots.some(slot => 
      slot.date === date && slot.time === time && slot.courts.includes(courtId)
    );
  };

  const handleBookSlot = (time) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(slot => slot !== time));
    } else {
      setSelectedSlots([...selectedSlots, time]);
    }
  };

  const renderStep1 = () => (
    <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose an Activity</h2>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-4 mb-4 rounded-lg bg-white/30 cursor-pointer hover:bg-white/50"
          onClick={() => {
            setSelectedActivity(activity);
            setStep(2);
          }}
        >
          <div>
            <p className="font-medium text-gray-800">{activity.name}</p>
            <p className="text-sm text-gray-600">
              {activity.facilities} Facilities/{activity.sessions} Sessions Available
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-green-700 mr-2">₹{activity.price} onwards</span>
            <button className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
              BOOK
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose a Facility</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="flex items-center justify-between p-4 rounded-lg bg-white/30 cursor-pointer hover:bg-white/50"
            onClick={() => {
              setSelectedFacility(facility);
              setStep(3);
            }}
          >
            <div>
              <p className="font-medium text-gray-800">{facility.name}</p>
              <p className="text-sm text-gray-600">24x7 Available</p>
            </div>
            <div className="flex items-center">
              <span className="text-green-700 mr-2">₹{facility.price} onwards</span>
              <button className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                BOOK
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-4 px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
        onClick={() => setStep(1)}
      >
        Change
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Slots</h2>
      <div className="flex justify-between mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 rounded-lg border border-gray-300"
        />
        <div className="flex space-x-2">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Booked
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span> Not Available
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Available
          </span>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800">Today</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {slotTimes.map((time) => {
          const isBooked = isSlotBooked(selectedDate, time, selectedFacility?.id);
          const isSelected = selectedSlots.includes(time);
          return (
            <button
              key={time}
              className={`p-2 rounded-lg text-sm ${
                isBooked
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => !isBooked && handleBookSlot(time)}
              disabled={isBooked}
            >
              {time}<br />₹{getPrice(0.5)}<br />1 left
            </button>
          );
        })}
      </div>
      <button
        className="mt-4 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        onClick={() => console.log('Booking confirmed:', { selectedFacility, selectedSlots })}
      >
        Confirm Booking
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, {user?.name}! - Booking
      </h1>
      <div className="space-y-6">
        {step === 1 && renderStep1()}
        {step === 2 && (
          <div>
            <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected a Facility</h2>
              <p className="font-medium text-gray-800">{selectedActivity.name}</p>
              <p className="text-sm text-gray-600">price ₹{selectedActivity.price} onwards</p>
            </div>
            {renderStep2()}
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected a Facility</h2>
              <p className="font-medium text-gray-800">{selectedFacility.name}</p>
              <p className="text-sm text-gray-600">price ₹{selectedFacility.price} onwards</p>
              <button
                className="mt-2 px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
                onClick={() => setStep(2)}
              >
                Change
              </button>
            </div>
            {renderStep3()}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBooking;
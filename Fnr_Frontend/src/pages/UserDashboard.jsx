import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  
  const upcomingBookings = [
    { court: 1, date: '2024-03-20', time: '2:00 PM - 3:00 PM', status: 'Confirmed' },
    { court: 3, date: '2024-03-22', time: '4:00 PM - 5:00 PM', status: 'Pending' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, {user?.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Your Upcoming Bookings</h2>
          </div>
          <div className="space-y-4">
            {upcomingBookings.map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/30">
                <div>
                  <p className="font-medium text-gray-800">Court {booking.court}</p>
                  <p className="text-sm text-gray-600">{booking.date}</p>
                  <p className="text-sm text-gray-600">{booking.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  booking.status === 'Confirmed' 
                    ? 'bg-green-100/50 text-green-700'
                    : 'bg-yellow-100/50 text-yellow-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full p-4 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
              Book a Court
            </button>
            <button className="w-full p-4 rounded-lg bg-white/50 text-gray-800 hover:bg-white/70 transition-colors">
              View Available Courts
            </button>
            <button className="w-full p-4 rounded-lg bg-white/50 text-gray-800 hover:bg-white/70 transition-colors">
              View My Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
import React from 'react';
import { Activity, Users, Calendar, Package } from 'lucide-react';

const Dashboard = () =>
    const [selectedTimeframe, setSelectedTimeframe] = useState('12h');
   {
  const stats = [
    { icon: <Activity className="text-emerald-500" />, title: 'Active Courts', value: '6/8', subtitle: 'Courts in use' },
    { icon: <Users className="text-blue-500" />, title: 'Members', value: '124', subtitle: 'Active members' },
    { icon: <Calendar className="text-purple-500" />, title: 'Bookings', value: '28', subtitle: "Today's bookings" },
    { icon: <Package className="text-orange-500" />, title: 'Equipment', value: '85%', subtitle: 'Equipment available' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 rounded-lg backdrop-blur-md bg-white/40 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-white/50">{stat.icon}</div>
              <div className="ml-4">
                <h3 className="text-gray-600 text-sm">{stat.title}</h3>
                <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((booking) => (
              <div key={booking} className="flex items-center justify-between border-b border-gray-200/50 pb-4">
                <div>
                  <p className="font-medium text-gray-800">Court {booking}</p>
                  <p className="text-sm text-gray-600">John Doe</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">2:00 PM - 3:00 PM</p>
                  <p className="text-sm text-gray-600">Today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg backdrop-blur-md bg-white/40 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Court Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((court) => (
              <div
                key={court}
                className={`p-4 rounded-lg ${
                  court <= 6
                    ? 'bg-emerald-100/50 text-emerald-700'
                    : 'bg-gray-100/50 text-gray-700'
                }`}
              >
                <p className="font-medium">Court {court}</p>
                <p className="text-sm">{court <= 6 ? 'Active' : 'Available'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
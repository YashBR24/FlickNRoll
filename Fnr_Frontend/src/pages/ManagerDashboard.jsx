import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Calendar, Package, DollarSign, Clock, AlertTriangle, CreditCard, 
  Plus, Edit3, UserPlus, X, CheckCircle, XCircle, Search, Trash2, Save, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format, parse, addHours, addMinutes } from 'date-fns';
import api from '../utils/api';

const ManagerDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [courtStatuses, setCourtStatuses] = useState([]);
  const [futureBookings, setFutureBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCourts: '0/5',
    members: 0,
    totalIn: 0,
    totalOut: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      const [dashboardStats, balanceRes, totalInRes, totalOutRes, courtStatusRes, futureBookingsRes, membersRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/reports/current-balance'),
        api.get('/api/reports/total-in'),
        api.get('/api/reports/total-out'),
        api.get('/api/bookings/courts/status'),
        api.get('/api/bookings/future'),
        api.get('/api/members')
      ]);

      setStats({
        activeCourts: dashboardStats.data.activeCourts,
        members: dashboardStats.data.members,
        totalIn: totalInRes.data.totalIn,
        totalOut: totalOutRes.data.totalOut
      });
      setCourtStatuses(courtStatusRes.data);
      setMembers(membersRes.data);

      const transformedBookings = futureBookingsRes.data.slice(0, 5).map(booking => {
        const startTimeParts = booking.startTime.split(':').map(Number);
        const startDate = new Date(booking.date);
        startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
        const durationHours = Math.floor(booking.duration || 1);
        const durationMinutes = Math.round((booking.duration - durationHours) * 60);
        const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes);
        const formattedStartTime = format(startDate, 'hh:mm a');
        const endTime = format(endDate, 'hh:mm a');
        const timeRange = `${formattedStartTime} - ${endTime}`;

        const players = Array.isArray(booking.players) ? booking.players : [];

        return {
          ...booking,
          time: timeRange,
          courtId: booking.court || booking.courtId,
          players,
          status: booking.status || 'confirmed',
          paymentStatus: booking.paymentStatus || 'pending'
        };
      });

      setFutureBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourtStatusUpdate = async (courtNumber, newStatus) => {
    try {
      const response = await api.put(`/api/bookings/courts/${courtNumber}/status`, {
        isActive: newStatus
      });
      
      setCourtStatuses(prevStatuses =>
        prevStatuses.map(court =>
          court.number === courtNumber ? { ...court, isActive: newStatus } : court
        )
      );
      
      const dashboardStats = await api.get('/api/dashboard/stats');
      setStats(prevStats => ({
        ...prevStats,
        activeCourts: dashboardStats.data.activeCourts
      }));
      
      return response.data;
    } catch (error) {
      console.error('Error updating court status:', error);
      throw error;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMemberName = (memberId) => {
    if (!memberId) return 'N/A';
    const member = members.find(m => m._id === memberId);
    if (member) {
      if (member.user && member.user.name) return member.user.name;
      if (member.name) return member.name;
      return member.email ? member.email.split('@')[0] : 'Unknown Member';
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-transparent p-6"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Clock className="text-gray-500" />
            <span className="text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <Activity className="text-emerald-500 h-10 w-10" />
              <div className="ml-4">
                <p className="text-gray-600">Active Courts</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.activeCourts}</p>
                <p className="text-sm text-gray-500">Courts in use</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <Users className="text-blue-500 h-10 w-10" />
              <div className="ml-4">
                <p className="text-gray-600">Members</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.members}</p>
                <p className="text-sm text-gray-500">Active members</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <ArrowUpRight className="text-green-500 h-10 w-10" />
              <div className="ml-4">
                <p className="text-gray-600">Total In</p>
                <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.totalIn)}</p>
                <p className="text-sm text-gray-500">All time income</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <ArrowDownRight className="text-red-500 h-10 w-10" />
              <div className="ml-4">
                <p className="text-gray-600">Total Out</p>
                <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalOut)}</p>
                <p className="text-sm text-gray-500">All time expenses</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-white p-6 shadow-lg mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {courtStatuses.map((court, index) => (
              <motion.div
                key={court.number}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm mb-2 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${court.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    {court.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">Court {court.number}</span>
                    <p className="text-xs text-gray-500">{court.isActive ? 'Active' : 'Under Maintenance'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCourtStatusUpdate(court.number, !court.isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-200 ${
                    court.isActive
                      ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
                      : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                  }`}
                >
                  {court.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-white p-6 shadow-lg mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="12h">Next 12 hours</option>
                <option value="24h">Next 24 hours</option>
                <option value="7d">Next 7 days</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {futureBookings.length > 0 ? (
                  futureBookings.map((booking, index) => {
                    let name = 'N/A';
                    if (booking.bookingType === 'member' && booking.players?.length > 0) {
                      const memberId = typeof booking.players[0] === 'string' ? booking.players[0] : booking.players[0]?._id;
                      name = getMemberName(memberId);
                    } else if (booking.bookingType === 'general') {
                      name = booking.name || 'N/A';
                    }

                    return (
                      <motion.tr 
                        key={booking._id} // Fixed key prop
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(booking.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Court {booking.courtId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.paymentStatus === 'paid' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No upcoming bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-white p-6 shadow-lg mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Court Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {courtStatuses.map((court) => (
              <motion.div
                key={court.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  !court.isActive ? 'bg-red-100' :
                  court.currentBooking ? 'bg-yellow-100' : 'bg-green-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Court {court.number}</span>
                  {court.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm">
                  {!court.isActive ? 'Under Maintenance' :
                   court.currentBooking ? `Booked: ${court.currentBooking.time}` : 'Available'}
                </p>
                {court.currentBooking && (
                  <p className="text-xs mt-1">{court.currentBooking.member}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ManagerDashboard;

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Activity, Users, Calendar, Package, DollarSign, Clock, AlertTriangle, CreditCard, 
//   Plus, Edit3, UserPlus, X, CheckCircle, XCircle, Search, Trash2, Save, ArrowUpRight, ArrowDownRight
// } from 'lucide-react';
// import { format, parse, addHours, addMinutes } from 'date-fns';
// import api from '../utils/api';

// const ManagerDashboard = () => {
//   const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
//   const [showCourtModal, setShowCourtModal] = useState(false);
//   const [selectedCourt, setSelectedCourt] = useState(null);
//   const [courts, setCourts] = useState([]);
//   const [bookings, setBookings] = useState([]);
//   const [courtStatuses, setCourtStatuses] = useState([]);
//   const [futureBookings, setFutureBookings] = useState([]);
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     activeCourts: '0/5',
//     members: 0,
//     totalIn: 0,
//     totalOut: 0
//   });

//   useEffect(() => {
//     fetchDashboardData();
//     // Refresh live status every minute
//     const interval = setInterval(() => {
//       updateLiveCourtStatus();
//     }, 60000); // 1 minute
//     return () => clearInterval(interval);
//   }, [selectedTimeframe, futureBookings]);

//   const fetchDashboardData = async () => {
//     try {
//       const [dashboardStats, balanceRes, totalInRes, totalOutRes, courtStatusRes, futureBookingsRes, membersRes] = await Promise.all([
//         api.get('/api/dashboard/stats'),
//         api.get('/api/reports/current-balance'),
//         api.get('/api/reports/total-in'),
//         api.get('/api/reports/total-out'),
//         api.get('/api/bookings/courts/status'),
//         api.get('/api/bookings/future'),
//         api.get('/api/members')
//       ]);

//       setStats({
//         activeCourts: dashboardStats.data.activeCourts,
//         members: dashboardStats.data.members,
//         totalIn: totalInRes.data.totalIn,
//         totalOut: totalOutRes.data.totalOut
//       });
//       setCourtStatuses(courtStatusRes.data);
//       setMembers(membersRes.data);

//       const transformedBookings = futureBookingsRes.data.slice(0, 5).map(booking => {
//         const startTimeParts = booking.startTime.split(':').map(Number);
//         const startDate = new Date(booking.date);
//         startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
//         const durationHours = Math.floor(booking.duration || 1);
//         const durationMinutes = Math.round((booking.duration - durationHours) * 60);
//         const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes);
//         const formattedStartTime = format(startDate, 'hh:mm a');
//         const endTime = format(endDate, 'hh:mm a');
//         const timeRange = `${formattedStartTime} - ${endTime}`;

//         const players = Array.isArray(booking.players) ? booking.players : [];

//         return {
//           ...booking,
//           time: timeRange,
//           courtId: booking.court || booking.courtId,
//           players,
//           status: booking.status || 'confirmed',
//           paymentStatus: booking.paymentStatus || 'pending',
//           startDateTime: startDate,
//           endDateTime: endDate
//         };
//       });

//       setFutureBookings(transformedBookings);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateLiveCourtStatus = () => {
//     const now = new Date();
//     const updatedCourtStatuses = courtStatuses.map(court => {
//       const currentBooking = futureBookings.find(booking => 
//         booking.courtId === court.number &&
//         now >= booking.startDateTime &&
//         now <= booking.endDateTime &&
//         booking.status !== 'cancelled'
//       );
//       return {
//         ...court,
//         isCurrentlyBooked: !!currentBooking,
//         bookingTimeRange: currentBooking ? currentBooking.time : null
//       };
//     });
//     setCourtStatuses(updatedCourtStatuses);
//   };

//   const handleCourtStatusUpdate = async (courtNumber, newStatus) => {
//     try {
//       const response = await api.put(`/api/bookings/courts/${courtNumber}/status`, {
//         isActive: newStatus
//       });
      
//       setCourtStatuses(prevStatuses =>
//         prevStatuses.map(court =>
//           court.number === courtNumber ? { ...court, isActive: newStatus } : court
//         )
//       );
      
//       const dashboardStats = await api.get('/api/dashboard/stats');
//       setStats(prevStats => ({
//         ...prevStats,
//         activeCourts: dashboardStats.data.activeCourts
//       }));
      
//       return response.data;
//     } catch (error) {
//       console.error('Error updating court status:', error);
//       throw error;
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const getMemberName = (memberId) => {
//     if (!memberId) return 'N/A';
//     const member = members.find(m => m._id === memberId);
//     if (member) {
//       if (member.user && member.user.name) return member.user.name;
//       if (member.name) return member.name;
//       return member.email ? member.email.split('@')[0] : 'Unknown Member';
//     }
//     return 'N/A';
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <p className="text-lg text-gray-600">Loading dashboard...</p>
//       </div>
//     );
//   }

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="min-h-screen bg-transparent p-6"
//     >
//       <div className="max-w-7xl mx-auto">
//         <motion.div 
//           initial={{ y: -20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ type: "spring", stiffness: 260, damping: 20 }}
//           className="flex justify-between items-center mb-6"
//         >
//           <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
//           <div className="flex items-center space-x-4">
//             <Clock className="text-gray-500" />
//             <span className="text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
//           </div>
//         </motion.div>

//         <motion.div 
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.1 }}
//           className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
//         >
//           <motion.div
//             initial={{ x: -20, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             transition={{ delay: 0.1 }}
//             whileHover={{ scale: 1.02 }}
//             className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <Activity className="text-emerald-500 h-10 w-10" />
//               <div className="ml-4">
//                 <p className="text-gray-600">Active Courts</p>
//                 <p className="text-2xl font-semibold text-gray-800">{stats.activeCourts}</p>
//                 <p className="text-sm text-gray-500">Courts in use</p>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ x: -20, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             transition={{ delay: 0.2 }}
//             whileHover={{ scale: 1.02 }}
//             className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <Users className="text-blue-500 h-10 w-10" />
//               <div className="ml-4">
//                 <p className="text-gray-600">Members</p>
//                 <p className="text-2xl font-semibold text-gray-800">{stats.members}</p>
//                 <p className="text-sm text-gray-500">Active members</p>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ x: -20, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             transition={{ delay: 0.3 }}
//             whileHover={{ scale: 1.02 }}
//             className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <ArrowUpRight className="text-green-500 h-10 w-10" />
//               <div className="ml-4">
//                 <p className="text-gray-600">Total In</p>
//                 <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.totalIn)}</p>
//                 <p className="text-sm text-gray-500">All time income</p>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ x: -20, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             transition={{ delay: 0.4 }}
//             whileHover={{ scale: 1.02 }}
//             className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <ArrowDownRight className="text-red-500 h-10 w-10" />
//               <div className="ml-4">
//                 <p className="text-gray-600">Total Out</p>
//                 <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalOut)}</p>
//                 <p className="text-sm text-gray-500">All time expenses</p>
//               </div>
//             </div>
//           </motion.div>
//         </motion.div>

//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg mb-6"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
//           <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//             {courtStatuses.map((court, index) => (
//               <motion.div
//                 key={court.number}
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ delay: 0.4 + index * 0.1 }}
//                 className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm mb-2 last:mb-0"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className={`flex items-center justify-center w-8 h-8 rounded-full ${court.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
//                     {court.isActive ? (
//                       <CheckCircle className="h-5 w-5 text-green-600" />
//                     ) : (
//                       <AlertTriangle className="h-5 w-5 text-red-600" />
//                     )}
//                   </div>
//                   <div>
//                     <span className="text-sm font-medium text-gray-800">Court {court.number}</span>
//                     <p className="text-xs text-gray-500">{court.isActive ? 'Active' : 'Under Maintenance'}</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => handleCourtStatusUpdate(court.number, !court.isActive)}
//                   className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-200 ${
//                     court.isActive
//                       ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
//                       : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
//                   }`}
//                 >
//                   {court.isActive ? 'Deactivate' : 'Activate'}
//                 </button>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>

//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.5 }}
//           className="rounded-xl bg-white p-6 shadow-lg mb-6"
//         >
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h2>
//             <div className="flex items-center gap-4">
//               <select
//                 value={selectedTimeframe}
//                 onChange={(e) => setSelectedTimeframe(e.target.value)}
//                 className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//               >
//                 <option value="12h">Next 12 hours</option>
//                 <option value="24h">Next 24 hours</option>
//                 <option value="7d">Next 7 days</option>
//               </select>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {futureBookings.length > 0 ? (
//                   futureBookings.map((booking, index) => {
//                     let name = 'N/A';
//                     if (booking.bookingType === 'member' && booking.players?.length > 0) {
//                       const memberId = typeof booking.players[0] === 'string' ? booking.players[0] : booking.players[0]?._id;
//                       name = getMemberName(memberId);
//                     } else if (booking.bookingType === 'general') {
//                       name = booking.name || 'N/A';
//                     }

//                     return (
//                       <motion.tr 
//                         key={booking._id}
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: index * 0.1 }}
//                       >
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {format(new Date(booking.date), 'dd/MM/yyyy')}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {booking.time}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           Court {booking.courtId}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {name}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             booking.status === 'confirmed' 
//                               ? 'bg-green-100 text-green-800' 
//                               : 'bg-yellow-100 text-yellow-800'
//                           }`}>
//                             {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             booking.paymentStatus === 'paid' 
//                               ? 'bg-blue-100 text-blue-800'
//                               : 'bg-gray-100 text-gray-800'
//                           }`}>
//                             {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
//                           </span>
//                         </td>
//                       </motion.tr>
//                     );
//                   })
//                 ) : (
//                   <tr>
//                     <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
//                       No upcoming bookings found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </motion.div>

//         <motion.div 
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.6 }}
//           className="rounded-xl bg-white p-6 shadow-lg mb-6"
//         >
//           <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Court Status</h2>
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {courtStatuses.map((court) => (
//               <motion.div
//                 key={court.number}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className={`p-4 rounded-lg transition-all duration-200 ${
//                   !court.isActive ? 'bg-gray-200' : // Inactive courts
//                   court.isCurrentlyBooked ? 'bg-red-100' : 'bg-green-100' // Booked (red) or Available (green)
//                 }`}
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="font-medium">Court {court.number}</span>
//                   {court.isActive ? (
//                     court.isCurrentlyBooked ? (
//                       <XCircle className="w-5 h-5 text-red-500" />
//                     ) : (
//                       <CheckCircle className="w-5 h-5 text-green-500" />
//                     )
//                   ) : (
//                     <XCircle className="w-5 h-5 text-gray-500" />
//                   )}
//                 </div>
//                 <p className="text-sm">
//                   {!court.isActive ? 'Inactive' :
//                    court.isCurrentlyBooked ? `Booked: ${court.bookingTimeRange}` : 'Available'}
//                 </p>
//                 {court.isCurrentlyBooked && court.currentBooking && (
//                   <p className="text-xs mt-1">{court.currentBooking.member || 'N/A'}</p>
//                 )}
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// };

// export default ManagerDashboard;
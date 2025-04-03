// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Activity, Users, Calendar, Package, TrendingUp, DollarSign, Settings, UserCog, 
//   FileText, Key, Bell, X, ChevronRight, AlertTriangle, CheckCircle, Info, 
//   BarChart2, Clock, Shield, Database, ArrowUpRight, ArrowDownRight, Edit2, Trash2
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { format, addHours, addMinutes } from 'date-fns';
// import api from '../utils/api';

// const AdminDashboard = () => {
//   const [activeModal, setActiveModal] = useState(null);
//   const [stats, setStats] = useState({
//     activeCourts: '0/5',
//     members: 0,
//     revenue: 0,
//     currentBalance: 0,
//     totalIn: 0,
//     totalOut: 0
//   });
//   const [recentActivities, setRecentActivities] = useState([]);
//   const [courtStatuses, setCourtStatuses] = useState([]);
//   const [futureBookings, setFutureBookings] = useState([]);
//   const [members, setMembers] = useState([]); // Store member data
//   const [loading, setLoading] = useState(true);
//   const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
//   const navigate = useNavigate();

//   const fetchDashboardData = async () => {
//     try {
//       const [dashboardStats, balanceRes, totalInRes, totalOutRes, recentActivitiesRes, courtStatusRes, futureBookingsRes, membersRes] = await Promise.all([
//         api.get('/api/dashboard/stats'),
//         api.get('/api/reports/current-balance'),
//         api.get('/api/reports/total-in'),
//         api.get('/api/reports/total-out'),
//         api.get('/api/logs'),
//         api.get('/api/bookings/courts/status'),
//         api.get('/api/bookings/future'),
//         api.get('/api/members') // Fetch member data for name mapping
//       ]);

//       setStats({
//         activeCourts: dashboardStats.data.activeCourts,
//         members: dashboardStats.data.members,
//         revenue: dashboardStats.data.revenue,
//         currentBalance: balanceRes.data.currentBalance,
//         totalIn: totalInRes.data.totalIn,
//         totalOut: totalOutRes.data.totalOut
//       });
//       setRecentActivities(recentActivitiesRes.data.slice(0, 5));
//       setCourtStatuses(courtStatusRes.data);

//       // Transform future bookings and ensure proper data structure
//       const transformedBookings = futureBookingsRes.data.slice(0, 5).map(booking => {
//         // Ensure players is an array
//         const players = Array.isArray(booking.players) ? booking.players : [];
//         return {
//           ...booking,
//           players,
//         };
//       });

//       setFutureBookings(transformedBookings);
//       setMembers(membersRes.data); // Store member data
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
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

//   useEffect(() => {
//     fetchDashboardData();
//   }, [selectedTimeframe]);

//   const quickActions = [
//     { 
//       id: 'members',
//       title: 'Members Controller', 
//       icon: <Users className="h-5 w-5" />, 
//       color: 'indigo',
//       description: 'Manage member profiles and memberships.',
//       options: [
//         { label: 'View All Members', action: () => navigate('/members') },
//         { label: 'Add New Member', action: () => navigate('/members?action=new') },
//         { label: 'Active Memberships', action: () => navigate('/memberships') },
//         { label: 'Add New Memberships Plan', action: () => navigate('/memberships') }
//       ]
//     },
//     { 
//       id: 'users',
//       title: 'User Management', 
//       icon: <UserCog className="h-5 w-5" />, 
//       color: 'purple',
//       description: 'Manage user accounts and roles.',
//       options: [
//         { label: 'View All Users', action: () => navigate('/users') },
//         { label: 'Add New User', action: () => navigate('/users?action=new') },
//         { label: 'Role Management', action: () => navigate('/users?tab=roles') },
//         { label: 'Access Control', action: () => navigate('/users?tab=access') }
//       ]
//     },
//     { 
//       id: 'reports',
//       title: 'Financial Reports', 
//       icon: <FileText className="h-5 w-5" />, 
//       color: 'green',
//       description: 'View financial reports and analytics.',
//       options: [
//         { label: 'Revenue Reports', action: () => navigate('/reports?type=revenue') },
//         { label: 'Expense Reports', action: () => navigate('/reports?type=expenses') },
//         { label: 'Member Payments', action: () => navigate('/reports?type=payments') },
//         { label: 'Financial Analytics', action: () => navigate('/reports?type=analytics') }
//       ]
//     },
//     { 
//       id: 'bookings',
//       title: 'Booking Controller', 
//       icon: <Calendar className="h-5 w-5" />, 
//       color: 'blue',
//       description: 'Manage court bookings and schedules.',
//       options: [
//         { label: 'Add New Booking', action: () => navigate('/bookings?action=new') },
//         { label: 'View All Bookings', action: () => navigate('/bookings') },
//         { label: 'Advanced Booking', action: () => navigate('/bookings?type=advanced') },
//         { label: 'Booking Reports', action: () => navigate('/reports?type=bookings') }
//       ]
//     }
//   ];

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case 'alert': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
//       case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
//       case 'info': return <Info className="h-5 w-5 text-blue-500" />;
//       default: return <Info className="h-5 w-5 text-gray-500" />;
//     }
//   };

//   const getActivityIcon = (type) => {
//     switch (type) {
//       case 'user': return <Users className="h-5 w-5" />;
//       case 'member': return <Users className="h-5 w-5" />;
//       case 'security': return <Shield className="h-5 w-5" />;
//       case 'error': return <AlertTriangle className="h-5 w-5" />;
//       default: return <Database className="h-5 w-5" />;
//     }
//   };

//   const getActivityTypeColor = (type) => {
//     switch (type) {
//       case 'user': return 'bg-blue-800 text-blue-200';
//       case 'member': return 'bg-blue-800 text-blue-200';
//       case 'security': return 'bg-red-800 text-red-200';
//       case 'error': return 'bg-yellow-800 text-yellow-200';
//       default: return 'bg-green-800 text-green-200';
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   // Updated getMemberName to handle nested user data and fallback gracefully
//   const getMemberName = (memberId) => {
//     if (!memberId) return 'N/A';
//     const member = members.find(m => m._id === memberId);
//     if (member) {
//       // Check if the member has a user object with a name, or fallback to member.email
//       if (member.user && member.user.name) return member.user.name;
//       if (member.name) return member.name;
//       return member.email ? member.email.split('@')[0] : 'Unknown Member';
//     }
//     return 'N/A';
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="text-xl font-semibold text-gray-800">Loading dashboard...</div>
//       </div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50 text-gray-900"
//     >
//       <div className="flex justify-between items-center mb-8">
//         <motion.h1 
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="text-3xl font-bold text-gray-800">
//           Admin Dashboard
//         </motion.h1>
        
//         <motion.div
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="flex items-center gap-4"
//         >
//           <div className="flex items-center space-x-4">
//             <Clock className="text-gray-500" />
//             <span className="text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
//           </div>
//         </motion.div>
//       </div>
      
//       <motion.div 
//         variants={container}
//         initial="hidden"
//         animate="show"
//         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
//       >
//         {[
//           { icon: <Activity className="text-emerald-500" />, title: 'Active Courts', value: stats.activeCourts, subtitle: 'Courts in use' },
//           { icon: <Users className="text-blue-500" />, title: 'Members', value: stats.members, subtitle: 'Active members' },
//           { icon: <ArrowUpRight className="text-green-500" />, title: 'Total In', value: formatCurrency(stats.totalIn), subtitle: 'All time income' },
//           { icon: <ArrowDownRight className="text-red-500" />, title: 'Total Out', value: formatCurrency(stats.totalOut), subtitle: 'All time expenses' }
//         ].map((stat) => (
//           <motion.div
//             key={stat.title}
//             variants={item}
//             whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
//             className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <motion.div 
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.1 }}
//                 className="p-3 rounded-full bg-gray-100"
//               >
//                 {stat.icon}
//               </motion.div>
//               <div className="ml-4">
//                 <h3 className="text-sm text-gray-600">{stat.title}</h3>
//                 <motion.p 
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   className="text-xl font-semibold text-gray-800"
//                 >
//                   {stat.value}
//                 </motion.p>
//                 <p className="text-sm text-gray-500">{stat.subtitle}</p>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </motion.div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
//           <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//             {courtStatuses.map((court) => (
//               <motion.div
//                 key={court.number}
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
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
//           initial={{ x: 20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
//           <div className="grid grid-cols-2 gap-4">
//             {quickActions.map((action) => (
//               <motion.button
//                 key={action.id}
//                 initial={{ scale: 0.95, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
//                 whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => setActiveModal(action.id)}
//                 className={`p-4 rounded-lg bg-gray-900 text-white hover:bg-${action.color}-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
//               >
//                 {action.icon}
//                 <span className="text-sm">{action.title}</span>
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       </div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.5 }}
//         className="rounded-xl bg-white p-6 shadow-lg mb-6"
//       >
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h2>
//           <div className="flex items-center gap-4">
//             <select
//               value={selectedTimeframe}
//               onChange={(e) => setSelectedTimeframe(e.target.value)}
//               className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//             >
//               <option value="12h">Next 12 hours</option>
//               <option value="24h">Next 24 hours</option>
//               <option value="7d">Next 7 days</option>
//             </select>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="text-left py-3 px-4 text-gray-600">Date</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Time</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Court</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Name</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Status</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Payment</th>
//               </tr>
//             </thead>
//             <tbody>
//               {futureBookings.length > 0 ? (
//                 futureBookings.map((booking) => {
//                   // Calculate time range based on startTime and duration
//                   const startTimeParts = booking.startTime.split(':').map(Number);
//                   const startDate = new Date(booking.date);
//                   startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
//                   const durationHours = Math.floor(booking.duration || 1); // Default to 1 hour if duration missing
//                   const durationMinutes = Math.round((booking.duration - durationHours) * 60);
//                   const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes);
//                   const formattedStartTime = format(startDate, 'hh:mm a');
//                   const endTime = format(endDate, 'hh:mm a');
//                   const timeRange = `${formattedStartTime} - ${endTime}`;

//                   // Determine name based on bookingType with improved logic
//                   let name = 'N/A';
//                   if (booking.bookingType === 'member' && booking.players?.length > 0) {
//                     const memberId = typeof booking.players[0] === 'string' ? booking.players[0] : booking.players[0]?._id;
//                     name = getMemberName(memberId);
//                   } else if (booking.bookingType === 'general') {
//                     name = booking.name || 'N/A';
//                   }

//                   // Format date
//                   const formattedDate = format(new Date(booking.date), 'dd/MM/yyyy');

//                   return (
//                     <motion.tr
//                       key={booking._id}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 0.1 }}
//                       className="border-b border-gray-200 hover:bg-gray-50"
//                     >
//                       <td className="py-3 px-4 text-gray-800">{formattedDate}</td>
//                       <td className="py-3 px-4 text-gray-800">{timeRange}</td>
//                       <td className="py-3 px-4 text-gray-800">Court {booking.courtId || booking.court}</td>
//                       <td className="py-3 px-4 text-gray-800">{name}</td>
//                       <td className="py-3 px-4">
//                         <span
//                           className={`px-3 py-1 rounded-full text-sm ${
//                             booking.status === 'confirmed'
//                               ? 'bg-green-100 text-green-800'
//                               : 'bg-yellow-100 text-yellow-800'
//                           }`}
//                         >
//                           {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span
//                           className={`px-3 py-1 rounded-full text-sm ${
//                             booking.paymentStatus === 'paid'
//                               ? 'bg-blue-100 text-blue-800'
//                               : booking.paymentStatus === 'partially_paid'
//                               ? 'bg-yellow-100 text-yellow-800'
//                               : 'bg-gray-100 text-gray-800'
//                           }`}
//                         >
//                           {booking.paymentStatus || 'Pending'}
//                         </span>
//                       </td>
//                     </motion.tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan="6" className="py-3 px-4 text-center text-gray-500">
//                     No upcoming bookings found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.5 }}
//         className="rounded-xl bg-white p-6 shadow-lg"
//       >
//         <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
//         <div className="space-y-4">
//           {recentActivities.length > 0 ? (
//             recentActivities.map((activity) => (
//               <motion.div
//                 key={activity.id}
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ delay: 0.6 }}
//                 className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <div className="flex items-center gap-4">
//                   <div className={`p-2 rounded-full ${getActivityTypeColor(activity.type)}`}>
//                     {getActivityIcon(activity.type)}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-800">{activity.message}</p>
//                     <p className="text-xs text-gray-500">{activity.time}</p>
//                   </div>
//                 </div>
//                 <ChevronRight className="h-5 w-5 text-gray-400" />
//               </motion.div>
//             ))
//           ) : (
//             <p className="text-sm text-gray-500">No recent activities available.</p>
//           )}
//         </div>
//       </motion.div>

//       <AnimatePresence>
//         {activeModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
//             onClick={() => setActiveModal(null)}
//           >
//             <motion.div
//               variants={modalVariants}
//               initial="hidden"
//               animate="visible"
//               exit="hidden"
//               onClick={e => e.stopPropagation()}
//               className="bg-gray-800 rounded-xl p-6 w-full max-w-md text-white"
//             >
//               {activeModal === 'notifications' ? (
//                 <div>
//                   <div className="flex justify-between items-center mb-4">
//                     <div className="flex items-center gap-2">
//                       <Bell className="h-5 w-5" />
//                       <h3 className="text-xl font-semibold">Notifications</h3>
//                     </div>
//                     <button
//                       onClick={() => setActiveModal(null)}
//                       className="p-1 hover:bg-gray-700 rounded-full"
//                     >
//                       <X className="h-5 w-5" />
//                     </button>
//                   </div>
//                   <div className="space-y-2">
//                     <p className="text-sm text-gray-400">No new notifications at this time.</p>
//                   </div>
//                 </div>
//               ) : (
//                 quickActions.map(action => {
//                   if (action.id === activeModal) {
//                     return (
//                       <div key={action.id}>
//                         <div className="flex justify-between items-center mb-4">
//                           <div className="flex items-center gap-2">
//                             {action.icon}
//                             <h3 className="text-xl font-semibold">{action.title}</h3>
//                           </div>
//                           <button
//                             onClick={() => setActiveModal(null)}
//                             className="p-1 hover:bg-gray-700 rounded-full"
//                           >
//                             <X className="h-5 w-5" />
//                           </button>
//                         </div>
//                         <p className="text-gray-400 mb-4">{action.description}</p>
//                         <div className="space-y-2">
//                           {action.options.map((option) => (
//                             <motion.button
//                               key={option.label}
//                               initial={{ x: -20, opacity: 0 }}
//                               animate={{ x: 0, opacity: 1 }}
//                               transition={{ delay: 0.1 }}
//                               onClick={option.action}
//                               className="w-full p-3 text-left rounded-lg hover:bg-gray-700 flex items-center justify-between group"
//                             >
//                               <span className="text-gray-200">{option.label}</span>
//                               <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
//                             </motion.button>
//                           ))}
//                         </div>
//                       </div>
//                     );
//                   }
//                   return null;
//                 })
//               )}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// const container = {
//   hidden: { opacity: 0 },
//   show: { 
//     opacity: 1,
//     transition: { 
//       when: "beforeChildren",
//       staggerChildren: 0.1
//     }
//   }
// };

// const item = {
//   hidden: { y: 20, opacity: 0 },
//   show: { 
//     y: 0, 
//     opacity: 1,
//     transition: {
//       type: "spring",
//       stiffness: 100
//     }
//   }
// };

// const modalVariants = {
//   hidden: { opacity: 0, scale: 0.95 },
//   visible: { opacity: 1, scale: 1 }
// };

// export default AdminDashboard;


// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Activity, Users, Calendar, Package, DollarSign, Clock, AlertTriangle, 
//   CreditCard, Plus, Edit3, UserPlus, X, CheckCircle, XCircle, Search, 
//   Trash2, Save, BarChart2, LineChart, PieChart
// } from 'lucide-react';
// import RevenueChart from './RevenueChart';
// import api from '../utils/api';

// const AdminDashboard = () => {
//   const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
//   const [showInventoryModal, setShowInventoryModal] = useState(false);
//   const [showCourtModal, setShowCourtModal] = useState(false);
//   const [showBookingModal, setShowBookingModal] = useState(false);
//   const [showMembershipModal, setShowMembershipModal] = useState(false);
//   const [showManageBookingsModal, setShowManageBookingsModal] = useState(false);
//   const [selectedCourt, setSelectedCourt] = useState(null);
//   const [editingBooking, setEditingBooking] = useState(null);
//   const [editingMember, setEditingMember] = useState(null);
//   const [revenueData, setRevenueData] = useState([]);
//   const [chartType, setChartType] = useState('bar');
//   const [loading, setLoading] = useState(true);
//   const [dashboardStats, setDashboardStats] = useState({
//     activeCourts: '0/5',
//     members: 0,
//     revenue: 0,
//     currentBalance: 0,
//     totalIn: 0,
//     totalOut: 0
//   });
//   const [courtStatuses, setCourtStatuses] = useState([]);
//   const [futureBookings, setFutureBookings] = useState([]);
//   const [members, setMembers] = useState([]);

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     try {
//       const [
//         dashboardStatsRes,
//         balanceRes,
//         totalInRes,
//         totalOutRes,
//         revenueOverviewRes,
//         courtStatusRes,
//         futureBookingsRes,
//         membersRes
//       ] = await Promise.all([
//         api.get('/api/dashboard/stats'),
//         api.get('/api/reports/current-balance'),
//         api.get('/api/reports/total-in'),
//         api.get('/api/reports/total-out'),
//         api.get('/api/reports/revenue-overview'),
//         api.get('/api/bookings/courts/status'),
//         api.get('/api/bookings/future'),
//         api.get('/api/members')
//       ]);

//       setDashboardStats({
//         activeCourts: dashboardStatsRes.data.activeCourts,
//         members: dashboardStatsRes.data.members,
//         revenue: dashboardStatsRes.data.revenue,
//         currentBalance: balanceRes.data.currentBalance,
//         totalIn: totalInRes.data.totalIn,
//         totalOut: totalOutRes.data.totalOut
//       });

//       setRevenueData(revenueOverviewRes.data.monthlyData);
//       setCourtStatuses(courtStatusRes.data);
//       setFutureBookings(futureBookingsRes.data.slice(0, 5));
//       setMembers(membersRes.data);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
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
      
//       // Refresh dashboard stats after court status update
//       const dashboardStats = await api.get('/api/dashboard/stats');
//       setDashboardStats(prevStats => ({
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

//   const stats = [
//     { 
//       icon: <Activity className="text-emerald-500" />, 
//       title: 'Court Status', 
//       value: dashboardStats.activeCourts, 
//       subtitle: 'Active Courts',
//       details: [
//         { label: 'Maintenance', value: courtStatuses.filter(c => !c.isActive).length },
//         { label: 'Available', value: courtStatuses.filter(c => c.isActive).length },
//         { label: 'In Use', value: courtStatuses.filter(c => c.status === 'maintenance').length }
//       ]
//     },
//     { 
//       icon: <Users className="text-blue-500" />, 
//       title: 'Membership', 
//       value: dashboardStats.members, 
//       subtitle: 'Total Members',
//       details: [
//         { label: 'Active', value: members.filter(m => m.status === 'active').length },
//         { label: 'Expiring Soon', value: members.filter(m => m.status === 'expiring').length },
//         { label: 'Expired', value: members.filter(m => m.status === 'expired').length }
//       ]
//     },
//     { 
//       icon: <Calendar className="text-purple-500" />, 
//       title: 'Bookings', 
//       value: futureBookings.length, 
//       subtitle: "Today's Total",
//       details: [
//         { label: 'Current', value: futureBookings.filter(b => b.status === 'ongoing').length },
//         { label: 'Upcoming', value: futureBookings.filter(b => b.status === 'confirmed').length },
//         { label: 'Completed', value: futureBookings.filter(b => b.status === 'completed').length }
//       ]
//     },
//     { 
//       icon: <DollarSign className="text-orange-500" />, 
//       title: 'Financial', 
//       value: formatCurrency(dashboardStats.currentBalance), 
//       subtitle: 'Current Balance',
//       details: [
//         { label: 'Total In', value: formatCurrency(dashboardStats.totalIn) },
//         { label: 'Total Out', value: formatCurrency(dashboardStats.totalOut) },
//         { label: 'Today', value: formatCurrency(dashboardStats.revenue) }
//       ]
//     }
//   ];

//   const container = {
//     hidden: { opacity: 0 },
//     show: { opacity: 1, transition: { staggerChildren: 0.1 } },
//   };

//   const item = {
//     hidden: { y: 20, opacity: 0 },
//     show: { y: 0, opacity: 1 },
//   };

//   if (loading) {
//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50"
//       >
//         <div className="flex items-center justify-center min-h-screen">
//           <p className="text-xl font-semibold text-gray-800">Loading dashboard data...</p>
//         </div>
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50 text-gray-900"
//     >
//       <div className="flex justify-between items-center mb-8">
//         <motion.h1 
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="text-3xl font-bold text-gray-800">
//           Admin Dashboard
//         </motion.h1>
        
//         <motion.div
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="flex items-center gap-4"
//         >
//           <div className="flex items-center space-x-4">
//             <Clock className="text-gray-500" />
//             <span className="text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
//           </div>
//         </motion.div>
//       </div>
      
//       <motion.div 
//         variants={container}
//         initial="hidden"
//         animate="show"
//         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
//       >
//         {stats.map((stat) => (
//           <motion.div
//             key={stat.title}
//             variants={item}
//             whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
//             className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <motion.div 
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.1 }}
//                 className="p-3 rounded-full bg-gray-100"
//               >
//                 {stat.icon}
//               </motion.div>
//               <div className="ml-4">
//                 <h3 className="text-sm text-gray-600">{stat.title}</h3>
//                 <motion.p 
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   className="text-xl font-semibold text-gray-800"
//                 >
//                   {stat.value}
//                 </motion.p>
//                 <p className="text-sm text-gray-500">{stat.subtitle}</p>
//               </div>
//             </div>
//             <div className="mt-4 grid grid-cols-3 gap-2">
//               {stat.details.map((detail, idx) => (
//                 <div key={idx} className="text-center">
//                   <p className="text-xs text-gray-500">{detail.label}</p>
//                   <p className="text-sm font-semibold text-gray-700">{detail.value}</p>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         ))}
//       </motion.div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.3 }}
//         className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
//       >
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
//           <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//             {courtStatuses.map((court) => (
//               <motion.div
//                 key={court.number}
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
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
//           initial={{ x: 20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
//           <div className="grid grid-cols-2 gap-4">
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => setShowBookingModal(true)}
//               className="p-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
//             >
//               <Calendar className="h-5 w-5" />
//               <span>New Booking</span>
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => setShowMembershipModal(true)}
//               className="p-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
//             >
//               <UserPlus className="h-5 w-5" />
//               <span>Add Member</span>
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => setShowManageBookingsModal(true)}
//               className="p-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all flex items-center justify-center gap-2"
//             >
//               <Edit3 className="h-5 w-5" />
//               <span>Manage Bookings</span>
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => setShowInventoryModal(true)}
//               className="p-4 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
//             >
//               <Package className="h-5 w-5" />
//               <span>Inventory</span>
//             </motion.button>
//           </div>
//         </motion.div>
//       </motion.div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.5 }}
//         className="rounded-xl bg-white p-6 shadow-lg mb-6"
//       >
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
//           <div className="flex items-center gap-4">
//             <select
//               value={chartType}
//               onChange={(e) => setChartType(e.target.value)}
//               className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//             >
//               <option value="bar">Bar Chart</option>
//               <option value="line">Line Chart</option>
//               <option value="pie">Pie Chart</option>
//             </select>
//           </div>
//         </div>

//         <RevenueChart data={revenueData} chartType={chartType} />
//       </motion.div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.6 }}
//         className="rounded-xl bg-white p-6 shadow-lg mb-6"
//       >
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h2>
//           <button
//             onClick={() => setShowManageBookingsModal(true)}
//             className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//           >
//             View All
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="text-left py-3 px-4 text-gray-600">Time</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Court</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Member</th>
//                 <th className="text-left py-3 px-4 text-gray-600">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {futureBookings.map((booking) => (
//                 <tr key={booking._id} className="border-b border-gray-200 hover:bg-gray-50">
//                   <td className="py-3 px-4 text-gray-800">{booking.startTime}</td>
//                   <td className="py-3 px-4 text-gray-800">Court {booking.court}</td>
//                   <td className="py-3 px-4 text-gray-800">{booking.name || 'N/A'}</td>
//                   <td className="py-3 px-4">
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       booking.status === 'confirmed' 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-yellow-100 text-yellow-800'
//                     }`}>
//                       {booking.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default AdminDashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Activity, Users, Calendar, Package, TrendingUp, DollarSign, Settings, UserCog, 
//   FileText, Key, Bell, X, ChevronRight, AlertTriangle, CheckCircle, Info, 
//   BarChart2, Clock, Shield, Database, ArrowUpRight, ArrowDownRight, Edit2, Trash2,
//   LogOut
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { format, addHours, addMinutes } from 'date-fns';
// import RevenueChart from './RevenueChart';
// import api from '../utils/api';

// const AdminDashboard = () => {
//   const [activeModal, setActiveModal] = useState(null);
//   const [stats, setStats] = useState({
//     activeCourts: '0/5',
//     members: 0,
//     revenue: 0,
//     currentBalance: 0,
//     totalIn: 0,
//     totalOut: 0
//   });
//   const [recentActivities, setRecentActivities] = useState([]);
//   const [courtStatuses, setCourtStatuses] = useState([]);
//   const [futureBookings, setFutureBookings] = useState([]);
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
//   const [revenueData, setRevenueData] = useState([]);
//   const [chartType, setChartType] = useState('bar');
//   const navigate = useNavigate();

//   const fetchDashboardData = async () => {
//     try {
//       const [dashboardStats, balanceRes, totalInRes, totalOutRes, recentActivitiesRes, courtStatusRes, futureBookingsRes, membersRes, revenueOverviewRes] = await Promise.all([
//         api.get('/api/dashboard/stats'),
//         api.get('/api/reports/current-balance'),
//         api.get('/api/reports/total-in'),
//         api.get('/api/reports/total-out'),
//         api.get('/api/logs'),
//         api.get('/api/bookings/courts/status'),
//         api.get('/api/bookings/future'),
//         api.get('/api/members'),
//         api.get('/api/reports/revenue-overview')
//       ]);

//       setStats({
//         activeCourts: dashboardStats.data.activeCourts,
//         members: dashboardStats.data.members,
//         revenue: dashboardStats.data.revenue,
//         currentBalance: balanceRes.data.currentBalance,
//         totalIn: totalInRes.data.totalIn,
//         totalOut: totalOutRes.data.totalOut
//       });
//       setRecentActivities(recentActivitiesRes.data.slice(0, 5));
//       setCourtStatuses(courtStatusRes.data);
//       setFutureBookings(futureBookingsRes.data.slice(0, 5));
//       setMembers(membersRes.data);
//       setRevenueData(revenueOverviewRes.data.monthlyData);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, [selectedTimeframe]);

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

//   const quickActions = [
//     { 
//       id: 'members',
//       title: 'Members Controller', 
//       icon: <Users className="h-5 w-5" />, 
//       color: 'indigo',
//       description: 'Manage member profiles and memberships.',
//       options: [
//         { label: 'View All Members', action: () => navigate('/members') },
//         { label: 'Add New Member', action: () => navigate('/members?action=new') },
//         { label: 'Active Memberships', action: () => navigate('/memberships') },
//         { label: 'Add New Memberships Plan', action: () => navigate('/memberships') }
//       ]
//     },
//     { 
//       id: 'users',
//       title: 'User Management', 
//       icon: <UserCog className="h-5 w-5" />, 
//       color: 'purple',
//       description: 'Manage user accounts and roles.',
//       options: [
//         { label: 'View All Users', action: () => navigate('/users') },
//         { label: 'Add New User', action: () => navigate('/users?action=new') },
//         { label: 'Role Management', action: () => navigate('/users?tab=roles') },
//         { label: 'Access Control', action: () => navigate('/users?tab=access') }
//       ]
//     },
//     { 
//       id: 'reports',
//       title: 'Financial Reports', 
//       icon: <FileText className="h-5 w-5" />, 
//       color: 'green',
//       description: 'View financial reports and analytics.',
//       options: [
//         { label: 'Revenue Reports', action: () => navigate('/reports?type=revenue') },
//         { label: 'Expense Reports', action: () => navigate('/reports?type=expenses') },
//         { label: 'Member Payments', action: () => navigate('/reports?type=payments') },
//         { label: 'Financial Analytics', action: () => navigate('/reports?type=analytics') }
//       ]
//     },
//     { 
//       id: 'bookings',
//       title: 'Booking Controller', 
//       icon: <Calendar className="h-5 w-5" />, 
//       color: 'blue',
//       description: 'Manage court bookings and schedules.',
//       options: [
//         { label: 'Add New Booking', action: () => navigate('/bookings?action=new') },
//         { label: 'View All Bookings', action: () => navigate('/bookings') },
//         { label: 'Advanced Booking', action: () => navigate('/bookings?type=advanced') },
//         { label: 'Booking Reports', action: () => navigate('/reports?type=bookings') }
//       ]
//     }
//   ];

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case 'alert': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
//       case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
//       case 'info': return <Info className="h-5 w-5 text-blue-500" />;
//       default: return <Info className="h-5 w-5 text-gray-500" />;
//     }
//   };

//   const getActivityIcon = (type) => {
//     switch (type) {
//       case 'user': return <Users className="h-5 w-5" />;
//       case 'member': return <Users className="h-5 w-5" />;
//       case 'security': return <Shield className="h-5 w-5" />;
//       case 'error': return <AlertTriangle className="h-5 w-5" />;
//       default: return <Database className="h-5 w-5" />;
//     }
//   };

//   const getActivityTypeColor = (type) => {
//     switch (type) {
//       case 'user': return 'bg-blue-800 text-blue-200';
//       case 'member': return 'bg-blue-800 text-blue-200';
//       case 'security': return 'bg-red-800 text-red-200';
//       case 'error': return 'bg-yellow-800 text-yellow-200';
//       default: return 'bg-green-800 text-green-200';
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const container = {
//     hidden: { opacity: 0 },
//     show: { opacity: 1, transition: { staggerChildren: 0.1 } },
//   };

//   const item = {
//     hidden: { y: 20, opacity: 0 },
//     show: { y: 0, opacity: 1 },
//   };

//   const modalVariants = {
//     hidden: { opacity: 0, scale: 0.95 },
//     visible: { opacity: 1, scale: 1 }
//   };

//   if (loading) {
//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50"
//       >
//         <div className="flex items-center justify-center min-h-screen">
//           <p className="text-xl font-semibold text-gray-800">Loading dashboard data...</p>
//         </div>
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50 text-gray-900"
//     >
//       <div className="flex justify-between items-center mb-8">
//         <motion.h1 
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="text-3xl font-bold text-gray-800">
//           Admin Dashboard
//         </motion.h1>
        
//         <motion.div
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           className="flex items-center gap-4"
//         >
//           <div className="flex items-center space-x-4">
//             <Clock className="text-gray-500" />
//             <span className="text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
//           </div>
//         </motion.div>
//       </div>
      
//       <motion.div 
//         variants={container}
//         initial="hidden"
//         animate="show"
//         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
//       >
//         {[
//           { icon: <Activity className="text-emerald-500" />, title: 'Active Courts', value: stats.activeCourts, subtitle: 'Courts in use' },
//           { icon: <Users className="text-blue-500" />, title: 'Members', value: stats.members, subtitle: 'Active members' },
//           { icon: <ArrowUpRight className="text-green-500" />, title: 'Total In', value: formatCurrency(stats.totalIn), subtitle: 'All time income' },
//           { icon: <ArrowDownRight className="text-red-500" />, title: 'Total Out', value: formatCurrency(stats.totalOut), subtitle: 'All time expenses' }
//         ].map((stat) => (
//           <motion.div
//             key={stat.title}
//             variants={item}
//             whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
//             className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all"
//           >
//             <div className="flex items-center">
//               <motion.div 
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.1 }}
//                 className="p-3 rounded-full bg-gray-100"
//               >
//                 {stat.icon}
//               </motion.div>
//               <div className="ml-4">
//                 <h3 className="text-sm text-gray-600">{stat.title}</h3>
//                 <motion.p 
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   className="text-xl font-semibold text-gray-800"
//                 >
//                   {stat.value}
//                 </motion.p>
//                 <p className="text-sm text-gray-500">{stat.subtitle}</p>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </motion.div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
//           <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
//             {courtStatuses.map((court) => (
//               <motion.div
//                 key={court.number}
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
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
//           initial={{ x: 20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="rounded-xl bg-white p-6 shadow-lg"
//         >
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
//           <div className="grid grid-cols-2 gap-4">
//             {quickActions.map((action) => (
//               <motion.button
//                 key={action.id}
//                 initial={{ scale: 0.95, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => setActiveModal(action.id)}
//                 className={`p-4 rounded-lg bg-gray-900 text-white hover:bg-${action.color}-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
//               >
//                 {action.icon}
//                 <span className="text-sm">{action.title}</span>
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       </div>

//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.5 }}
//         className="rounded-xl bg-white p-6 shadow-lg mt-6 mb-6"
//       >
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
//           <div className="flex items-center gap-4">
//             <select
//               value={chartType}
//               onChange={(e) => setChartType(e.target.value)}
//               className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//             >
//               <option value="bar">Bar Chart</option>
//               <option value="line">Line Chart</option>
//               <option value="pie">Pie Chart</option>
//             </select>
//           </div>
//         </div>

//         <RevenueChart data={revenueData} chartType={chartType} />
//       </motion.div>

//       <AnimatePresence>
//         {activeModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
//             onClick={() => setActiveModal(null)}
//           >
//             <motion.div
//               variants={modalVariants}
//               initial="hidden"
//               animate="visible"
//               exit="hidden"
//               onClick={e => e.stopPropagation()}
//               className="bg-gray-800 rounded-xl p-6 w-full max-w-md text-white"
//             >
//               {quickActions.map(action => {
//                 if (action.id === activeModal) {
//                   return (
//                     <div key={action.id}>
//                       <div className="flex justify-between items-center mb-4">
//                         <div className="flex items-center gap-2">
//                           {action.icon}
//                           <h3 className="text-xl font-semibold">{action.title}</h3>
//                         </div>
//                         <button
//                           onClick={() => setActiveModal(null)}
//                           className="p-1 hover:bg-gray-700 rounded-full"
//                         >
//                           <X className="h-5 w-5" />
//                         </button>
//                       </div>
//                       <p className="text-gray-400 mb-4">{action.description}</p>
//                       <div className="space-y-2">
//                         {action.options.map((option) => (
//                           <motion.button
//                             key={option.label}
//                             initial={{ x: -20, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             transition={{ delay: 0.1 }}
//                             onClick={option.action}
//                             className="w-full p-3 text-left rounded-lg hover:bg-gray-700 flex items-center justify-between group"
//                           >
//                             <span className="text-gray-200">{option.label}</span>
//                             <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
//                           </motion.button>
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 }
//                 return null;
//               })}
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// export default AdminDashboard;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Users, Calendar, DollarSign, UserCog, FileText, Bell, X, ChevronRight, 
  AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RevenueChart from './RevenueChart';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [stats, setStats] = useState({
    activeCourts: '0/5',
    members: 0,
    revenue: 0,
    currentBalance: 0,
    totalIn: 0,
    totalOut: 0
  });
  const [courtStatuses, setCourtStatuses] = useState([]);
  const [futureBookings, setFutureBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [revenueData, setRevenueData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [dashboardStats, balanceRes, totalInRes, totalOutRes, courtStatusRes, futureBookingsRes, membersRes, revenueOverviewRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/reports/current-balance'),
        api.get('/api/reports/total-in'),
        api.get('/api/reports/total-out'),
        api.get('/api/bookings/courts/status'),
        api.get('/api/bookings/future'),
        api.get('/api/members'),
        api.get('/api/reports/revenue-overview')
      ]);

      setStats({
        activeCourts: dashboardStats.data.activeCourts,
        members: dashboardStats.data.members,
        revenue: dashboardStats.data.revenue,
        currentBalance: balanceRes.data.currentBalance,
        totalIn: totalInRes.data.totalIn,
        totalOut: totalOutRes.data.totalOut
      });
      setCourtStatuses(courtStatusRes.data);
      setFutureBookings(futureBookingsRes.data.slice(0, 5));
      setMembers(membersRes.data);
      setRevenueData(revenueOverviewRes.data.monthlyData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const handleCourtStatusUpdate = async (courtNumber, newStatus) => {
    try {
      await api.put(`/api/bookings/courts/${courtNumber}/status`, { isActive: newStatus });
      setCourtStatuses(prev => prev.map(court => 
        court.number === courtNumber ? { ...court, isActive: newStatus } : court
      ));
      const dashboardStats = await api.get('/api/dashboard/stats');
      setStats(prev => ({ ...prev, activeCourts: dashboardStats.data.activeCourts }));
    } catch (error) {
      console.error('Error updating court status:', error);
    }
  };

  const quickActions = [
    { id: 'members', title: 'Members', icon: <Users className="h-5 w-5 text-indigo-500" />, color: 'indigo', options: [
      { label: 'View All', action: () => navigate('/members') },
      { label: 'Add New', action: () => navigate('/members?action=new') }
    ]},
    { id: 'users', title: 'Users', icon: <UserCog className="h-5 w-5 text-purple-500" />, color: 'purple', options: [
      { label: 'View All', action: () => navigate('/users') },
      { label: 'Add New', action: () => navigate('/users?action=new') }
    ]},
    { id: 'reports', title: 'Reports', icon: <FileText className="h-5 w-5 text-green-500" />, color: 'green', options: [
      { label: 'Revenue', action: () => navigate('/reports?type=revenue') },
      { label: 'Expenses', action: () => navigate('/reports?type=expenses') }
    ]},
    { id: 'bookings', title: 'Bookings', icon: <Calendar className="h-5 w-5 text-blue-500" />, color: 'blue', options: [
      { label: 'Add New', action: () => navigate('/bookings?action=new') },
      { label: 'View All', action: () => navigate('/bookings') }
    ]}
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-700">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <motion.h1 
          initial={{ y: -30 }} 
          animate={{ y: 0 }} 
          transition={{ type: 'spring', stiffness: 120 }}
          className="text-4xl font-bold text-gray-800"
        >
          Admin Dashboard
        </motion.h1>
        <motion.div 
          initial={{ y: -30 }} 
          animate={{ y: 0 }} 
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 text-gray-600"
        >
          <Clock className="h-5 w-5" />
          <span className="text-sm">{new Date().toLocaleTimeString()}</span>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Cards */}
        <motion.div 
          className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { icon: <Activity className="h-6 w-6 text-teal-600" />, title: 'Active Courts', value: stats.activeCourts, bg: 'bg-teal-50' },
            { icon: <Users className="h-6 w-6 text-blue-600" />, title: 'Members', value: stats.members, bg: 'bg-blue-50' },
            { icon: <ArrowUpRight className="h-6 w-6 text-green-600" />, title: 'Total In', value: formatCurrency(stats.totalIn), bg: 'bg-green-50' },
            { icon: <ArrowDownRight className="h-6 w-6 text-red-600" />, title: 'Total Out', value: formatCurrency(stats.totalOut), bg: 'bg-red-50' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
              className={`${stat.bg} p-6 rounded-2xl bg-opacity-80 backdrop-blur-md shadow-md transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                {stat.icon}
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map(action => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveModal(action.id)}
                className={`bg-${action.color}-100 text-${action.color}-700 p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-${action.color}-200 transition-all`}
              >
                {action.icon}
                <span className="text-sm font-medium">{action.title}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Court Maintenance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Court Maintenance</h2>
          <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
            {courtStatuses.map(court => (
              <motion.div
                key={court.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${court.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    {court.isActive ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Court {court.number}</p>
                    <p className="text-xs text-gray-500">{court.isActive ? 'Active' : 'Maintenance'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCourtStatusUpdate(court.number, !court.isActive)}
                  className={`px-4 py-1 rounded-full text-sm font-medium ${court.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-all`}
                >
                  {court.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Revenue Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white bg-opacity-70 backdrop-blur-md p-6 rounded-2xl shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </div>
          <RevenueChart data={revenueData} chartType={chartType} />
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="bg-white bg-opacity-90 backdrop-blur-md p-6 rounded-2xl shadow-xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {quickActions.map(action => action.id === activeModal && (
                <div key={action.id}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <h3 className="text-xl font-semibold text-gray-800">{action.title}</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {action.options.map(option => (
                      <motion.button
                        key={option.label}
                        whileHover={{ x: 10, backgroundColor: '#f3f4f6' }}
                        onClick={option.action}
                        className="w-full p-3 text-left rounded-lg bg-gray-100 text-gray-700 flex justify-between items-center transition-all"
                      >
                        <span>{option.label}</span>
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
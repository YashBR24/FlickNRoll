// import React, { useState, useEffect } from 'react';
// import { User, Search, Filter, Edit, ChevronUp, UserPlus, X } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import api from '../utils/api';

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [memberships, setMemberships] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showPromoteModal, setShowPromoteModal] = useState(false);
//   const [showMakeMemberModal, setShowMakeMemberModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const usersResponse = await api.get('/api/users');
//         console.log('Users Response:', usersResponse.data);
//         setUsers(usersResponse.data);

//         // const membershipsResponse = await api.get('/api/memberships');
//         // console.log('Memberships Response:', membershipsResponse.data);
//         // setMemberships(membershipsResponse.data);
//       } catch (error) {
//         console.error('Error fetching data:', error.response?.data || error.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleUpdateUser = async () => {
//     if (!selectedUser) return;

//     try {
//       const response = await api.put(`/api/users/${selectedUser.id}`, {
//         name: selectedUser.name,
//       });
//       console.log('Update User Response:', response.data);
//       const updatedUser = response.data;
//       setUsers(users.map(u => 
//         u.id === selectedUser.id ? { ...u, name: updatedUser.name } : u
//       ));
//       setShowEditModal(false);
//       setSelectedUser(null);
//     } catch (error) {
//       console.error('Error updating user:', error.response?.data || error.message);
//     }
//   };

//   const handlePromoteUser = async () => {
//     if (!selectedUser) return;

//     try {
//       const response = await api.put(`/api/users/promote/${selectedUser.id}`, { // Fixed URL to match route
//         role: selectedUser.role.toLowerCase(),
//         ...(selectedUser.role.toLowerCase() === 'member' && {
//           membershipId: selectedUser.membership,
//           paymentMethod: selectedUser.paymentMethod,
//           phone: selectedUser.phone,
//           address: selectedUser.address,
//           emergencyContactName: selectedUser.emergencyContactName,
//           emergencyContactNumber: selectedUser.emergencyContactNumber,
//         }),
//       });
//       console.log('Promote User Response:', response.data);
//       const updatedUser = response.data;
//       setUsers(users.map(u => 
//         u.id === selectedUser.id ? { ...u, role: updatedUser.role, isMember: updatedUser.isMember } : u
//       ));
//       setShowPromoteModal(false);
//       setSelectedUser(null);
//     } catch (error) {
//       console.error('Error promoting user:', error.response?.data || error.message);
//     }
//   };

//   const handleMakeMember = async () => {
//     if (!selectedUser || !selectedUser.membership) return;

//     try {
//       const response = await api.post('/api/members', {
//         email: selectedUser.email,
//         membership: selectedUser.membership,
//         phone: selectedUser.phone || '',
//         address: selectedUser.address || '',
//         emergencyContact: {
//           contactName: selectedUser.emergencyContactName || '',
//           contactNumber: selectedUser.emergencyContactNumber || '',
//         },
//         paymentMethod: selectedUser.paymentMethod || 'Cash',
//       });
//       console.log('Make Member Response:', response.data);
//       const addedMember = response.data.member || response.data;
//       setUsers(users.map(u => 
//         u.id === selectedUser.id ? { ...u, isMember: true, role: 'member' } : u
//       ));
//       setShowMakeMemberModal(false);
//       setSelectedUser(null);
//     } catch (error) {
//       console.error('Error making member:', error.response?.data || error.message);
//     }
//   };

//   const filteredUsers = users.filter(user => {
//     if (!user) return false;
//     return (
//       (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   });

//   const stats = users.length > 0 ? {
//     total: users.length,
//     members: users.filter(u => u.isMember).length,
//   } : { total: 0, members: 0 };

//   if (loading) {
//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="p-6 max-w-7xl mx-auto"
//       >
//         <p>Loading users...</p>
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="p-6 max-w-7xl mx-auto"
//     >
//       <motion.h1 
//         initial={{ y: -20 }}
//         animate={{ y: 0 }}
//         className="text-3xl font-bold text-gray-800 mb-8"
//       >
//         User Management
//       </motion.h1>

//       <motion.div 
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.1 }}
//         className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
//       >
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.1 }}
//           whileHover={{ scale: 1.02 }}
//           className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//         >
//           <div className="flex items-center">
//             <User className="h-10 w-10 text-blue-500" />
//             <div className="ml-4">
//               <p className="text-gray-600">Total Users</p>
//               <p className="text-2xl font-semibold text-gray-800">{stats.total}</p>
//             </div>
//           </div>
//         </motion.div>
//         <motion.div
//           initial={{ x: -20, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ delay: 0.2 }}
//           whileHover={{ scale: 1.02 }}
//           className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
//         >
//           <div className="flex items-center">
//             <User className="h-10 w-10 text-green-500" />
//             <div className="ml-4">
//               <p className="text-gray-600">Members</p>
//               <p className="text-2xl font-semibold text-gray-800">{stats.members}</p>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>

//       <motion.div 
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.3 }}
//         className="rounded-xl bg-white shadow-lg overflow-hidden"
//       >
//         <div className="p-6">
//           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
//             <div className="flex items-center w-full sm:w-auto">
//               <div className="relative w-full sm:w-64">
//                 <input
//                   type="text"
//                   placeholder="Search users..F."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
//                 />
//                 <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//               </div>
//               <button className="ml-2 p-2 text-gray-400 hover:text-gray-600">
//                 <Filter className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-gray-200">
//                   <th className="text-left py-3 px-4 text-gray-600">Name</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Email</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Role</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredUsers.map((user) => (
//                   <motion.tr
//                     key={user.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     className="border-b border-gray-200 hover:bg-gray-50"
//                   >
//                     <td className="py-3 px-4 text-gray-800">{user.name}</td>
//                     <td className="py-3 px-4 text-gray-600">{user.email}</td>
//                     <td className="py-3 px-4">
//                       <span className={`px-3 py-1 rounded-full text-sm capitalize ${
//                         user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
//                         user.role === 'manager' ? 'bg-green-100 text-green-700' :
//                         user.role === 'member' ? 'bg-blue-100 text-blue-700' : 
//                         'bg-gray-100 text-gray-700'
//                       }`}>
//                         {user.role}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <motion.button
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.9 }}
//                           onClick={() => {
//                             setSelectedUser(user);
//                             setShowEditModal(true);
//                           }}
//                           className="p-1 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
//                         >
//                           <Edit className="h-4 w-4" />
//                         </motion.button>
//                         <motion.button
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.9 }}
//                           onClick={() => {
//                             setSelectedUser({ ...user, membership: '', paymentMethod: 'Cash', phone: '', address: '', emergencyContactName: '', emergencyContactNumber: '' });
//                             setShowPromoteModal(true);
//                           }}
//                           className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
//                         >
//                           <ChevronUp className="h-4 w-4" />
//                         </motion.button>
//                         {/* {!user.isMember && (
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             onClick={() => {
//                               setSelectedUser({ ...user, membership: '', phone: '', address: '', emergencyContactName: '', emergencyContactNumber: '', paymentMethod: 'Cash' });
//                               setShowMakeMemberModal(true);
//                             }}
//                             className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
//                           >
//                             <UserPlus className="h-4 w-4" />
//                           </motion.button>
//                         )} */}
//                       </div>
//                     </td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </motion.div>

//       {/* Edit User Modal */}
//       <AnimatePresence>
//         {showEditModal && selectedUser && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white rounded-xl p-6 w-full max-w-md"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold">Edit User</h3>
//                 <button
//                   onClick={() => {
//                     setShowEditModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                   <input
//                     type="text"
//                     value={selectedUser.name}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                   <input
//                     type="email"
//                     value={selectedUser.email}
//                     disabled
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowEditModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpdateUser}
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                 >
//                   Update User
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Promote User Modal */}
//       <AnimatePresence>
//         {showPromoteModal && selectedUser && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white rounded-xl p-6 w-full max-w-md"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold">Promote User</h3>
//                 <button
//                   onClick={() => {
//                     setShowPromoteModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                   <input
//                     type="text"
//                     value={selectedUser.name}
//                     disabled
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                   <input
//                     type="email"
//                     value={selectedUser.email}
//                     disabled
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//                   <select
//                     value={selectedUser.role}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   >
//                     <option value="user">user</option>
//                     <option value="manager">manager</option>
//                     <option value="admin">admin</option>
//                     {/* <option value="member">member</option> */}
//                   </select>
//                 </div>
//                 {/* {selectedUser.role === 'member' && (
//                   <>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
//                       <select
//                         value={selectedUser.membership}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, membership: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       >
//                         <option value="">Select Membership</option>
//                         {memberships.map(membership => (
//                           <option key={membership._id} value={membership._id}>
//                             {membership.name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
//                       <select
//                         value={selectedUser.paymentMethod}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, paymentMethod: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       >
//                         <option value="Cash">Cash</option>
//                         <option value="UPI">UPI</option>
//                         <option value="Card">Card</option>
//                         <option value="other">Other</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                       <input
//                         type="tel"
//                         value={selectedUser.phone}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//                       <input
//                         type="text"
//                         value={selectedUser.address}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
//                       <input
//                         type="text"
//                         value={selectedUser.emergencyContactName}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, emergencyContactName: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
//                       <input
//                         type="tel"
//                         value={selectedUser.emergencyContactNumber}
//                         onChange={(e) => setSelectedUser({ ...selectedUser, emergencyContactNumber: e.target.value })}
//                         className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                       />
//                     </div>
//                   </>
//                 )} */}
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowPromoteModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handlePromoteUser}
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   Promote User
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Make Member Modal */}
//       {/* <AnimatePresence>
//         {showMakeMemberModal && selectedUser && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white rounded-xl p-6 w-full max-w-md"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold">Make User a Member</h3>
//                 <button
//                   onClick={() => {
//                     setShowMakeMemberModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                   <input
//                     type="text"
//                     value={selectedUser.name}
//                     disabled
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                   <input
//                     type="email"
//                     value={selectedUser.email}
//                     disabled
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
//                   <select
//                     value={selectedUser.membership}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, membership: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   >
//                     <option value="">Select Membership</option>
//                     {memberships.map(membership => (
//                       <option key={membership._id} value={membership._id}>
//                         {membership.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                   <input
//                     type="tel"
//                     value={selectedUser.phone}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//                   <input
//                     type="text"
//                     value={selectedUser.address}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
//                   <input
//                     type="text"
//                     value={selectedUser.emergencyContactName}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, emergencyContactName: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
//                   <input
//                     type="tel"
//                     value={selectedUser.emergencyContactNumber}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, emergencyContactNumber: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
//                   <select
//                     value={selectedUser.paymentMethod}
//                     onChange={(e) => setSelectedUser({ ...selectedUser, paymentMethod: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   >
//                     <option value="Cash">Cash</option>
//                     <option value="UPI">UPI</option>
//                     <option value="Card">Card</option>
//                     <option value="other">Other</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowMakeMemberModal(false);
//                     setSelectedUser(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleMakeMember}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Make Member
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence> */}
//     </motion.div>
//   );
// };

// export default Users;


import React, { useState, useEffect } from 'react';
import { User, Search, Filter, Edit, ChevronUp, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResponse = await api.get('/api/users');
        console.log('Users Response:', usersResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.put(`/api/users/${selectedUser.id}`, {
        name: selectedUser.name,
      });
      console.log('Update User Response:', response.data);
      const updatedUser = response.data;
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, name: updatedUser.name } : u
      ));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error.response?.data || error.message);
    }
  };

  const handlePromoteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.put(`/api/users/promote/${selectedUser.id}`, {
        role: selectedUser.role.toLowerCase(),
      });
      console.log('Promote User Response:', response.data);
      const updatedUser = response.data;
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: updatedUser.role } : u
      ));
      setShowPromoteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error promoting user:', error.response?.data || error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;
    return (
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = users.length > 0 ? {
    total: users.length,
    members: users.filter(u => u.isMember).length,
  } : { total: 0, members: 0 };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 max-w-7xl mx-auto"
      >
        <p>Loading users...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <motion.h1 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-3xl font-bold text-gray-800 mb-8"
      >
        User Management
      </motion.h1>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center">
            <User className="h-10 w-10 text-blue-500" />
            <div className="ml-4">
              <p className="text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.total}</p>
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
            <User className="h-10 w-10 text-green-500" />
            <div className="ml-4">
              <p className="text-gray-600">Members</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.members}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-white shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button className="ml-2 p-2 text-gray-400 hover:text-gray-600">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'manager' ? 'bg-green-100 text-green-700' :
                        user.role === 'member' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${
                        user.isVerified ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedUser({ ...user, membership: '', paymentMethod: 'Cash', phone: '', address: '', emergencyContactName: '', emergencyContactNumber: '' });
                            setShowPromoteModal(true);
                          }}
                          className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Update User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promote User Modal */}
      <AnimatePresence>
        {showPromoteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Promote User</h3>
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="user">user</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromoteUser}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Promote User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Users;
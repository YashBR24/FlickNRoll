// import React, { useState, useEffect } from 'react';
// import { Package, RefreshCw, AlertTriangle, Edit, Trash2, X, Search, Filter, Plus, CheckCircle } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import api from '../utils/api';

// const Inventory = () => {
//   const [inventory, setInventory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showInUseModal, setShowInUseModal] = useState(false);
//   const [showAddQuantityModal, setShowAddQuantityModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [editMode, setEditMode] = useState(false);
//   const [inUseQuantity, setInUseQuantity] = useState(0);
//   const [addQuantity, setAddQuantity] = useState(0);

//   const [newItem, setNewItem] = useState({
//     name: '',
//     category: 'Equipment',
//     totalQuantity: 0, // Renamed to totalQuantity for clarity
//   });

//   const LOW_QUANTITY_THRESHOLD = 5;

//   useEffect(() => {
//     const fetchInventory = async () => {
//       try {
//         const response = await api.get('/api/inventory');
//         setInventory(
//           response.data.map(item => ({
//             id: item._id,
//             name: item.item || '',
//             category: item.category || 'Equipment',
//             totalQuantity: item.quantity || 0, // Use totalQuantity instead of quantity
//             inUse: item.inUse || 0,
//           }))
//         );
//       } catch (error) {
//         console.error('Error fetching inventory:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchInventory();
//   }, []);

//   // Calculate remaining quantity and status
//   const getRemainingQuantity = (item) => {
//     return (item.totalQuantity || 0) - (item.inUse || 0);
//   };

//   const getItemStatus = (item) => {
//     const remainingQty = getRemainingQuantity(item);
//     if (remainingQty === 0) return 'Out of Stock';
//     if (remainingQty < LOW_QUANTITY_THRESHOLD) return 'Low Quantity';
//     return 'In Stock';
//   };

//   const handleAddItem = async () => {
//     if (!newItem.name || newItem.totalQuantity < 0) {
//       console.error('Please provide a valid item name and quantity.');
//       return;
//     }

//     try {
//       const response = await api.post('/api/inventory', {
//         item: newItem.name,
//         category: newItem.category,
//         quantity: newItem.totalQuantity, // Send as quantity to backend
//         inUse: 0,
//         notes: '',
//       });
//       const addedItem = response.data;
//       setInventory([
//         ...inventory,
//         {
//           id: addedItem._id,
//           name: addedItem.item || '',
//           category: addedItem.category || 'Equipment',
//           totalQuantity: addedItem.quantity || 0,
//           inUse: addedItem.inUse || 0,
//         },
//       ]);
//       setShowAddModal(false);
//       setNewItem({ name: '', category: 'Equipment', totalQuantity: 0 });
//       console.log('Item added successfully!');
//     } catch (error) {
//       console.error('Error adding item:', error.response?.data || error.message);
//     }
//   };

//   const handleDeleteItem = async () => {
//     if (!selectedItem) return;

//     try {
//       await api.delete(`/api/inventory/${selectedItem.id}`);
//       setInventory(inventory.filter(item => item.id !== selectedItem.id));
//       setShowDeleteModal(false);
//       setSelectedItem(null);
//       console.log('Item deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting item:', error.response?.data || error.message);
//     }
//   };

//   const handleUpdateItem = async () => {
//     if (!selectedItem || !selectedItem.name || selectedItem.totalQuantity < 0) {
//       console.error('Please provide a valid item name and quantity.');
//       return;
//     }

//     try {
//       const response = await api.put(`/api/inventory/${selectedItem.id}`, {
//         item: selectedItem.name,
//         category: selectedItem.category,
//         quantity: selectedItem.totalQuantity, // Send as quantity to backend
//         inUse: selectedItem.inUse,
//         notes: '',
//       });
//       const updatedItem = response.data;
//       setInventory(
//         inventory.map(item =>
//           item.id === selectedItem.id
//             ? {
//                 id: updatedItem._id,
//                 name: updatedItem.item || '',
//                 category: updatedItem.category || 'Equipment',
//                 totalQuantity: updatedItem.quantity || 0,
//                 inUse: updatedItem.inUse || 0,
//               }
//             : item
//         )
//       );
//       setEditMode(false);
//       setSelectedItem(null);
//       console.log('Item updated successfully!');
//     } catch (error) {
//       console.error('Error updating item:', error.response?.data || error.message);
//     }
//   };

//   const handleMarkInUse = (item) => {
//     setSelectedItem(item);
//     setInUseQuantity(0);
//     setShowInUseModal(true);
//   };

//   const handleSubmitInUse = async () => {
//     if (!selectedItem || inUseQuantity <= 0) {
//       console.error('Please enter a valid quantity to mark as in use.');
//       return;
//     }

//     const remainingQty = getRemainingQuantity(selectedItem);
//     if (inUseQuantity > remainingQty) {
//       console.error(`Cannot mark ${inUseQuantity} items in use. Only ${remainingQty} are available.`);
//       return;
//     }

//     try {
//       const response = await api.put(`/api/inventory/in-use/${selectedItem.id}`, {
//         quantity: inUseQuantity,
//       });
//       const updatedItem = response.data;
//       setInventory(
//         inventory.map(i =>
//           i.id === selectedItem.id
//             ? {
//                 ...i,
//                 inUse: updatedItem.inUse || 0,
//                 totalQuantity: updatedItem.quantity || 0,
//               }
//             : i
//         )
//       );
//       setShowInUseModal(false);
//       setSelectedItem(null);
//       setInUseQuantity(0);
//       console.log('Items marked as in use successfully!');
//     } catch (error) {
//       console.error('Error marking item in use:', error.response?.data || error.message);
//     }
//   };

//   const handleAddQuantity = async () => {
//     if (!selectedItem || addQuantity <= 0) {
//       console.error('Please enter a valid quantity to add.');
//       return;
//     }

//     try {
//       const response = await api.put(`/api/inventory/${selectedItem.id}`, {
//         item: selectedItem.name,
//         category: selectedItem.category,
//         quantity: selectedItem.totalQuantity + addQuantity, // Update totalQuantity
//         inUse: selectedItem.inUse,
//         notes: selectedItem.notes || '',
//       });
//       const updatedItem = response.data;
//       setInventory(
//         inventory.map(item =>
//           item.id === selectedItem.id
//             ? {
//                 id: updatedItem._id,
//                 name: updatedItem.item || '',
//                 category: updatedItem.category || 'Equipment',
//                 totalQuantity: updatedItem.quantity || 0,
//                 inUse: updatedItem.inUse || 0,
//               }
//             : item
//         )
//       );
//       setShowAddQuantityModal(false);
//       setSelectedItem(null);
//       setAddQuantity(0);
//       console.log('Quantity added successfully!');
//     } catch (error) {
//       console.error('Error adding quantity:', error.response?.data || error.message);
//     }
//   };

//   const handleAddMoreItems = (item) => {
//     setSelectedItem(item);
//     setAddQuantity(0);
//     setShowAddQuantityModal(true);
//   };

//   const filteredInventory = inventory.filter(item => {
//     if (!item) return false;
//     return (
//       (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   });

//   if (loading) {
//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="p-6 max-w-7xl mx-auto bg-[#] text-292333"
//       >
//         <p>Loading inventory...</p>
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="p-6 max-w-7xl mx-auto bg-[#] text-292333"
//     >
//       <motion.h1
//         initial={{ y: -20 }}
//         animate={{ y: 0 }}
//         className="text-3xl font-bold mb-8"
//       >
//         Inventory Management
//       </motion.h1>

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
//                   placeholder="Search inventory..."
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
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => setShowAddModal(true)}
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
//             >
//               <Plus className="h-5 w-5" />
//               Add New Item
//             </motion.button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-gray-200">
//                   <th className="text-left py-3 px-4 text-gray-600">Item Name</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Category</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Avelable Quantity</th> {/* Updated header */}
//                   <th className="text-left py-3 px-4 text-gray-600">In Use</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Status</th>
//                   <th className="text-left py-3 px-4 text-gray-600">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredInventory.map((item) => {
//                   const remainingQty = getRemainingQuantity(item);
//                   const status = getItemStatus(item);
//                   return (
//                     <motion.tr
//                       key={item.id}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -20 }}
//                       className="border-b border-gray-200 hover:bg-gray-50"
//                     >
//                       <td className="py-3 px-4 text-gray-800">{item.name}</td>
//                       <td className="py-3 px-4 text-gray-600">{item.category}</td>
//                       <td className="py-3 px-4 text-gray-800">{remainingQty}</td> {/* Show remaining quantity */}
//                       <td className="py-3 px-4 text-gray-800">{item.inUse}</td>
//                       <td className="py-3 px-4">
//                         <span
//                           className={`px-3 py-1 rounded-full text-sm ${
//                             status === 'In Stock'
//                               ? 'bg-green-100 text-green-700'
//                               : status === 'Low Quantity'
//                               ? 'bg-orange-100 text-orange-700'
//                               : 'bg-red-100 text-red-700'
//                           }`}
//                         >
//                           {status}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center gap-2">
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             onClick={() => handleMarkInUse(item)}
//                             className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
//                           >
//                             <CheckCircle className="h-4 w-4" />
//                           </motion.button>
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             onClick={() => {
//                               setSelectedItem(item);
//                               setEditMode(true);
//                             }}
//                             className="p-1 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
//                           >
//                             <Edit className="h-4 w-4" />
//                           </motion.button>
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             onClick={() => {
//                               setSelectedItem(item);
//                               setShowDeleteModal(true);
//                             }}
//                             className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </motion.button>
//                           <motion.button
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             onClick={() => handleAddMoreItems(item)}
//                             className="p-1 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-50"
//                           >
//                             <Plus className="h-4 w-4" />
//                           </motion.button>
//                         </div>
//                       </td>
//                     </motion.tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </motion.div>

//       {/* Add Item Modal */}
//       <AnimatePresence>
//         {showAddModal && (
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
//                 <h3 className="text-xl font-semibold">Add New Item</h3>
//                 <button
//                   onClick={() => setShowAddModal(false)}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
//                   <input
//                     type="text"
//                     value={newItem.name}
//                     onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                   <select
//                     value={newItem.category}
//                     onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   >
//                     <option value="Equipment">Equipment</option>
//                     <option value="Accessories">Accessories</option>
//                     <option value="Safety">Safety</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label> {/* Updated label */}
//                   <input
//                     type="number"
//                     min="0"
//                     value={newItem.totalQuantity}
//                     onChange={(e) => setNewItem({ ...newItem, totalQuantity: parseInt(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => setShowAddModal(false)}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAddItem}
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                 >
//                   Add Item
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Edit Item Modal */}
//       <AnimatePresence>
//         {editMode && selectedItem && (
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
//                 <h3 className="text-xl font-semibold">Edit Item</h3>
//                 <button
//                   onClick={() => {
//                     setEditMode(false);
//                     setSelectedItem(null);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
//                   <input
//                     type="text"
//                     value={selectedItem.name}
//                     onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                   <select
//                     value={selectedItem.category}
//                     onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   >
//                     <option value="Equipment">Equipment</option>
//                     <option value="Accessories">Accessories</option>
//                     <option value="Safety">Safety</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label> {/* Updated label */}
//                   <input
//                     type="number"
//                     min="0"
//                     value={selectedItem.totalQuantity}
//                     onChange={(e) => setSelectedItem({ ...selectedItem, totalQuantity: parseInt(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setEditMode(false);
//                     setSelectedItem(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpdateItem}
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                 >
//                   Update Item
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Delete Confirmation Modal */}
//       <AnimatePresence>
//         {showDeleteModal && selectedItem && (
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
//               <div className="text-center">
//                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
//                   <Trash2 className="h-6 w-6 text-red-600" />
//                 </div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Item</h3>
//                 <p className="text-sm text-gray-500">
//                   Are you sure you want to delete {selectedItem.name}? This action cannot be undone.
//                 </p>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowDeleteModal(false);
//                     setSelectedItem(null);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDeleteItem}
//                   className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* In Use Confirmation Modal */}
//       <AnimatePresence>
//         {showInUseModal && selectedItem && (
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
//                 <h3 className="text-xl font-semibold">Mark Items In Use</h3>
//                 <button
//                   onClick={() => {
//                     setShowInUseModal(false);
//                     setSelectedItem(null);
//                     setInUseQuantity(0);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Number of Items to Mark In Use</label>
//                   <input
//                     type="number"
//                     min="0"
//                     max={getRemainingQuantity(selectedItem)}
//                     value={inUseQuantity}
//                     onChange={(e) => setInUseQuantity(parseInt(e.target.value) || 0)}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                   />
//                 </div>
//                 <p className="text-sm text-gray-500">
//                   Available: {getRemainingQuantity(selectedItem)}
//                 </p>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowInUseModal(false);
//                     setSelectedItem(null);
//                     setInUseQuantity(0);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSubmitInUse}
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   Confirm
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Add Quantity Modal */}
//       <AnimatePresence>
//         {showAddQuantityModal && selectedItem && (
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
//                 <h3 className="text-xl font-semibold">Add Items to Inventory</h3>
//                 <button
//                   onClick={() => {
//                     setShowAddQuantityModal(false);
//                     setSelectedItem(null);
//                     setAddQuantity(0);
//                   }}
//                   className="p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
//                   <input
//                     type="number"
//                     min="1"
//                     value={addQuantity}
//                     onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => {
//                     setShowAddQuantityModal(false);
//                     setSelectedItem(null);
//                     setAddQuantity(0);
//                   }}
//                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAddQuantity}
//                   className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//                 >
//                   Add Items
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// export default Inventory;


import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertTriangle, Edit, Trash2, X, Search, Filter, Plus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInUseModal, setShowInUseModal] = useState(false);
  const [showAddQuantityModal, setShowAddQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [inUseQuantity, setInUseQuantity] = useState(0);
  const [addQuantity, setAddQuantity] = useState(0);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Equipment',
    totalQuantity: 0,
  });

  const LOW_QUANTITY_THRESHOLD = 5;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/api/inventory');
        setInventory(
          response.data.map(item => ({
            id: item._id,
            name: item.item || '',
            category: item.category || 'Equipment',
            totalQuantity: item.quantity || 0,
            inUse: item.inUse || 0,
          }))
        );
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const getRemainingQuantity = (item) => {
    return (item.totalQuantity || 0) - (item.inUse || 0);
  };

  const getItemStatus = (item) => {
    const remainingQty = getRemainingQuantity(item);
    if (remainingQty === 0) return 'Out of Stock';
    if (remainingQty < LOW_QUANTITY_THRESHOLD) return 'Low Quantity';
    return 'In Stock';
  };

  const handleAddItem = async () => {
    if (!newItem.name || newItem.totalQuantity < 0) {
      console.error('Please provide a valid item name and quantity.');
      return;
    }

    try {
      const response = await api.post('/api/inventory', {
        item: newItem.name,
        category: newItem.category,
        quantity: newItem.totalQuantity,
        inUse: 0,
        notes: '',
      });
      const addedItem = response.data;
      setInventory([
        ...inventory,
        {
          id: addedItem._id,
          name: addedItem.item || '',
          category: addedItem.category || 'Equipment',
          totalQuantity: addedItem.quantity || 0,
          inUse: addedItem.inUse || 0,
        },
      ]);
      setShowAddModal(false);
      setNewItem({ name: '', category: 'Equipment', totalQuantity: 0 });
      console.log('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error.response?.data || error.message);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await api.delete(`/api/inventory/${selectedItem.id}`);
      setInventory(inventory.filter(item => item.id !== selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      console.log('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error.response?.data || error.message);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !selectedItem.name || selectedItem.totalQuantity < 0) {
      console.error('Please provide a valid item name and quantity.');
      return;
    }

    try {
      const response = await api.put(`/api/inventory/${selectedItem.id}`, {
        item: selectedItem.name,
        category: selectedItem.category,
        quantity: selectedItem.totalQuantity,
        inUse: selectedItem.inUse,
        notes: '',
      });
      const updatedItem = response.data;
      setInventory(
        inventory.map(item =>
          item.id === selectedItem.id
            ? {
                id: updatedItem._id,
                name: updatedItem.item || '',
                category: updatedItem.category || 'Equipment',
                totalQuantity: updatedItem.quantity || 0,
                inUse: updatedItem.inUse || 0,
              }
            : item
        )
      );
      setEditMode(false);
      setSelectedItem(null);
      console.log('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error.response?.data || error.message);
    }
  };

  const handleMarkInUse = (item) => {
    setSelectedItem(item);
    setInUseQuantity(0);
    setShowInUseModal(true);
  };

  const handleSubmitInUse = async () => {
    if (!selectedItem || inUseQuantity <= 0) {
      console.error('Please enter a valid quantity to mark as in use.');
      return;
    }

    const remainingQty = getRemainingQuantity(selectedItem);
    if (inUseQuantity > remainingQty) {
      console.error(`Cannot mark ${inUseQuantity} items in use. Only ${remainingQty} are available.`);
      return;
    }

    try {
      const response = await api.put(`/api/inventory/in-use/${selectedItem.id}`, {
        quantity: inUseQuantity,
      });
      const updatedItem = response.data;
      setInventory(
        inventory.map(i =>
          i.id === selectedItem.id
            ? {
                ...i,
                inUse: updatedItem.inUse || 0,
                totalQuantity: updatedItem.quantity || 0,
              }
            : i
        )
      );
      setShowInUseModal(false);
      setSelectedItem(null);
      setInUseQuantity(0);
      console.log('Items marked as in use successfully!');
    } catch (error) {
      console.error('Error marking item in use:', error.response?.data || error.message);
    }
  };

  const handleAddQuantity = async () => {
    if (!selectedItem || addQuantity <= 0) {
      console.error('Please enter a valid quantity to add.');
      return;
    }

    try {
      const response = await api.put(`/api/inventory/${selectedItem.id}`, {
        item: selectedItem.name,
        category: selectedItem.category,
        quantity: selectedItem.totalQuantity + addQuantity,
        inUse: selectedItem.inUse,
        notes: selectedItem.notes || '',
      });
      const updatedItem = response.data;
      setInventory(
        inventory.map(item =>
          item.id === selectedItem.id
            ? {
                id: updatedItem._id,
                name: updatedItem.item || '',
                category: updatedItem.category || 'Equipment',
                totalQuantity: updatedItem.quantity || 0,
                inUse: updatedItem.inUse || 0,
              }
            : item
        )
      );
      setShowAddQuantityModal(false);
      setSelectedItem(null);
      setAddQuantity(0);
      console.log('Quantity added successfully!');
    } catch (error) {
      console.error('Error adding quantity:', error.response?.data || error.message);
    }
  };

  const handleAddMoreItems = (item) => {
    setSelectedItem(item);
    setAddQuantity(0);
    setShowAddQuantityModal(true);
  };

  const filteredInventory = inventory.filter(item => {
    if (!item) return false;
    return (
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 max-w-7xl mx-auto bg-[#] text-292333"
      >
        <p>Loading inventory...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto bg-[#] text-292333"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Inventory Management
      </motion.h1>

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
                  placeholder="Search inventory..."
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New Item
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200"><th className="text-left py-3 px-4 text-gray-600">Item Name</th><th className="text-left py-3 px-4 text-gray-600">Category</th><th className="text-left py-3 px-4 text-gray-600">Available Quantity</th><th className="text-left py-3 px-4 text-gray-600">In Use</th><th className="text-left py-3 px-4 text-gray-600">Status</th><th className="text-left py-3 px-4 text-gray-600">Actions</th></tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const remainingQty = getRemainingQuantity(item);
                  const status = getItemStatus(item);
                  return (<motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  ><td className="py-3 px-4 text-gray-800">{item.name}</td><td className="py-3 px-4 text-gray-600">{item.category}</td><td className="py-3 px-4 text-gray-800">{remainingQty}</td><td className="py-3 px-4 text-gray-800">{item.inUse}</td><td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        status === 'In Stock'
                          ? 'bg-green-100 text-green-700'
                          : status === 'Low Quantity'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {status}
                    </span>
                  </td><td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMarkInUse(item)}
                        className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </motion.button>
                      {/* <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedItem(item);
                          setEditMode(true);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button> */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddMoreItems(item)}
                        className="p-1 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td></motion.tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
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
                <h3 className="text-xl font-semibold">Add New Item</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.totalQuantity}
                    onChange={(e) => setNewItem({ ...newItem, totalQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editMode && selectedItem && (
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
                <h3 className="text-xl font-semibold">Edit Item</h3>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedItem(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedItem.category}
                    onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedItem.totalQuantity}
                    onChange={(e) => setSelectedItem({ ...selectedItem, totalQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Update Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedItem && (
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
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Item</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedItem.name}? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In Use Confirmation Modal */}
      <AnimatePresence>
        {showInUseModal && selectedItem && (
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
                <h3 className="text-xl font-semibold">Mark Items In Use</h3>
                <button
                  onClick={() => {
                    setShowInUseModal(false);
                    setSelectedItem(null);
                    setInUseQuantity(0);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Items to Mark In Use</label>
                  <input
                    type="number"
                    min="0"
                    max={getRemainingQuantity(selectedItem)}
                    value={inUseQuantity}
                    onChange={(e) => setInUseQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Available: {getRemainingQuantity(selectedItem)}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowInUseModal(false);
                    setSelectedItem(null);
                    setInUseQuantity(0);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInUse}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Quantity Modal */}
      <AnimatePresence>
        {showAddQuantityModal && selectedItem && (
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
                <h3 className="text-xl font-semibold">Add Items to Inventory</h3>
                <button
                  onClick={() => {
                    setShowAddQuantityModal(false);
                    setSelectedItem(null);
                    setAddQuantity(0);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                  <input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddQuantityModal(false);
                    setSelectedItem(null);
                    setAddQuantity(0);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuantity}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Items
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Inventory;
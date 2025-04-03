import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, X, Search, Filter, UserCheck, UserX } from 'lucide-react'; // CreditCard for memberships
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api'; // Adjust path based on your structure

const Memberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newMembership, setNewMembership] = useState({
    name: '',
    description: '',
    totalHours: '',
    durationDays: '',
    price: '',
  });

  // Fetch memberships on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/memberships');
        console.log('Memberships Response:', response.data); // Debug response
        setMemberships(response.data.map(membership => ({
          id: membership._id,
          name: membership.name,
          description: membership.description,
          totalHours: membership.totalHours,
          durationDays: membership.durationDays,
          price: membership.price,
          createdBy: membership.createdBy,
          isActive: membership.isActive,
        })));
      } catch (error) {
        console.error('Error fetching memberships:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle adding a new membership via API
  const handleAddMembership = async () => {
    if (!newMembership.name || !newMembership.description || !newMembership.totalHours || !newMembership.durationDays || !newMembership.price) return;

    try {
      const response = await api.post('/api/memberships', {
        name: newMembership.name,
        description: newMembership.description,
        totalHours: parseInt(newMembership.totalHours, 10),
        durationDays: parseInt(newMembership.durationDays, 10),
        price: parseFloat(newMembership.price),
      });
      console.log('Add Membership Response:', response.data); // Debug response
      const addedMembership = response.data.membership || response.data;
      setMemberships([...memberships, {
        id: addedMembership._id,
        name: addedMembership.name,
        description: addedMembership.description,
        totalHours: addedMembership.totalHours,
        durationDays: addedMembership.durationDays,
        price: addedMembership.price,
        createdBy: addedMembership.createdBy,
        isActive: addedMembership.isActive,
      }]);
      setShowAddModal(false);
      setNewMembership({
        name: '',
        description: '',
        totalHours: '',
        durationDays: '',
        price: '',
      });
    } catch (error) {
      console.error('Error adding membership:', error.response?.data || error.message);
    }
  };

  // Handle updating a membership via API
  const handleUpdateMembership = async () => {
    if (!selectedMembership) return;

    try {
      const response = await api.put(`/api/memberships/${selectedMembership.id}`, {
        name: selectedMembership.name,
        description: selectedMembership.description,
        totalHours: parseInt(selectedMembership.totalHours, 10),
        durationDays: parseInt(selectedMembership.durationDays, 10),
        price: parseFloat(selectedMembership.price),
      });
      console.log('Update Membership Response:', response.data); // Debug response
      const updatedMembership = response.data;
      setMemberships(memberships.map(m => 
        m.id === selectedMembership.id ? {
          id: updatedMembership._id,
          name: updatedMembership.name,
          description: updatedMembership.description,
          totalHours: updatedMembership.totalHours,
          durationDays: updatedMembership.durationDays,
          price: updatedMembership.price,
          createdBy: updatedMembership.createdBy,
          isActive: updatedMembership.isActive,
        } : m
      ));
      setShowEditModal(false);
      setSelectedMembership(null);
    } catch (error) {
      console.error('Error updating membership:', error.response?.data || error.message);
    }
  };

  // Handle deleting a membership via API
  const handleDeleteMembership = async () => {
    if (!selectedMembership) return;

    try {
      await api.delete(`/api/memberships/${selectedMembership.id}`);
      setMemberships(memberships.filter(m => m.id !== selectedMembership.id));
      setShowDeleteModal(false);
      setSelectedMembership(null);
    } catch (error) {
      console.error('Error deleting membership:', error.response?.data || error.message);
    }
  };

  const filteredMemberships = memberships.filter(membership => {
    if (!membership) return false;
    return (
      (membership.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = memberships.length > 0 ? {
    total: memberships.length,
    active: memberships.filter(m => m.isActive).length,
    inactive: memberships.filter(m => !m.isActive).length,
  } : { total: 0, active: 0, inactive: 0 };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 max-w-7xl mx-auto"
      >
        <p>Loading memberships...</p>
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
        Membership Plans Management
      </motion.h1>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {[
          { icon: CreditCard, label: 'Total Memberships', value: stats.total, color: 'blue', key: 'total' },
          { icon: UserCheck, label: 'Active', value: stats.active, color: 'green', key: 'active' },
          { icon: UserX, label: 'Inactive', value: stats.inactive, color: 'red', key: 'inactive' },
        ].map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <stat.icon className={`h-10 w-10 text-${stat.color}-500`} />
              <div className="ml-4">
                <p className="text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
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
                  placeholder="Search memberships..."
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
              Add New Membership Plan
            </motion.button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-gray-600">Total Hours</th>
                  <th className="text-left py-3 px-4 text-gray-600">Duration (Days)</th>
                  <th className="text-left py-3 px-4 text-gray-600">Price</th>
                  <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map((membership) => (
                  <motion.tr
                    key={membership.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800">{membership.name}</td>
                    <td className="py-3 px-4 text-gray-600">{membership.totalHours}</td>
                    <td className="py-3 px-4 text-gray-600">{membership.durationDays}</td>
                    <td className="py-3 px-4 text-gray-600">₹{membership.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        membership.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {membership.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedMembership(membership);
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
                            setSelectedMembership(membership);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Membership Modal */}
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
                <h3 className="text-xl font-semibold">Add New Membership</h3>
                <button
                  onClick={() => setShowAddModal(false)}
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
                    value={newMembership.name}
                    onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newMembership.description}
                    onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                  <input
                    type="number"
                    value={newMembership.totalHours}
                    onChange={(e) => setNewMembership({ ...newMembership, totalHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={newMembership.durationDays}
                    onChange={(e) => setNewMembership({ ...newMembership, durationDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMembership.price}
                    onChange={(e) => setNewMembership({ ...newMembership, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
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
                  onClick={handleAddMembership}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Membership
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Membership Modal */}
      <AnimatePresence>
        {showEditModal && selectedMembership && (
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
                <h3 className="text-xl font-semibold">Edit Membership</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMembership(null);
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
                    value={selectedMembership.name}
                    onChange={(e) => setSelectedMembership({ ...selectedMembership, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={selectedMembership.description}
                    onChange={(e) => setSelectedMembership({ ...selectedMembership, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                  <input
                    type="number"
                    value={selectedMembership.totalHours}
                    onChange={(e) => setSelectedMembership({ ...selectedMembership, totalHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={selectedMembership.durationDays}
                    onChange={(e) => setSelectedMembership({ ...selectedMembership, durationDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedMembership.price}
                    onChange={(e) => setSelectedMembership({ ...selectedMembership, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMembership(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMembership}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Update Membership
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedMembership && (
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Membership</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedMembership.name}? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMembership(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMembership}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Memberships;
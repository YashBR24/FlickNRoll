import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Plus, X, Edit2, Trash2, Check, Clock, Calendar as CalendarIcon, Search, Filter, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parse, addHours, addMinutes, differenceInMinutes, isBefore, roundToNearestMinutes, addDays } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import TimePicker from './TimePicker';
import api from '../utils/api';
import Swal from 'sweetalert2';

const Bookings = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('today');
  const [bookings, setBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [bookingToMarkAsPaid, setBookingToMarkAsPaid] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const getDefaultTimes = () => {
    const now = new Date();
    const roundedStart = roundToNearestMinutes(now, { nearestTo: 15, roundingMethod: 'ceil' });
    const roundedEnd = addHours(roundedStart, 1);
    return {
      startTime: format(roundedStart, 'HH:mm'),
      endTime: format(roundedEnd, 'HH:mm'),
    };
  };

  const [newBooking, setNewBooking] = useState(() => {
    const { startTime, endTime } = getDefaultTimes();
    return {
      court: 1,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime,
      endTime,
      bookingType: 'general',
      players: [],
      name: '',
      paymentMethod: 'Cash',
      totalAmount: '',
      advancePayment: '',
    };
  });

  const [editBooking, setEditBooking] = useState(null);
  const [markAsPaidData, setMarkAsPaidData] = useState({
    paymentMethod: 'Cash',
  });
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    court: '',
    status: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchActiveMembers();
    fetchUsers();
  }, [filters, view, date]);

  const fetchActiveMembers = () => {
    api.get('/api/members')
      .then((response) => {
        const members = response.data.filter(member => 
          member.membershipStatus && member.membershipStatus.toLowerCase() === 'active'
        );
        setActiveMembers(members);
      })
      .catch((error) => {
        console.error('Error fetching members:', error);
        setActiveMembers([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    api.get('/api/users')
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error('Error fetching users:', error);
        setUsers([]);
      });
  };

  const fetchBookings = () => {
    setLoading(true);
    let { startDate, endDate, court, status } = filters;
    
    // Adjust filters based on view
    if (view === 'today') {
      startDate = format(date, 'yyyy-MM-dd');
      endDate = format(date, 'yyyy-MM-dd');
    } else if (view === 'next24') {
      startDate = format(date, 'yyyy-MM-dd');
      endDate = format(addDays(date, 1), 'yyyy-MM-dd');
    }

    let query = '/api/bookings?';
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}&`;
    if (court) query += `court=${court}&`;
    if (status) query += `status=${status}`;
    if (query.endsWith('&')) query = query.slice(0, -1);

    api.get(query)
      .then((response) => {
        setBookings(Array.isArray(response.data.bookings) ? response.data.bookings : []);
      })
      .catch((error) => {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 1.0;
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);
      const endDate = new Date(startDate);
      if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endDate.setHours(endHours, endMinutes, 0, 0);
      const durationMinutes = differenceInMinutes(endDate, startDate);
      return durationMinutes / 60;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 1.0;
    }
  };

  const validateBookingTime = (booking) => {
    const currentDate = new Date();
    const bookingDate = new Date(booking.date);
    const [startHours, startMinutes] = booking.startTime.split(':').map(Number);
    const bookingStartTime = new Date(bookingDate);
    bookingStartTime.setHours(startHours, startMinutes, 0, 0);
  
    const errors = [];
    
    if (format(bookingDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')) {
      if (isBefore(bookingStartTime, currentDate)) {
        errors.push(
          `Selected start time (${booking.startTime}) is in the past. Current time is ${format(
            currentDate,
            'hh:mm a'
          )}. Please select a future time.`
        );
      }
    }
  
    const [endHours, endMinutes] = booking.endTime.split(':').map(Number);
    const bookingEndTime = new Date(bookingDate);
    
    if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
      bookingEndTime.setDate(bookingEndTime.getDate() + 1);
    }
    bookingEndTime.setHours(endHours, endMinutes, 0, 0);
  
    if (isBefore(bookingEndTime, bookingStartTime)) {
      errors.push('End time cannot be before start time.');
    }
  
    return errors;
  };

  const validateBookingData = (booking) => {
    const errors = [];

    if (!booking.court) errors.push('court');
    if (!booking.date) errors.push('date');
    if (!booking.startTime) errors.push('start time');
    if (!booking.endTime) errors.push('end time');

    if (booking.bookingType === 'general') {
      if (!booking.name) errors.push('player name');
      if (booking.totalAmount === '' || isNaN(parseFloat(booking.totalAmount)) || parseFloat(booking.totalAmount) <= 0) {
        errors.push('valid total amount (greater than 0)');
      }
      const advancePaymentValue = booking.advancePayment === '' ? 0 : parseFloat(booking.advancePayment);
      if (isNaN(advancePaymentValue) || advancePaymentValue < 0) {
        errors.push('valid advance payment (non-negative)');
      }
      if (booking.totalAmount && booking.advancePayment && parseFloat(booking.advancePayment) > parseFloat(booking.totalAmount)) {
        errors.push('advance payment must be less than or equal to total amount');
      }
    } else if (booking.bookingType === 'member') {
      if (booking.players.length === 0) errors.push('member selection');
    }

    const timeErrors = validateBookingTime(booking);
    errors.push(...timeErrors);

    return errors;
  };

  const createNewBooking = () => {
    const errors = validateBookingData(newBooking);

    if (errors.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `Please correct the following issues:<br><ul className="list-disc list-inside">${errors.map(err => `<li>${err}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
        },
      });
      return;
    }

    const duration = calculateDuration(newBooking.startTime, newBooking.endTime);
    const bookingData = {
      ...newBooking,
      players: newBooking.bookingType === 'member' ? newBooking.players : undefined,
      name: newBooking.bookingType === 'general' ? newBooking.name : undefined,
      totalAmount: newBooking.bookingType === 'general' ? parseFloat(newBooking.totalAmount) : undefined,
      advancePayment: newBooking.bookingType === 'general' ? parseFloat(newBooking.advancePayment || 0) : undefined,
      duration: duration,
    };

    api.post('/api/bookings', bookingData)
      .then((response) => {
        fetchBookings();
        setShowBookingModal(false);
        setNewBooking(() => {
          const { startTime, endTime } = getDefaultTimes();
          return {
            court: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime,
            endTime,
            bookingType: 'general',
            players: [],
            name: '',
            paymentMethod: 'Cash',
            totalAmount: '',
            advancePayment: '',
          };
        });
        Swal.fire({
          icon: 'success',
          title: 'Booking Created',
          text: 'Your booking has been successfully created!',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.message || error.message;
        Swal.fire({
          icon: 'error',
          title: 'Booking Failed',
          text: errorMessage,
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      });
  };

  const editBookingSubmit = () => {
    if (!editBooking) return;

    const errors = validateBookingData(editBooking);

    if (errors.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `Please correct the following issues:<br><ul className="list-disc list-inside">${errors.map(err => `<li>${err}</li>`).join('')}</ul>`,
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
        },
      });
      return;
    }

    const duration = calculateDuration(editBooking.startTime, editBooking.endTime);
    const updatedData = {
      court: editBooking.court,
      date: editBooking.date,
      startTime: editBooking.startTime,
      duration: duration,
      paymentMethod: editBooking.paymentMethod,
      status: editBooking.status,
    };

    if (editBooking.bookingType === 'general') {
      updatedData.name = editBooking.name;
      updatedData.totalAmount = parseFloat(editBooking.totalAmount);
      updatedData.advancePayment = parseFloat(editBooking.advancePayment || 0);
    } else if (editBooking.bookingType === 'member') {
      updatedData.players = editBooking.players;
    }

    api.put(`/api/bookings/${editBooking._id}`, updatedData)
      .then((response) => {
        fetchBookings();
        setShowEditModal(false);
        setEditBooking(null);
        Swal.fire({
          icon: 'success',
          title: 'Booking Updated',
          text: 'The booking has been successfully updated!',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: error.response?.data?.message || error.message,
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      });
  };

  const markAsPaid = () => {
    if (!bookingToMarkAsPaid) return;

    api.put(`/api/bookings/${bookingToMarkAsPaid._id}/mark-as-paid`, { paymentMethod: markAsPaidData.paymentMethod })
      .then((response) => {
        fetchBookings();
        setShowMarkAsPaidModal(false);
        setBookingToMarkAsPaid(null);
        setMarkAsPaidData({ paymentMethod: 'Cash' });
        Swal.fire({
          icon: 'success',
          title: 'Payment Confirmed',
          text: 'The booking has been marked as paid!',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: error.response?.data?.message || error.message,
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      });
  };

  const confirmDeleteBooking = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const cancelBooking = () => {
    if (!bookingToDelete) return;

    api.delete(`/api/bookings/${bookingToDelete._id}`)
      .then((response) => {
        fetchBookings();
        setShowDeleteModal(false);
        setBookingToDelete(null);
        Swal.fire({
          icon: 'success',
          title: 'Booking Deleted',
          text: 'The booking has been successfully deleted!',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Deletion Failed',
          text: error.response?.data?.message || error.message,
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg',
          },
        });
      });
  };

  const confirmMarkAsPaid = (booking) => {
    setBookingToMarkAsPaid(booking);
    setShowMarkAsPaidModal(true);
  };

  const clearFilters = () => {
    const today = new Date();
    setFilters({
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      court: '',
      status: '',
    });
    setSearchTerm('');
    setDate(today);
    setView('today');
  };

  const handleEditBooking = (booking) => {
    const startTimeParts = booking.startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
    const durationHours = Math.floor(booking.duration);
    const durationMinutes = Math.round((booking.duration - durationHours) * 60);
    const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes);
    const endTime = format(endDate, 'HH:mm');

    setEditBooking({
      _id: booking._id,
      court: booking.court,
      date: format(new Date(booking.date), 'yyyy-MM-dd'),
      startTime: booking.startTime,
      endTime: endTime,
      bookingType: booking.bookingType,
      players: booking.players || [],
      name: booking.name || '',
      paymentMethod: booking.paymentMethod || 'Cash',
      totalAmount: booking.totalAmount || '',
      advancePayment: booking.advancePayment || '',
      status: booking.status || 'confirmed',
    });
    setShowEditModal(true);
  };

  const handleStartTimeChange = (time, isNewBooking = true) => {
    if (isNewBooking) {
      setNewBooking(prev => ({ ...prev, startTime: time }));
    } else {
      setEditBooking(prev => ({ ...prev, startTime: time }));
    }
  };

  const handleEndTimeChange = (time, isNewBooking = true) => {
    if (isNewBooking) {
      setNewBooking(prev => ({ ...prev, endTime: time }));
    } else {
      setEditBooking(prev => ({ ...prev, endTime: time }));
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setFilters(prev => ({
      ...prev,
      startDate: format(newDate, 'yyyy-MM-dd'),
      endDate: view === 'next24' ? format(addDays(newDate, 1), 'yyyy-MM-dd') : format(newDate, 'yyyy-MM-dd')
    }));
  };

  const handleViewChange = (newView) => {
    setView(newView);
    const currentDate = new Date(); // Get actual current date
    
    if (newView === 'today') {
      setDate(currentDate); // Reset the calendar to today
      setFilters(prev => ({
        ...prev,
        startDate: format(currentDate, 'yyyy-MM-dd'),
        endDate: format(currentDate, 'yyyy-MM-dd')
      }));
  } else if (newView === 'next24') {
    setFilters(prev => ({
      ...prev,
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(addDays(date, 1), 'yyyy-MM-dd')
    }));
  }
};

  const getMemberName = (memberId) => {
    const member = activeMembers.find(m => m._id === memberId);
    if (member) {
      if (member.user && member.user.name) return member.user.name;
      const user = users.find(u => u.email === member.email);
      if (user && user.name) return user.name;
      return member.email.split('@')[0];
    }
    return 'Unknown Member';
  };

  const filteredBookings = bookings.filter(booking => {
    if (!booking) return false;

    let bookingName = '';
    if (booking.bookingType === 'member' && booking.players?.length > 0) {
      bookingName = getMemberName(booking.players[0]);
    } else if (booking.bookingType === 'general') {
      bookingName = booking.name || '';
    }

    return (
      bookingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `Court ${booking.court}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.paymentStatus || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
        <p>Loading bookings...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }} className="text-3xl font-bold text-gray-800 mb-8">
        Court Bookings
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
            <Calendar
              onChange={handleDateChange}
              value={date}
              className="w-full rounded-lg border-none"
              tileClassName="rounded-full hover:bg-blue-100 transition-colors"
            />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => handleViewChange('today')}
                className={`px-4 py-2 rounded-lg transition-all ${view === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Today
              </button>
              <button
                onClick={() => handleViewChange('next24')}
                className={`px-4 py-2 rounded-lg transition-all ${view === 'next24' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Next 24h
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBookingModal(true)}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" /> New Booking
            </motion.button>
          </div>
        </motion.div>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-xl bg-white shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search bookings..."
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
                  onClick={() => setShowBookingModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 sm:hidden"
                >
                  <Plus className="h-5 w-5" /> New Booking
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setDate(new Date(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                />
                <select
                  value={filters.court}
                  onChange={(e) => setFilters({ ...filters, court: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                >
                  <option value="">All Courts</option>
                  {[1, 2, 3, 4, 5].map((court) => (
                    <option key={court} value={court}>Court {court}</option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="px-4 py-2 mb-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </motion.button>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 text-gray-600">Court</th>
                      <th className="text-left py-3 px-4 text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600">Payment</th>
                      <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => {
                        const startTimeParts = booking.startTime.split(':').map(Number);
                        const startDate = new Date();
                        startDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
                        const durationHours = Math.floor(booking.duration);
                        const durationMinutes = Math.round((booking.duration - durationHours) * 60);
                        const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes);
                        const endTime = format(endDate, 'hh:mm a');
                        const formattedStartTime = format(startDate, 'hh:mm a');

                        let name = '';
                        if (booking.bookingType === 'member' && booking.players?.length > 0) {
                          const player = booking.players[0];
                          if (typeof player === 'string') {
                            name = getMemberName(player);
                          } else if (player && (player.user?.name || player.name)) {
                            name = player.user?.name || player.name || 'Unknown Member';
                          } else {
                            name = 'Unknown Member';
                          }
                        } else if (booking.bookingType === 'general') {
                          name = booking.name || 'N/A';
                        }

                        return (
                          <motion.tr
                            key={booking._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-800">{format(new Date(booking.date), 'dd/MM/yyyy')}</td>
                            <td className="py-3 px-4 text-gray-800">{`${formattedStartTime} - ${endTime}`}</td>
                            <td className="py-3 px-4 text-gray-800">Court {booking.court}</td>
                            <td className="py-3 px-4 text-gray-800">{name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-800' : booking.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                {booking.paymentStatus || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditBooking(booking)}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
                                  disabled={booking.status !== 'confirmed'}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => confirmDeleteBooking(booking)}
                                  className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                                {booking.bookingType === 'general' && booking.paymentStatus !== 'paid' && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => confirmMarkAsPaid(booking)}
                                    className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-3 px-4 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* New Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBookingModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-lg shadow-md border border-gray-300"
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800">Create New Booking</h3>
                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" type="button">
                  <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                  <select
                    value={newBooking.court}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, court: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((court) => (
                      <option key={court} value={court}>Court {court}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newBooking.date}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <TimePicker value={newBooking.startTime} onChange={(time) => handleStartTimeChange(time, true)} use12Hours={true} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <TimePicker value={newBooking.endTime} onChange={(time) => handleEndTimeChange(time, true)} use12Hours={true} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
                  <select
                    value={newBooking.bookingType}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, bookingType: e.target.value }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                {newBooking.bookingType === 'general' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                      <input
                        type="text"
                        value={newBooking.name}
                        onChange={(e) => setNewBooking(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={newBooking.paymentMethod}
                        onChange={(e) => setNewBooking(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
                      <input
                        type="number"
                        value={newBooking.totalAmount}
                        onChange={(e) => setNewBooking(prev => ({ ...prev, totalAmount: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="Enter total amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (₹)</label>
                      <input
                        type="number"
                        value={newBooking.advancePayment}
                        onChange={(e) => setNewBooking(prev => ({ ...prev, advancePayment: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={newBooking.totalAmount || Infinity}
                        placeholder="Enter advance payment (0 or more)"
                      />
                    </div>
                  </>
                )}
                {newBooking.bookingType === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                    <select
                      value={newBooking.players[0] || ''}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, players: e.target.value ? [e.target.value] : [] }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a member</option>
                      {activeMembers.map((member) => {
                        const userName = member.user?.name || users.find(u => u.email === member.email)?.name || member.email.split('@')[0];
                        return (
                          <option key={member._id} value={member._id}>
                            {userName} ({member.email})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createNewBooking}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Check className="h-5 w-5 inline mr-2" /> Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Booking Modal */}
      <AnimatePresence>
        {showEditModal && editBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowEditModal(false); setEditBooking(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-lg shadow-md border border-gray-300"
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800">Edit Booking</h3>
                <button onClick={() => { setShowEditModal(false); setEditBooking(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors" type="button">
                  <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                  <select
                    value={editBooking.court}
                    onChange={(e) => setEditBooking(prev => ({ ...prev, court: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((court) => (
                      <option key={court} value={court}>Court {court}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editBooking.date}
                      onChange={(e) => setEditBooking(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <TimePicker value={editBooking.startTime} onChange={(time) => handleStartTimeChange(time, false)} use12Hours={true} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <TimePicker value={editBooking.endTime} onChange={(time) => handleEndTimeChange(time, false)} use12Hours={true} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
                  <select
                    value={editBooking.bookingType}
                    onChange={(e) => setEditBooking(prev => ({ ...prev, bookingType: e.target.value }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  >
                    <option value="general">General</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                {editBooking.bookingType === 'general' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                      <input
                        type="text"
                        value={editBooking.name || ''}
                        onChange={(e) => setEditBooking(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={editBooking.paymentMethod || 'Cash'}
                        onChange={(e) => setEditBooking(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
                      <input
                        type="number"
                        value={editBooking.totalAmount || ''}
                        onChange={(e) => setEditBooking(prev => ({ ...prev, totalAmount: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="Enter total amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (₹)</label>
                      <input
                        type="number"
                        value={editBooking.advancePayment || ''}
                        onChange={(e) => setEditBooking(prev => ({ ...prev, advancePayment: e.target.value }))}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={editBooking.totalAmount || Infinity}
                        placeholder="Enter advance payment (0 or more)"
                      />
                    </div>
                  </>
                )}
                {editBooking.bookingType === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                    <select
                      value={editBooking.players[0] || ''}
                      onChange={(e) => setEditBooking(prev => ({ ...prev, players: e.target.value ? [e.target.value] : [] }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a member</option>
                      {activeMembers.map((member) => {
                        const userName = member.user?.name || users.find(u => u.email === member.email)?.name || member.email.split('@')[0];
                        return (
                          <option key={member._id} value={member._id}>
                            {userName} ({member.email})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editBooking.status || 'confirmed'}
                    onChange={(e) => setEditBooking(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditBooking(null); }}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={editBookingSubmit}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Check className="h-5 w-5 inline mr-2" /> Update Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && bookingToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setBookingToDelete(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-md"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Booking</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this booking? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setBookingToDelete(null); }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={cancelBooking}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark as Paid Modal */}
      <AnimatePresence>
        {showMarkAsPaidModal && bookingToMarkAsPaid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowMarkAsPaidModal(false); setBookingToMarkAsPaid(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-md"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mark Booking as Paid</h3>
                <p className="text-gray-600 mb-6">
                  Confirm marking this booking as fully paid. Remaining amount: ₹{(bookingToMarkAsPaid.totalAmount - bookingToMarkAsPaid.advancePayment).toFixed(2)}.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={markAsPaidData.paymentMethod}
                    onChange={(e) => setMarkAsPaidData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowMarkAsPaidModal(false); setBookingToMarkAsPaid(null); }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={markAsPaid}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Bookings;
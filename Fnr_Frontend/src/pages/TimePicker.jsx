import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 0);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);
  const [period, setPeriod] = useState(hours >= 12 ? 'PM' : 'AM');
  const pickerRef = useRef(null);

  // Format the time in 24-hour format for the input
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Format the time in 12-hour format for display
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

  useEffect(() => {
    // Update the hours and minutes when the value changes
    const [h, m] = value.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      setHours(h);
      setMinutes(m);
      setPeriod(h >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    // Close the picker when clicking outside
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleHourChange = (newHours) => {
    // Adjust hours based on AM/PM
    let adjustedHours = newHours;
    if (period === 'PM' && newHours < 12) {
      adjustedHours = newHours + 12;
    } else if (period === 'AM' && newHours === 12) {
      adjustedHours = 0;
    }
    
    setHours(adjustedHours);
    onChange(`${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinutes) => {
    setMinutes(newMinutes);
    onChange(`${hours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    
    // Adjust hours based on AM/PM change
    let adjustedHours = hours;
    if (newPeriod === 'PM' && hours < 12) {
      adjustedHours = hours + 12;
    } else if (newPeriod === 'AM' && hours >= 12) {
      adjustedHours = hours - 12;
    }
    
    setHours(adjustedHours);
    onChange(`${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleManualInput = (e) => {
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const inputValue = e.target.value;
    
    if (timePattern.test(inputValue)) {
      const [h, m] = inputValue.split(':').map(Number);
      setHours(h);
      setMinutes(m);
      setPeriod(h >= 12 ? 'PM' : 'AM');
      onChange(inputValue);
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative">
        <input
          type="text"
          value={formattedTime}
          onChange={handleManualInput}
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
          placeholder="HH:MM"
        />
        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Select Time</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="text-3xl font-bold text-gray-800">
                {displayTime}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                <div className="grid grid-cols-4 gap-2">
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                    <button
                      key={h}
                      onClick={() => handleHourChange(h === 12 ? (period === 'AM' ? 0 : 12) : (period === 'PM' ? h + 12 : h))}
                      className={`p-2 rounded-full ${
                        (period === 'AM' && (h === 12 ? 0 : h) === hours % 12) || 
                        (period === 'PM' && (h ===  12 ? 12 : h) === hours % 12)
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minutes</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMinuteChange(m)}
                      className={`p-2 rounded-full ${
                        m === minutes
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {m.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => handlePeriodChange('AM')}
                className={`px-4 py-2 rounded-lg ${
                  period === 'AM'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => handlePeriodChange('PM')}
                className={`px-4 py-2 rounded-lg ${
                  period === 'PM'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                PM
              </button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePicker;
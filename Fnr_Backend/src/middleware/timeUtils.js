const moment = require('moment');

// Convert 12-hour or 24-hour time format to 24-hour format
const normalizeTime = (timeString) => {
  return moment(timeString, ['HH:mm', 'h:mm A']).format('HH:mm');
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeString) => {
  const [hours, minutes] = normalizeTime(timeString).split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if two time ranges overlap
const doTimesOverlap = (start1, duration1, start2, duration2) => {
  const start1Mins = timeToMinutes(start1);
  const end1Mins = start1Mins + (duration1 * 60);
  const start2Mins = timeToMinutes(start2);
  const end2Mins = start2Mins + (duration2 * 60);

  return start1Mins < end2Mins && start2Mins < end1Mins;
};

// Get formatted time range
const getTimeRange = (startTime, duration) => {
  const start = moment(startTime, 'HH:mm');
  const end = moment(start).add(duration, 'hours');
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
};

module.exports = {
  normalizeTime,
  timeToMinutes,
  doTimesOverlap,
  getTimeRange
};
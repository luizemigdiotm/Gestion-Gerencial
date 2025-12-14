import { Activity, Collaborator, ShiftType } from './types';
import { LUNCH_TIME_MATUTINO, LUNCH_TIME_VESPERTINO } from './constants';

export const isLunchTime = (time: string, shift: ShiftType): boolean => {
  if (shift === 'MATUTINO') return LUNCH_TIME_MATUTINO.includes(time);
  if (shift === 'VESPERTINO') return LUNCH_TIME_VESPERTINO.includes(time);
  return false;
};

// Converts "08:30" to minutes from midnight for comparison
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getCurrentTimeSlot = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const roundedMinutes = minutes < 30 ? "00" : "30";
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes}`;
};

export const getActivityStatus = (activity: Activity, currentTime: Date) => {
  if (activity.completed) return 'COMPLETED';

  const startMinutes = timeToMinutes(activity.time);
  // If endTime exists use it, otherwise assume 30 mins
  const endMinutes = activity.endTime ? timeToMinutes(activity.endTime) : startMinutes + 30;
  
  const nowRawMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  // Logic: 
  // If current time is between start and end => IN_PROGRESS / CURRENT
  // If current time >= end => LATE (RED)
  // If current time < start => UPCOMING
  
  if (nowRawMinutes >= startMinutes && nowRawMinutes < endMinutes) {
    return 'CURRENT'; // Yellow/Active
  } else if (nowRawMinutes >= endMinutes) {
    return 'LATE'; // Red
  } else {
    return 'UPCOMING'; // Gray
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
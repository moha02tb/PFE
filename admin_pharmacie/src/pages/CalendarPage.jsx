import React, { useState } from 'react';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 4, 10)); // May 10, 2024
  const [selectedShift, setSelectedShift] = useState('regular');

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    return daysInMonth;
  };

  const shiftsData = {
    10: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
    ],
    11: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
      { time: '20:00 - 08:00', pharmacy: 'Emergency Duty', type: 'emergency' },
    ],
    12: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
      { time: '14:00 - 18:00', pharmacy: 'Inventory Audit', type: 'other' },
    ],
    13: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
      { time: 'Full Day', pharmacy: 'Founders Day', type: 'holiday' },
    ],
    14: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
    ],
    15: [
      { time: '08:00 - 20:00', pharmacy: 'Main Branch', type: 'regular' },
      { time: '20:00 - 08:00', pharmacy: 'Central Hub', type: 'emergency' },
    ],
    16: [
      { time: '10:00 - 16:00', pharmacy: 'Weekend Clinic', type: 'regular' },
    ],
  };

  const getShiftColor = (type) => {
    switch (type) {
      case 'regular':
        return 'bg-secondary-container/30 border-secondary text-on-secondary-container';
      case 'emergency':
        return 'bg-primary-container text-white border-primary-fixed';
      case 'holiday':
        return 'bg-error-container text-on-error-container border-error';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDates = [10, 11, 12, 13, 14, 15, 16];

  return (
    <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-surface">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-on-surface">Schedule Manager</h2>
          <p className="text-on-surface-variant font-body mt-2">Overseeing 24 clinical locations and rotating emergency shifts.</p>
        </div>
        <div className="flex gap-3 bg-surface-container rounded-full p-1.5 shadow-sm">
          <button className="px-6 py-2 rounded-full bg-surface-container-lowest text-primary font-bold shadow-sm transition-all">Monthly View</button>
          <button className="px-6 py-2 rounded-full text-on-surface-variant font-medium hover:text-primary transition-all">Weekly View</button>
        </div>
      </div>

      {/* Bento Grid Layout for Controls & Calendar */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Controls & Quick Actions */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Date Picker Mini */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">May 2024</span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-surface-container rounded-lg">◀</button>
                <button className="p-1 hover:bg-surface-container rounded-lg">▶</button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-outline uppercase tracking-widest gap-y-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <span key={day}>{day}</span>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <span
                  key={i + 1}
                  className={`${
                    i + 1 === 10 ? 'text-primary font-black' : i + 1 < 10 || i + 1 > 25 ? 'opacity-20' : ''
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Filter / Legends */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl space-y-6">
            <h3 className="font-bold text-sm text-outline uppercase tracking-wider">Shift Legend</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-secondary shadow-[0_0_0_4px_rgba(0,107,91,0.1)]"></div>
                <span className="text-sm font-medium">Regular Opening</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_0_4px_rgba(0,74,183,0.1)]"></div>
                <span className="text-sm font-medium">Emergency Shift</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-error shadow-[0_0_0_4px_rgba(186,26,26,0.1)]"></div>
                <span className="text-sm font-medium">Public Holiday</span>
              </div>
            </div>
            <div className="pt-6 border-t border-surface-container">
              <h3 className="font-bold text-sm text-outline uppercase tracking-wider mb-4">Quick Toggle</h3>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <span className="text-xs font-semibold">Accept Emergencies</span>
                <div className="w-10 h-5 bg-secondary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Shifts Card */}
          <div className="bg-primary-container p-6 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4">Tonight's Alert</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">🏥</span>
                  <div>
                    <p className="font-bold leading-none">Downtown Medical</p>
                    <p className="text-[10px] opacity-70 mt-1">Primary Duty: 20:00 - 08:00</p>
                  </div>
                </div>
              </div>
              <button className="mt-6 w-full bg-white/20 backdrop-blur-md py-2 rounded-lg text-xs font-bold hover:bg-white/30 transition-all">
                Notify Staff
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 text-7xl">🚨</div>
          </div>
        </div>

        {/* Right Column: Main Calendar Interface */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold tracking-tight">May 10 - May 16, 2024</h3>
              <div className="flex items-center gap-2 bg-surface-container px-2 py-1 rounded-lg">
                <button className="p-1 hover:bg-surface-container-high rounded-md transition-all">⬅</button>
                <span className="text-xs font-bold px-2">TODAY</span>
                <button className="p-1 hover:bg-surface-container-high rounded-md transition-all">➡</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-3xl text-xs font-bold hover:bg-surface-container transition-all">
                <span>🔍</span> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-on-surface text-white rounded-3xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all">
                <span>➕</span> Add Shift
              </button>
            </div>
          </div>

          {/* Main Calendar Grid */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-surface-container">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`p-4 text-center border-r border-surface-container last:border-r-0 ${
                    index === 1 ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="block text-[10px] text-primary font-black uppercase tracking-widest">
                    {day}
                  </span>
                  <span className={`text-xl font-headline font-black ${index === 1 ? 'text-primary' : ''}`}>
                    {weekDates[index]}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Rows */}
            <div className="grid grid-cols-7 min-h-[600px] bg-surface-container-low/30">
              {weekDates.map((date, dayIndex) => (
                <div
                  key={date}
                  className={`p-3 border-r border-b border-surface-container space-y-2 ${
                    dayIndex === 1 ? 'bg-primary/5' : ''
                  }`}
                >
                  {shiftsData[date]?.map((shift, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-l-4 rounded-lg ${getShiftColor(shift.type)}`}
                    >
                      <p className="text-[10px] font-bold opacity-80">{shift.time}</p>
                      <p className="text-xs font-bold truncate">{shift.pharmacy}</p>
                      {shift.type === 'emergency' && (
                        <div className="flex -space-x-2 mt-2">
                          <div className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-300 text-[8px] flex items-center justify-center font-bold">👨</div>
                          <div className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-400 text-[8px] flex items-center justify-center font-bold">👩</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Shift Detail & Entry */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-on-surface">Quick Shift Entry</h3>
                <p className="text-on-surface-variant text-sm mt-1">Easily update daily status and assignment.</p>
              </div>
              <span className="text-outline cursor-pointer hover:text-on-surface transition-colors">⋯</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Pharmacy Location</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-highest border-none rounded-3xl py-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-primary/40 font-medium">
                    <option>Central Park Pharmacy</option>
                    <option>West End Medical</option>
                    <option>Harbor Clinical</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">▼</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Shift Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedShift('regular')}
                    className={`flex-1 py-3 rounded-3xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      selectedShift === 'regular'
                        ? 'bg-secondary/10 border-2 border-secondary text-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span>✅</span> Regular
                  </button>
                  <button
                    onClick={() => setSelectedShift('emergency')}
                    className={`flex-1 py-3 rounded-3xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      selectedShift === 'emergency'
                        ? 'bg-primary/10 border-2 border-primary text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span>⚡</span> Emergency
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Time Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="08:00"
                    className="w-full bg-surface-container-highest border-none rounded-3xl py-3 text-center font-bold focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-outline font-black">—</span>
                  <input
                    type="text"
                    defaultValue="20:00"
                    className="w-full bg-surface-container-highest border-none rounded-3xl py-3 text-center font-bold focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button className="w-full bg-primary text-white py-3 rounded-3xl font-bold hover:bg-primary-container shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

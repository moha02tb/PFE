import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import api from '../lib/api';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, SectionHeader } from '../components/ui';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const toIsoDate = (date) => date.toISOString().split('T')[0];
const formatHeaderMonth = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const formatFullDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [gardes, setGardes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadGardes = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/admin/gardes', { params: { skip: 0, limit: 1000 } });
        if (!active) return;
        setGardes(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || 'Failed to load garde calendar data.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadGardes();
    return () => {
      active = false;
    };
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const gardesByDate = useMemo(() => {
    const map = new Map();
    gardes.forEach((item) => {
      if (!item.date) return;
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [gardes]);

  const monthGardes = useMemo(
    () =>
      gardes.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= monthStart && itemDate <= monthEnd;
      }),
    [gardes, monthStart, monthEnd]
  );

  const selectedDayGardes = gardesByDate.get(selectedDate) || [];
  const calendarCells = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentMonth, monthStart, monthEnd]);

  const topPharmacists = useMemo(() => {
    const counts = new Map();
    monthGardes.forEach((item) => counts.set(item.pharmacy_name, (counts.get(item.pharmacy_name) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [monthGardes]);

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="Scheduling"
          title="Garde calendar"
          description="Browse garde assignments saved by the upload flow, with clearer density and calmer surfaces for operational review."
          actions={
            <Button asChild>
              <Link to="/upload-garde">
                <Upload className="h-4 w-4" />
                Upload garde
              </Link>
            </Button>
          }
        />

        {error ? (
          <Card className="border-danger/30 bg-danger-soft">
            <CardContent className="p-4 text-sm text-danger">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.38fr]">
          <Card>
            <CardHeader className="border-b border-border">
              <div>
                <CardTitle>{formatHeaderMonth(currentMonth)}</CardTitle>
                <CardDescription>Days with saved garde assignments show counters and previews.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => {
                  const today = new Date();
                  setCurrentMonth(startOfMonth(today));
                  setSelectedDate(toIsoDate(today));
                }}>
                  Today
                </Button>
                <Button variant="secondary" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, index) => {
                  if (!cell) return <div key={`empty-${index}`} className="min-h-[150px] border-b border-r border-border bg-surface-muted/40" />;
                  const isoDate = toIsoDate(cell);
                  const dayGardes = gardesByDate.get(isoDate) || [];
                  const isSelected = isoDate === selectedDate;
                  const isToday = isoDate === toIsoDate(new Date());
                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => setSelectedDate(isoDate)}
                      className={`min-h-[150px] border-b border-r border-border p-3 text-left transition ${
                        isSelected ? 'bg-primary-soft' : 'bg-surface-elevated hover:bg-surface-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                          {cell.getDate()}
                        </span>
                        {dayGardes.length ? <Badge variant="warning">{dayGardes.length}</Badge> : null}
                      </div>
                      <div className="mt-3 space-y-2">
                        {dayGardes.slice(0, 2).map((item) => (
                          <div key={item.id} className="rounded-xl bg-surface-muted px-3 py-2">
                            <p className="truncate text-xs font-medium text-foreground">{item.pharmacy_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.start_time} - {item.end_time}</p>
                          </div>
                        ))}
                        {dayGardes.length > 2 ? <p className="text-xs text-primary">+{dayGardes.length - 2} more</p> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Selected day</CardTitle>
                  <CardDescription>{selectedDate ? formatFullDate(selectedDate) : 'Choose a date from the calendar.'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayGardes.length ? (
                  selectedDayGardes.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.pharmacy_name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.start_time} - {item.end_time}</p>
                        </div>
                        {item.shift_type ? <Badge variant="primary">{item.shift_type}</Badge> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title={loading ? 'Loading garde rows' : 'No garde rows'}
                    description={loading ? 'Fetching saved garde assignments.' : 'No garde rows were saved for this date.'}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Top assigned pharmacies</CardTitle>
                  <CardDescription>Most frequent entries this month.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {topPharmacists.length ? (
                  topPharmacists.map(([name, count]) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground">{name}</span>
                        <span className="text-sm font-medium text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(12, (count / Math.max(...topPharmacists.map((entry) => entry[1]), 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title={loading ? 'Loading leaderboard' : 'No monthly assignments'}
                    description={loading ? 'Fetching current month activity.' : 'No garde rows were found in this month.'}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

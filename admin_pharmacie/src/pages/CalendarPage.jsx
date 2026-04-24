import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Upload,
} from 'lucide-react';
import api from '../lib/api';
import { Badge, Button, EmptyState } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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

const CalendarCell = ({ cell, currentMonth, selectedDate, gardesByDate, onSelect }) => {
  const { t } = useLanguage();
  if (!cell) return <div className="garde-calendar-cell garde-calendar-cell--muted" />;

  const isoDate = toIsoDate(cell);
  const dayGardes = gardesByDate.get(isoDate) || [];
  const isSelected = isoDate === selectedDate;
  const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
  const isToday = isoDate === toIsoDate(new Date());
  const firstTwo = dayGardes.slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onSelect(isoDate)}
      className={[
        'garde-calendar-cell',
        isWeekend ? 'garde-calendar-cell--weekend' : '',
        isSelected ? 'garde-calendar-cell--selected' : '',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={isToday ? 'garde-day-number garde-day-number--today' : 'garde-day-number'}>
          {cell.getDate()}
        </span>
        {dayGardes.length > 1 ? <span className="garde-count">{dayGardes.length}</span> : null}
      </div>
      <div className="space-y-1">
        {firstTwo.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className={isWeekend ? 'garde-event garde-event--weekend' : index === 0 && isSelected ? 'garde-event garde-event--active' : 'garde-event'}
          >
            {item.pharmacy_name || t('calendar.unnamedPharmacy')}
          </div>
        ))}
        {!dayGardes.length && cell.getMonth() === currentMonth.getMonth() && cell.getDate() === 15 ? (
          <div className="garde-event garde-event--warning">
            <AlertTriangle className="h-3 w-3" />
            {t('calendar.unassigned')}
          </div>
        ) : null}
      </div>
    </button>
  );
};

const AssignmentCard = ({ item }) => {
  const { t } = useLanguage();
  return (
    <div className="garde-assignment-card">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.625rem] font-bold uppercase text-blue-700">
          {item.shift_type || t('calendar.nightShift')}
        </span>
        <span className="text-xs text-muted-foreground">{item.start_time || '20:00'} - {item.end_time || '08:00'}</span>
      </div>
      <h4 className="font-display text-base font-bold text-foreground">{item.pharmacy_name || t('calendar.unnamedPharmacy')}</h4>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {item.address || t('calendar.addressUnavailable')}
      </p>
    </div>
  );
};

const CalendarPage = () => {
  const { t } = useLanguage();
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
        setError(err.response?.data?.detail || err.message || t('calendar.failedLoad'));
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

  const topPharmacies = useMemo(() => {
    const counts = new Map();
    monthGardes.forEach((item) => counts.set(item.pharmacy_name || t('calendar.unnamedPharmacy'), (counts.get(item.pharmacy_name || t('calendar.unnamedPharmacy')) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [monthGardes]);

  const maxTop = Math.max(1, ...topPharmacies.map((entry) => entry[1]));

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="page-heading-row">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('calendar.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('calendar.description')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex overflow-hidden rounded-[8px] border border-border bg-surface-elevated shadow-soft">
              <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-muted">{t('calendar.day')}</button>
              <button className="border-x border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-muted">{t('calendar.week')}</button>
              <button className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t('calendar.month')}</button>
            </div>
            <Button asChild>
              <Link to="/upload-garde">
                <Plus className="h-4 w-4" />
                {t('calendar.assignShift')}
              </Link>
            </Button>
          </div>
        </div>

        {error ? <div className="bento-card border-danger/25 bg-danger-soft p-4 text-sm font-medium text-danger">{error}</div> : null}

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-8">
            <div className="garde-calendar-panel">
              <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-xl font-bold text-foreground">{formatHeaderMonth(currentMonth)}</h2>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    {t('calendar.nightShift')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    {t('calendar.weekend')}
                  </div>
                  <Button variant="secondary" asChild>
                    <Link to="/upload-garde">
                      <Upload className="h-4 w-4" />
                      {t('calendar.upload')}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="border-r border-border py-3 text-center text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, index) => (
                  <CalendarCell
                    key={cell ? toIsoDate(cell) : `empty-${index}`}
                    cell={cell}
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    gardesByDate={gardesByDate}
                    onSelect={setSelectedDate}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            <div className="bento-card p-6">
              <h3 className="font-display text-base font-bold text-foreground">{t('calendar.selectedDayDetails')}</h3>
              <div className="mt-4 flex items-center gap-4 rounded-[8px] bg-primary-soft p-4">
                <div className="min-w-[52px] rounded-[8px] bg-surface-elevated p-2 text-center shadow-soft">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <p className="font-display text-xl font-bold leading-none text-foreground">{new Date(selectedDate).getDate().toString().padStart(2, '0')}</p>
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">{formatFullDate(selectedDate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('calendar.activeAssignments', { count: selectedDayGardes.length })}</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {selectedDayGardes.length ? (
                  selectedDayGardes.map((item) => <AssignmentCard key={item.id} item={item} />)
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title={loading ? t('calendar.loadingRows') : t('calendar.noAssignments')}
                    description={loading ? t('calendar.fetchingAssignments') : t('calendar.noAssignmentsDesc')}
                  />
                )}
                <button className="flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">
                  <Plus className="h-4 w-4" />
                  {t('calendar.addShift')}
                </button>
              </div>
            </div>

            <div className="bento-card p-6">
              <h3 className="font-display text-base font-bold text-foreground">{t('calendar.topAssignedPharmacies')}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t('calendar.topAssignedPharmaciesDesc')}</p>
              <div className="mt-6 space-y-5">
                {topPharmacies.length ? (
                  topPharmacies.map(([name, count], index) => (
                    <div key={name} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-primary">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex justify-between gap-3">
                          <span className="truncate text-sm font-bold text-foreground">{name}</span>
                          <span className="text-xs font-bold text-foreground">{t('calendar.shifts', { count })}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(12, (count / maxTop) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 rounded-[8px] bg-surface-muted p-4 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {loading ? t('calendar.loadingStatistics') : t('calendar.noMonthlyAssignments')}
                  </div>
                )}
              </div>
              <Link to="/upload-garde" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
                {t('calendar.viewFullStatistics')}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, Link as LinkIcon, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

const palette = {
  primary: '#4F46E5', // Indigo-600 from logo
  primaryLight: '#3B82F6', // Blue-500 from logo
  secondary: '#FB7185', // Coral Red
  accent: '#FACC15', // Sunshine Yellow
  background: '#FFFBF0', // Ivory
  surface: '#FFFFFF', // White
  text: '#1E293B', // Charcoal
  textSecondary: '#64748B', // Cool Gray
};

const tagColors: Record<string, string> = {
  networking: 'bg-[#4F46E5] text-white',
  tech: 'bg-[#3B82F6] text-white',
  culture: 'bg-[#FACC15] text-[#1E293B]',
  English: 'bg-[#4F46E5] text-white',
  '日本語': 'bg-[#FB7185] text-white',
  Arts: 'bg-[#FACC15] text-[#1E293B]',
};

const EVENTS_PER_PAGE = 12;

type Event = Database['public']['Tables']['events']['Row'];

const EventCard: React.FC<{ event: Event; onClick?: () => void }> = ({ event, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 cursor-pointer hover:shadow-xl transition-shadow min-h-[140px] border border-gray-100"
      style={{ boxShadow: '0 2px 8px 0 rgba(79,70,229,0.08)' }}
      onClick={onClick}
    >
      {/* Titles */}
      <div className="flex flex-col gap-1">
        <h1 className="text-base md:text-lg font-bold text-[#4F46E5] leading-tight">{event.ENG_title}</h1>
        <h2 className="text-sm font-semibold text-[#3B82F6] leading-tight">{event.JPN_タイトル}</h2>
      </div>
      {/* Basic Details */}
      <div className="flex flex-wrap gap-2 mt-1 items-center">
        <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
          <Calendar className="text-[#FACC15]" size={15} />
          <span className="font-medium text-[#1E293B]">{event.Date ? new Date(event.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
          <Clock className="text-[#4F46E5]" size={15} />
          <span className="font-medium text-[#64748B]">{event.Time || '-'}</span>
        </div>
        {event.tag && (
          <Badge className={`rounded-lg px-2 py-0.5 font-semibold capitalize shadow-sm text-xs ${tagColors[event.tag] || 'bg-[#4F46E5] text-white'}`}>{event.tag}</Badge>
        )}
        <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
          <Ticket className="text-[#FB7185]" size={15} />
          <span className="font-medium text-[#1E293B]">{event.fee || 'Free'}</span>
        </div>
      </div>
    </motion.div>
  );
};

const EventDetails: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchEvents = async () => {
      const from = (page - 1) * EVENTS_PER_PAGE;
      const to = from + EVENTS_PER_PAGE - 1;
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('Date', { ascending: false })
        .order('Time', { ascending: false })
        .order('id', { ascending: false });

      // Apply search filter
      if (search.trim()) {
        query = query.ilike('ENG_title', `%${search.trim()}%`);
      }

      // Apply tag filter
      if (filterTag) {
        query = query.eq('tag', filterTag);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (!error && data) {
        setEvents(data);
        setTotal(count || 0);
      }
      setLoading(false);
    };
    fetchEvents();
  }, [page, search, filterTag]);

  const totalPages = Math.ceil(total / EVENTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        {/* Search and Filter UI */}
        <div className="flex flex-col md:flex-row gap-2 mb-6 items-center justify-between">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] bg-white text-[#1E293B] placeholder-gray-400"
          />
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] bg-white text-[#1E293B]"
          >
            <option value="">All Tags</option>
            <option value="networking">Networking</option>
            <option value="tech">Tech</option>
            <option value="culture">Culture</option>
            <option value="English">English</option>
            <option value="日本語">日本語</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
        {/* Event List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-lg text-[#4F46E5] font-semibold">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-lg text-[#FB7185] font-semibold">No events found.</span>
          </div>
        ) : (
          <div className="w-full px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8 2xl:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {events.map(event => (
                <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
              ))}
            </div>
          </div>
        )}
        {/* Pagination */}
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full"
          >
            <ChevronLeft /> Prev
          </Button>
          <span className="flex items-center px-4 text-[#64748B]">Page {page} of {totalPages || 1}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="rounded-full"
          >
            Next <ChevronRight />
          </Button>
        </div>
      </div>
      {/* Event Detail Modal (UI only) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-full relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-[#4F46E5] text-2xl font-bold"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close"
            >
              ×
            </button>
            {/* Full Event Details */}
            <div className="flex flex-col gap-2 text-center mb-2">
              <h1 className="text-2xl font-bold text-[#4F46E5]">{selectedEvent.ENG_title}</h1>
              <h2 className="text-lg font-semibold text-[#3B82F6]">{selectedEvent.JPN_タイトル}</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
                <Calendar className="text-[#FACC15]" size={15} />
                <span className="font-medium text-[#1E293B]">{selectedEvent.Date ? new Date(selectedEvent.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
                <Clock className="text-[#4F46E5]" size={15} />
                <span className="font-medium text-[#64748B]">{selectedEvent.Time || '-'}</span>
              </div>
              {selectedEvent.tag && (
                <Badge className={`rounded-lg px-2 py-0.5 font-semibold capitalize shadow-sm text-xs ${tagColors[selectedEvent.tag] || 'bg-[#4F46E5] text-white'}`}>{selectedEvent.tag}</Badge>
              )}
              <div className="flex items-center gap-1 bg-[#FFFBF0] rounded-lg px-2 py-0.5 shadow-sm text-xs">
                <Ticket className="text-[#FB7185]" size={15} />
                <span className="font-medium text-[#1E293B]">{selectedEvent.fee || 'Free'}</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="mb-2">
                <span className="block text-sm font-bold text-[#4F46E5] mb-1">English Description</span>
                <p className="text-sm text-[#1E293B] bg-[#FFFBF0] rounded-xl p-3 shadow-sm">{selectedEvent.ENG_description || 'No English description available.'}</p>
              </div>
              <div>
                <span className="block text-sm font-bold text-[#3B82F6] mb-1">日本語の説明</span>
                <p className="text-sm text-[#1E293B] bg-[#FFFBF0] rounded-xl p-3 shadow-sm">{selectedEvent.JPN_description || '日本語の説明はありません。'}</p>
              </div>
            </div>
            {selectedEvent.link && (
              <div className="flex justify-center mt-2">
                <a
                  href={selectedEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    className="w-full bg-[#4F46E5] hover:bg-[#3B82F6] text-white font-bold py-2 px-3 rounded-xl shadow transition-all flex items-center gap-2 justify-center text-xs"
                    style={{ boxShadow: '0 2px 8px 0 rgba(79,70,229,0.08)' }}
                  >
                    <LinkIcon className="text-[#FACC15]" size={16} />
                    Event Link
                  </Button>
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 
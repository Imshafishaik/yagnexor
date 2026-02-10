import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ClassSchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [viewMode] = useState('weekly');

  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 'MONDAY',
    start_time: '',
    end_time: '',
    room_number: '',
    semester: '',
    academic_year: '',
    notes: '',
    schedule_date: '', // New field for specific date
    is_recurring: true // New field to toggle recurring vs specific date
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, [user, navigate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [c, s, t] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/users?role=teacher')
      ]);
      setClasses(c.data.classes || []);
      setSubjects(s.data.subjects || []);
      setTeachers(t.data.users || []);
      fetchSchedules();
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    const res = await api.get('/class-schedule');
    setSchedules(res.data.schedules || []);
    organizeWeeklySchedule(res.data.schedules || []);
  };

  const organizeWeeklySchedule = data => {
    const week = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    };
    data.forEach(s => week[s.day_of_week]?.push(s));
    setWeeklySchedule(week);
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 23; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getDayName = d => d[0] + d.slice(1).toLowerCase();

  const changeWeek = dir => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setSelectedWeek(d);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert time format from HH:mm:ss to HH:mm for API
      const submitData = {
        ...formData,
        start_time: formData.start_time.slice(0, 5), // "23:00:00" -> "23:00"
        end_time: formData.end_time.slice(0, 5)       // "12:00:00" -> "12:00"
      };
      
      // For specific date schedules, don't send day_of_week
      if (!formData.is_recurring && formData.schedule_date) {
        delete submitData.day_of_week;
      }
      
      // For recurring schedules, don't send schedule_date
      if (formData.is_recurring) {
        delete submitData.schedule_date;
      }
      
      // Remove the toggle field from API call
      delete submitData.is_recurring;
      
      if (editingSchedule) {
        await api.put(`/class-schedule/${editingSchedule.id}`, submitData);
      } else {
        await api.post('/class-schedule', {
          ...submitData,
          class_id: formData.class_id // Include class_id for create
        });
      }
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      subject_id: '',
      teacher_id: '',
      day_of_week: 'MONDAY',
      start_time: '',
      end_time: '',
      room_number: '',
      semester: '',
      academic_year: '',
      notes: '',
      schedule_date: '',
      is_recurring: true
    });
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      // Don't include class_id in edit form since backend doesn't allow updating it
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room_number: schedule.room_number || '',
      semester: schedule.semester || '',
      academic_year: schedule.academic_year || '',
      notes: schedule.notes || '',
      schedule_date: schedule.schedule_date || '',
      is_recurring: !schedule.schedule_date // If schedule_date exists, it's not recurring
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600"
          >
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="text-xl font-bold">Class Schedule</h1>
          <span>Welcome, {user?.first_name}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* CONTROLS */}
        <div className="bg-white p-4 rounded shadow mb-6 flex justify-between">
          <div className="flex gap-4">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button onClick={() => changeWeek('prev')}>
                <ChevronLeft />
              </button>
              <button onClick={() => changeWeek('next')}>
                <ChevronRight />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Add Schedule
          </button>
        </div>

        {/* WEEKLY VIEW */}
        {viewMode === 'weekly' && (
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 font-semibold">Time</div>
              {Object.keys(weeklySchedule).map(d => (
                <div key={d} className="p-3 text-center font-semibold">
                  {getDayName(d)}
                </div>
              ))}
            </div>

            {getTimeSlots().map(time => (
              <div key={time} className="grid grid-cols-8 border-b">
                <div className="p-2 text-sm">{time}</div>

                {Object.keys(weeklySchedule).map(day => (
                  <div key={day + time} className="p-2 min-h-[60px]">
                    {weeklySchedule[day]?.map(s => {
                      const st = s.start_time.slice(0, 5);
                      const et = s.end_time.slice(0, 5);
                      if (st <= time && et > time) {
                        return (
                          <div
                            key={s.id}
                            className="bg-blue-100 p-2 rounded text-xs mb-1 cursor-pointer hover:bg-blue-200"
                            onClick={() => handleEdit(s)}
                          >
                            <div className="font-semibold">
                              {s.subject_name}
                            </div>
                            <div>{s.class_name}</div>
                            <div>{s.teacher_name}</div>
                            <div className="text-xs text-blue-600 mt-1">
                              <Edit size={12} className="inline mr-1" />Click to edit
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Schedule Type Toggle */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        checked={formData.is_recurring}
                        onChange={() => setFormData({...formData, is_recurring: true, schedule_date: ''})}
                        className="mr-2"
                      />
                      Recurring Weekly
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        checked={!formData.is_recurring}
                        onChange={() => setFormData({...formData, is_recurring: false})}
                        className="mr-2"
                      />
                      Specific Date
                    </label>
                  </div>
                </div>

                {/* Only show class field for creating, not editing */}
                {!editingSchedule && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Show day selector for recurring, date picker for specific date */}
                {formData.is_recurring ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="MONDAY">Monday</option>
                      <option value="TUESDAY">Tuesday</option>
                      <option value="WEDNESDAY">Wednesday</option>
                      <option value="THURSDAY">Thursday</option>
                      <option value="FRIDAY">Friday</option>
                      <option value="SATURDAY">Saturday</option>
                      <option value="SUNDAY">Sunday</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date</label>
                    <input
                      type="date"
                      value={formData.schedule_date}
                      onChange={(e) => setFormData({...formData, schedule_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

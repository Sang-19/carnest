import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Reminder, Medication, Appointment } from '@/types';
import { useAuth } from './AuthContext';

// Mock data for demo purposes
const MOCK_REMINDERS: Reminder[] = [
  {
    id: '1',
    type: 'medication',
    title: 'Blood Pressure Medication',
    description: 'Take 1 pill with water',
    time: '08:00',
    recurring: true,
    frequency: 'daily',
    elderlyId: '1',
    relatedItemId: 'med1',
    completed: false,
    notified: false,
  },
  {
    id: '2',
    type: 'medication',
    title: 'Diabetes Medication',
    description: 'Take after breakfast',
    time: '09:30',
    recurring: true,
    frequency: 'daily',
    elderlyId: '1',
    relatedItemId: 'med2',
    completed: false,
    notified: false,
  },
  {
    id: '3',
    type: 'hydration',
    title: 'Drink Water',
    description: 'At least one glass',
    time: '11:00',
    recurring: true,
    frequency: 'daily',
    elderlyId: '1',
    completed: false,
    notified: false,
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Doctor Appointment',
    description: 'Checkup with Dr. Wilson',
    time: '14:00',
    recurring: false,
    elderlyId: '1',
    relatedItemId: 'app1',
    completed: false,
    notified: false,
  },
];

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    schedule: [
      {
        time: '08:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    instructions: 'Take with or without food at the same time each day',
    startDate: '2023-01-01',
    elderlyId: '1',
  },
  {
    id: 'med2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    schedule: [
      {
        time: '09:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      {
        time: '19:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    instructions: 'Take with meals',
    startDate: '2023-01-01',
    elderlyId: '1',
  },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'app1',
    title: 'Quarterly Checkup',
    date: '2023-06-15',
    time: '14:00',
    location: 'City Medical Center, Room 305',
    notes: 'Bring current medication list',
    doctorName: 'Dr. Jane Wilson',
    elderlyId: '1',
  },
];

// Web fallback for SecureStore
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
};

interface ReminderContextType {
  reminders: Reminder[];
  medications: Medication[];
  appointments: Appointment[];
  loading: boolean;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markReminderComplete: (id: string) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getTodaysReminders: () => Reminder[];
  getUpcomingReminders: () => Reminder[];
  getMissedReminders: () => Reminder[];
}

const ReminderContext = createContext<ReminderContextType>({
  reminders: [],
  medications: [],
  appointments: [],
  loading: true,
  addReminder: async () => {},
  updateReminder: async () => {},
  deleteReminder: async () => {},
  markReminderComplete: async () => {},
  addMedication: async () => {},
  updateMedication: async () => {},
  deleteMedication: async () => {},
  addAppointment: async () => {},
  updateAppointment: async () => {},
  deleteAppointment: async () => {},
  getTodaysReminders: () => [],
  getUpcomingReminders: () => [],
  getMissedReminders: () => [],
});

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on app startup or when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setReminders([]);
        setMedications([]);
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // In a real app, these would be API calls
        // For demo, using mock data filtered by the user's role
        if (user.role === 'elderly') {
          setReminders(MOCK_REMINDERS.filter(r => r.elderlyId === user.id));
          setMedications(MOCK_MEDICATIONS.filter(m => m.elderlyId === user.id));
          setAppointments(MOCK_APPOINTMENTS.filter(a => a.elderlyId === user.id));
        } else if (user.role === 'caregiver' && user.elderly && user.elderly.length > 0) {
          const elderlyIds = user.elderly;
          setReminders(MOCK_REMINDERS.filter(r => elderlyIds.includes(r.elderlyId)));
          setMedications(MOCK_MEDICATIONS.filter(m => elderlyIds.includes(m.elderlyId)));
          setAppointments(MOCK_APPOINTMENTS.filter(a => elderlyIds.includes(a.elderlyId)));
        }
      } catch (error) {
        console.error('Failed to load reminder data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Helper to generate a unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // CRUD operations for reminders
  const addReminder = async (reminder: Omit<Reminder, 'id'>): Promise<void> => {
    const newReminder: Reminder = { ...reminder, id: generateId() };
    setReminders(prev => [...prev, newReminder]);
    // In a real app, this would be saved to a server
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<void> => {
    setReminders(prev => 
      prev.map(reminder => (reminder.id === id ? { ...reminder, ...updates } : reminder))
    );
    // In a real app, this would be saved to a server
  };

  const deleteReminder = async (id: string): Promise<void> => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    // In a real app, this would be deleted from a server
  };

  const markReminderComplete = async (id: string): Promise<void> => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: true, completedTime: new Date().toISOString() } 
          : reminder
      )
    );
    // In a real app, this would be saved to a server
  };

  // CRUD operations for medications
  const addMedication = async (medication: Omit<Medication, 'id'>): Promise<void> => {
    const newMedication: Medication = { ...medication, id: generateId() };
    setMedications(prev => [...prev, newMedication]);
    // In a real app, this would be saved to a server
  };

  const updateMedication = async (id: string, updates: Partial<Medication>): Promise<void> => {
    setMedications(prev => 
      prev.map(medication => (medication.id === id ? { ...medication, ...updates } : medication))
    );
    // In a real app, this would be saved to a server
  };

  const deleteMedication = async (id: string): Promise<void> => {
    setMedications(prev => prev.filter(medication => medication.id !== id));
    // In a real app, this would be deleted from a server
  };

  // CRUD operations for appointments
  const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<void> => {
    const newAppointment: Appointment = { ...appointment, id: generateId() };
    setAppointments(prev => [...prev, newAppointment]);
    // In a real app, this would be saved to a server
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<void> => {
    setAppointments(prev => 
      prev.map(appointment => (appointment.id === id ? { ...appointment, ...updates } : appointment))
    );
    // In a real app, this would be saved to a server
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
    // In a real app, this would be deleted from a server
  };

  // Helper functions for filtering reminders
  const getTodaysReminders = (): Reminder[] => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(reminder => {
      // For recurring reminders, check if they're active today
      if (reminder.recurring) return !reminder.completed;
      
      // For non-recurring, check if they're scheduled for today
      if (reminder.type === 'appointment' && appointments.length > 0) {
        const appointment = appointments.find(a => a.id === reminder.relatedItemId);
        return appointment && appointment.date === today && !reminder.completed;
      }
      
      return !reminder.completed;
    });
  };

  const getUpcomingReminders = (): Reminder[] => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(reminder => {
      // Exclude completed reminders
      if (reminder.completed) return false;
      
      // For appointments, check if they're in the future
      if (reminder.type === 'appointment' && reminder.relatedItemId) {
        const appointment = appointments.find(a => a.id === reminder.relatedItemId);
        return appointment && appointment.date > today;
      }
      
      // Include all recurring reminders that aren't completed
      return reminder.recurring;
    });
  };

  const getMissedReminders = (): Reminder[] => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    return reminders.filter(reminder => {
      // Skip completed reminders
      if (reminder.completed) return false;
      
      // Parse the reminder time
      const [hours, minutes] = reminder.time.split(':').map(Number);
      
      // Check if the reminder is for today and has passed
      const hasTimePassed = currentHour > hours || (currentHour === hours && currentMinutes > minutes);
      
      // For appointments, check if the date has passed
      if (reminder.type === 'appointment' && reminder.relatedItemId) {
        const appointment = appointments.find(a => a.id === reminder.relatedItemId);
        return appointment && 
              (appointment.date < today || 
               (appointment.date === today && hasTimePassed));
      }
      
      // For recurring daily reminders, check if the time has passed today
      return hasTimePassed;
    });
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        medications,
        appointments,
        loading,
        addReminder,
        updateReminder,
        deleteReminder,
        markReminderComplete,
        addMedication,
        updateMedication,
        deleteMedication,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getTodaysReminders,
        getUpcomingReminders,
        getMissedReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => useContext(ReminderContext);

export default ReminderContext;
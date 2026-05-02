import { create } from "zustand";

export interface ConfirmedBooking {
  id: string;
  doctorId: string;
  /** ISO datetime — the actual slot. */
  dateTime: string;
  /** Display time "HH:MM". */
  time: string;
  /** Plain ISO date "YYYY-MM-DDT00:00:00Z" for the picked day. */
  day: string;
  type: string;
  reason: string;
  isNewPatient: boolean;
}

interface BookingState {
  lastConfirmed: ConfirmedBooking | null;
  setLastConfirmed: (booking: ConfirmedBooking) => void;
  clear: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  lastConfirmed: null,
  setLastConfirmed: (booking) => set({ lastConfirmed: booking }),
  clear: () => set({ lastConfirmed: null }),
}));

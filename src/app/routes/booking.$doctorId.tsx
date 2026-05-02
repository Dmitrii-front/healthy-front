import { createFileRoute } from "@tanstack/react-router";
import { BookingPage, bookingLoader } from "@/pages/booking";

export const Route = createFileRoute("/booking/$doctorId")({
  staticData: { hideTabBar: true },
  loader: bookingLoader,
  component: BookingPage,
});

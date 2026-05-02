import { createFileRoute } from "@tanstack/react-router";
import { DoctorDetailPage, doctorDetailLoader } from "@/pages/doctor-detail";

export const Route = createFileRoute("/doctor/$doctorId")({
  staticData: { hideTabBar: true },
  loader: doctorDetailLoader,
  component: DoctorDetailPage,
});

import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import HotelForm from "@/components/hotel/HotelForm";
import RoomsTab from "@/components/hotel/RoomsTab";
import BookingsTab from "@/components/hotel/BookingsTab";
import CheckInTab from "@/components/hotel/CheckInTab";

type Tab = "rooms" | "bookings" | "checkin" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "rooms", label: "Chambres" },
  { key: "bookings", label: "Réservations" },
  { key: "checkin", label: "Check-in" },
  { key: "settings", label: "Établissement" },
];

export default function HotelDashboard() {
  const { user, isLoading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: LOGIN_PATH,
  });
  const [tab, setTab] = useState<Tab>("rooms");

  const myHotel = trpc.manage.myHotel.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  if (isLoading || (user && myHotel.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
        <p className="text-sm text-white/45">Chargement…</p>
      </div>
    );
  }
  if (!user) return null;

  const hotel = myHotel.data;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* En-tête */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#121212]/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <svg viewBox="0 0 24 24" width="15" height="15">
                <g fill="#121212">
                  <rect x="5" y="19" width="14" height="2" />
                  <polygon points="7.5,19 16.5,19 15.5,10 8.5,10" />
                  <rect x="6.5" y="6" width="11" height="3" />
                  <rect x="6.5" y="2.5" width="2.8" height="4" />
                  <rect x="10.6" y="2.5" width="2.8" height="4" />
                  <rect x="14.7" y="2.5" width="2.8" height="4" />
                </g>
              </svg>
            </span>
            <div>
              <p className="font-display text-sm font-semibold leading-tight">
                {hotel ? hotel.name : "Espace hôtelier"}
              </p>
              <p className="text-[10px] text-white/40">{user.name ?? user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[11px] text-white/50">
              ← App client
            </Link>
            <button onClick={logout} className="text-[11px] text-white/50">
              Déconnexion
            </button>
          </div>
        </div>
        {hotel && (
          <div className="mx-auto flex max-w-xl gap-1.5 overflow-x-auto px-5 pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-none rounded-full px-4 py-2 text-xs font-medium ${
                  tab === t.key
                    ? "bg-white font-bold text-[#121212]"
                    : "bg-[#232323] text-white/55"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-5">
        {!hotel ? (
          <HotelForm initial={null} onSaved={() => myHotel.refetch()} />
        ) : (
          <>
            {tab === "rooms" && (
              <RoomsTab rooms={hotel.rooms} onChanged={() => myHotel.refetch()} />
            )}
            {tab === "bookings" && <BookingsTab />}
            {tab === "checkin" && <CheckInTab />}
            {tab === "settings" && (
              <HotelForm
                initial={{
                  name: hotel.name,
                  neighborhood: hotel.neighborhood,
                  description: hotel.description,
                  address: hotel.address,
                  landmarks: hotel.landmarks,
                  phone: hotel.phone,
                  lat: hotel.lat,
                  lng: hotel.lng,
                  facilities: hotel.facilities,
                }}
                onSaved={() => myHotel.refetch()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

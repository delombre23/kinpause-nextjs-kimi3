import { useMemo, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Map from "@/components/client/Map";
import BookingPanel from "@/components/client/BookingPanel";
import Reservations from "@/components/client/Reservations";
import { FACILITY_LABELS, AMENITY_LABELS, formatDist, haversineKm } from "@/lib/kp";

type SheetView = "list" | "hotel" | "room";

export default function Home() {
  const hotelsQuery = trpc.catalog.hotels.useQuery();
  const [view, setView] = useState<SheetView>("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<"distance" | "price">("distance");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReservations, setShowReservations] = useState(false);

  const hotelQuery = trpc.catalog.hotel.useQuery(
    { id: selectedHotelId! },
    { enabled: selectedHotelId !== null },
  );

  const hotels = useMemo(() => hotelsQuery.data ?? [], [hotelsQuery.data]);

  const sortedHotels = useMemo(() => {
    const list = [...hotels];
    if (sortMode === "price") {
      return list.sort((a, b) => (a.cheapestRate ?? 999) - (b.cheapestRate ?? 999));
    }
    if (userLocation) {
      return list.sort(
        (a, b) =>
          haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
      );
    }
    return list;
  }, [hotels, sortMode, userLocation]);

  function selectHotel(id: number) {
    setSelectedHotelId(id);
    setSelectedRoomId(null);
    setView("hotel");
    setSheetOpen(true);
  }

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const hotel = hotelQuery.data;
  const selectedRoom = hotel?.rooms.find((r) => r.id === selectedRoomId) ?? null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#121212] text-white">
      <Map
        hotels={hotels}
        selectedId={selectedHotelId}
        userLocation={userLocation}
        onSelect={selectHotel}
      />

      {/* Barre supérieure */}
      <div className="fixed left-4 top-[max(14px,env(safe-area-inset-top))] z-[46] flex items-center gap-2.5">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu KinPause"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="19" height="19">
            <g fill="#121212">
              <rect x="5" y="19" width="14" height="2" />
              <polygon points="7.5,19 16.5,19 15.5,10 8.5,10" />
              <rect x="6.5" y="6" width="11" height="3" />
              <rect x="6.5" y="2.5" width="2.8" height="4" />
              <rect x="10.6" y="2.5" width="2.8" height="4" />
              <rect x="14.7" y="2.5" width="2.8" height="4" />
            </g>
          </svg>
        </button>
        <span className="font-display rounded-full border border-white/15 bg-[#121212]/75 px-4 py-2 text-sm font-semibold backdrop-blur">
          KinPause
        </span>
      </div>

      {/* Menu */}
      {menuOpen && (
        <div className="fixed left-4 top-[max(64px,calc(env(safe-area-inset-top)+50px))] z-[45] flex w-60 flex-col gap-0.5 rounded-2xl border border-white/15 bg-[#1A1A1A] p-2 shadow-2xl">
          <button
            className="rounded-xl px-3.5 py-3 text-left text-sm active:bg-[#232323]"
            onClick={() => {
              setMenuOpen(false);
              setShowReservations(true);
            }}
          >
            Vos réservations
          </button>
          <button
            className="rounded-xl px-3.5 py-3 text-left text-sm active:bg-[#232323]"
            onClick={() => {
              setMenuOpen(false);
              setView("list");
              setSheetOpen(true);
            }}
          >
            Hôtels près de vous
          </button>
          <div className="mx-1.5 my-1 h-px bg-white/10" />
          <Link
            to="/hotel"
            className="rounded-xl px-3.5 py-3 text-left text-sm font-semibold active:bg-[#232323]"
            onClick={() => setMenuOpen(false)}
          >
            Espace hôtelier →
          </Link>
        </div>
      )}

      {/* Bouton localisation */}
      <button
        onClick={locate}
        aria-label="Me localiser"
        className={`fixed right-4 z-[40] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 shadow-lg backdrop-blur transition-all active:scale-95 ${
          sheetOpen && view !== "list" ? "bottom-52" : "bottom-8"
        }`}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
          strokeWidth="2.2" strokeLinecap="round"
          className={locating ? "animate-spin" : ""}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {/* Bouton flottant pour ouvrir la liste */}
      {!sheetOpen && (
        <button
          onClick={() => { setView("list"); setSheetOpen(true); }}
          className="font-display fixed bottom-8 left-1/2 z-[40] -translate-x-1/2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#121212] shadow-2xl active:scale-95"
        >
          Voir les hôtels
        </button>
      )}

      {/* Bottom sheet */}
      {sheetOpen && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-[50] flex flex-col overflow-hidden rounded-t-3xl bg-[#1A1A1A] shadow-2xl transition-all ${
            view === "list" ? "h-[46vh]" : "h-[86vh]"
          }`}
        >
          <div className="mx-auto mb-1 mt-2.5 h-1 w-10 flex-none rounded-full bg-white/15" />
          <div className="flex-1 overflow-y-auto pt-1">
            {view === "list" && (
              <div className="px-5 pb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-base font-semibold">
                    {userLocation ? "Hôtels près de vous" : "Hôtels à Kinshasa"}
                  </p>
                  <button onClick={() => setSheetOpen(false)} className="text-xs text-white/50">
                    Fermer
                  </button>
                </div>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setSortMode("distance")}
                    className={`rounded-full px-4 py-2 text-xs font-medium ${
                      sortMode === "distance" ? "bg-white font-bold text-[#121212]" : "bg-[#232323] text-white/55"
                    }`}
                  >
                    Plus proches
                  </button>
                  <button
                    onClick={() => setSortMode("price")}
                    className={`rounded-full px-4 py-2 text-xs font-medium ${
                      sortMode === "price" ? "bg-white font-bold text-[#121212]" : "bg-[#232323] text-white/55"
                    }`}
                  >
                    Moins chers
                  </button>
                </div>
                {!userLocation && (
                  <button
                    onClick={locate}
                    className="mb-3 w-full rounded-xl border border-white/15 bg-[#232323] px-3.5 py-2.5 text-left text-xs text-white/80"
                  >
                    {locating ? "Localisation en cours…" : "Touchez pour trouver les hôtels les plus proches"}
                  </button>
                )}
                {hotelsQuery.isLoading && (
                  <p className="mt-8 text-center text-sm text-white/45">Chargement des hôtels…</p>
                )}
                <div className="flex snap-x gap-2.5 overflow-x-auto pb-1">
                  {sortedHotels.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => selectHotel(h.id)}
                      className="w-40 flex-none snap-start rounded-2xl bg-[#232323] p-3.5 text-left active:scale-95"
                    >
                      <p className="font-display text-[13px] font-semibold leading-tight">{h.name}</p>
                      <p className="mt-1 text-[11px] text-white/45">
                        {userLocation
                          ? `${formatDist(haversineKm(userLocation.lat, userLocation.lng, h.lat, h.lng))} · `
                          : ""}
                        {h.neighborhood}
                      </p>
                      <p className="mt-1 text-[11px] text-white/45">
                        {h.roomCount} chambre{h.roomCount > 1 ? "s" : ""} dispo
                      </p>
                      <p className="font-mono-kp mt-1.5 text-xs font-bold">
                        {h.cheapestRate !== null ? `Dès $${h.cheapestRate}/h` : "Complet"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "hotel" && (
              <div className="px-5 pb-8">
                <button
                  onClick={() => { setView("list"); setSelectedHotelId(null); }}
                  className="mb-3 text-sm text-white/80"
                >
                  ‹ Retour aux hôtels
                </button>
                {hotelQuery.isLoading && (
                  <p className="mt-8 text-center text-sm text-white/45">Chargement…</p>
                )}
                {hotel && (
                  <>
                    <p className="text-[11px] uppercase tracking-widest text-white/45">
                      {hotel.neighborhood}, Kinshasa
                    </p>
                    <h2 className="font-display mt-1 text-2xl font-semibold">{hotel.name}</h2>
                    {hotel.address && <p className="mt-2 text-xs text-white/70">{hotel.address}</p>}
                    {hotel.landmarks && (
                      <p className="mt-1 text-[11px] leading-relaxed text-white/45">{hotel.landmarks}</p>
                    )}
                    {hotel.description && (
                      <p className="mt-3 text-xs leading-relaxed text-white/55">{hotel.description}</p>
                    )}
                    {hotel.facilities.length > 0 && (
                      <>
                        <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-white/45">
                          Équipements de l'hôtel
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {hotel.facilities.map((f) => (
                            <span key={f} className="rounded-full bg-[#2C2C2C] px-3 py-1 text-[11px] text-white/70">
                              {FACILITY_LABELS[f] ?? f}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <p className="mt-5 text-xs text-white/45">
                      {hotel.rooms.length} chambre{hotel.rooms.length > 1 ? "s" : ""} disponible
                      {hotel.rooms.length > 1 ? "s" : ""} maintenant
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      {hotel.rooms.map((r) => (
                        <div key={r.id} className="overflow-hidden rounded-2xl bg-[#232323]">
                          {r.photos.length > 0 && (
                            <img src={r.photos[0].data} alt="" className="h-32 w-full object-cover" loading="lazy" />
                          )}
                          <div className="p-4">
                            <p className="font-display text-[15px] font-semibold">{r.name}</p>
                            {r.bedConfig && <p className="mt-1 text-xs text-white/55">{r.bedConfig}</p>}
                            {r.amenities.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.amenities.slice(0, 4).map((a) => (
                                  <span key={a} className="rounded-full bg-[#2C2C2C] px-2.5 py-0.5 text-[10px] text-white/60">
                                    {AMENITY_LABELS[a] ?? a}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-mono-kp text-[15px] font-bold">${r.pricePerHour}/h</span>
                              <button
                                onClick={() => { setSelectedRoomId(r.id); setView("room"); }}
                                className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#121212] active:scale-95"
                              >
                                Sélectionner
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hotel.rooms.length === 0 && (
                        <p className="rounded-2xl bg-[#232323] p-4 text-center text-sm text-white/45">
                          Aucune chambre disponible pour le moment.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {view === "room" && hotel && selectedRoom && (
              <BookingPanel
                hotelName={hotel.name}
                room={selectedRoom}
                onBack={() => { setSelectedRoomId(null); setView("hotel"); }}
              />
            )}
          </div>
        </div>
      )}

      {showReservations && <Reservations onClose={() => setShowReservations(false)} />}
    </div>
  );
}

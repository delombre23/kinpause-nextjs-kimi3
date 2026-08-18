/** Helpers partagés KinPause (client + espace hôtel). */

export const FACILITY_LABELS: Record<string, string> = {
  parking: "Parking",
  restaurant: "Restaurant",
  pool: "Piscine",
  wifi: "Internet / Wi-Fi",
  lounge: "Food & Drink",
  security: "Sécurité 24/7",
  generator: "Groupe électrogène",
};

export const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi gratuit",
  ac: "Climatisation",
  balcony: "Balcon",
  privatebath: "Salle de bains privative",
  tv: "Télévision à écran plat",
  teacoffee: "Plateau thé/café",
  towels: "Serviettes",
  hairdryer: "Sèche-cheveux",
  hotwater: "Eau chaude",
  wardrobe: "Armoire",
  desk: "Bureau",
  minibar: "Minibar",
};

export const PROVIDERS = [
  { key: "mpesa", label: "M-Pesa", hint: "Vodacom" },
  { key: "orange", label: "Orange Money", hint: "Orange" },
  { key: "airtel", label: "Airtel Money", hint: "Airtel" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payée",
  checked_in: "Client présent",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function calcAge(dobStr: string): number {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function endTime(start: string, durationHours: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + Math.round(durationHours * 60);
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

export function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Redimensionne une image (max 1000px, JPEG 0.75) et renvoie une data URL. */
export function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1000;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas indisponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

/** Codes de réservation conservés sur l'appareil du client. */
export function getStoredCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem("kp_codes") ?? "[]");
  } catch {
    return [];
  }
}

export function addStoredCode(code: string) {
  const codes = getStoredCodes();
  if (!codes.includes(code)) {
    codes.push(code);
    localStorage.setItem("kp_codes", JSON.stringify(codes));
  }
}

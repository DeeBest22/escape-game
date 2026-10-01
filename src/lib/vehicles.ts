export interface Sprite {
  src: string;
  /** Board cells the vehicle occupies (1-3). */
  len: number;
}

/** Red car, nose pointing right (toward the exit). */
export const TARGET_SPRITE = "/vehicles/red-sedan.webp";

/** Blocker pool. Sprites face left/right; the Board rotates them for vertical lanes. */
export const SPRITES: Sprite[] = [
  { src: "/vehicles/white-suv.webp", len: 2 },
  { src: "/vehicles/blue-sedan.webp", len: 2 },
  { src: "/vehicles/green-pickup.webp", len: 3 },
  { src: "/vehicles/yellow-bus.webp", len: 3 },
  { src: "/vehicles/purple-suv.webp", len: 2 },
  { src: "/vehicles/orange-box-truck.webp", len: 3 },
  { src: "/vehicles/gray-sedan.webp", len: 2 },
  { src: "/vehicles/blue-flatbed.webp", len: 3 },
  { src: "/vehicles/blue-pickup.webp", len: 2 },
  { src: "/vehicles/white-wagon.webp", len: 2 },
  { src: "/vehicles/yellow-hatch.webp", len: 2 },
  { src: "/vehicles/green-hatch.webp", len: 2 },
  { src: "/vehicles/white-van.webp", len: 2 },
  { src: "/vehicles/gray-pickup.webp", len: 2 },
  { src: "/vehicles/orange-suv.webp", len: 2 },
  { src: "/vehicles/purple-sedan.webp", len: 2 },
  { src: "/vehicles/tan-pickup.webp", len: 2 },
  { src: "/vehicles/blue-compact.webp", len: 2 },
  { src: "/vehicles/green-jeep.webp", len: 2 },
  { src: "/vehicles/police.webp", len: 2 },
  { src: "/vehicles/taxi.webp", len: 2 },
  { src: "/vehicles/ambulance.webp", len: 2 },
  { src: "/vehicles/fire-truck.webp", len: 3 },
  { src: "/vehicles/orange-sports.webp", len: 2 },
  { src: "/vehicles/blue-coach.webp", len: 3 },
  { src: "/vehicles/blue-cab-truck.webp", len: 2 },
  { src: "/vehicles/green-pickup-2.webp", len: 2 },
  { src: "/vehicles/white-van-2.webp", len: 2 },
  { src: "/vehicles/red-box-truck.webp", len: 2 },
  { src: "/vehicles/camper.webp", len: 2 },
  { src: "/vehicles/school-bus.webp", len: 2 },
  { src: "/vehicles/tanker.webp", len: 3 },
  { src: "/vehicles/orange-4x4.webp", len: 2 },
  { src: "/vehicles/blue-moto.webp", len: 1 },
  { src: "/vehicles/red-moto.webp", len: 1 },
  { src: "/vehicles/container-truck.webp", len: 3 },
  { src: "/vehicles/pink-mini.webp", len: 1 },
  { src: "/vehicles/gray-mini.webp", len: 1 },
];

export function pickSprite(len: number, rng: () => number, used: Set<string>) {
  const pool = SPRITES.filter((s) => s.len === len);
  const fresh = pool.filter((s) => !used.has(s.src));
  const list = fresh.length ? fresh : pool;
  const s = list[Math.floor(rng() * list.length)]!;
  used.add(s.src);
  return s.src;
}

if (typeof window !== "undefined") {
  for (const s of [TARGET_SPRITE, ...SPRITES.map((x) => x.src)]) new Image().src = s;
}

/** Fleet type keys used as homepage vehicle categories — keep in sync with Car.type. */

export const VEHICLE_CATEGORY_TYPES = /** @type {const} */ ([
  'essential',
  'premium',
  'prestige',
  'supercar',
]);

export const DEFAULT_VEHICLE_CATEGORIES = [
  {
    type: 'essential',
    title: 'Essential',
    description: 'Reliable daily drivers for city trips and business travel.',
    icon: 'directions_car',
    sort_order: 10,
  },
  {
    type: 'premium',
    title: 'Premium',
    description: 'Comfort-focused luxury sedans and refined executive cars.',
    icon: 'airline_seat_recline_normal',
    sort_order: 20,
  },
  {
    type: 'prestige',
    title: 'Prestige',
    description: 'High-performance SUVs and statement vehicles for Dubai.',
    icon: 'verified',
    sort_order: 30,
  },
  {
    type: 'supercar',
    title: 'Supercar',
    description: 'Exotic sports cars built for the skyline and the strip.',
    icon: 'speed',
    sort_order: 40,
  },
];

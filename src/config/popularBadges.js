/** Marketing badges for the Most Popular Cars homepage strip. */
export const POPULAR_BADGES = Object.freeze({
  BEST_SELLER: 'best_seller',
  MOST_BOOKED: 'most_booked',
  NEW_ARRIVAL: 'new_arrival',
  LIMITED_AVAILABILITY: 'limited_availability',
});

export const POPULAR_BADGE_VALUES = Object.freeze(Object.values(POPULAR_BADGES));

export const POPULAR_BADGE_LABELS = Object.freeze({
  [POPULAR_BADGES.BEST_SELLER]: 'Best Seller',
  [POPULAR_BADGES.MOST_BOOKED]: 'Most Booked',
  [POPULAR_BADGES.NEW_ARRIVAL]: 'New Arrival',
  [POPULAR_BADGES.LIMITED_AVAILABILITY]: 'Limited Availability',
});

export function popularBadgeLabel(key) {
  return POPULAR_BADGE_LABELS[key] || String(key || '').replace(/_/g, ' ');
}

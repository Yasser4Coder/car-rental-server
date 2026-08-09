export const COMPANY = {
  name: 'Green Rental Experience',
  city: 'Dubai',
  country: 'United Arab Emirates',
  address: 'Marina Plaza, Dubai Marina',
  fullAddress: 'Marina Plaza, Dubai Marina, Dubai, UAE',
  phone: '+971 4 555 0190',
  email: 'concierge@greenrental.ae',
  hours: 'Open daily · 8:00 AM – 10:00 PM',
  currency: 'AED',
  tagline: 'Premium exotic & luxury car rental in Dubai',
};

export const LOCATIONS = [
  { value: 'dubai-marina', label: 'Dubai Marina' },
  { value: 'downtown', label: 'Downtown Dubai' },
  { value: 'palm-jumeirah', label: 'Palm Jumeirah' },
  { value: 'dxb-airport', label: 'DXB Airport' },
];

export const CAR_TYPES = [
  { value: 'any', label: 'Any type' },
  { value: 'supercar', label: 'Supercar' },
  { value: 'luxury-suv', label: 'Luxury SUV' },
  { value: 'ev-premium', label: 'EV Premium' },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
  { value: 'name', label: 'Name A–Z' },
];

const BADGE = {
  sport: { label: 'SPORT', className: 'bg-primary/80 backdrop-blur text-on-primary' },
  popular: { label: 'MOST POPULAR', className: 'bg-secondary-container text-on-secondary-container' },
  suv: { label: 'SUV', className: 'bg-primary/80 backdrop-blur text-on-primary' },
  electric: { label: 'ELECTRIC', className: 'bg-primary/80 backdrop-blur text-on-primary' },
  newArrival: { label: 'NEW ARRIVAL', className: 'bg-tertiary text-on-tertiary' },
  luxury: { label: 'LUXURY', className: 'bg-primary/80 backdrop-blur text-on-primary' },
};

const SHARED_INCLUDED = [
  'Comprehensive insurance',
  '24/7 Dubai roadside assistance',
  'Second driver free',
  'Airport or hotel delivery available',
];

const SHARED_REQUIREMENTS = [
  'Valid UAE or international driving licence',
  'Passport / Emirates ID',
  'Credit card in the renter’s name',
  'Minimum age 25 (30 for supercars)',
];

export const CARS = [
  {
    id: 1,
    name: 'Porsche 911 GT3',
    brand: 'Porsche',
    model: '911 GT3',
    year: 2024,
    type: 'supercar',
    locations: ['dubai-marina', 'palm-jumeirah', 'dxb-airport'],
    price: 2900,
    deposit: 15000,
    dailyKm: 250,
    image:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Silver Porsche 911 GT3 in a clean studio setting.',
    color: 'GT Silver Metallic',
    transmission: 'PDK Auto',
    seats: 2,
    doors: 2,
    powertrain: 'Petrol',
    drivetrain: 'RWD',
    horsepower: 502,
    acceleration: '3.4s',
    topSpeed: '318 km/h',
    fuel: 'Petrol · 98 RON',
    rating: 4.9,
    reviews: 128,
    featured: true,
    badges: [BADGE.sport, BADGE.popular],
    description:
      'Track-bred precision made for Dubai’s open stretches — from Sheikh Zayed Road to an evening along Palm Jumeirah. Pure Porsche character with everyday usability for short city hops and weekend escapes to Hatta.',
    highlights: [
      'Ideal for marina evenings and desert-edge drives',
      'Delivered washed and fuelled across Dubai',
      'Concierge pickup at hotel or DXB',
    ],
    features: [
      'Sport Chrono Package',
      'Carbon ceramic brakes',
      'Apple CarPlay',
      'Surround camera system',
      'Adaptive sport seats',
      'Premium sound system',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 2,
    name: 'Range Rover Autobiography',
    brand: 'Land Rover',
    model: 'Range Rover Autobiography',
    year: 2024,
    type: 'luxury-suv',
    locations: ['downtown', 'dubai-marina', 'dxb-airport', 'palm-jumeirah'],
    price: 2000,
    deposit: 10000,
    dailyKm: 300,
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Charcoal Range Rover parked in an elegant driveway.',
    color: 'Santorini Black',
    transmission: 'Auto',
    seats: 5,
    doors: 5,
    powertrain: 'Petrol',
    drivetrain: 'AWD',
    horsepower: 523,
    acceleration: '4.4s',
    topSpeed: '250 km/h',
    fuel: 'Petrol',
    rating: 4.8,
    reviews: 96,
    featured: true,
    badges: [BADGE.suv],
    description:
      'First-class comfort for Dubai family days, Downtown dinners, and airport runs. Whisper-quiet cabin, commanding presence on Sheikh Zayed Road, and space for luggage after a DXB landing.',
    highlights: [
      'Perfect for families and VIP transfers',
      'Cooling seats for summer heat',
      'Hotel delivery across Dubai',
    ],
    features: [
      'Executive rear seating',
      'Meridian™ sound',
      'Panoramic roof',
      'Air suspension',
      'Four-zone climate',
      'Soft-close doors',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 3,
    name: 'Tesla Model S Plaid',
    brand: 'Tesla',
    model: 'Model S Plaid',
    year: 2024,
    type: 'ev-premium',
    locations: ['dubai-marina', 'downtown', 'dxb-airport'],
    price: 1650,
    deposit: 8000,
    dailyKm: 300,
    image:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Pearl white Tesla Model S at a modern charging station.',
    color: 'Pearl White Multi-Coat',
    transmission: 'Auto',
    seats: 5,
    doors: 4,
    powertrain: 'Electric',
    drivetrain: 'AWD',
    horsepower: 1020,
    acceleration: '2.1s',
    topSpeed: '322 km/h',
    fuel: 'Electric · ~600 km range',
    rating: 4.9,
    reviews: 84,
    featured: true,
    badges: [BADGE.electric, BADGE.newArrival],
    description:
      'Instant thrust with a calm, futuristic cabin — ideal for DIFC meetings and evening drives along Jumeirah. We map Supercharger / destination charging options across Dubai for you.',
    highlights: [
      'Zero-emission luxury for city days',
      'Autopilot hardware enabled',
      'Charging guidance included',
    ],
    features: [
      '17" touchscreen',
      'Premium connectivity',
      'Glass roof',
      'HEPA filtration',
      'Ventilated seats',
      'Yoke or wheel steering',
    ],
    included: [...SHARED_INCLUDED, 'Charging adapter kit'],
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 4,
    name: 'Lamborghini Huracán EVO',
    brand: 'Lamborghini',
    model: 'Huracán EVO',
    year: 2023,
    type: 'supercar',
    locations: ['palm-jumeirah', 'dubai-marina'],
    price: 4500,
    deposit: 25000,
    dailyKm: 200,
    image:
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820d79879?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Yellow Lamborghini Huracán on an open road.',
    color: 'Giallo Inti',
    transmission: 'Auto',
    seats: 2,
    doors: 2,
    powertrain: 'Petrol',
    drivetrain: 'AWD',
    horsepower: 631,
    acceleration: '2.9s',
    topSpeed: '325 km/h',
    fuel: 'Petrol · 98 RON',
    rating: 5.0,
    reviews: 62,
    featured: false,
    badges: [BADGE.sport],
    description:
      'Italian theatre for Dubai nights — Palm fronds, Marina Walk, and every valet that matters. A statement supercar for birthdays, proposals, and unforgettable arrivals.',
    highlights: [
      'Head-turning presence on the Palm',
      'White-glove delivery & collection',
      'Photo-ready detailing before handover',
    ],
    features: [
      'Lamborghini Infotainment',
      'Lifting system',
      'Sport exhaust',
      'Carbon interior pack',
      'Performance telemetry',
      'Parking sensors + camera',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 5,
    name: 'Mercedes-AMG G63',
    brand: 'Mercedes-Benz',
    model: 'G63 AMG',
    year: 2024,
    type: 'luxury-suv',
    locations: ['downtown', 'palm-jumeirah', 'dubai-marina', 'dxb-airport'],
    price: 3200,
    deposit: 15000,
    dailyKm: 250,
    image:
      'https://images.unsplash.com/photo-1520031445312-1e24412156f0?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520031445312-1e24412156f0?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Black Mercedes-AMG G-Class parked in an urban setting.',
    color: 'Obsidian Black',
    transmission: 'Auto',
    seats: 5,
    doors: 5,
    powertrain: 'Petrol',
    drivetrain: '4MATIC',
    horsepower: 577,
    acceleration: '4.5s',
    topSpeed: '220 km/h',
    fuel: 'Petrol',
    rating: 4.9,
    reviews: 110,
    featured: false,
    badges: [BADGE.suv, BADGE.luxury],
    description:
      'The icon of Dubai streets. AMG power with lounge-level comfort — equally at home outside Atlantis, Downtown, or a desert resort gate.',
    highlights: [
      'Dubai’s most requested luxury SUV',
      'Strong A/C for peak summer',
      'DXB meet & greet available',
    ],
    features: [
      'AMG Performance exhaust',
      'Burmester® sound',
      'Massage seats',
      'Off-road modes',
      'Night package styling',
      '360° camera',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 6,
    name: 'Ferrari Roma',
    brand: 'Ferrari',
    model: 'Roma',
    year: 2023,
    type: 'supercar',
    locations: ['palm-jumeirah', 'downtown', 'dubai-marina'],
    price: 4900,
    deposit: 30000,
    dailyKm: 200,
    image:
      'https://images.unsplash.com/photo-1583121274602-3e2820d79879?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583121274602-3e2820d79879?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Red Ferrari Roma in dramatic lighting.',
    color: 'Rosso Corsa',
    transmission: 'Auto',
    seats: 2,
    doors: 2,
    powertrain: 'Petrol',
    drivetrain: 'RWD',
    horsepower: 612,
    acceleration: '3.4s',
    topSpeed: '320 km/h',
    fuel: 'Petrol · 98 RON',
    rating: 4.9,
    reviews: 47,
    featured: false,
    badges: [BADGE.sport, BADGE.luxury],
    description:
      'Elegant grand touring with Ferrari soul — refined enough for a DIFC dinner, thrilling enough for an early run toward Jebel Hafeet.',
    highlights: [
      'Timeless coupe silhouette',
      'Ideal for special occasions',
      'Concierge briefing on pickup',
    ],
    features: [
      'Ferrari infotainment',
      'Adaptive dampers',
      'Carbon steering wheel',
      'Premium leather cabin',
      'Performance launch control',
      'Parking assist',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 7,
    name: 'BMW iX M60',
    brand: 'BMW',
    model: 'iX M60',
    year: 2024,
    type: 'ev-premium',
    locations: ['downtown', 'dubai-marina', 'dxb-airport'],
    price: 1500,
    deposit: 8000,
    dailyKm: 300,
    image:
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Modern BMW electric SUV on a city street.',
    color: 'Mineral White',
    transmission: 'Auto',
    seats: 5,
    doors: 5,
    powertrain: 'Electric',
    drivetrain: 'xDrive',
    horsepower: 610,
    acceleration: '3.8s',
    topSpeed: '250 km/h',
    fuel: 'Electric · ~500 km range',
    rating: 4.7,
    reviews: 58,
    featured: false,
    badges: [BADGE.electric, BADGE.suv],
    description:
      'Spa-quiet EV SUV for executives moving between Business Bay, DIFC, and Marina residences — with serious M performance when the road opens.',
    highlights: [
      'Executive cabin for Dubai heat',
      'Fast-charge friendly',
      'Strong for mixed city & highway use',
    ],
    features: [
      'BMW Curved Display',
      'Bowers & Wilkins sound',
      'Air suspension',
      'Panoramic glass roof',
      'Driving Assistant Professional',
      'Heated & ventilated seats',
    ],
    included: [...SHARED_INCLUDED, 'Charging adapter kit'],
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 8,
    name: 'Bentley Continental GT',
    brand: 'Bentley',
    model: 'Continental GT',
    year: 2023,
    type: 'supercar',
    locations: ['downtown', 'palm-jumeirah', 'dubai-marina'],
    price: 3600,
    deposit: 20000,
    dailyKm: 250,
    image:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Luxury Bentley Continental GT coupe.',
    color: 'Beluga',
    transmission: 'Auto',
    seats: 4,
    doors: 2,
    powertrain: 'Petrol',
    drivetrain: 'AWD',
    horsepower: 542,
    acceleration: '3.7s',
    topSpeed: '318 km/h',
    fuel: 'Petrol',
    rating: 4.8,
    reviews: 41,
    featured: false,
    badges: [BADGE.luxury],
    description:
      'Handcrafted British luxury for Dubai celebrations — proposals on the Palm, VIP arrivals at Downtown hotels, and effortless cruising on Emirates Road.',
    highlights: [
      'Four-seat grand tourer comfort',
      'Rotating display & craft cabin',
      'Occasion & event favourite',
    ],
    features: [
      'Naim for Bentley audio',
      'Rotating dashboard display',
      'Massage front seats',
      'Adaptive cruise',
      'Soft-close doors',
      'Ambient lighting',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 9,
    name: 'Porsche Taycan Turbo S',
    brand: 'Porsche',
    model: 'Taycan Turbo S',
    year: 2024,
    type: 'ev-premium',
    locations: ['dubai-marina', 'downtown', 'palm-jumeirah'],
    price: 2600,
    deposit: 12000,
    dailyKm: 280,
    image:
      'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Porsche Taycan electric sports sedan.',
    color: 'Frozen Blue Metallic',
    transmission: 'Auto',
    seats: 4,
    doors: 4,
    powertrain: 'Electric',
    drivetrain: 'AWD',
    horsepower: 750,
    acceleration: '2.8s',
    topSpeed: '260 km/h',
    fuel: 'Electric · ~450 km range',
    rating: 4.9,
    reviews: 73,
    featured: false,
    badges: [BADGE.electric, BADGE.sport],
    description:
      'Porsche dynamics with zero exhaust note — sharp for Sheikh Zayed Road, polished for valet at Opera District. We include charging guidance for your Dubai itinerary.',
    highlights: [
      'Sports-car feel in an EV sedan',
      'Fast DC charging supported',
      'Driver-focused cockpit',
    ],
    features: [
      'Performance Battery Plus',
      'Rear-axle steering',
      'Sport Chrono',
      'BOSE® Surround Sound',
      'Adaptive air suspension',
      'Porsche Communication Management',
    ],
    included: [...SHARED_INCLUDED, 'Charging adapter kit'],
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 10,
    name: 'Cadillac Escalade Sport',
    brand: 'Cadillac',
    model: 'Escalade Sport',
    year: 2024,
    type: 'luxury-suv',
    locations: ['dxb-airport', 'downtown', 'palm-jumeirah'],
    price: 1750,
    deposit: 9000,
    dailyKm: 300,
    image:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Black Cadillac Escalade luxury SUV.',
    color: 'Black Raven',
    transmission: 'Auto',
    seats: 7,
    doors: 5,
    powertrain: 'Petrol',
    drivetrain: 'AWD',
    horsepower: 420,
    acceleration: '5.9s',
    topSpeed: '210 km/h',
    fuel: 'Petrol',
    rating: 4.6,
    reviews: 39,
    featured: false,
    badges: [BADGE.suv],
    description:
      'Black-tie utility for groups — nightlife on JBR, family days to Global Village, and spacious DXB pickups with room for every suitcase.',
    highlights: [
      '7 seats for groups & families',
      'Huge luggage space',
      'Excellent for airport transfers',
    ],
    features: [
      '38" curved OLED display',
      'AKG Studio audio',
      'Super Cruise hardware',
      'Power running boards',
      'Tri-zone climate',
      'Rear entertainment ready',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 11,
    name: 'Audi e-tron GT',
    brand: 'Audi',
    model: 'e-tron GT',
    year: 2023,
    type: 'ev-premium',
    locations: ['downtown', 'dubai-marina', 'dxb-airport'],
    price: 1850,
    deposit: 9000,
    dailyKm: 280,
    image:
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'Sleek Audi e-tron GT electric grand tourer.',
    color: 'Tactical Green',
    transmission: 'Auto',
    seats: 4,
    doors: 4,
    powertrain: 'Electric',
    drivetrain: 'quattro',
    horsepower: 522,
    acceleration: '3.9s',
    topSpeed: '245 km/h',
    fuel: 'Electric · ~480 km range',
    rating: 4.7,
    reviews: 44,
    featured: false,
    badges: [BADGE.electric, BADGE.newArrival],
    description:
      'Sculpted EV grand tourer with quattro grip — quiet confidence from Business Bay to a late reservation in Downtown Dubai.',
    highlights: [
      'Striking design for city nights',
      'quattro all-weather grip',
      'Smooth grand-tourer ride',
    ],
    features: [
      'Matrix LED headlights',
      'Bang & Olufsen sound',
      'Adaptive air suspension',
      'Virtual cockpit',
      'Fast charging support',
      'Heated sport seats',
    ],
    included: [...SHARED_INCLUDED, 'Charging adapter kit'],
    requirements: SHARED_REQUIREMENTS,
  },
  {
    id: 12,
    name: 'Rolls-Royce Cullinan',
    brand: 'Rolls-Royce',
    model: 'Cullinan',
    year: 2023,
    type: 'luxury-suv',
    locations: ['palm-jumeirah', 'downtown', 'dubai-marina', 'dxb-airport'],
    price: 5900,
    deposit: 40000,
    dailyKm: 200,
    image:
      'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=1400&q=80',
    ],
    alt: 'White Rolls-Royce Cullinan luxury SUV.',
    color: 'Arctic White',
    transmission: 'Auto',
    seats: 5,
    doors: 5,
    powertrain: 'Petrol',
    drivetrain: 'AWD',
    horsepower: 563,
    acceleration: '5.2s',
    topSpeed: '250 km/h',
    fuel: 'Petrol',
    rating: 5.0,
    reviews: 36,
    featured: false,
    badges: [BADGE.luxury, BADGE.suv],
    description:
      'The pinnacle of SUV opulence in Dubai — reserved for royal-level arrivals, Palm residences, and moments that demand absolute presence.',
    highlights: [
      'Ultimate VIP statement',
      'Magic Carpet Ride comfort',
      'Preferred for weddings & galas',
    ],
    features: [
      'Starlight Headliner',
      'Bespoke audio',
      'Rear privacy suite',
      'Picnic tables',
      'Night-vision assist',
      'Umbrella compartments',
    ],
    included: SHARED_INCLUDED,
    requirements: SHARED_REQUIREMENTS,
  },
];

export function formatPrice(amount) {
  return `${COMPANY.currency} ${Number(amount).toLocaleString('en-AE')}`;
}

export function getCarById(id) {
  return CARS.find((car) => String(car.id) === String(id)) || null;
}

export function getLocationLabel(value) {
  return LOCATIONS.find((item) => item.value === value)?.label || null;
}

export function getTypeLabel(value) {
  return CAR_TYPES.find((item) => item.value === value)?.label || null;
}

export function getCarSpecs(car) {
  const powerIcon = car.powertrain === 'Electric' ? 'bolt' : 'settings';
  const powerLabel = car.powertrain === 'Electric' ? 'Electric' : car.transmission;
  return [
    { icon: powerIcon, label: powerLabel },
    { icon: 'airline_seat_recline_normal', label: `${car.seats} Seats` },
  ];
}

export function getDetailSpecs(car) {
  return [
    { icon: 'calendar_month', label: 'Year', value: String(car.year) },
    { icon: 'speed', label: 'Power', value: `${car.horsepower} hp` },
    { icon: 'timer', label: '0–100 km/h', value: car.acceleration },
    { icon: 'speed', label: 'Top speed', value: car.topSpeed },
    { icon: 'settings', label: 'Transmission', value: car.transmission },
    { icon: 'sync_alt', label: 'Drivetrain', value: car.drivetrain },
    { icon: 'airline_seat_recline_normal', label: 'Seats', value: String(car.seats) },
    { icon: 'sensor_door', label: 'Doors', value: String(car.doors) },
    { icon: 'local_gas_station', label: 'Fuel', value: car.fuel },
    { icon: 'palette', label: 'Colour', value: car.color },
    { icon: 'straighten', label: 'Daily limit', value: `${car.dailyKm} km` },
    { icon: 'payments', label: 'Deposit', value: formatPrice(car.deposit) },
  ];
}

export function getRelatedCars(car, limit = 3) {
  return CARS.filter((item) => item.id !== car.id && item.type === car.type).slice(0, limit);
}

export function filterCars({ location, type, sort = 'featured', query = '' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  let results = CARS.filter((car) => {
    const matchesLocation = !location || car.locations.includes(location);
    const matchesType = !type || type === 'any' || car.type === type;
    const matchesQuery =
      !normalizedQuery ||
      car.name.toLowerCase().includes(normalizedQuery) ||
      car.brand.toLowerCase().includes(normalizedQuery) ||
      car.model.toLowerCase().includes(normalizedQuery);

    return matchesLocation && matchesType && matchesQuery;
  });

  switch (sort) {
    case 'price-asc':
      results = [...results].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      results = [...results].sort((a, b) => b.price - a.price);
      break;
    case 'name':
      results = [...results].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      results = [...results].sort((a, b) => Number(b.featured) - Number(a.featured) || a.price - b.price);
  }

  return results;
}

export function toFeaturedCar(car) {
  return {
    id: car.id,
    name: car.name,
    price: car.price,
    image: car.image,
    alt: car.alt,
    badges: car.badges,
    specs: getCarSpecs(car),
  };
}

export const FEATURED_CAR_IDS = [1, 2, 3];

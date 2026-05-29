/**
 * Tunisian governorate metadata used by the mobile location search.
 *
 * The backend pharmacy rows are not guaranteed to have complete address data,
 * so the app needs stable coordinate presets to search by place even when only
 * latitude/longitude is available.
 */

export const TUNISIAN_GOVERNORATES = [
  {
    id: 1,
    name: 'Tunis',
    aliases: ['tunis'],
    cities: ['Tunis', 'La Marsa', 'Carthage', 'Le Bardo', 'La Goulette', 'Sidi Hassine'],
    center: { latitude: 36.8065, longitude: 10.1815 },
    radiusKm: 24,
  },
  {
    id: 2,
    name: 'Ariana',
    aliases: ['ariana'],
    cities: ['Ariana', 'La Soukra', 'Raoued', 'Mnihla'],
    center: { latitude: 36.8665, longitude: 10.1647 },
    radiusKm: 20,
  },
  {
    id: 3,
    name: 'Ben Arous',
    aliases: ['ben arous'],
    cities: ['Ben Arous', 'El Mourouj', 'Hammam Lif', 'Rades', 'Fouchana'],
    center: { latitude: 36.7531, longitude: 10.2189 },
    radiusKm: 24,
  },
  {
    id: 4,
    name: 'Manouba',
    aliases: ['manouba'],
    cities: ['Manouba', 'Den Den', 'Oued Ellil', 'Tebourba'],
    center: { latitude: 36.8101, longitude: 10.0956 },
    radiusKm: 25,
  },
  {
    id: 5,
    name: 'Nabeul',
    aliases: ['nabeul'],
    cities: ['Nabeul', 'Hammamet', 'Kelibia', 'Korba', 'Soliman'],
    center: { latitude: 36.4561, longitude: 10.7376 },
    radiusKm: 40,
  },
  {
    id: 6,
    name: 'Bizerte',
    aliases: ['bizerte'],
    cities: ['Bizerte', 'Menzel Bourguiba', 'Ras Jebel', 'Mateur'],
    center: { latitude: 37.2744, longitude: 9.8739 },
    radiusKm: 35,
  },
  {
    id: 7,
    name: 'Beja',
    aliases: ['beja', 'béja'],
    cities: ['Beja', 'Testour', 'Medjez el Bab'],
    center: { latitude: 36.7256, longitude: 9.1817 },
    radiusKm: 35,
  },
  {
    id: 8,
    name: 'Jendouba',
    aliases: ['jendouba'],
    cities: ['Jendouba', 'Tabarka', 'Ain Draham'],
    center: { latitude: 36.5011, longitude: 8.7802 },
    radiusKm: 40,
  },
  {
    id: 9,
    name: 'Le Kef',
    aliases: ['le kef', 'kef'],
    cities: ['Le Kef', 'Tajerouine', 'Sakiet Sidi Youssef'],
    center: { latitude: 36.1742, longitude: 8.7049 },
    radiusKm: 40,
  },
  {
    id: 10,
    name: 'Siliana',
    aliases: ['siliana'],
    cities: ['Siliana', 'Bou Arada', 'Gaafour'],
    center: { latitude: 36.0849, longitude: 9.3708 },
    radiusKm: 35,
  },
  {
    id: 11,
    name: 'Zaghouan',
    aliases: ['zaghouan'],
    cities: ['Zaghouan', 'Zriba', 'Bir Mcherga'],
    center: { latitude: 36.4029, longitude: 10.1429 },
    radiusKm: 35,
  },
  {
    id: 12,
    name: 'Sousse',
    aliases: ['sousse'],
    cities: ['Sousse', 'Msaken', 'Akouda', 'Kalaa Kebira'],
    center: { latitude: 35.8256, longitude: 10.6369 },
    radiusKm: 30,
  },
  {
    id: 13,
    name: 'Monastir',
    aliases: ['monastir'],
    cities: ['Monastir', 'Moknine', 'Ksibet el Mediouni'],
    center: { latitude: 35.7643, longitude: 10.8113 },
    radiusKm: 26,
  },
  {
    id: 14,
    name: 'Mahdia',
    aliases: ['mahdia'],
    cities: ['Mahdia', 'Chebba', 'El Jem'],
    center: { latitude: 35.5047, longitude: 11.0622 },
    radiusKm: 32,
  },
  {
    id: 15,
    name: 'Sfax',
    aliases: ['sfax'],
    cities: ['Sfax', 'Sakiet Ezzit', 'Mahres', 'Kerkennah'],
    center: { latitude: 34.7406, longitude: 10.7603 },
    radiusKm: 38,
  },
  {
    id: 16,
    name: 'Kairouan',
    aliases: ['kairouan'],
    cities: ['Kairouan', 'Sbikha', 'Haffouz'],
    center: { latitude: 35.6781, longitude: 10.0963 },
    radiusKm: 45,
  },
  {
    id: 17,
    name: 'Kasserine',
    aliases: ['kasserine'],
    cities: ['Kasserine', 'Sbeitla', 'Feriana'],
    center: { latitude: 35.1676, longitude: 8.8365 },
    radiusKm: 55,
  },
  {
    id: 18,
    name: 'Sidi Bouzid',
    aliases: ['sidi bouzid'],
    cities: ['Sidi Bouzid', 'Regueb', 'Meknassy'],
    center: { latitude: 35.0382, longitude: 9.4849 },
    radiusKm: 55,
  },
  {
    id: 19,
    name: 'Gabes',
    aliases: ['gabes', 'gabès'],
    cities: ['Gabes', 'Matmata', 'Mareth'],
    center: { latitude: 33.8815, longitude: 10.0982 },
    radiusKm: 55,
  },
  {
    id: 20,
    name: 'Medenine',
    aliases: ['medenine'],
    cities: ['Medenine', 'Djerba', 'Zarzis'],
    center: { latitude: 33.3549, longitude: 10.5055 },
    radiusKm: 65,
  },
  {
    id: 21,
    name: 'Tataouine',
    aliases: ['tataouine'],
    cities: ['Tataouine', 'Ghomrassen', 'Remada'],
    center: { latitude: 32.9297, longitude: 10.4518 },
    radiusKm: 90,
  },
  {
    id: 22,
    name: 'Gafsa',
    aliases: ['gafsa'],
    cities: ['Gafsa', 'Metlaoui', 'Redeyef'],
    center: { latitude: 34.425, longitude: 8.7842 },
    radiusKm: 60,
  },
  {
    id: 23,
    name: 'Tozeur',
    aliases: ['tozeur'],
    cities: ['Tozeur', 'Nefta', 'Degache'],
    center: { latitude: 33.9197, longitude: 8.1335 },
    radiusKm: 55,
  },
  {
    id: 24,
    name: 'Kebili',
    aliases: ['kebili'],
    cities: ['Kebili', 'Douz', 'Souk Lahad'],
    center: { latitude: 33.7044, longitude: 8.969 },
    radiusKm: 65,
  },
];

export const POPULAR_GOVERNORATES = ['Tunis', 'Sfax', 'Sousse', 'Ariana', 'Nabeul'];

const GOVERNORATE_BY_KEY = new Map();
const CITY_BY_KEY = new Map();

const normalizeLocationKey = (value) =>
  `${value || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

TUNISIAN_GOVERNORATES.forEach((governorate) => {
  GOVERNORATE_BY_KEY.set(normalizeLocationKey(governorate.name), governorate);
  governorate.aliases.forEach((alias) => {
    GOVERNORATE_BY_KEY.set(normalizeLocationKey(alias), governorate);
  });

  governorate.cities.forEach((city) => {
    const normalizedCity = normalizeLocationKey(city);
    if (normalizedCity === normalizeLocationKey(governorate.name)) {
      return;
    }

    CITY_BY_KEY.set(normalizedCity, {
      label: city,
      governorate: governorate.name,
      fallbackCoords: { ...governorate.center },
      radiusKm: Math.max(12, Math.round(governorate.radiusKm * 0.45)),
    });
  });
});

export const ALL_GOVERNORATE_NAMES = TUNISIAN_GOVERNORATES.map((gov) => gov.name);
export const ALL_CITY_NAMES = Array.from(CITY_BY_KEY.values())
  .map((city) => city.label)
  .sort((left, right) => left.localeCompare(right));

export const ALL_LOCATION_OPTIONS = [
  ...TUNISIAN_GOVERNORATES.map((gov) => ({
    type: 'governorate',
    label: gov.name,
    value: gov.name,
    governorate: gov.name,
  })),
  ...Array.from(CITY_BY_KEY.values())
    .map((city) => ({
      type: 'city',
      label: city.label,
      value: city.label,
      governorate: city.governorate,
    }))
    .sort((left, right) => left.label.localeCompare(right.label)),
];

export const getCitiesForGovernorate = (governorateName) => {
  const normalized = normalizeLocationKey(governorateName);
  const governorate = GOVERNORATE_BY_KEY.get(normalized);
  return governorate ? governorate.cities : [];
};

export const getGovernorateSearchConfig = (governorateName) => {
  const normalized = normalizeLocationKey(governorateName);
  const governorate = GOVERNORATE_BY_KEY.get(normalized);

  if (!governorate) {
    return null;
  }

  return {
    id: governorate.id,
    name: governorate.name,
    coords: { ...governorate.center },
    radiusKm: governorate.radiusKm,
    cities: [...governorate.cities],
  };
};

export const createGovernorateSearchTarget = (governorateName) => {
  const config = getGovernorateSearchConfig(governorateName);

  if (!config) {
    return null;
  }

  return {
    type: 'governorate',
    label: config.name,
    governorate: config.name,
    latitude: config.coords.latitude,
    longitude: config.coords.longitude,
    radiusKm: config.radiusKm,
  };
};

export const createLocationSearchTarget = (locationName) => {
  if (!locationName) {
    return null;
  }

  const governorateTarget = createGovernorateSearchTarget(locationName);
  if (governorateTarget) {
    return governorateTarget;
  }

  const city = CITY_BY_KEY.get(normalizeLocationKey(locationName));
  if (!city) {
    return null;
  }

  return {
    type: 'city',
    label: city.label,
    queryText: city.label,
    governorate: city.governorate,
    radiusKm: city.radiusKm,
    fallbackLatitude: city.fallbackCoords.latitude,
    fallbackLongitude: city.fallbackCoords.longitude,
  };
};

export const LOCATION_SEARCH_OPTIONS = [
  { label: 'All locations', value: null },
  ...TUNISIAN_GOVERNORATES.map((gov) => ({
    label: gov.name,
    value: gov.name,
  })),
];

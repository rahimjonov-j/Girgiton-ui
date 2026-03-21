export const CATEGORIES = [
  { id: 'asosiy', label: 'Asosiy taom', icon: '🍽️' },
  { id: 'shorva', label: "Sho'rvalar", icon: '🍲' },
  { id: 'fast_food', label: 'Fast-food', icon: '🍔' },
  { id: 'grill', label: 'Grill', icon: '🍗' },
  { id: 'milliy', label: 'Milliy taom', icon: '🥘' },
  { id: 'salat', label: 'Salatlar', icon: '🥗' },
  { id: 'ichimlik', label: 'Ichimliklar', icon: '🥤' },
  { id: 'desert', label: 'Shirinliklar', icon: '🍰' },
];

export const MENU_ITEMS = [
  // Salatlar
  { id: 's1', category: 'salat', name: 'Achchiq-chuq', description: 'Pomidor, piyoz, achchiq qalampir, rayhon.', price: 8000, image: null, status: 'mavjud' },
  { id: 's2', category: 'salat', name: 'Sezar salati', description: 'Tovuq filesi, aysberg, pishloq, maxsus sous.', price: 25000, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&q=80', status: 'mavjud' },
  { id: 's3', category: 'salat', name: 'Bahor salati', description: "Bodring, pomidor, rediska, ko'katlar va tu...", price: 12000, image: null, status: 'tayyorlanmoqda' },
  { id: 's4', category: 'salat', name: 'Toshkent salati', description: "Qaynatilgan mol go'shti, turp, qovurilgan...", price: 22000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80', status: 'mavjud' },
  { id: 's5', category: 'salat', name: 'Grecheskiy salat', description: 'Bodring, pomidor, zaytun, fetaksa pishlo...', price: 24000, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80', status: 'mavjud' },

  // Asosiy taom
  { id: 'a1', category: 'asosiy', name: 'Toshkent palovi', description: "Lazer guruchi, qo'y go'shti, sariq sabzi, noxat, kis...", price: 28000, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80', status: 'tayyorlanmoqda' },
  { id: 'a2', category: 'asosiy', name: "Uyg'ur lag'mon", description: "Cho'zma xamir, mol go'shti, say, sarimsoq, bolga...", price: 24000, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=80', status: 'mavjud' },
  { id: 'a3', category: 'asosiy', name: 'Qozon kabob', description: "Qovurilgan qo'y qovurg'alari, tillarang kartoshka...", price: 35000, image: 'https://images.unsplash.com/photo-1544025162-d76594d18494?w=200&q=80', status: 'mavjud' },
  { id: 'a4', category: 'asosiy', name: "Manti (Go'shtli)", description: "Yupqa xamir, to'g'ralgan mol go'shti, piyoz, murc...", price: 25000, image: null, status: 'tayyorlanmoqda' },

  // Shorva
  { id: 'sh1', category: 'shorva', name: "Mastava sho'rvasi", description: "Guruch, mol go'shti, sabzavotlar va ziravorlar.", price: 18000, image: null, status: 'mavjud' },
  { id: 'sh2', category: 'shorva', name: "Moshhorda sho'rva", description: "Mosh, guruch va go'sht qo'shilib pishirilgan.", price: 20000, image: null, status: 'tayyorlanmoqda' },

  // Kabob
  { id: 'k1', category: 'kabob', name: 'Tanovar kabob', description: "Qo'y go'shtidan tayyorlangan shirali kabob.", price: 32000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80', status: 'mavjud' },
  { id: 'k2', category: 'kabob', name: 'Jiz-biz', description: "Qovurilgan qo'y ichak-chavoqlari, kartoshka.", price: 28000, image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=200&q=80', status: 'tayyorlanmoqda' },

  // Ichimliklar
  { id: 'i1', category: 'ichimlik', name: 'Limonod', description: "Limon, nanadan tayyorlangan tabiiy limonod.", price: 8000, image: null, status: 'mavjud' },
  { id: 'i2', category: 'ichimlik', name: 'Qora choy', description: 'Choynak choy (2 piyola).', price: 5000, image: null, status: 'mavjud' },
  { id: 'i3', category: 'ichimlik', name: 'Ko\'k choy', description: 'Choynak ko\'k choy (2 piyola).', price: 5000, image: null, status: 'mavjud' },

  // Desert
  { id: 'd1', category: 'desert', name: 'Tort (1 kichim)', description: 'Kundalik yangi tort.', price: 18000, image: null, status: 'tayyorlanmoqda' },
  { id: 'd2', category: 'desert', name: 'Halva', description: "O'zbek milliy shirin taomlari.", price: 10000, image: null, status: 'mavjud' },
];

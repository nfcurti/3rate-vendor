export type ItalianProvince = {
  code: string;
  name: string;
};

export type ItalianRegion = {
  name: string;
  provinces: ItalianProvince[];
};

export const ITALIAN_REGIONS: ItalianRegion[] = [
  {
    name: "Abruzzo",
    provinces: [
      { code: "AQ", name: "L'Aquila" },
      { code: "CH", name: "Chieti" },
      { code: "PE", name: "Pescara" },
      { code: "TE", name: "Teramo" },
    ],
  },
  {
    name: "Basilicata",
    provinces: [
      { code: "MT", name: "Matera" },
      { code: "PZ", name: "Potenza" },
    ],
  },
  {
    name: "Calabria",
    provinces: [
      { code: "CS", name: "Cosenza" },
      { code: "CZ", name: "Catanzaro" },
      { code: "KR", name: "Crotone" },
      { code: "RC", name: "Reggio Calabria" },
      { code: "VV", name: "Vibo Valentia" },
    ],
  },
  {
    name: "Campania",
    provinces: [
      { code: "AV", name: "Avellino" },
      { code: "BN", name: "Benevento" },
      { code: "CE", name: "Caserta" },
      { code: "NA", name: "Napoli" },
      { code: "SA", name: "Salerno" },
    ],
  },
  {
    name: "Emilia-Romagna",
    provinces: [
      { code: "BO", name: "Bologna" },
      { code: "FC", name: "Forlì-Cesena" },
      { code: "FE", name: "Ferrara" },
      { code: "MO", name: "Modena" },
      { code: "PC", name: "Piacenza" },
      { code: "PR", name: "Parma" },
      { code: "RA", name: "Ravenna" },
      { code: "RE", name: "Reggio Emilia" },
      { code: "RN", name: "Rimini" },
    ],
  },
  {
    name: "Friuli-Venezia Giulia",
    provinces: [
      { code: "GO", name: "Gorizia" },
      { code: "PN", name: "Pordenone" },
      { code: "TS", name: "Trieste" },
      { code: "UD", name: "Udine" },
    ],
  },
  {
    name: "Lazio",
    provinces: [
      { code: "FR", name: "Frosinone" },
      { code: "LT", name: "Latina" },
      { code: "RI", name: "Rieti" },
      { code: "RM", name: "Roma" },
      { code: "VT", name: "Viterbo" },
    ],
  },
  {
    name: "Liguria",
    provinces: [
      { code: "GE", name: "Genova" },
      { code: "IM", name: "Imperia" },
      { code: "SP", name: "La Spezia" },
      { code: "SV", name: "Savona" },
    ],
  },
  {
    name: "Lombardia",
    provinces: [
      { code: "BG", name: "Bergamo" },
      { code: "BS", name: "Brescia" },
      { code: "CO", name: "Como" },
      { code: "CR", name: "Cremona" },
      { code: "LC", name: "Lecco" },
      { code: "LO", name: "Lodi" },
      { code: "MB", name: "Monza e Brianza" },
      { code: "MI", name: "Milano" },
      { code: "MN", name: "Mantova" },
      { code: "PV", name: "Pavia" },
      { code: "SO", name: "Sondrio" },
      { code: "VA", name: "Varese" },
    ],
  },
  {
    name: "Marche",
    provinces: [
      { code: "AN", name: "Ancona" },
      { code: "AP", name: "Ascoli Piceno" },
      { code: "FM", name: "Fermo" },
      { code: "MC", name: "Macerata" },
      { code: "PU", name: "Pesaro e Urbino" },
    ],
  },
  {
    name: "Molise",
    provinces: [
      { code: "CB", name: "Campobasso" },
      { code: "IS", name: "Isernia" },
    ],
  },
  {
    name: "Piemonte",
    provinces: [
      { code: "AL", name: "Alessandria" },
      { code: "AT", name: "Asti" },
      { code: "BI", name: "Biella" },
      { code: "CN", name: "Cuneo" },
      { code: "NO", name: "Novara" },
      { code: "TO", name: "Torino" },
      { code: "VB", name: "Verbano-Cusio-Ossola" },
      { code: "VC", name: "Vercelli" },
    ],
  },
  {
    name: "Puglia",
    provinces: [
      { code: "BA", name: "Bari" },
      { code: "BT", name: "Barletta-Andria-Trani" },
      { code: "BR", name: "Brindisi" },
      { code: "FG", name: "Foggia" },
      { code: "LE", name: "Lecce" },
      { code: "TA", name: "Taranto" },
    ],
  },
  {
    name: "Sardegna",
    provinces: [
      { code: "CA", name: "Cagliari" },
      { code: "NU", name: "Nuoro" },
      { code: "OR", name: "Oristano" },
      { code: "SS", name: "Sassari" },
      { code: "SU", name: "Sud Sardegna" },
    ],
  },
  {
    name: "Sicilia",
    provinces: [
      { code: "AG", name: "Agrigento" },
      { code: "CL", name: "Caltanissetta" },
      { code: "CT", name: "Catania" },
      { code: "EN", name: "Enna" },
      { code: "ME", name: "Messina" },
      { code: "PA", name: "Palermo" },
      { code: "RG", name: "Ragusa" },
      { code: "SR", name: "Siracusa" },
      { code: "TP", name: "Trapani" },
    ],
  },
  {
    name: "Toscana",
    provinces: [
      { code: "AR", name: "Arezzo" },
      { code: "FI", name: "Firenze" },
      { code: "GR", name: "Grosseto" },
      { code: "LI", name: "Livorno" },
      { code: "LU", name: "Lucca" },
      { code: "MS", name: "Massa-Carrara" },
      { code: "PI", name: "Pisa" },
      { code: "PO", name: "Prato" },
      { code: "PT", name: "Pistoia" },
      { code: "SI", name: "Siena" },
    ],
  },
  {
    name: "Trentino-Alto Adige",
    provinces: [
      { code: "BZ", name: "Bolzano" },
      { code: "TN", name: "Trento" },
    ],
  },
  {
    name: "Umbria",
    provinces: [
      { code: "PG", name: "Perugia" },
      { code: "TR", name: "Terni" },
    ],
  },
  {
    name: "Valle d'Aosta",
    provinces: [{ code: "AO", name: "Aosta" }],
  },
  {
    name: "Veneto",
    provinces: [
      { code: "BL", name: "Belluno" },
      { code: "PD", name: "Padova" },
      { code: "RO", name: "Rovigo" },
      { code: "TV", name: "Treviso" },
      { code: "VE", name: "Venezia" },
      { code: "VI", name: "Vicenza" },
      { code: "VR", name: "Verona" },
    ],
  },
];

export const ITALIAN_REGION_OPTIONS = ITALIAN_REGIONS.map((region) => ({
  value: region.name,
  label: region.name,
}));

export function getProvincesForRegion(regionName: string) {
  return ITALIAN_REGIONS.find((region) => region.name === regionName)?.provinces ?? [];
}

export function getProvinceOptionsForRegion(regionName: string) {
  return getProvincesForRegion(regionName).map((province) => ({
    value: province.code,
    label: `${province.name} (${province.code})`,
  }));
}

export function findRegionByProvinceCode(provinceCode: string) {
  const normalized = provinceCode.trim().toUpperCase();
  if (!normalized) return undefined;
  return ITALIAN_REGIONS.find((region) =>
    region.provinces.some((province) => province.code === normalized)
  )?.name;
}

export function normalizeProvinceCode(value: string) {
  return value.trim().toUpperCase();
}

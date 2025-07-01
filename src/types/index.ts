export interface Champion {
  key: string;
  name: string;
  cost: number[];
  imageUrl: string;
  traits: string[];
  health: number[];
  attackDamage: number[];
  attackSpeed: number;
  armor: number;
  magicalResistance: number;
  skill: {
    name: string;
    imageUrl: string;
    desc: string;
    startingMana: number;
    skillMana: number;
    stats: string[];
  };
  recommendItems: string[];
  // Statistiques simulées
  rating?: number;
  winRate?: number;
  pickRate?: number;
  avgPlacement?: number;
  isMeta?: boolean;
}

export interface Item {
  key: string;
  name: string;
  desc: string;
  shortDesc: string;
  fromDesc: string;
  imageUrl: string;
  compositions?: string[];
  affectedTraitKey?: string;
  isUnique?: boolean;
  isEmblem?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface Synergy {
  name: string;
  icon: string;
  color: string;
  imageUrl?: string;
  dominantColor?: string;
}

export interface FilterState {
  selectedTags: string[];
  selectedSynergies: string[];
  showOnlyFavorites: boolean;
  showOnlyMeta: boolean;
  activeTab: number | 'all';
  sortBy: 'cost' | 'name' | 'winrate';
  viewMode: 'grid' | 'compact';
}
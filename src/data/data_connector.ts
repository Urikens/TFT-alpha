import { Champion, Item, Synergy } from '../types';

// Importe les données générées
import { generatedChampions } from './champions_generated';
import { generatedItemsStats } from './items_stats_generated';
import { commonSynergies } from './synergies';

// Mapping des traits corrects pour chaque champion
const championTraitsMapping: Record<string, string[]> = {
  "Alistar": ["Armorclad", "Vanguard"],
  "Annie": ["Divinicorp", "Controller"],
  "Aphelios": ["Divinicorp", "Marksman"],
  "Aurora": ["Anima Squad", "Marksman"],
  "Brand": ["Street Demon", "Techie"],
  "Braum": ["Ballistek", "Vanguard"],
  "Cho'Gath": ["Mob", "Bruiser"],
  "Darius": ["Street Demon", "Bruiser"],
  "Dr. Mundo": ["Street Demon", "Bruiser"],
  "Draven": ["Street Demon", "Marksman"],
  "Ekko": ["Anima Squad", "Swift"],
  "Elise": ["Mob", "Controller"],
  "Fiddlesticks": ["Mob", "Controller"],
  "Galio": ["Divinicorp", "Vanguard"],
  "Gragas": ["Ballistek", "Bruiser"],
  "Graves": ["Ballistek", "Marksman"],
  "Illaoi": ["Divinicorp", "Bruiser"],
  "Jarvan IV": ["Divinicorp", "Vanguard"],
  "Jax": ["Anima Squad", "Bruiser"],
  "Jhin": ["Anima Squad", "Marksman"],
  "Jinx": ["Anima Squad", "Marksman"],
  "Kindred": ["Mob", "Marksman"],
  "Kobuko": ["Street Demon", "Swift"],
  "Kog'Maw": ["Ballistek", "Marksman"],
  "LeBlanc": ["Anima Squad", "Controller"],
  "Leona": ["Anima Squad", "Vanguard"],
  "Miss Fortune": ["Ballistek", "Marksman"],
  "Mordekaiser": ["Street Demon", "Vanguard"],
  "Morgana": ["Divinicorp", "Controller"],
  "Naafiri": ["Street Demon", "Swift"],
  "Neeko": ["Anima Squad", "Controller"],
  "Nidalee": ["Anima Squad", "Swift"],
  "Poppy": ["Ballistek", "Vanguard"],
  "Rengar": ["Mob", "Swift"],
  "Renekton": ["Street Demon", "Bruiser"],
  "Rhaast": ["Mob", "Bruiser"],
  "Samira": ["Street Demon", "Marksman"],
  "Sejuani": ["Ballistek", "Vanguard"],
  "Senna": ["Divinicorp", "Marksman"],
  "Seraphine": ["Divinicorp", "Controller"],
  "Shaco": ["Mob", "Swift"],
  "Shyvana": ["Street Demon", "Bruiser"],
  "Skarner": ["Ballistek", "Bruiser"],
  "Sylas": ["Anima Squad", "Bruiser"],
  "Twisted Fate": ["Ballistek", "Controller"],
  "Urgot": ["Ballistek", "Bruiser"],
  "Varus": ["Divinicorp", "Marksman"],
  "Vayne": ["Anima Squad", "Marksman"],
  "Veigar": ["Mob", "Controller"],
  "Vex": ["Mob", "Controller"],
  "Vi": ["Anima Squad", "Bruiser"],
  "Viego": ["Mob", "Swift"],
  "Xayah": ["Anima Squad", "Marksman"],
  "Yuumi": ["Divinicorp", "Controller"],
  "Zac": ["Street Demon", "Vanguard"],
  "Zed": ["Anima Squad", "Swift"],
  "Zeri": ["Ballistek", "Marksman"],
  "Ziggs": ["Ballistek", "Controller"],
  "Zyra": ["Divinicorp", "Controller"]
};

/**
 * Classe utilitaire pour lier les différentes sources de données TFT
 */
export class TFTDataConnector {
  private champions: Champion[] = [];
  private items: Item[] = [];
  private synergies: Synergy[] = [];
  private championsByName: Map<string, Champion> = new Map();
  private itemsByKey: Map<string, Item> = new Map();
  private synergiesByName: Map<string, Synergy> = new Map();
  private championTraits: Map<string, string[]> = new Map();
  private traitChampions: Map<string, string[]> = new Map();
  private recommendedItemsMap: Map<string, Item[]> = new Map();

  constructor() {
    this.initializeData();
  }

  /**
   * Initialise toutes les données et crée les mappings
   */
  private initializeData(): void {
    // Initialise les champions
    this.champions = generatedChampions.map(champion => {
      // Utilise le mapping correct des traits pour chaque champion
      const correctTraits = championTraitsMapping[champion.name] || champion.traits || [];
      return {
        ...champion,
        traits: correctTraits
      };
    });
    
    this.champions.forEach(champion => {
      this.championsByName.set(champion.name, champion);
      
      // Crée le mapping des traits pour chaque champion
      if (champion.traits) {
        this.championTraits.set(champion.name, champion.traits);
        
        // Crée le mapping inverse (traits -> champions)
        champion.traits.forEach(trait => {
          if (!this.traitChampions.has(trait)) {
            this.traitChampions.set(trait, []);
          }
          this.traitChampions.get(trait)?.push(champion.name);
        });
      }
    });

    // Initialise les items
    this.items = generatedItemsStats;
    this.items.forEach(item => {
      this.itemsByKey.set(item.key, item);
    });

    // Initialise les synergies
    this.synergies = commonSynergies;
    this.synergies.forEach(synergy => {
      this.synergiesByName.set(synergy.name, synergy);
    });

    // Génère les items recommandés pour chaque champion
    this.generateRecommendedItems();
  }

  /**
   * Génère des items recommandés pour chaque champion en fonction de ses traits
   */
  private generateRecommendedItems(): void {
    // Mapping de classes à des items recommandés
    const itemsByClass: Record<string, string[]> = {
      'Marksman': ['InfinityEdge', 'LastWhisper', 'GuinsoosRageblade', 'RunaansHurricane', 'RapidFireCannon'],
      'Controller': ['BlueBuff', 'RabadonsDeathcap', 'JeweledGauntlet', 'Morellonomicon', 'ArchangelsStaff'],
      'Bruiser': ['WarmogsArmor', 'TitansResolve', 'SteraksGage', 'RedBuff', 'Bloodthirster'],
      'Vanguard': ['BrambleVest', 'DragonsClaw', 'GargoyleStoneplate', 'WarmogsArmor', 'Redemption'],
      'Swift': ['GuinsoosRageblade', 'RapidFireCannon', 'Quicksilver', 'RunaansHurricane', 'LastWhisper']
    };

    this.champions.forEach(champion => {
      let recommendedItemKeys: string[] = [];
      
      if (champion.traits) {
        // Priorise la classe principale pour les items
        const classTraits = champion.traits.filter(trait => 
          ['Marksman', 'Controller', 'Bruiser', 'Vanguard', 'Swift'].includes(trait)
        );
        
        if (classTraits.length > 0) {
          const mainClass = classTraits[0];
          recommendedItemKeys = itemsByClass[mainClass] || [];
        }
        
        // Si c'est un carry, priorise les items offensifs
        if (champion.asCarry > 0) {
          if (champion.traits.includes('Marksman')) {
            recommendedItemKeys = ['InfinityEdge', 'LastWhisper', 'GuinsoosRageblade'];
          } else if (champion.traits.includes('Controller')) {
            recommendedItemKeys = ['BlueBuff', 'RabadonsDeathcap', 'JeweledGauntlet'];
          } else {
            recommendedItemKeys = ['Bloodthirster', 'InfinityEdge', 'GuinsoosRageblade'];
          }
        }
      }
      
      // Trouve les objets correspondants
      const items = recommendedItemKeys
        .map(key => this.items.find(item => item.key.includes(key)))
        .filter(Boolean) as Item[];
      
      // Si aucun item n'est trouvé, utilise des items par défaut
      if (items.length === 0) {
        this.recommendedItemsMap.set(champion.name, this.items.slice(0, 3));
      } else {
        this.recommendedItemsMap.set(champion.name, items.slice(0, 3));
      }
    });
  }

  /**
   * Récupère tous les champions
   */
  getAllChampions(): Champion[] {
    return this.champions;
  }

  /**
   * Récupère tous les items
   */
  getAllItems(): Item[] {
    return this.items;
  }

  /**
   * Récupère toutes les synergies
   */
  getAllSynergies(): Synergy[] {
    return this.synergies;
  }

  /**
   * Récupère un champion par son nom
   */
  getChampionByName(name: string): Champion | undefined {
    return this.championsByName.get(name);
  }

  /**
   * Récupère un item par sa clé
   */
  getItemByKey(key: string): Item | undefined {
    return this.itemsByKey.get(key);
  }

  /**
   * Récupère une synergie par son nom
   */
  getSynergyByName(name: string): Synergy | undefined {
    return this.synergiesByName.get(name);
  }

  /**
   * Récupère les traits d'un champion
   */
  getChampionTraits(championName: string): string[] {
    return this.championTraits.get(championName) || [];
  }

  /**
   * Récupère tous les champions ayant un trait spécifique
   */
  getChampionsByTrait(traitName: string): Champion[] {
    const championNames = this.traitChampions.get(traitName) || [];
    return championNames
      .map(name => this.championsByName.get(name))
      .filter(Boolean) as Champion[];
  }

  /**
   * Récupère les items recommandés pour un champion
   */
  getRecommendedItems(championName: string): Item[] {
    return this.recommendedItemsMap.get(championName) || [];
  }

  /**
   * Récupère le nombre de champions par trait
   */
  getChampionCountByTrait(traitName: string): number {
    return this.traitChampions.get(traitName)?.length || 0;
  }

  /**
   * Récupère les champions meta (top tier)
   */
  getMetaChampions(): Champion[] {
    return this.champions.filter(champion => champion.isMeta);
  }

  /**
   * Récupère les items par tier
   */
  getItemsByTier(tier: number): Item[] {
    return this.items.filter(item => item.tier === tier);
  }

  /**
   * Récupère les items par type
   */
  getItemsByType(type: string): Item[] {
    return this.items.filter(item => item.itemType === type);
  }

  /**
   * Récupère les emblèmes
   */
  getEmblemItems(): Item[] {
    return this.items.filter(item => item.isEmblem);
  }
}

// Exporte une instance singleton
export const tftDataConnector = new TFTDataConnector();
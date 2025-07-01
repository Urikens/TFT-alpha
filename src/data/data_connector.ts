import { Champion, Item, Synergy } from '../types';

// Importe les données générées
import { generatedChampions } from './champions_generated';
import { generatedItemsStats } from './items_stats_generated';
import { commonSynergies } from './synergies';

// Mapping des traits corrects pour chaque champion
const championTraitsMapping: Record<string, string[]> = {
  "Alistar": ["Golden Ox", "Bruiser"],
  "Annie": ["Golden Ox", "A.M.P."],
  "Aphelios": ["Golden Ox", "Marksman"],
  "Aurora": ["Anima Squad", "Dynamo"],
  "Brand": ["Street Demon", "Techie"],
  "Braum": ["Syndicate", "Vanguard"],
  "Cho'Gath": ["BoomBots", "Bruiser"],
  "Darius": ["Syndicate", "Bruiser"],
  "Dr. Mundo": ["Street Demon", "Bruiser"],
  "Draven": ["Cypher", "Rapidfire"],
  "Ekko": ["Street Demon", "Strategist"],
  "Elise": ["Nitro", "Dynamo"],
  "Fiddlesticks": ["BoomBots", "Techie"],
  "Galio": ["Cypher", "Bastion"],
  "Garen": ["God of the Net"],
  "Gragas": ["Divinicorp", "Bruiser"],
  "Graves": ["Golden Ox", "Executioner"],
  "Illaoi": ["Anima Squad", "Bastion"],
  "Jarvan IV": ["Golden Ox", "Vanguard"],
  "Jax": ["Exotech", "Bastion"],
  "Jhin": ["Exotech", "Dynamo"],
  "Jinx": ["Street Demon", "Marksman"],
  "Kindred": ["Nitro", "Rapidfire"],
  "Kobuko": ["Cyberboss", "Bruiser"],
  "Kog'Maw": ["BoomBots", "Rapidfire"],
  "LeBlanc": ["Cypher", "Strategist"],
  "Leona": ["Anima Squad", "Vanguard"],
  "Miss Fortune": ["Syndicate", "Dynamo"],
  "Mordekaiser": ["Exotech", "Techie"],
  "Morgana": ["Divinicorp", "Dynamo"],
  "Naafiri": ["Exotech", "A.M.P."],
  "Neeko": ["Street Demon", "Strategist"],
  "Nidalee": ["Nitro", "A.M.P."],
  "Poppy": ["Cyberboss", "Bastion"],
  "Rengar": ["Street Demon", "Executioner"],
  "Renekton": ["Overlord", "Divinicorp", "Bastion"],
  "Rhaast": ["Divinicorp", "Vanguard"],
  "Samira": ["Street Demon", "A.M.P."],
  "Sejuani": ["Exotech", "Bastion"],
  "Senna": ["Divinicorp", "Slayer"],
  "Seraphine": ["Anima Squad", "Techie"],
  "Shaco": ["Syndicate", "Slayer"],
  "Shyvana": ["BoomBots", "Bastion"],
  "Skarner": ["BoomBots", "Vanguard"],
  "Sylas": ["Anima Squad", "Vanguard"],
  "Twisted Fate": ["Syndicate", "Rapidfire"],
  "Urgot": ["BoomBots", "Executioner"],
  "Varus": ["Exotech", "Executioner"],
  "Vayne": ["Anima Squad", "Slayer"],
  "Veigar": ["Cyberboss", "Techie"],
  "Vex": ["Divinicorp", "Executioner"],
  "Vi": ["Cypher", "Vanguard"],
  "Viego": ["Soul Killer", "Golden Ox", "Techie"],
  "Xayah": ["Anima Squad", "Marksman"],
  "Yuumi": ["Anima Squad", "A.M.P.", "Strategist"],
  "Zac": ["Virus", "Cypher", "Slayer"],
  "Zed": ["Cypher", "Slayer"],
  "Zeri": ["Exotech", "Rapidfire"],
  "Ziggs": ["Cyberboss", "Strategist"],
  "Zyra": ["Street Demon", "Techie"]
};

// Mapping des items recommandés pour chaque champion
const recommendedItemsMapping: Record<string, string[]> = {
  // Marksmen
  "Aphelios": ["InfinityEdge", "LastWhisper", "GuinsoosRageblade"],
  "Jinx": ["InfinityEdge", "LastWhisper", "RunaansHurricane"],
  "Xayah": ["InfinityEdge", "LastWhisper", "GuinsoosRageblade"],
  "Zeri": ["GuinsoosRageblade", "RunaansHurricane", "RapidFireCannon"],
  
  // AP Carries
  "Aurora": ["BlueBuff", "RabadonsDeathcap", "JeweledGauntlet"],
  "Brand": ["SpearOfShojin", "JeweledGauntlet", "Morellonomicon"],
  "Fiddlesticks": ["RabadonsDeathcap", "JeweledGauntlet", "ArchangelsStaff"],
  "Morgana": ["Morellonomicon", "RabadonsDeathcap", "ArchangelsStaff"],
  "Vex": ["JeweledGauntlet", "SpearOfShojin", "RabadonsDeathcap"],
  
  // Tanks
  "Braum": ["WarmogsArmor", "BrambleVest", "DragonsClaw"],
  "Cho'Gath": ["WarmogsArmor", "GargoyleStoneplate", "Redemption"],
  "Dr. Mundo": ["WarmogsArmor", "TitansResolve", "Redemption"],
  "Leona": ["GargoyleStoneplate", "BrambleVest", "DragonsClaw"],
  "Rhaast": ["WarmogsArmor", "BrambleVest", "DragonsClaw"],
  
  // Slayers
  "Senna": ["Bloodthirster", "InfinityEdge", "LastWhisper"],
  "Shaco": ["InfinityEdge", "Bloodthirster", "GuardianAngel"],
  "Vayne": ["GuinsoosRageblade", "InfinityEdge", "Bloodthirster"],
  "Zed": ["InfinityEdge", "Bloodthirster", "GuardianAngel"],
  
  // Bruisers
  "Alistar": ["WarmogsArmor", "SteraksGage", "Redemption"],
  "Darius": ["SteraksGage", "TitansResolve", "Bloodthirster"],
  "Gragas": ["WarmogsArmor", "Redemption", "GargoyleStoneplate"],
  "Kobuko": ["SteraksGage", "TitansResolve", "Bloodthirster"],
  
  // Techies
  "Mordekaiser": ["RabadonsDeathcap", "JeweledGauntlet", "HextechGunblade"],
  "Seraphine": ["BlueBuff", "Morellonomicon", "RabadonsDeathcap"],
  "Veigar": ["BlueBuff", "JeweledGauntlet", "RabadonsDeathcap"],
  "Zyra": ["Morellonomicon", "SpearOfShojin", "RabadonsDeathcap"],
  
  // Default items by class
  "default_Marksman": ["InfinityEdge", "LastWhisper", "GuinsoosRageblade"],
  "default_Dynamo": ["BlueBuff", "RabadonsDeathcap", "JeweledGauntlet"],
  "default_Bruiser": ["WarmogsArmor", "SteraksGage", "TitansResolve"],
  "default_Vanguard": ["WarmogsArmor", "BrambleVest", "GargoyleStoneplate"],
  "default_Bastion": ["WarmogsArmor", "BrambleVest", "GargoyleStoneplate"],
  "default_Techie": ["BlueBuff", "RabadonsDeathcap", "JeweledGauntlet"],
  "default_Executioner": ["InfinityEdge", "LastWhisper", "Bloodthirster"],
  "default_Slayer": ["InfinityEdge", "Bloodthirster", "GuardianAngel"],
  "default_Rapidfire": ["GuinsoosRageblade", "RunaansHurricane", "RapidFireCannon"],
  "default_A.M.P.": ["BlueBuff", "RabadonsDeathcap", "JeweledGauntlet"]
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
    this.champions.forEach(champion => {
      // Vérifie d'abord si le champion a des items recommandés spécifiques
      if (recommendedItemsMapping[champion.name]) {
        const itemKeys = recommendedItemsMapping[champion.name];
        const items = this.findItemsByKeys(itemKeys);
        this.recommendedItemsMap.set(champion.name, items);
        return;
      }
      
      // Sinon, utilise les items recommandés par classe
      if (champion.traits) {
        for (const trait of champion.traits) {
          const defaultKey = `default_${trait}`;
          if (recommendedItemsMapping[defaultKey]) {
            const itemKeys = recommendedItemsMapping[defaultKey];
            const items = this.findItemsByKeys(itemKeys);
            this.recommendedItemsMap.set(champion.name, items);
            return;
          }
        }
      }
      
      // Si aucun item recommandé n'est trouvé, utilise des items par défaut
      const defaultItems = this.findItemsByKeys(['WarmogsArmor', 'InfinityEdge', 'RabadonsDeathcap']);
      this.recommendedItemsMap.set(champion.name, defaultItems);
    });
  }

  /**
   * Trouve des items par leurs clés
   */
  private findItemsByKeys(keys: string[]): Item[] {
    return keys
      .map(key => this.items.find(item => item.key.includes(key)))
      .filter(Boolean) as Item[];
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
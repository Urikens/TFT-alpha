import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les données individuelles des champions TFT
interface ItemTrio {
  pick_rate_rank: number;
  item_api_names: string[];
  avg_placement: number;
  top_1_percent: number;
  nb_boards: number;
  pick_rate: number;
}

interface IndividualChampionStats {
  tier: number;
  pick_rate: number;
  avg_placement: number;
  top_4_percent: number;
  top_1_percent: number;
  item_trios: ItemTrio[];
}

interface ChampionData {
  championName: string;
  apiName: string;
  stats: IndividualChampionStats;
  localImageUrl?: string | null;
  itemImages?: { [itemName: string]: string | null };
}

interface ChampionStatsCollection {
  [championName: string]: ChampionData;
}

interface AnalysisStats {
  totalChampions: number;
  avgPickRate: number;
  avgPlacement: number;
  avgTop4Rate: number;
  avgTop1Rate: number;
  totalItemCombinations: number;
  mostPopularItems: { [itemName: string]: number };
  tierDistribution: { [tier: number]: number };
}

interface ScrapingResult {
  success: boolean;
  data?: ChampionStatsCollection;
  error?: string;
  timestamp: string;
  stats?: AnalysisStats;
  downloadedImages?: number;
  downloadedItemImages?: number;
}

class TFTIndividualChampionScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/stats/data/15.13/indiv_units_stats:rank=PLATINUM+&region=WORLD&mode=RANKED&api_name=';
  private championImageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/champion_squares/set14';
  private itemImageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/items/set14';
  private outputDir = './data/tft/individual_champions';
  private championImagesDir = './public/images/champions';
  private itemImagesDir = './public/images/items';
  private championsDataPath = './src/data/champions_14.json';

  constructor() {
    this.ensureOutputDirectory();
    this.ensureImagesDirectories();
  }

  /**
   * Assure que le répertoire de sortie existe
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire:', error);
    }
  }

  /**
   * Assure que les répertoires d'images existent
   */
  private async ensureImagesDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.championImagesDir, { recursive: true });
      await fs.mkdir(this.itemImagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création des répertoires d\'images:', error);
    }
  }

  /**
   * Charge la liste des champions depuis le fichier local
   */
  private async loadChampionsList(): Promise<{ key: string; name: string }[]> {
    try {
      const championsData = await fs.readFile(this.championsDataPath, 'utf-8');
      const champions = JSON.parse(championsData);
      
      if (!Array.isArray(champions)) {
        throw new Error('Le fichier champions_14.json ne contient pas un tableau');
      }

      console.log(`📋 ${champions.length} champions chargés depuis ${this.championsDataPath}`);
      return champions.map((champ: any) => ({
        key: champ.key,
        name: champ.name || champ.key
      }));
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la liste des champions:', error);
      throw error;
    }
  }

  /**
   * Convertit la clé du champion en nom API
   * Ex: "Jarvan" → "TFT14_Jarvan"
   */
  private getApiName(championKey: string): string {
    // Cas spéciaux pour les noms API
    const specialCases: { [key: string]: string } = {
      'Dr. Mundo': 'TFT14_DrMundo',
      'Miss Fortune': 'TFT14_MissFortune',
      "Kog'Maw": 'TFT14_KogMaw',
      'Twisted Fate': 'TFT14_TwistedFate',
      'Jarvan IV': 'TFT14_Jarvan'
    };
    
    return specialCases[championKey] || `TFT14_${championKey.replace(/\s+/g, '')}`;
  }

  /**
   * Nettoie le nom de l'item pour l'URL
   * Ex: "TFT_Item_RunaansHurricane" → "RunaansHurricane"
   */
  private cleanItemName(itemApiName: string): string {
    return itemApiName.replace(/^TFT_Item_/, '');
  }

  /**
   * Télécharge une image de champion
   */
  private async downloadChampionImage(championKey: string): Promise<string | null> {
    try {
      const apiName = this.getApiName(championKey);
      const imageUrl = `${this.championImageBaseUrl}/${apiName}.webp`;
      const cleanedName = championKey.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      const localPath = path.join(this.championImagesDir, `${cleanedName}.webp`);
      const relativePath = `/images/champions/${cleanedName}.webp`;

      // Vérifie si l'image existe déjà
      try {
        await fs.access(localPath);
        return relativePath;
      } catch {
        // L'image n'existe pas, on la télécharge
      }

      console.log(`📥 Téléchargement champion: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Individual-Champions-Scraper/1.0',
        }
      });

      if (response.status === 200) {
        await fs.writeFile(localPath, response.data);
        console.log(`✅ Image champion sauvegardée: ${cleanedName}.webp`);
        return relativePath;
      } else {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour ${cleanedName}`);
        return null;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`❌ Image champion non trouvée: ${championKey}`);
        } else {
          console.warn(`❌ Erreur téléchargement champion ${championKey}:`, error.message);
        }
      } else {
        console.warn(`❌ Erreur inattendue pour champion ${championKey}:`, error);
      }
      return null;
    }
  }

  /**
   * Télécharge une image d'item
   */
  private async downloadItemImage(itemApiName: string): Promise<string | null> {
    try {
      const cleanedName = this.cleanItemName(itemApiName);
      const imageUrl = `${this.itemImageBaseUrl}/${itemApiName}.webp`;
      const localPath = path.join(this.itemImagesDir, `${cleanedName}.webp`);
      const relativePath = `/images/items/${cleanedName}.webp`;

      // Vérifie si l'image existe déjà
      try {
        await fs.access(localPath);
        return relativePath;
      } catch {
        // L'image n'existe pas, on la télécharge
      }

      console.log(`📥 Téléchargement item: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Individual-Champions-Scraper/1.0',
        }
      });

      if (response.status === 200) {
        await fs.writeFile(localPath, response.data);
        console.log(`✅ Image item sauvegardée: ${cleanedName}.webp`);
        return relativePath;
      } else {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour item ${cleanedName}`);
        return null;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`❌ Image item non trouvée: ${itemApiName}`);
        } else {
          console.warn(`❌ Erreur téléchargement item ${itemApiName}:`, error.message);
        }
      } else {
        console.warn(`❌ Erreur inattendue pour item ${itemApiName}:`, error);
      }
      return null;
    }
  }

  /**
   * Récupère les statistiques d'un champion individuel
   */
  private async fetchChampionStats(championKey: string): Promise<{ stats: IndividualChampionStats | null, error?: string }> {
    try {
      const apiName = this.getApiName(championKey);
      const url = `${this.baseUrl}${apiName}`;
      
      const response = await axios.get<IndividualChampionStats>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Individual-Champions-Scraper/1.0',
          'Accept': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status}`);
      }

      const data = response.data;
      
      // Validation basique des données
      if (!data || typeof data !== 'object' || typeof data.tier !== 'number') {
        throw new Error('Structure de données invalide');
      }

      return { stats: data };

    } catch (error) {
      let errorMessage = 'Erreur inconnue';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = 'Champion non trouvé dans l\'API';
        } else if (error.response) {
          errorMessage = `Erreur HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'Aucune réponse du serveur';
        } else {
          errorMessage = `Erreur de configuration: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.warn(`⚠️ Erreur pour ${championKey}: ${errorMessage}`);
      return { stats: null, error: errorMessage };
    }
  }

  /**
   * Télécharge toutes les images d'items uniques trouvées
   */
  private async downloadAllItemImages(data: ChampionStatsCollection): Promise<{ [itemName: string]: string | null }> {
    console.log('\n🖼️ Téléchargement des images d\'items...');
    
    // Collecte tous les items uniques
    const allItems = new Set<string>();
    Object.values(data).forEach(championData => {
      championData.stats.item_trios.forEach(trio => {
        trio.item_api_names.forEach(itemName => {
          allItems.add(itemName);
        });
      });
    });

    const itemsArray = Array.from(allItems);
    console.log(`📦 ${itemsArray.length} items uniques trouvés`);

    const imageMap: { [itemName: string]: string | null } = {};
    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Télécharge les images en parallèle (par groupes de 5)
    const batchSize = 5;
    for (let i = 0; i < itemsArray.length; i += batchSize) {
      const batch = itemsArray.slice(i, i + batchSize);
      
      const promises = batch.map(async (itemName) => {
        const imagePath = await this.downloadItemImage(itemName);
        imageMap[itemName] = imagePath;
        
        if (imagePath) {
          downloadedCount++;
        } else {
          errorCount++;
        }
      });

      await Promise.all(promises);
      
      // Petite pause entre les batches
      if (i + batchSize < itemsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n📊 Résumé du téléchargement d'images d'items:`);
    console.log(`├─ Téléchargées: ${downloadedCount}`);
    console.log(`├─ Erreurs: ${errorCount}`);
    console.log(`└─ Total traité: ${itemsArray.length}`);

    return imageMap;
  }

  /**
   * Extrait les statistiques d'analyse
   */
  private extractAnalysisStats(data: ChampionStatsCollection): AnalysisStats {
    const champions = Object.values(data);
    const totalChampions = champions.length;
    
    const avgPickRate = champions.reduce((sum, c) => sum + c.stats.pick_rate, 0) / totalChampions;
    const avgPlacement = champions.reduce((sum, c) => sum + c.stats.avg_placement, 0) / totalChampions;
    const avgTop4Rate = champions.reduce((sum, c) => sum + c.stats.top_4_percent, 0) / totalChampions;
    const avgTop1Rate = champions.reduce((sum, c) => sum + c.stats.top_1_percent, 0) / totalChampions;
    
    // Compte les combinaisons d'items
    const totalItemCombinations = champions.reduce((sum, c) => sum + c.stats.item_trios.length, 0);
    
    // Items les plus populaires
    const itemCounts: { [itemName: string]: number } = {};
    champions.forEach(championData => {
      championData.stats.item_trios.forEach(trio => {
        trio.item_api_names.forEach(itemName => {
          itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        });
      });
    });
    
    // Distribution des tiers
    const tierDistribution: { [tier: number]: number } = {};
    champions.forEach(championData => {
      const tier = championData.stats.tier;
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    return {
      totalChampions,
      avgPickRate: Math.round(avgPickRate * 10000) / 100, // Pourcentage avec 2 décimales
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      avgTop4Rate: Math.round(avgTop4Rate * 10000) / 100,
      avgTop1Rate: Math.round(avgTop1Rate * 10000) / 100,
      totalItemCombinations,
      mostPopularItems: itemCounts,
      tierDistribution
    };
  }

  /**
   * Fonction principale de scraping
   */
  async fetchAllChampionsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🚀 Démarrage du scraping des statistiques individuelles des champions TFT...\n');
      
      // Charge la liste des champions
      const championsList = await this.loadChampionsList();
      
      console.log(`🔄 Récupération des données pour ${championsList.length} champions...`);
      
      const results: ChampionStatsCollection = {};
      const errors: { [championName: string]: string } = {};
      let successCount = 0;
      let errorCount = 0;

      // Traite les champions par batches pour éviter la surcharge
      const batchSize = 3;
      for (let i = 0; i < championsList.length; i += batchSize) {
        const batch = championsList.slice(i, i + batchSize);
        
        console.log(`📊 Traitement du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(championsList.length / batchSize)} (${batch.map(c => c.name).join(', ')})`);
        
        const promises = batch.map(async (champion) => {
          const { stats, error } = await this.fetchChampionStats(champion.key);
          
          if (stats) {
            results[champion.name] = {
              championName: champion.name,
              apiName: this.getApiName(champion.key),
              stats
            };
            successCount++;
          } else {
            errors[champion.name] = error || 'Erreur inconnue';
            errorCount++;
          }
        });

        await Promise.all(promises);
        
        // Pause entre les batches
        if (i + batchSize < championsList.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`\n✅ Récupération terminée:`);
      console.log(`├─ Succès: ${successCount} champions`);
      console.log(`├─ Erreurs: ${errorCount} champions`);
      console.log(`└─ Total: ${championsList.length} champions traités`);

      if (errorCount > 0) {
        console.log(`\n❌ Champions avec erreurs:`);
        Object.entries(errors).forEach(([name, error]) => {
          console.log(`├─ ${name}: ${error}`);
        });
      }

      if (successCount === 0) {
        throw new Error('Aucun champion récupéré avec succès');
      }

      // Télécharge les images des champions
      console.log('\n🖼️ Téléchargement des images des champions...');
      let championImageCount = 0;
      for (const [championName, championData] of Object.entries(results)) {
        const imagePath = await this.downloadChampionImage(championName);
        championData.localImageUrl = imagePath;
        if (imagePath) championImageCount++;
        
        // Petite pause entre les téléchargements
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Télécharge les images des items
      const itemImageMap = await this.downloadAllItemImages(results);
      const itemImageCount = Object.values(itemImageMap).filter(Boolean).length;

      // Ajoute les images d'items aux données des champions
      Object.values(results).forEach(championData => {
        championData.itemImages = {};
        championData.stats.item_trios.forEach(trio => {
          trio.item_api_names.forEach(itemName => {
            if (championData.itemImages) {
              championData.itemImages[itemName] = itemImageMap[itemName];
            }
          });
        });
      });

      // Extrait les statistiques d'analyse
      const stats = this.extractAnalysisStats(results);
      
      console.log(`\n📈 Analyse des données:`);
      console.log(`├─ Champions analysés: ${stats.totalChampions}`);
      console.log(`├─ Pick rate moyen: ${stats.avgPickRate}%`);
      console.log(`├─ Placement moyen: ${stats.avgPlacement}`);
      console.log(`├─ Taux Top 4 moyen: ${stats.avgTop4Rate}%`);
      console.log(`├─ Taux Top 1 moyen: ${stats.avgTop1Rate}%`);
      console.log(`├─ Combinaisons d'items: ${stats.totalItemCombinations}`);
      console.log(`└─ Images téléchargées: ${championImageCount} champions, ${itemImageCount} items`);

      return {
        success: true,
        data: results,
        timestamp,
        stats,
        downloadedImages: championImageCount,
        downloadedItemImages: itemImageCount
      };

    } catch (error) {
      let errorMessage = 'Erreur inconnue';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('❌ Erreur lors du scraping:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Sauvegarde les données dans un fichier JSON
   */
  async saveData(data: ChampionStatsCollection, filename?: string): Promise<void> {
    try {
      const fileName = filename || `individual_champions_stats_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Sauvegarde les données par tier
   */
  async saveDataByTier(data: ChampionStatsCollection): Promise<void> {
    try {
      const tierData: { [tier: number]: ChampionData[] } = {};

      Object.values(data).forEach(championData => {
        const tier = championData.stats.tier;
        if (!tierData[tier]) {
          tierData[tier] = [];
        }
        tierData[tier].push(championData);
      });

      const timestamp = Date.now();
      
      for (const [tier, champions] of Object.entries(tierData)) {
        if (champions.length > 0) {
          // Trie par pick rate décroissant
          champions.sort((a, b) => b.stats.pick_rate - a.stats.pick_rate);
          
          await fs.writeFile(
            path.join(this.outputDir, `individual_champions_tier_${tier}_${timestamp}.json`),
            JSON.stringify(champions, null, 2),
            'utf-8'
          );
        }
      }

      const tierCounts = Object.entries(tierData).map(([tier, champions]) => `Tier ${tier}: ${champions.length}`);
      console.log(`📂 Données sauvegardées par tier (${tierCounts.join(', ')})`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par tier:', error);
    }
  }

  /**
   * Génère un rapport détaillé
   */
  async generateReport(data: ChampionStatsCollection, stats: AnalysisStats): Promise<void> {
    try {
      let report = '# TFT Set 14 - Individual Champions Statistics Report\n\n';
      report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
      report += `Nombre total de champions: ${stats.totalChampions}\n`;
      report += `Combinaisons d'items analysées: ${stats.totalItemCombinations}\n\n`;

      // Statistiques générales
      report += '## Statistiques générales\n\n';
      report += `- **Total champions:** ${stats.totalChampions}\n`;
      report += `- **Pick rate moyen:** ${stats.avgPickRate}%\n`;
      report += `- **Placement moyen:** ${stats.avgPlacement}\n`;
      report += `- **Taux Top 4 moyen:** ${stats.avgTop4Rate}%\n`;
      report += `- **Taux Top 1 moyen:** ${stats.avgTop1Rate}%\n`;
      report += `- **Combinaisons d'items:** ${stats.totalItemCombinations}\n\n`;

      // Distribution des tiers
      report += '## Distribution des Tiers\n\n';
      Object.entries(stats.tierDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([tier, count]) => {
          report += `- **Tier ${tier}:** ${count} champions\n`;
        });
      report += '\n';

      // Top items
      const topItems = Object.entries(stats.mostPopularItems)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      
      report += '## Top 10 Items les plus utilisés\n\n';
      report += '| Rang | Item | Utilisations |\n';
      report += '|------|------|-------------|\n';
      topItems.forEach(([itemName, count], index) => {
        const cleanName = this.cleanItemName(itemName);
        report += `| ${index + 1} | ${cleanName} | ${count} |\n`;
      });
      report += '\n';

      // Champions par tier
      const tierOrder = Object.keys(stats.tierDistribution).map(Number).sort((a, b) => a - b);
      
      for (const tier of tierOrder) {
        const tierChampions = Object.values(data)
          .filter(championData => championData.stats.tier === tier)
          .sort((a, b) => b.stats.pick_rate - a.stats.pick_rate);

        if (tierChampions.length > 0) {
          report += `## Tier ${tier} Champions\n\n`;
          report += '| Champion | Pick Rate | Placement | Top 4% | Top 1% | Meilleure Build |\n';
          report += '|----------|-----------|-----------|--------|--------|-----------------|\n';
          
          tierChampions.forEach(championData => {
            const bestBuild = championData.stats.item_trios[0]; // Premier = meilleur pick rate
            const buildItems = bestBuild ? bestBuild.item_api_names.map(item => this.cleanItemName(item)).join(', ') : 'N/A';
            
            report += `| ${championData.championName} | ${(championData.stats.pick_rate * 100).toFixed(2)}% | ${championData.stats.avg_placement.toFixed(2)} | ${(championData.stats.top_4_percent * 100).toFixed(1)}% | ${(championData.stats.top_1_percent * 100).toFixed(1)}% | ${buildItems} |\n`;
          });
          report += '\n';
        }
      }

      const reportPath = path.join(this.outputDir, `individual_champions_report_${Date.now()}.md`);
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📄 Rapport généré: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'individual_champions_scraping_log.json');
      let logs: ScrapingResult[] = [];

      // Charge les logs existants
      try {
        const existingLogs = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      } catch {
        console.log('📝 Création du fichier de log');
      }

      // Ajoute le nouveau résultat
      logs.push(result);

      // Garde seulement les 50 derniers logs
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }

      await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf-8');
      console.log(`📝 Log de scraping mis à jour (${logs.length} entrées)`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du log:', error);
    }
  }

  /**
   * Fonction principale de scraping avec options
   */
  async scrape(options: { 
    saveData?: boolean, 
    generateReport?: boolean,
    saveByTier?: boolean,
    downloadImages?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      generateReport = false,
      saveByTier = false,
      downloadImages = true
    } = options;

    // Récupère les données
    const result = await this.fetchAllChampionsData();

    if (result.success && result.data && result.stats) {
      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }

      // Sauvegarde par tier
      if (saveByTier) {
        await this.saveDataByTier(result.data);
      }

      // Génère un rapport
      if (generateReport) {
        await this.generateReport(result.data, result.stats);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runIndividualChampionsScraper() {
  const scraper = new TFTIndividualChampionScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const generateReport = args.includes('--report');
  const saveByTier = args.includes('--by-tier');
  const downloadImages = !args.includes('--no-images');

  await scraper.scrape({ 
    saveData, 
    generateReport,
    saveByTier,
    downloadImages
  });
}

// Export pour utilisation en module
export { 
  TFTIndividualChampionScraper, 
  type ChampionStatsCollection, 
  type ChampionData, 
  type IndividualChampionStats,
  type AnalysisStats,
  type ScrapingResult 
};

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runIndividualChampionsScraper().catch(console.error);
}
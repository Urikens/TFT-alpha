import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les données individuelles des items TFT
interface IndividualItemStats {
  tier: number;
  score: number;
  nb_games: number;
  pick_rate: number;
  avg_placement: number;
  top_4_percent: number;
  top_1_percent: number;
  item_type: string;
  craftable: boolean;
}

interface ItemData {
  key: string;
  apiName: string;
  name?: string;
  stats: IndividualItemStats;
  localImageUrl?: string | null;
}

interface ItemsCollection {
  [itemKey: string]: ItemData;
}

interface AnalysisStats {
  totalItems: number;
  craftableItems: number;
  avgPickRate: number;
  avgPlacement: number;
  avgTop4Rate: number;
  avgTop1Rate: number;
  tierDistribution: { [tier: number]: number };
  typeDistribution: { [type: string]: number };
  topItems: ItemData[];
}

interface ScrapingResult {
  success: boolean;
  data?: ItemsCollection;
  error?: string;
  timestamp: string;
  stats?: AnalysisStats;
  downloadedImages?: number;
}

class TFTIndividualItemScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/stats/data/15.13/items_stats:rank=PLATINUM+&region=WORLD&mode=RANKED';
  private itemImageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/items/set14';
  private outputDir = './data/tft/individual_items';
  private itemImagesDir = './public/images/items';

  constructor() {
    this.ensureOutputDirectory();
    this.ensureImagesDirectory();
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
   * Assure que le répertoire d'images existe
   */
  private async ensureImagesDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.itemImagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire d\'images:', error);
    }
  }

  /**
   * Nettoie le nom de l'item pour l'URL
   * Ex: "TFT_Item_RunaansHurricane" → "RunaansHurricane"
   */
  private cleanItemName(itemApiName: string): string {
    return itemApiName.replace(/^TFT_Item_/, '');
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
        console.log(`⏭️ Image déjà existante: ${cleanedName}.webp`);
        return relativePath;
      } catch {
        // L'image n'existe pas, on la télécharge
      }

      console.log(`📥 Téléchargement item: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Individual-Items-Scraper/1.0',
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
   * Télécharge toutes les images des items
   */
  private async downloadAllItemImages(data: ItemsCollection): Promise<{ [itemKey: string]: string | null }> {
    console.log('\n🖼️ Téléchargement des images des items...');
    
    const imageMap: { [itemKey: string]: string | null } = {};
    const items = Object.keys(data);
    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Télécharge les images en parallèle (par groupes de 5 pour éviter la surcharge)
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const promises = batch.map(async (itemKey) => {
        const itemData = data[itemKey];
        const imagePath = await this.downloadItemImage(itemData.apiName);
        imageMap[itemKey] = imagePath;
        
        if (imagePath) {
          if (imagePath.includes('déjà existante')) {
            skippedCount++;
          } else {
            downloadedCount++;
          }
        } else {
          errorCount++;
        }
      });

      await Promise.all(promises);
      
      // Petite pause entre les batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n📊 Résumé du téléchargement d'images d'items:`);
    console.log(`├─ Téléchargées: ${downloadedCount}`);
    console.log(`├─ Déjà existantes: ${skippedCount}`);
    console.log(`├─ Erreurs: ${errorCount}`);
    console.log(`└─ Total traité: ${items.length}`);

    return imageMap;
  }

  /**
   * Valide les données récupérées
   */
  private validateData(data: any): data is Record<string, IndividualItemStats> {
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Données invalides: pas un objet');
      return false;
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      console.warn('⚠️ Données invalides: objet vide');
      return false;
    }

    // Vérifie quelques entrées pour s'assurer de la structure
    const sampleKeys = keys.slice(0, 3);
    for (const key of sampleKeys) {
      const item = data[key];
      if (!item || typeof item !== 'object') {
        console.warn(`⚠️ Item invalide pour la clé ${key}`);
        return false;
      }

      if (typeof item.tier !== 'number' || typeof item.pick_rate !== 'number') {
        console.warn(`⚠️ Structure invalide pour l'item ${key}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Récupère les données depuis l'API TFT Items
   */
  async fetchItemsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des données individuelles des items TFT...');
      console.log(`📡 URL: ${this.baseUrl}`);
      
      const response = await axios.get<Record<string, IndividualItemStats>>(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TFT-Individual-Items-Scraper/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status} - ${response.statusText}`);
      }

      const data = response.data;
      
      // Validation des données
      if (!this.validateData(data)) {
        throw new Error('Données reçues invalides ou corrompues');
      }

      // Transforme les données en format plus riche
      const itemsCollection: ItemsCollection = {};
      
      Object.entries(data).forEach(([itemKey, stats]) => {
        itemsCollection[itemKey] = {
          key: itemKey,
          apiName: itemKey,
          name: this.cleanItemName(itemKey),
          stats
        };
      });

      const itemCount = Object.keys(itemsCollection).length;
      console.log(`✅ ${itemCount} items récupérés avec succès`);

      // Télécharge les images si demandé
      const imageMap = await this.downloadAllItemImages(itemsCollection);
      const downloadedImages = Object.values(imageMap).filter(Boolean).length;

      // Ajoute les URL d'images aux données
      Object.entries(itemsCollection).forEach(([itemKey, itemData]) => {
        itemData.localImageUrl = imageMap[itemKey];
      });

      // Extrait les statistiques d'analyse
      const stats = this.extractAnalysisStats(itemsCollection);
      
      console.log(`\n📈 Analyse des données:`);
      console.log(`├─ Items analysés: ${stats.totalItems}`);
      console.log(`├─ Items craftables: ${stats.craftableItems}`);
      console.log(`├─ Pick rate moyen: ${stats.avgPickRate}%`);
      console.log(`├─ Placement moyen: ${stats.avgPlacement}`);
      console.log(`├─ Distribution des tiers: ${Object.entries(stats.tierDistribution).map(([tier, count]) => `Tier ${tier}: ${count}`).join(', ')}`);
      console.log(`└─ Images téléchargées: ${downloadedImages} items`);

      return {
        success: true,
        data: itemsCollection,
        timestamp,
        stats,
        downloadedImages
      };

    } catch (error) {
      let errorMessage = 'Erreur inconnue';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Erreur HTTP ${error.response.status}: ${error.response.statusText}`;
          console.error('📄 Réponse du serveur:', error.response.data);
        } else if (error.request) {
          errorMessage = 'Aucune réponse du serveur (timeout ou réseau)';
        } else {
          errorMessage = `Erreur de configuration: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('❌ Erreur lors de la récupération:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Extrait les statistiques d'analyse
   */
  private extractAnalysisStats(data: ItemsCollection): AnalysisStats {
    const items = Object.values(data);
    const totalItems = items.length;
    const craftableItems = items.filter(item => item.stats.craftable).length;
    
    const avgPickRate = items.reduce((sum, item) => sum + item.stats.pick_rate, 0) / totalItems * 100;
    const avgPlacement = items.reduce((sum, item) => sum + item.stats.avg_placement, 0) / totalItems;
    const avgTop4Rate = items.reduce((sum, item) => sum + item.stats.top_4_percent, 0) / totalItems * 100;
    const avgTop1Rate = items.reduce((sum, item) => sum + item.stats.top_1_percent, 0) / totalItems * 100;
    
    // Distribution des tiers
    const tierDistribution: { [tier: number]: number } = {};
    items.forEach(item => {
      const tier = item.stats.tier;
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    // Distribution des types
    const typeDistribution: { [type: string]: number } = {};
    items.forEach(item => {
      const type = item.stats.item_type;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Top items par score
    const topItems = [...items]
      .sort((a, b) => b.stats.score - a.stats.score)
      .slice(0, 10);

    return {
      totalItems,
      craftableItems,
      avgPickRate: Math.round(avgPickRate * 100) / 100,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      avgTop4Rate: Math.round(avgTop4Rate * 100) / 100,
      avgTop1Rate: Math.round(avgTop1Rate * 100) / 100,
      tierDistribution,
      typeDistribution,
      topItems
    };
  }

  /**
   * Sauvegarde les données dans un fichier JSON
   */
  async saveData(data: ItemsCollection, filename?: string): Promise<void> {
    try {
      const fileName = filename || `individual_items_stats_${Date.now()}.json`;
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
  async saveDataByTier(data: ItemsCollection): Promise<void> {
    try {
      const tierData: { [tier: number]: ItemData[] } = {};

      Object.values(data).forEach(itemData => {
        const tier = itemData.stats.tier;
        if (!tierData[tier]) {
          tierData[tier] = [];
        }
        tierData[tier].push(itemData);
      });

      const timestamp = Date.now();
      
      for (const [tier, items] of Object.entries(tierData)) {
        if (items.length > 0) {
          // Trie par score décroissant
          items.sort((a, b) => b.stats.score - a.stats.score);
          
          await fs.writeFile(
            path.join(this.outputDir, `individual_items_tier_${tier}_${timestamp}.json`),
            JSON.stringify(items, null, 2),
            'utf-8'
          );
        }
      }

      const tierCounts = Object.entries(tierData).map(([tier, items]) => `Tier ${tier}: ${items.length}`);
      console.log(`📂 Données sauvegardées par tier (${tierCounts.join(', ')})`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par tier:', error);
    }
  }

  /**
   * Sauvegarde les données par type
   */
  async saveDataByType(data: ItemsCollection): Promise<void> {
    try {
      const typeData: { [type: string]: ItemData[] } = {};

      Object.values(data).forEach(itemData => {
        const type = itemData.stats.item_type;
        if (!typeData[type]) {
          typeData[type] = [];
        }
        typeData[type].push(itemData);
      });

      const timestamp = Date.now();
      
      for (const [type, items] of Object.entries(typeData)) {
        if (items.length > 0) {
          // Trie par score décroissant
          items.sort((a, b) => b.stats.score - a.stats.score);
          
          await fs.writeFile(
            path.join(this.outputDir, `individual_items_type_${type}_${timestamp}.json`),
            JSON.stringify(items, null, 2),
            'utf-8'
          );
        }
      }

      const typeCounts = Object.entries(typeData).map(([type, items]) => `${type}: ${items.length}`);
      console.log(`📂 Données sauvegardées par type (${typeCounts.join(', ')})`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par type:', error);
    }
  }

  /**
   * Génère un rapport détaillé
   */
  async generateReport(data: ItemsCollection, stats: AnalysisStats): Promise<void> {
    try {
      let report = '# TFT Set 14 - Individual Items Statistics Report\n\n';
      report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
      report += `Nombre total d'items: ${stats.totalItems}\n`;
      report += `Items craftables: ${stats.craftableItems}\n\n`;

      // Statistiques générales
      report += '## Statistiques générales\n\n';
      report += `- **Total items:** ${stats.totalItems}\n`;
      report += `- **Items craftables:** ${stats.craftableItems}\n`;
      report += `- **Pick rate moyen:** ${stats.avgPickRate}%\n`;
      report += `- **Placement moyen:** ${stats.avgPlacement}\n`;
      report += `- **Taux Top 4 moyen:** ${stats.avgTop4Rate}%\n`;
      report += `- **Taux Top 1 moyen:** ${stats.avgTop1Rate}%\n\n`;

      // Distribution des tiers
      report += '## Distribution des Tiers\n\n';
      Object.entries(stats.tierDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([tier, count]) => {
          report += `- **Tier ${tier}:** ${count} items\n`;
        });
      report += '\n';

      // Distribution des types
      report += '## Distribution des Types\n\n';
      Object.entries(stats.typeDistribution)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          report += `- **${type}:** ${count} items\n`;
        });
      report += '\n';

      // Top items
      report += '## Top 10 Items par Score\n\n';
      report += '| Rang | Item | Score | Pick Rate | Placement | Top 4% | Top 1% | Type |\n';
      report += '|------|------|-------|-----------|-----------|--------|--------|------|\n';
      stats.topItems.forEach((item, index) => {
        const cleanName = this.cleanItemName(item.apiName);
        report += `| ${index + 1} | ${cleanName} | ${item.stats.score.toFixed(2)} | ${(item.stats.pick_rate * 100).toFixed(2)}% | ${item.stats.avg_placement.toFixed(2)} | ${(item.stats.top_4_percent * 100).toFixed(1)}% | ${(item.stats.top_1_percent * 100).toFixed(1)}% | ${item.stats.item_type} |\n`;
      });
      report += '\n';

      // Items par tier
      for (let tier = 1; tier <= 5; tier++) {
        const tierItems = Object.values(data)
          .filter(item => item.stats.tier === tier)
          .sort((a, b) => b.stats.score - a.stats.score);

        if (tierItems.length > 0) {
          report += `## Tier ${tier} Items\n\n`;
          report += '| Item | Score | Pick Rate | Placement | Top 4% | Top 1% | Type | Craftable |\n';
          report += '|------|-------|-----------|-----------|--------|--------|------|----------|\n';
          
          tierItems.forEach(item => {
            const cleanName = this.cleanItemName(item.apiName);
            report += `| ${cleanName} | ${item.stats.score.toFixed(2)} | ${(item.stats.pick_rate * 100).toFixed(2)}% | ${item.stats.avg_placement.toFixed(2)} | ${(item.stats.top_4_percent * 100).toFixed(1)}% | ${(item.stats.top_1_percent * 100).toFixed(1)}% | ${item.stats.item_type} | ${item.stats.craftable ? '✅' : '❌'} |\n`;
          });
          report += '\n';
        }
      }

      const reportPath = path.join(this.outputDir, `individual_items_report_${Date.now()}.md`);
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📄 Rapport généré: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }

  /**
   * Génère un fichier d'items pour l'application
   */
  async generateItemsForApp(data: ItemsCollection): Promise<void> {
    try {
      const items = Object.values(data).map(item => ({
        key: this.cleanItemName(item.apiName),
        ingameKey: item.apiName,
        name: item.name || this.cleanItemName(item.apiName),
        imageUrl: item.localImageUrl || `${this.itemImageBaseUrl}/${item.apiName}.webp`,
        stats: {
          tier: item.stats.tier,
          score: item.stats.score,
          pickRate: item.stats.pick_rate,
          avgPlacement: item.stats.avg_placement,
          top4Percent: item.stats.top_4_percent,
          top1Percent: item.stats.top_1_percent,
          itemType: item.stats.item_type,
          craftable: item.stats.craftable
        }
      }));

      const appItemsPath = path.join('./src/data', 'individual_items_stats_generated.ts');
      
      let content = `// Généré automatiquement le ${new Date().toLocaleString('fr-FR')}\n`;
      content += `import { ItemStats } from '../types';\n\n`;
      content += `export const generatedIndividualItemsStats: ItemStats[] = [\n`;
      
      items.forEach(item => {
        content += `  {\n`;
        content += `    key: "${item.key}",\n`;
        content += `    ingameKey: "${item.ingameKey}",\n`;
        content += `    name: "${item.name}",\n`;
        content += `    imageUrl: "${item.imageUrl}",\n`;
        content += `    stats: {\n`;
        content += `      tier: ${item.stats.tier},\n`;
        content += `      score: ${item.stats.score},\n`;
        content += `      pickRate: ${item.stats.pickRate},\n`;
        content += `      avgPlacement: ${item.stats.avgPlacement},\n`;
        content += `      top4Percent: ${item.stats.top4Percent},\n`;
        content += `      top1Percent: ${item.stats.top1Percent},\n`;
        content += `      itemType: "${item.stats.itemType}",\n`;
        content += `      craftable: ${item.stats.craftable}\n`;
        content += `    }\n`;
        content += `  },\n`;
      });
      
      content += `];\n`;

      await fs.writeFile(appItemsPath, content, 'utf-8');
      console.log(`🎯 Fichier d'items pour l'app généré: ${appItemsPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du fichier items:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'individual_items_scraping_log.json');
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
   * Fonction principale de scraping
   */
  async scrape(options: { 
    saveData?: boolean, 
    generateReport?: boolean,
    saveByTier?: boolean,
    saveByType?: boolean,
    generateAppFile?: boolean,
    downloadImages?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      generateReport = false,
      saveByTier = false,
      saveByType = false,
      generateAppFile = true,
      downloadImages = true
    } = options;

    console.log('🚀 Démarrage du scraping des items individuels TFT...\n');

    // Récupère les données
    const result = await this.fetchItemsData();

    if (result.success && result.data && result.stats) {
      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }

      // Sauvegarde par tier
      if (saveByTier) {
        await this.saveDataByTier(result.data);
      }

      // Sauvegarde par type
      if (saveByType) {
        await this.saveDataByType(result.data);
      }

      // Génère un rapport
      if (generateReport) {
        await this.generateReport(result.data, result.stats);
      }

      // Génère le fichier pour l'application
      if (generateAppFile) {
        await this.generateItemsForApp(result.data);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runIndividualItemScraper() {
  const scraper = new TFTIndividualItemScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const generateReport = args.includes('--report');
  const saveByTier = args.includes('--by-tier');
  const saveByType = args.includes('--by-type');
  const generateAppFile = !args.includes('--no-app-file');
  const downloadImages = !args.includes('--no-images');

  await scraper.scrape({ 
    saveData, 
    generateReport,
    saveByTier,
    saveByType,
    generateAppFile,
    downloadImages
  });
}

// Export pour utilisation en module
export { 
  TFTIndividualItemScraper, 
  type ItemsCollection, 
  type ItemData, 
  type IndividualItemStats,
  type AnalysisStats,
  type ScrapingResult 
};

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runIndividualItemScraper().catch(console.error);
}
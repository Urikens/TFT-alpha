import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les données des champions TFT (structure réelle de l'API)
interface ChampionUnit {
  name: string;
  star_level: number;
  core: boolean;
  avg_nb_items: number;
  items: string[];
}

interface CompositionStats {
  tier: number;
  pick_rate: number;
  nb_boards: number;
  nb_games: number;
  avg_placement: number;
  top_4_percent: number;
  top_1_percent: number;
}

interface Composition {
  cluster_id: number;
  name: string;
  api_name: string;
  units: ChampionUnit[];
  stats: CompositionStats;
  carry_units: string[];
  tags: string[];
  // ... autres propriétés
}

interface ChampionStats {
  champName: string;
  gamesPlayed: number;
  rawWinrate: number;
  weightedWinrate: number;
  avgPlacement: number;
  meta: boolean;
  pickRate?: number;
  tier?: string;
  totalAppearances?: number;
  asCarry?: number;
  asCore?: number;
}

interface ChampionStatsData {
  [championName: string]: ChampionStats;
}

interface ChampionAnalysisStats {
  totalChampions: number;
  metaChampions: number;
  avgWinrate: number;
  avgPlacement: number;
  topPerformers: ChampionStats[];
  tierDistribution: { [tier: string]: number };
  totalCompositions: number;
}

interface ScrapingResult {
  success: boolean;
  data?: ChampionStatsData;
  error?: string;
  timestamp: string;
  stats?: ChampionAnalysisStats;
  downloadedImages?: number;
}

class TFTChampionScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/stats/data/15.13/analyzed_comps:rank=PLATINUM+&region=WORLD&mode=RANKED&portal=ALL';
  private imageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/champion_squares/set14';
  private outputDir = './data/tft/champions';
  private imagesDir = './public/images/champions';

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
      await fs.mkdir(this.imagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire d\'images:', error);
    }
  }

  /**
   * Nettoie le nom du champion pour l'URL d'image
   * Ex: "TFT14_Jarvan" → "Jarvan", "TFT14_DrMundo" → "DrMundo"
   */
  private cleanChampionName(championName: string): string {
    return championName
      .replace(/^TFT\d+_/, '') // Supprime le préfixe TFT14_
      .replace(/\s+/g, ''); // Supprime les espaces
  }

  /**
   * Convertit le nom API en nom d'affichage
   * Ex: "TFT14_Jarvan" → "Jarvan IV", "TFT14_DrMundo" → "Dr. Mundo"
   */
  private getDisplayName(apiName: string): string {
    const cleanName = this.cleanChampionName(apiName);
    
    // Cas spéciaux
    const specialCases: { [key: string]: string } = {
      'Jarvan': 'Jarvan IV',
      'DrMundo': 'Dr. Mundo',
      'MissFortune': 'Miss Fortune',
      'KogMaw': "Kog'Maw",
      'TwistedFate': 'Twisted Fate',
      'JarvanIV': 'Jarvan IV'
    };
    
    return specialCases[cleanName] || cleanName;
  }

  /**
   * Traite les données des compositions pour extraire les statistiques des champions
   */
  private processCompositionsData(compositions: Composition[]): ChampionStatsData {
    const championStats: { [key: string]: {
      totalGames: number;
      totalPlacements: number;
      totalWins: number;
      appearances: number;
      asCarry: number;
      asCore: number;
      weightedScore: number;
      totalWeight: number;
    } } = {};

    console.log(`📊 Traitement de ${compositions.length} compositions...`);

    compositions.forEach((comp, index) => {
      if (index % 50 === 0) {
        console.log(`   Progression: ${index}/${compositions.length} compositions traitées`);
      }

      const { stats } = comp;
      const weight = stats.nb_games; // Utilise le nombre de games comme poids

      comp.units.forEach(unit => {
        const championName = this.getDisplayName(unit.name);
        
        if (!championStats[championName]) {
          championStats[championName] = {
            totalGames: 0,
            totalPlacements: 0,
            totalWins: 0,
            appearances: 0,
            asCarry: 0,
            asCore: 0,
            weightedScore: 0,
            totalWeight: 0
          };
        }

        const champion = championStats[championName];
        
        // Accumule les statistiques pondérées
        champion.totalGames += stats.nb_games;
        champion.totalPlacements += stats.avg_placement * weight;
        champion.totalWins += stats.top_1_percent * weight;
        champion.appearances += 1;
        champion.weightedScore += (8 - stats.avg_placement) * weight; // Score inversé (meilleur = plus haut)
        champion.totalWeight += weight;
        
        // Marque si c'est un carry ou core
        if (comp.carry_units.includes(unit.name)) {
          champion.asCarry += 1;
        }
        if (unit.core) {
          champion.asCore += 1;
        }
      });
    });

    // Convertit en format final
    const result: ChampionStatsData = {};
    
    Object.entries(championStats).forEach(([championName, stats]) => {
      if (stats.totalWeight > 0) {
        const avgPlacement = stats.totalPlacements / stats.totalWeight;
        const winRate = (stats.totalWins / stats.totalWeight) * 100;
        const weightedWinrate = (stats.weightedScore / stats.totalWeight) * 10; // Normalise
        
        result[championName] = {
          champName: championName,
          gamesPlayed: stats.totalGames,
          rawWinrate: winRate,
          weightedWinrate: Math.min(weightedWinrate, 100), // Cap à 100%
          avgPlacement: avgPlacement,
          meta: stats.asCarry > 0 || weightedWinrate > 30, // Meta si carry ou bon score
          pickRate: (stats.appearances / compositions.length) * 100,
          totalAppearances: stats.appearances,
          asCarry: stats.asCarry,
          asCore: stats.asCore
        };
      }
    });

    console.log(`✅ ${Object.keys(result).length} champions extraits des compositions`);
    return result;
  }

  /**
   * Télécharge une image depuis l'URL et la sauvegarde localement
   */
  private async downloadChampionImage(championName: string): Promise<string | null> {
    try {
      // Convertit le nom d'affichage vers le nom API pour l'image
      const apiName = this.getApiNameForImage(championName);
      const imageUrl = `${this.imageBaseUrl}/${apiName}.webp`;
      const cleanedName = this.cleanChampionName(apiName);
      const localPath = path.join(this.imagesDir, `${cleanedName}.webp`);
      const relativePath = `/images/champions/${cleanedName}.webp`;

      // Vérifie si l'image existe déjà
      try {
        await fs.access(localPath);
        console.log(`⏭️ Image déjà existante: ${cleanedName}.webp`);
        return relativePath;
      } catch {
        // L'image n'existe pas, on la télécharge
      }

      console.log(`📥 Téléchargement: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Champions-Scraper/1.0',
        }
      });

      if (response.status === 200) {
        await fs.writeFile(localPath, response.data);
        console.log(`✅ Image sauvegardée: ${cleanedName}.webp`);
        return relativePath;
      } else {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour ${cleanedName}`);
        return null;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`❌ Image non trouvée: ${championName}`);
        } else {
          console.warn(`❌ Erreur téléchargement ${championName}:`, error.message);
        }
      } else {
        console.warn(`❌ Erreur inattendue pour ${championName}:`, error);
      }
      return null;
    }
  }

  /**
   * Convertit le nom d'affichage vers le nom API pour les images
   */
  private getApiNameForImage(displayName: string): string {
    const specialCases: { [key: string]: string } = {
      'Jarvan IV': 'TFT14_Jarvan',
      'Dr. Mundo': 'TFT14_DrMundo',
      'Miss Fortune': 'TFT14_MissFortune',
      "Kog'Maw": 'TFT14_KogMaw',
      'Twisted Fate': 'TFT14_TwistedFate'
    };
    
    return specialCases[displayName] || `TFT14_${displayName.replace(/\s+/g, '')}`;
  }

  /**
   * Télécharge toutes les images des champions
   */
  private async downloadAllImages(data: ChampionStatsData): Promise<{ [key: string]: string | null }> {
    console.log('\n🖼️ Téléchargement des images des champions...');
    
    const imageMap: { [key: string]: string | null } = {};
    const champions = Object.keys(data);
    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Télécharge les images en parallèle (par groupes de 5 pour éviter la surcharge)
    const batchSize = 5;
    for (let i = 0; i < champions.length; i += batchSize) {
      const batch = champions.slice(i, i + batchSize);
      
      const promises = batch.map(async (championName) => {
        const imagePath = await this.downloadChampionImage(championName);
        imageMap[championName] = imagePath;
        
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
      if (i + batchSize < champions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n📊 Résumé du téléchargement d'images:`);
    console.log(`├─ Téléchargées: ${downloadedCount}`);
    console.log(`├─ Déjà existantes: ${skippedCount}`);
    console.log(`├─ Erreurs: ${errorCount}`);
    console.log(`└─ Total traité: ${champions.length}`);

    return imageMap;
  }

  /**
   * Détermine le tier d'un champion basé sur ses statistiques
   */
  private calculateTier(champion: ChampionStats): string {
    const { weightedWinrate, avgPlacement, gamesPlayed } = champion;
    
    // Facteur de popularité (plus de games = plus fiable)
    const popularityFactor = Math.min(gamesPlayed / 1000, 1);
    
    // Score composite
    const placementScore = (8 - avgPlacement) / 7; // Normalise entre 0-1
    const winrateScore = weightedWinrate / 100;
    const compositeScore = (winrateScore * 0.6 + placementScore * 0.4) * popularityFactor;
    
    if (compositeScore >= 0.35) return 'S';
    if (compositeScore >= 0.25) return 'A';
    if (compositeScore >= 0.15) return 'B';
    return 'C';
  }

  /**
   * Extrait les statistiques d'analyse des champions
   */
  private extractStats(data: ChampionStatsData, totalCompositions: number): ChampionAnalysisStats {
    const champions = Object.values(data);
    const totalChampions = champions.length;
    const metaChampions = champions.filter(c => c.meta).length;
    
    const avgWinrate = champions.reduce((sum, c) => sum + c.weightedWinrate, 0) / totalChampions;
    const avgPlacement = champions.reduce((sum, c) => sum + c.avgPlacement, 0) / totalChampions;
    
    // Top 10 performers par winrate pondéré
    const topPerformers = champions
      .sort((a, b) => b.weightedWinrate - a.weightedWinrate)
      .slice(0, 10);
    
    // Distribution des tiers
    const tierDistribution: { [tier: string]: number } = { S: 0, A: 0, B: 0, C: 0 };
    champions.forEach(champion => {
      const tier = this.calculateTier(champion);
      tierDistribution[tier]++;
    });

    return {
      totalChampions,
      metaChampions,
      avgWinrate: Math.round(avgWinrate * 100) / 100,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      topPerformers,
      tierDistribution,
      totalCompositions
    };
  }

  /**
   * Valide les données récupérées
   */
  private validateData(data: any): data is Composition[] {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Données invalides: pas un tableau');
      return false;
    }

    if (data.length === 0) {
      console.warn('⚠️ Données invalides: tableau vide');
      return false;
    }

    // Vérifie quelques entrées pour s'assurer de la structure
    const sampleComps = data.slice(0, 3);
    for (const comp of sampleComps) {
      if (!comp || typeof comp !== 'object') {
        console.warn(`⚠️ Composition invalide`);
        return false;
      }

      if (!comp.units || !Array.isArray(comp.units) || !comp.stats) {
        console.warn(`⚠️ Structure invalide pour la composition`);
        return false;
      }

      // Vérifie qu'il y a des unités avec des noms
      if (comp.units.length === 0 || !comp.units[0].name) {
        console.warn(`⚠️ Unités invalides dans la composition`);
        return false;
      }
    }

    return true;
  }

  /**
   * Récupère les données depuis l'API TFT Champions
   */
  async fetchChampionsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des données des champions TFT...');
      console.log(`📡 URL: ${this.baseUrl}`);
      
      const response = await axios.get<Composition[]>(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TFT-Champions-Scraper/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status} - ${response.statusText}`);
      }

      const rawData = response.data;
      
      // Validation des données
      if (!this.validateData(rawData)) {
        throw new Error('Données reçues invalides ou corrompues');
      }

      console.log(`✅ ${rawData.length} compositions récupérées avec succès`);
      
      // Traite les compositions pour extraire les stats des champions
      const championData = this.processCompositionsData(rawData);
      const stats = this.extractStats(championData, rawData.length);
      
      console.log(`📊 Nombre total de champions: ${stats.totalChampions}`);
      console.log(`🎯 Champions meta: ${stats.metaChampions}`);
      console.log(`📈 Winrate moyen: ${stats.avgWinrate}%`);
      console.log(`📍 Placement moyen: ${stats.avgPlacement}`);

      return {
        success: true,
        data: championData,
        timestamp,
        stats
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
   * Sauvegarde les données dans un fichier JSON
   */
  async saveData(data: ChampionStatsData, filename?: string): Promise<void> {
    try {
      const fileName = filename || `tft_champions_stats_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Sauvegarde une version enrichie avec images locales et tiers
   */
  async saveEnrichedData(data: ChampionStatsData, imageMap: { [key: string]: string | null }): Promise<void> {
    try {
      const enrichedData: { [key: string]: ChampionStats & { localImageUrl?: string | null, tier?: string } } = {};
      
      for (const [championName, champion] of Object.entries(data)) {
        enrichedData[championName] = {
          ...champion,
          localImageUrl: imageMap[championName] || null,
          tier: this.calculateTier(champion)
        };
      }

      const fileName = `tft_champions_enriched_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(enrichedData, null, 2), 'utf-8');
      console.log(`🎯 Version enrichie sauvegardée: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde enrichie:', error);
    }
  }

  /**
   * Sauvegarde les données par tier
   */
  async saveDataByTier(data: ChampionStatsData, imageMap: { [key: string]: string | null }): Promise<void> {
    try {
      const tierData: { [tier: string]: any[] } = { S: [], A: [], B: [], C: [] };

      for (const [championName, champion] of Object.entries(data)) {
        const tier = this.calculateTier(champion);
        tierData[tier].push({
          ...champion,
          localImageUrl: imageMap[championName] || null,
          tier
        });
      }

      const timestamp = Date.now();
      
      for (const [tier, champions] of Object.entries(tierData)) {
        if (champions.length > 0) {
          await fs.writeFile(
            path.join(this.outputDir, `tft_champions_tier_${tier}_${timestamp}.json`),
            JSON.stringify(champions, null, 2),
            'utf-8'
          );
        }
      }

      console.log(`📂 Données sauvegardées par tier (S:${tierData.S.length}, A:${tierData.A.length}, B:${tierData.B.length}, C:${tierData.C.length})`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par tier:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'champions_scraping_log.json');
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
   * Vérifie si les données ont été mises à jour depuis la dernière fois
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      const logPath = path.join(this.outputDir, 'champions_scraping_log.json');
      
      try {
        await fs.access(logPath);
      } catch {
        console.log('📝 Aucun log existant, première exécution');
        return true;
      }

      const logs = JSON.parse(await fs.readFile(logPath, 'utf-8')) as ScrapingResult[];
      
      if (logs.length === 0) {
        console.log('📝 Log vide, mise à jour nécessaire');
        return true;
      }

      const lastSuccessfulScrape = logs.reverse().find(log => log.success);
      if (!lastSuccessfulScrape?.data || !lastSuccessfulScrape?.stats) {
        console.log('📝 Aucun scraping réussi précédent, mise à jour nécessaire');
        return true;
      }

      console.log('🔍 Vérification des mises à jour...');
      const currentData = await this.fetchChampionsData();
      if (!currentData.success || !currentData.data || !currentData.stats) {
        console.log('❌ Impossible de récupérer les données actuelles');
        return false;
      }

      // Compare les statistiques et le contenu
      const statsChanged = JSON.stringify(lastSuccessfulScrape.stats) !== JSON.stringify(currentData.stats);
      const contentChanged = JSON.stringify(lastSuccessfulScrape.data) !== JSON.stringify(currentData.data);

      if (statsChanged || contentChanged) {
        console.log('🆕 Changements détectés dans les données');
        return true;
      } else {
        console.log('✅ Aucun changement détecté');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des mises à jour:', error);
      return true;
    }
  }

  /**
   * Analyse les données récupérées
   */
  analyzeData(data: ChampionStatsData, stats: ChampionAnalysisStats): void {
    console.log('\n📈 Analyse des champions:');
    console.log(`├─ Total: ${stats.totalChampions} champions`);
    console.log(`├─ Champions meta: ${stats.metaChampions}`);
    console.log(`├─ Winrate moyen: ${stats.avgWinrate}%`);
    console.log(`├─ Placement moyen: ${stats.avgPlacement}`);
    console.log(`├─ Compositions analysées: ${stats.totalCompositions}`);
    console.log(`├─ Distribution des tiers:`);
    console.log(`│  ├─ Tier S: ${stats.tierDistribution.S}`);
    console.log(`│  ├─ Tier A: ${stats.tierDistribution.A}`);
    console.log(`│  ├─ Tier B: ${stats.tierDistribution.B}`);
    console.log(`│  └─ Tier C: ${stats.tierDistribution.C}`);
    
    console.log(`├─ Top 5 performers:`);
    stats.topPerformers.slice(0, 5).forEach((champion, index) => {
      const symbol = index === 4 ? '└─' : '├─';
      console.log(`│  ${symbol} ${champion.champName}: ${champion.weightedWinrate.toFixed(1)}% (${champion.gamesPlayed} games)`);
    });
    
    console.log('└─ Analyse terminée');
  }

  /**
   * Génère un rapport détaillé des champions
   */
  async generateReport(data: ChampionStatsData, stats: ChampionAnalysisStats, imageMap: { [key: string]: string | null }): Promise<void> {
    try {
      let report = '# TFT Set 14 - Champions Performance Report\n\n';
      report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
      report += `Nombre total de champions: ${stats.totalChampions}\n`;
      report += `Compositions analysées: ${stats.totalCompositions}\n`;
      report += `Images téléchargées: ${Object.values(imageMap).filter(Boolean).length}\n\n`;

      // Statistiques générales
      report += '## Statistiques générales\n\n';
      report += `- **Total champions:** ${stats.totalChampions}\n`;
      report += `- **Champions meta:** ${stats.metaChampions}\n`;
      report += `- **Winrate moyen:** ${stats.avgWinrate}%\n`;
      report += `- **Placement moyen:** ${stats.avgPlacement}\n`;
      report += `- **Compositions analysées:** ${stats.totalCompositions}\n`;
      report += `- **Images disponibles:** ${Object.values(imageMap).filter(Boolean).length}/${stats.totalChampions}\n\n`;

      // Distribution des tiers
      report += '## Distribution des Tiers\n\n';
      for (const [tier, count] of Object.entries(stats.tierDistribution)) {
        report += `- **Tier ${tier}:** ${count} champions\n`;
      }
      report += '\n';

      // Top performers
      report += '## Top 10 Performers\n\n';
      report += '| Rang | Champion | Winrate | Placement | Games | Meta | Carry | Core |\n';
      report += '|------|----------|---------|-----------|-------|------|-------|------|\n';
      stats.topPerformers.forEach((champion, index) => {
        const imagePath = imageMap[champion.champName];
        const imageCell = imagePath ? `![${champion.champName}](${imagePath})` : champion.champName;
        report += `| ${index + 1} | ${imageCell} | ${champion.weightedWinrate.toFixed(1)}% | ${champion.avgPlacement.toFixed(1)} | ${champion.gamesPlayed} | ${champion.meta ? '✅' : '❌'} | ${champion.asCarry || 0} | ${champion.asCore || 0} |\n`;
      });
      report += '\n';

      // Champions par tier
      for (const tier of ['S', 'A', 'B', 'C']) {
        const tierChampions = Object.entries(data)
          .filter(([, champion]) => this.calculateTier(champion) === tier)
          .sort(([, a], [, b]) => b.weightedWinrate - a.weightedWinrate);

        if (tierChampions.length > 0) {
          report += `## Tier ${tier} Champions\n\n`;
          tierChampions.forEach(([championName, champion]) => {
            const imagePath = imageMap[championName];
            report += `### ${championName}\n\n`;
            
            if (imagePath) {
              report += `![${championName}](${imagePath})\n\n`;
            }
            
            report += `- **Winrate:** ${champion.weightedWinrate.toFixed(1)}%\n`;
            report += `- **Placement moyen:** ${champion.avgPlacement.toFixed(1)}\n`;
            report += `- **Games joués:** ${champion.gamesPlayed}\n`;
            report += `- **Pick rate:** ${champion.pickRate?.toFixed(1)}%\n`;
            report += `- **Meta:** ${champion.meta ? 'Oui' : 'Non'}\n`;
            report += `- **Apparitions comme carry:** ${champion.asCarry || 0}\n`;
            report += `- **Apparitions comme core:** ${champion.asCore || 0}\n\n`;
          });
        }
      }

      const reportPath = path.join(this.outputDir, `champions_report_${Date.now()}.md`);
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📄 Rapport généré: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }

  /**
   * Génère un fichier de champions pour l'application
   */
  async generateChampionsForApp(data: ChampionStatsData, imageMap: { [key: string]: string | null }): Promise<void> {
    try {
      const champions = Object.entries(data).map(([championName, champion]) => ({
        key: this.getApiNameForImage(championName),
        name: championName,
        cost: [1], // À ajuster selon les données réelles
        imageUrl: imageMap[championName] || this.getChampionImageUrl(championName),
        traits: [], // À compléter avec les vraies données
        health: [500], // À ajuster
        attackDamage: [50], // À ajuster
        attackSpeed: 0.6, // À ajuster
        armor: 20, // À ajuster
        magicalResistance: 20, // À ajuster
        skill: {
          name: 'Compétence',
          imageUrl: '',
          desc: 'Description de la compétence',
          startingMana: 0,
          skillMana: 100,
          stats: []
        },
        recommendItems: [],
        // Statistiques depuis l'API
        gamesPlayed: champion.gamesPlayed,
        rawWinrate: champion.rawWinrate,
        weightedWinrate: champion.weightedWinrate,
        avgPlacement: champion.avgPlacement,
        isMeta: champion.meta,
        pickRate: champion.pickRate,
        tier: this.calculateTier(champion),
        totalAppearances: champion.totalAppearances,
        asCarry: champion.asCarry,
        asCore: champion.asCore
      }));

      const appChampionsPath = path.join('./src/data', 'champions_generated.ts');
      
      let content = `// Généré automatiquement le ${new Date().toLocaleString('fr-FR')}\n`;
      content += `import { Champion } from '../types';\n\n`;
      content += `export const generatedChampions: Champion[] = [\n`;
      
      champions.forEach(champion => {
        content += `  {\n`;
        content += `    key: "${champion.key}",\n`;
        content += `    name: "${champion.name}",\n`;
        content += `    cost: ${JSON.stringify(champion.cost)},\n`;
        content += `    imageUrl: "${champion.imageUrl}",\n`;
        content += `    traits: ${JSON.stringify(champion.traits)},\n`;
        content += `    health: ${JSON.stringify(champion.health)},\n`;
        content += `    attackDamage: ${JSON.stringify(champion.attackDamage)},\n`;
        content += `    attackSpeed: ${champion.attackSpeed},\n`;
        content += `    armor: ${champion.armor},\n`;
        content += `    magicalResistance: ${champion.magicalResistance},\n`;
        content += `    skill: ${JSON.stringify(champion.skill, null, 6).replace(/\n/g, '\n    ')},\n`;
        content += `    recommendItems: ${JSON.stringify(champion.recommendItems)},\n`;
        content += `    gamesPlayed: ${champion.gamesPlayed},\n`;
        content += `    rawWinrate: ${champion.rawWinrate},\n`;
        content += `    weightedWinrate: ${champion.weightedWinrate},\n`;
        content += `    avgPlacement: ${champion.avgPlacement},\n`;
        content += `    isMeta: ${champion.isMeta},\n`;
        content += `    pickRate: ${champion.pickRate},\n`;
        content += `    tier: "${champion.tier}"\n`;
        content += `  },\n`;
      });
      
      content += `];\n`;

      await fs.writeFile(appChampionsPath, content, 'utf-8');
      console.log(`🎯 Fichier de champions pour l'app généré: ${appChampionsPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du fichier champions:', error);
    }
  }

  /**
   * Génère l'URL d'image pour un champion (fallback)
   */
  private getChampionImageUrl(championName: string): string {
    const apiName = this.getApiNameForImage(championName);
    return `${this.imageBaseUrl}/${apiName}.webp`;
  }

  /**
   * Fonction principale de scraping
   */
  async scrape(options: { 
    saveData?: boolean, 
    checkUpdates?: boolean,
    generateReport?: boolean,
    saveEnrichedVersion?: boolean,
    saveByTier?: boolean,
    generateAppFile?: boolean,
    downloadImages?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveEnrichedVersion = true,
      saveByTier = false,
      generateAppFile = true,
      downloadImages = true
    } = options;

    console.log('🚀 Démarrage du scraping TFT Champions...\n');

    // Vérifie les mises à jour si demandé
    if (checkUpdates) {
      const hasUpdates = await this.checkForUpdates();
      if (!hasUpdates) {
        console.log('ℹ️ Aucune mise à jour détectée, scraping ignoré');
        return {
          success: true,
          timestamp: new Date().toISOString()
        };
      }
      console.log('🆕 Mise à jour détectée, poursuite du scraping...\n');
    }

    // Récupère les données
    const result = await this.fetchChampionsData();

    if (result.success && result.data && result.stats) {
      // Analyse les données
      this.analyzeData(result.data, result.stats);

      // Télécharge les images si demandé
      let imageMap: { [key: string]: string | null } = {};
      let downloadedImages = 0;
      
      if (downloadImages) {
        imageMap = await this.downloadAllImages(result.data);
        downloadedImages = Object.values(imageMap).filter(Boolean).length;
        result.downloadedImages = downloadedImages;
      }

      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }

      // Sauvegarde la version enrichie
      if (saveEnrichedVersion) {
        await this.saveEnrichedData(result.data, imageMap);
      }

      // Sauvegarde par tier
      if (saveByTier) {
        await this.saveDataByTier(result.data, imageMap);
      }

      // Génère un rapport
      if (generateReport) {
        await this.generateReport(result.data, result.stats, imageMap);
      }

      // Génère le fichier pour l'application
      if (generateAppFile) {
        await this.generateChampionsForApp(result.data, imageMap);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runChampionsScraper() {
  const scraper = new TFTChampionScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const checkUpdates = args.includes('--check-updates');
  const continuous = args.includes('--continuous');
  const generateReport = args.includes('--report');
  const saveEnrichedVersion = !args.includes('--no-enrich');
  const saveByTier = args.includes('--by-tier');
  const generateAppFile = !args.includes('--no-app-file');
  const downloadImages = !args.includes('--no-images');

  if (continuous) {
    console.log('🔄 Mode continu activé (vérification toutes les 20 minutes)');
    
    // Scraping initial
    await scraper.scrape({ 
      saveData, 
      checkUpdates: true, 
      generateReport,
      saveEnrichedVersion,
      saveByTier,
      generateAppFile,
      downloadImages
    });
    
    // Scraping périodique
    setInterval(async () => {
      console.log('\n⏰ Vérification programmée...');
      await scraper.scrape({ 
        saveData, 
        checkUpdates: true, 
        generateReport: false,
        saveEnrichedVersion,
        saveByTier: false,
        generateAppFile,
        downloadImages
      });
    }, 20 * 60 * 1000); // 20 minutes
    
  } else {
    // Scraping unique
    await scraper.scrape({ 
      saveData, 
      checkUpdates, 
      generateReport,
      saveEnrichedVersion,
      saveByTier,
      generateAppFile,
      downloadImages
    });
  }
}

// Export pour utilisation en module
export { 
  TFTChampionScraper, 
  type ChampionStatsData, 
  type ChampionStats, 
  type ChampionAnalysisStats,
  type ScrapingResult 
};

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runChampionsScraper().catch(console.error);
}
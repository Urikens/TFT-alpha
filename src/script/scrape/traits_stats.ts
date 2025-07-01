import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les statistiques des traits TFT
interface TraitStat {
  nb_games: number;
  nb_boards: number;
  avg_placement: number;
  top_4_percent: number;
  top_1_percent: number;
  pick_rate: number;
  trait_api_name: string;
  trait_count: number;
  style: string;
}

interface TraitData {
  apiName: string;
  displayName: string;
  count: number;
  style: string;
  stats: {
    nbGames: number;
    nbBoards: number;
    avgPlacement: number;
    top4Percent: number;
    top1Percent: number;
    pickRate: number;
  };
  localImageUrl?: string | null;
  tier?: string;
}

interface TraitsCollection {
  [traitKey: string]: TraitData;
}

interface AnalysisStats {
  totalTraits: number;
  uniqueTraits: number;
  avgPickRate: number;
  avgPlacement: number;
  avgTop4Rate: number;
  avgTop1Rate: number;
  styleDistribution: { [style: string]: number };
  countDistribution: { [count: number]: number };
  topTraits: TraitData[];
}

interface ScrapingResult {
  success: boolean;
  data?: TraitStat[];
  processedData?: TraitsCollection;
  error?: string;
  timestamp: string;
  stats?: AnalysisStats;
  downloadedImages?: number;
}

class TFTTraitsStatsScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/stats/data/15.13/traits_stats:rank=PLATINUM+&region=WORLD&mode=RANKED';
  private traitImageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/traits/dark';
  private outputDir = './data/tft/traits_stats';
  private traitImagesDir = './public/images/traits';

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
      await fs.mkdir(this.traitImagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire d\'images:', error);
    }
  }

  /**
   * Nettoie le nom du trait pour l'URL d'image
   * Ex: "TFT14_Armorclad" → "armorclad"
   */
  private cleanTraitName(traitApiName: string): string {
    return traitApiName
      .replace(/^TFT\d+_/, '') // Supprime le préfixe TFT14_
      .toLowerCase(); // Convertit en minuscules
  }

  /**
   * Convertit le nom API en nom d'affichage
   * Ex: "TFT14_Armorclad" → "Armorclad"
   */
  private getDisplayName(apiName: string): string {
    // Supprime le préfixe TFT14_
    let displayName = apiName.replace(/^TFT\d+_/, '');
    
    // Ajoute des espaces avant les majuscules (camelCase → Spaced Words)
    displayName = displayName.replace(/([A-Z])/g, ' $1').trim();
    
    // Première lettre en majuscule
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }

  /**
   * Télécharge une image de trait
   */
  private async downloadTraitImage(traitApiName: string): Promise<string | null> {
    try {
      const cleanedName = this.cleanTraitName(traitApiName);
      const imageUrl = `${this.traitImageBaseUrl}/trait-${cleanedName}.webp`;
      const localPath = path.join(this.traitImagesDir, `${cleanedName}.webp`);
      const relativePath = `/images/traits/${cleanedName}.webp`;

      // Vérifie si l'image existe déjà
      try {
        await fs.access(localPath);
        return relativePath;
      } catch {
        // L'image n'existe pas, on la télécharge
      }

      console.log(`📥 Téléchargement trait: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Traits-Stats-Scraper/1.0',
        }
      });

      if (response.status === 200) {
        await fs.writeFile(localPath, response.data);
        console.log(`✅ Image trait sauvegardée: ${cleanedName}.webp`);
        return relativePath;
      } else {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour trait ${cleanedName}`);
        return null;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`❌ Image trait non trouvée: ${traitApiName}`);
        } else {
          console.warn(`❌ Erreur téléchargement trait ${traitApiName}:`, error.message);
        }
      } else {
        console.warn(`❌ Erreur inattendue pour trait ${traitApiName}:`, error);
      }
      return null;
    }
  }

  /**
   * Télécharge toutes les images des traits
   */
  private async downloadAllTraitImages(data: TraitsCollection): Promise<{ [traitKey: string]: string | null }> {
    console.log('\n🖼️ Téléchargement des images des traits...');
    
    const imageMap: { [traitKey: string]: string | null } = {};
    const traits = Object.keys(data);
    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Télécharge les images en parallèle (par groupes de 5 pour éviter la surcharge)
    const batchSize = 5;
    for (let i = 0; i < traits.length; i += batchSize) {
      const batch = traits.slice(i, i + batchSize);
      
      const promises = batch.map(async (traitKey) => {
        const traitData = data[traitKey];
        const imagePath = await this.downloadTraitImage(traitData.apiName);
        imageMap[traitKey] = imagePath;
        
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
      if (i + batchSize < traits.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n📊 Résumé du téléchargement d'images des traits:`);
    console.log(`├─ Téléchargées: ${downloadedCount}`);
    console.log(`├─ Déjà existantes: ${skippedCount}`);
    console.log(`├─ Erreurs: ${errorCount}`);
    console.log(`└─ Total traité: ${traits.length}`);

    return imageMap;
  }

  /**
   * Valide les données récupérées
   */
  private validateData(data: any): data is TraitStat[] {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Données invalides: pas un tableau');
      return false;
    }

    if (data.length === 0) {
      console.warn('⚠️ Données invalides: tableau vide');
      return false;
    }

    // Vérifie quelques entrées pour s'assurer de la structure
    const sampleTraits = data.slice(0, 3);
    for (const trait of sampleTraits) {
      if (!trait || typeof trait !== 'object') {
        console.warn(`⚠️ Trait invalide`);
        return false;
      }

      if (typeof trait.trait_api_name !== 'string' || typeof trait.trait_count !== 'number') {
        console.warn(`⚠️ Structure invalide pour le trait`);
        return false;
      }
    }

    return true;
  }

  /**
   * Traite les données brutes pour les transformer en format plus riche
   */
  private processTraitsData(data: TraitStat[]): TraitsCollection {
    const traitsCollection: TraitsCollection = {};
    
    data.forEach(trait => {
      const key = `${trait.trait_api_name}_${trait.trait_count}`;
      
      traitsCollection[key] = {
        apiName: trait.trait_api_name,
        displayName: this.getDisplayName(trait.trait_api_name),
        count: trait.trait_count,
        style: trait.style,
        stats: {
          nbGames: trait.nb_games,
          nbBoards: trait.nb_boards,
          avgPlacement: trait.avg_placement,
          top4Percent: trait.top_4_percent,
          top1Percent: trait.top_1_percent,
          pickRate: trait.pick_rate
        },
        tier: this.calculateTier(trait)
      };
    });

    return traitsCollection;
  }

  /**
   * Détermine le tier d'un trait basé sur ses statistiques
   */
  private calculateTier(trait: TraitStat): string {
    const { avg_placement, top_4_percent, top_1_percent, pick_rate } = trait;
    
    // Facteur de popularité (plus de pick rate = plus fiable)
    const popularityFactor = Math.min(pick_rate * 10, 1);
    
    // Score composite
    const placementScore = (8 - avg_placement) / 7; // Normalise entre 0-1
    const top4Score = top_4_percent;
    const top1Score = top_1_percent * 2; // Donne plus de poids au top 1
    
    const compositeScore = (placementScore * 0.4 + top4Score * 0.3 + top1Score * 0.3) * popularityFactor;
    
    if (compositeScore >= 0.35) return 'S';
    if (compositeScore >= 0.25) return 'A';
    if (compositeScore >= 0.15) return 'B';
    return 'C';
  }

  /**
   * Extrait les statistiques d'analyse
   */
  private extractAnalysisStats(data: TraitsCollection): AnalysisStats {
    const traits = Object.values(data);
    const totalTraits = traits.length;
    
    // Compte les traits uniques (sans considérer le count)
    const uniqueTraitNames = new Set(traits.map(t => t.apiName));
    const uniqueTraits = uniqueTraitNames.size;
    
    const avgPickRate = traits.reduce((sum, t) => sum + t.stats.pickRate, 0) / totalTraits * 100;
    const avgPlacement = traits.reduce((sum, t) => sum + t.stats.avgPlacement, 0) / totalTraits;
    const avgTop4Rate = traits.reduce((sum, t) => sum + t.stats.top4Percent, 0) / totalTraits * 100;
    const avgTop1Rate = traits.reduce((sum, t) => sum + t.stats.top1Percent, 0) / totalTraits * 100;
    
    // Distribution des styles
    const styleDistribution: { [style: string]: number } = {};
    traits.forEach(trait => {
      const style = trait.style;
      styleDistribution[style] = (styleDistribution[style] || 0) + 1;
    });

    // Distribution des counts
    const countDistribution: { [count: number]: number } = {};
    traits.forEach(trait => {
      const count = trait.count;
      countDistribution[count] = (countDistribution[count] || 0) + 1;
    });

    // Top traits par placement
    const topTraits = [...traits]
      .sort((a, b) => a.stats.avgPlacement - b.stats.avgPlacement)
      .slice(0, 10);

    return {
      totalTraits,
      uniqueTraits,
      avgPickRate: Math.round(avgPickRate * 100) / 100,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      avgTop4Rate: Math.round(avgTop4Rate * 100) / 100,
      avgTop1Rate: Math.round(avgTop1Rate * 100) / 100,
      styleDistribution,
      countDistribution,
      topTraits
    };
  }

  /**
   * Récupère les données depuis l'API TFT Traits Stats
   */
  async fetchTraitsStatsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des statistiques des traits TFT...');
      console.log(`📡 URL: ${this.baseUrl}`);
      
      const response = await axios.get<TraitStat[]>(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TFT-Traits-Stats-Scraper/1.0',
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

      const traitCount = data.length;
      console.log(`✅ ${traitCount} combinaisons de traits récupérées avec succès`);

      // Traite les données brutes
      const processedData = this.processTraitsData(data);
      
      // Extrait les statistiques d'analyse
      const stats = this.extractAnalysisStats(processedData);
      
      console.log(`\n📈 Analyse des données:`);
      console.log(`├─ Combinaisons de traits: ${stats.totalTraits}`);
      console.log(`├─ Traits uniques: ${stats.uniqueTraits}`);
      console.log(`├─ Pick rate moyen: ${stats.avgPickRate}%`);
      console.log(`├─ Placement moyen: ${stats.avgPlacement}`);
      console.log(`├─ Distribution des styles: ${Object.entries(stats.styleDistribution).map(([style, count]) => `Style ${style}: ${count}`).join(', ')}`);

      return {
        success: true,
        data,
        processedData,
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
   * Sauvegarde les données brutes dans un fichier JSON
   */
  async saveRawData(data: TraitStat[], filename?: string): Promise<void> {
    try {
      const fileName = filename || `tft_traits_stats_raw_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données brutes sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données brutes:', error);
    }
  }

  /**
   * Sauvegarde les données traitées dans un fichier JSON
   */
  async saveProcessedData(data: TraitsCollection, filename?: string): Promise<void> {
    try {
      const fileName = filename || `tft_traits_stats_processed_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données traitées sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données traitées:', error);
    }
  }

  /**
   * Sauvegarde les données par trait (regroupées)
   */
  async saveDataByTrait(data: TraitsCollection): Promise<void> {
    try {
      // Regroupe par nom de trait
      const traitGroups: { [traitName: string]: TraitData[] } = {};
      
      Object.values(data).forEach(traitData => {
        const traitName = traitData.apiName;
        if (!traitGroups[traitName]) {
          traitGroups[traitName] = [];
        }
        traitGroups[traitName].push(traitData);
      });

      // Trie chaque groupe par count
      Object.values(traitGroups).forEach(group => {
        group.sort((a, b) => a.count - b.count);
      });

      const timestamp = Date.now();
      const filePath = path.join(this.outputDir, `tft_traits_grouped_${timestamp}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(traitGroups, null, 2), 'utf-8');
      console.log(`📂 Données regroupées par trait sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par trait:', error);
    }
  }

  /**
   * Sauvegarde les données par tier
   */
  async saveDataByTier(data: TraitsCollection): Promise<void> {
    try {
      const tierData: { [tier: string]: TraitData[] } = { S: [], A: [], B: [], C: [] };

      Object.values(data).forEach(traitData => {
        const tier = traitData.tier || 'C';
        tierData[tier].push(traitData);
      });

      const timestamp = Date.now();
      
      for (const [tier, traits] of Object.entries(tierData)) {
        if (traits.length > 0) {
          // Trie par placement
          traits.sort((a, b) => a.stats.avgPlacement - b.stats.avgPlacement);
          
          await fs.writeFile(
            path.join(this.outputDir, `tft_traits_tier_${tier}_${timestamp}.json`),
            JSON.stringify(traits, null, 2),
            'utf-8'
          );
        }
      }

      const tierCounts = Object.entries(tierData).map(([tier, traits]) => `Tier ${tier}: ${traits.length}`);
      console.log(`📂 Données sauvegardées par tier (${tierCounts.join(', ')})`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par tier:', error);
    }
  }

  /**
   * Génère un rapport détaillé
   */
  async generateReport(data: TraitsCollection, stats: AnalysisStats): Promise<void> {
    try {
      let report = '# TFT Set 14 - Traits Statistics Report\n\n';
      report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
      report += `Nombre total de combinaisons de traits: ${stats.totalTraits}\n`;
      report += `Traits uniques: ${stats.uniqueTraits}\n\n`;

      // Statistiques générales
      report += '## Statistiques générales\n\n';
      report += `- **Total combinaisons:** ${stats.totalTraits}\n`;
      report += `- **Traits uniques:** ${stats.uniqueTraits}\n`;
      report += `- **Pick rate moyen:** ${stats.avgPickRate}%\n`;
      report += `- **Placement moyen:** ${stats.avgPlacement}\n`;
      report += `- **Taux Top 4 moyen:** ${stats.avgTop4Rate}%\n`;
      report += `- **Taux Top 1 moyen:** ${stats.avgTop1Rate}%\n\n`;

      // Distribution des styles
      report += '## Distribution des Styles\n\n';
      Object.entries(stats.styleDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([style, count]) => {
          report += `- **Style ${style}:** ${count} combinaisons\n`;
        });
      report += '\n';

      // Distribution des counts
      report += '## Distribution des Counts\n\n';
      Object.entries(stats.countDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([count, number]) => {
          report += `- **${count} unités:** ${number} combinaisons\n`;
        });
      report += '\n';

      // Top traits
      report += '## Top 10 Traits par Placement\n\n';
      report += '| Rang | Trait | Count | Style | Placement | Top 4% | Top 1% | Pick Rate |\n';
      report += '|------|------|-------|-------|-----------|--------|--------|----------|\n';
      stats.topTraits.forEach((trait, index) => {
        report += `| ${index + 1} | ${trait.displayName} | ${trait.count} | ${trait.style} | ${trait.stats.avgPlacement.toFixed(2)} | ${(trait.stats.top4Percent * 100).toFixed(1)}% | ${(trait.stats.top1Percent * 100).toFixed(1)}% | ${(trait.stats.pickRate * 100).toFixed(2)}% |\n`;
      });
      report += '\n';

      // Traits par tier
      for (const tier of ['S', 'A', 'B', 'C']) {
        const tierTraits = Object.values(data)
          .filter(traitData => traitData.tier === tier)
          .sort((a, b) => a.stats.avgPlacement - b.stats.avgPlacement);

        if (tierTraits.length > 0) {
          report += `## Tier ${tier} Traits\n\n`;
          report += '| Trait | Count | Style | Placement | Top 4% | Top 1% | Pick Rate |\n';
          report += '|-------|-------|-------|-----------|--------|--------|----------|\n';
          
          tierTraits.forEach(trait => {
            report += `| ${trait.displayName} | ${trait.count} | ${trait.style} | ${trait.stats.avgPlacement.toFixed(2)} | ${(trait.stats.top4Percent * 100).toFixed(1)}% | ${(trait.stats.top1Percent * 100).toFixed(1)}% | ${(trait.stats.pickRate * 100).toFixed(2)}% |\n`;
          });
          report += '\n';
        }
      }

      // Traits regroupés
      report += '## Traits par Nom\n\n';
      
      // Regroupe par nom de trait
      const traitGroups: { [traitName: string]: TraitData[] } = {};
      Object.values(data).forEach(traitData => {
        const traitName = traitData.displayName;
        if (!traitGroups[traitName]) {
          traitGroups[traitName] = [];
        }
        traitGroups[traitName].push(traitData);
      });

      // Trie les groupes par nom
      const sortedGroups = Object.entries(traitGroups)
        .sort(([a], [b]) => a.localeCompare(b));

      for (const [traitName, traits] of sortedGroups) {
        report += `### ${traitName}\n\n`;
        report += '| Count | Style | Placement | Top 4% | Top 1% | Pick Rate |\n';
        report += '|-------|-------|-----------|--------|--------|----------|\n';
        
        // Trie par count
        traits.sort((a, b) => a.count - b.count).forEach(trait => {
          report += `| ${trait.count} | ${trait.style} | ${trait.stats.avgPlacement.toFixed(2)} | ${(trait.stats.top4Percent * 100).toFixed(1)}% | ${(trait.stats.top1Percent * 100).toFixed(1)}% | ${(trait.stats.pickRate * 100).toFixed(2)}% |\n`;
        });
        report += '\n';
      }

      const reportPath = path.join(this.outputDir, `traits_stats_report_${Date.now()}.md`);
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📄 Rapport généré: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }

  /**
   * Génère un fichier de traits pour l'application
   */
  async generateTraitsForApp(data: TraitsCollection, imageMap: { [traitKey: string]: string | null }): Promise<void> {
    try {
      // Regroupe par nom de trait
      const traitGroups: { [traitName: string]: TraitData[] } = {};
      Object.values(data).forEach(traitData => {
        const traitName = traitData.apiName;
        if (!traitGroups[traitName]) {
          traitGroups[traitName] = [];
        }
        traitGroups[traitName].push(traitData);
      });

      // Crée un objet pour chaque trait unique avec ses différents paliers
      const traits = Object.entries(traitGroups).map(([traitName, traitVariants]) => {
        // Trie les variantes par count
        traitVariants.sort((a, b) => a.count - b.count);
        
        // Prend la première variante pour les infos de base
        const baseTrait = traitVariants[0];
        
        // Trouve l'URL de l'image
        const imageKey = Object.keys(data).find(key => data[key].apiName === traitName);
        const imageUrl = imageKey && imageMap[imageKey] ? imageMap[imageKey] : null;
        
        return {
          apiName: traitName,
          displayName: baseTrait.displayName,
          imageUrl: imageUrl || `${this.traitImageBaseUrl}/trait-${this.cleanTraitName(traitName)}.webp`,
          variants: traitVariants.map(variant => ({
            count: variant.count,
            style: variant.style,
            avgPlacement: variant.stats.avgPlacement,
            pickRate: variant.stats.pickRate,
            top4Percent: variant.stats.top4Percent,
            top1Percent: variant.stats.top1Percent,
            tier: variant.tier
          }))
        };
      });

      const appTraitsPath = path.join('./src/data', 'traits_stats_generated.ts');
      
      let content = `// Généré automatiquement le ${new Date().toLocaleString('fr-FR')}\n\n`;
      content += `export interface TraitVariant {\n`;
      content += `  count: number;\n`;
      content += `  style: string;\n`;
      content += `  avgPlacement: number;\n`;
      content += `  pickRate: number;\n`;
      content += `  top4Percent: number;\n`;
      content += `  top1Percent: number;\n`;
      content += `  tier?: string;\n`;
      content += `}\n\n`;
      
      content += `export interface TraitStats {\n`;
      content += `  apiName: string;\n`;
      content += `  displayName: string;\n`;
      content += `  imageUrl: string;\n`;
      content += `  variants: TraitVariant[];\n`;
      content += `}\n\n`;
      
      content += `export const generatedTraitsStats: TraitStats[] = [\n`;
      
      traits.forEach(trait => {
        content += `  {\n`;
        content += `    apiName: "${trait.apiName}",\n`;
        content += `    displayName: "${trait.displayName}",\n`;
        content += `    imageUrl: "${trait.imageUrl}",\n`;
        content += `    variants: ${JSON.stringify(trait.variants, null, 6).replace(/\n/g, '\n    ')}\n`;
        content += `  },\n`;
      });
      
      content += `];\n`;

      await fs.writeFile(appTraitsPath, content, 'utf-8');
      console.log(`🎯 Fichier de traits pour l'app généré: ${appTraitsPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du fichier traits:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'traits_stats_scraping_log.json');
      let logs: ScrapingResult[] = [];

      // Charge les logs existants
      try {
        const existingLogs = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      } catch {
        console.log('📝 Création du fichier de log');
      }

      // Ajoute le nouveau résultat (sans les données volumineuses)
      const logResult = { ...result };
      delete logResult.data; // Supprime les données brutes pour alléger le log
      delete logResult.processedData; // Supprime les données traitées pour alléger le log
      
      logs.push(logResult);

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
    saveRawData?: boolean,
    saveProcessedData?: boolean,
    generateReport?: boolean,
    saveByTrait?: boolean,
    saveByTier?: boolean,
    generateAppFile?: boolean,
    downloadImages?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveRawData = true,
      saveProcessedData = true,
      generateReport = false,
      saveByTrait = false,
      saveByTier = false,
      generateAppFile = true,
      downloadImages = true
    } = options;

    console.log('🚀 Démarrage du scraping des statistiques des traits TFT...\n');

    // Récupère les données
    const result = await this.fetchTraitsStatsData();

    if (result.success && result.data && result.processedData && result.stats) {
      // Sauvegarde les données brutes si demandé
      if (saveRawData) {
        await this.saveRawData(result.data);
      }

      // Sauvegarde les données traitées si demandé
      if (saveProcessedData) {
        await this.saveProcessedData(result.processedData);
      }

      // Télécharge les images si demandé
      let imageMap: { [traitKey: string]: string | null } = {};
      let downloadedImages = 0;
      
      if (downloadImages) {
        imageMap = await this.downloadAllTraitImages(result.processedData);
        downloadedImages = Object.values(imageMap).filter(Boolean).length;
        result.downloadedImages = downloadedImages;
      }

      // Sauvegarde par trait
      if (saveByTrait) {
        await this.saveDataByTrait(result.processedData);
      }

      // Sauvegarde par tier
      if (saveByTier) {
        await this.saveDataByTier(result.processedData);
      }

      // Génère un rapport
      if (generateReport) {
        await this.generateReport(result.processedData, result.stats);
      }

      // Génère le fichier pour l'application
      if (generateAppFile) {
        await this.generateTraitsForApp(result.processedData, imageMap);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runTraitsStatsScraper() {
  const scraper = new TFTTraitsStatsScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveRawData = !args.includes('--no-raw');
  const saveProcessedData = !args.includes('--no-processed');
  const generateReport = args.includes('--report');
  const saveByTrait = args.includes('--by-trait');
  const saveByTier = args.includes('--by-tier');
  const generateAppFile = !args.includes('--no-app-file');
  const downloadImages = !args.includes('--no-images');

  await scraper.scrape({ 
    saveRawData,
    saveProcessedData,
    generateReport,
    saveByTrait,
    saveByTier,
    generateAppFile,
    downloadImages
  });
}

// Export pour utilisation en module
export { 
  TFTTraitsStatsScraper, 
  type TraitStat, 
  type TraitData, 
  type TraitsCollection,
  type AnalysisStats,
  type ScrapingResult 
};

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runTraitsStatsScraper().catch(console.error);
}
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les traits/synergies TFT
interface TraitBonus {
  effect: string;
  max: number | null;
  needed: number;
  style: number;
}

interface TFTTrait {
  apiKey: string;
  bonuses: TraitBonus[];
  description: string;
  name: string;
  type: 'origin' | 'class' | string; // Peut avoir d'autres types
}

interface TFTTraitsData {
  [traitKey: string]: TFTTrait; // ex: "TFT14_AnimaSquad": {...}
}

interface TraitStats {
  totalTraits: number;
  origins: number;
  classes: number;
  otherTypes: number;
  avgBonuses: number;
  maxBonusLevels: number[];
}

interface ScrapingResult {
  success: boolean;
  data?: TFTTraitsData;
  error?: string;
  timestamp: string;
  stats?: TraitStats;
}

class TFTTraitsScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tftTest/set14/fr_fr/traits';
  private outputDir = './data/tft/traits';

  constructor() {
    this.ensureOutputDirectory();
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
   * Nettoie le HTML des descriptions et effets
   */
  private cleanHtmlText(text: string): string {
    return text
      .replace(/<br>/g, '\n')
      .replace(/<\/br>/g, '\n')
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<i>/g, '*')
      .replace(/<\/i>/g, '*')
      .replace(/<rules>/g, '\n[RÈGLES] ')
      .replace(/<\/rules>/g, '')
      .replace(/%i:scale\w+%/g, '') // Supprime les variables de scaling
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrait les statistiques des traits
   */
  private extractStats(data: TFTTraitsData): TraitStats {
    const traits = Object.values(data);
    const totalTraits = traits.length;
    const origins = traits.filter(t => t.type === 'origin').length;
    const classes = traits.filter(t => t.type === 'class').length;
    const otherTypes = totalTraits - origins - classes;
    
    const totalBonuses = traits.reduce((sum, trait) => sum + trait.bonuses.length, 0);
    const avgBonuses = Math.round((totalBonuses / totalTraits) * 100) / 100;
    
    const maxBonusLevels = traits.map(trait => 
      Math.max(...trait.bonuses.map(bonus => bonus.needed))
    );

    return {
      totalTraits,
      origins,
      classes,
      otherTypes,
      avgBonuses,
      maxBonusLevels
    };
  }

  /**
   * Récupère les données depuis l'API TFT Traits
   */
  async fetchTraitsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des traits/synergies TFT...');
      
      const response = await axios.get<TFTTraitsData>(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TFT-Traits-Scraper/1.0',
          'Accept': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status}`);
      }

      const data = response.data;
      const stats = this.extractStats(data);
      
      console.log('✅ Données des traits récupérées avec succès');
      console.log(`📊 Nombre total de traits: ${stats.totalTraits}`);
      console.log(`🎯 Origines: ${stats.origins} | Classes: ${stats.classes} | Autres: ${stats.otherTypes}`);
      console.log(`📈 Moyenne de bonus par trait: ${stats.avgBonuses}`);

      return {
        success: true,
        data,
        timestamp,
        stats
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
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
  async saveData(data: TFTTraitsData, filename?: string): Promise<void> {
    try {
      const fileName = filename || `tft_traits_set14_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Sauvegarde une version nettoyée (sans HTML) des données
   */
  async saveCleanedData(data: TFTTraitsData): Promise<void> {
    try {
      const cleanedData: TFTTraitsData = {};
      
      for (const [traitKey, trait] of Object.entries(data)) {
        cleanedData[traitKey] = {
          ...trait,
          name: this.cleanHtmlText(trait.name),
          description: this.cleanHtmlText(trait.description),
          bonuses: trait.bonuses.map(bonus => ({
            ...bonus,
            effect: this.cleanHtmlText(bonus.effect)
          }))
        };
      }

      const fileName = `tft_traits_set14_cleaned_${Date.now()}.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
      console.log(`🧹 Version nettoyée sauvegardée: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde nettoyée:', error);
    }
  }

  /**
   * Sauvegarde les données par type (origines/classes)
   */
  async saveDataByType(data: TFTTraitsData): Promise<void> {
    try {
      const origins: TFTTraitsData = {};
      const classes: TFTTraitsData = {};
      const others: TFTTraitsData = {};

      for (const [key, trait] of Object.entries(data)) {
        if (trait.type === 'origin') {
          origins[key] = trait;
        } else if (trait.type === 'class') {
          classes[key] = trait;
        } else {
          others[key] = trait;
        }
      }

      const timestamp = Date.now();
      
      if (Object.keys(origins).length > 0) {
        await fs.writeFile(
          path.join(this.outputDir, `tft_origins_${timestamp}.json`),
          JSON.stringify(origins, null, 2),
          'utf-8'
        );
      }

      if (Object.keys(classes).length > 0) {
        await fs.writeFile(
          path.join(this.outputDir, `tft_classes_${timestamp}.json`),
          JSON.stringify(classes, null, 2),
          'utf-8'
        );
      }

      if (Object.keys(others).length > 0) {
        await fs.writeFile(
          path.join(this.outputDir, `tft_other_traits_${timestamp}.json`),
          JSON.stringify(others, null, 2),
          'utf-8'
        );
      }

      console.log(`📂 Données sauvegardées par type (${Object.keys(origins).length} origines, ${Object.keys(classes).length} classes, ${Object.keys(others).length} autres)`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde par type:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'traits_scraping_log.json');
      let logs: ScrapingResult[] = [];

      // Charge les logs existants
      try {
        const existingLogs = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(existingLogs);
      } catch {
        // Fichier n'existe pas encore
      }

      // Ajoute le nouveau résultat
      logs.push(result);

      // Garde seulement les 50 derniers logs
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }

      await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf-8');
      console.log(`📝 Log de scraping mis à jour`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du log:', error);
    }
  }

  /**
   * Vérifie si les données ont été mises à jour depuis la dernière fois
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      const logPath = path.join(this.outputDir, 'traits_scraping_log.json');
      const logs = JSON.parse(await fs.readFile(logPath, 'utf-8')) as ScrapingResult[];
      
      if (logs.length === 0) return true;

      const lastSuccessfulScrape = logs.reverse().find(log => log.success);
      if (!lastSuccessfulScrape?.data || !lastSuccessfulScrape?.stats) return true;

      const currentData = await this.fetchTraitsData();
      if (!currentData.success || !currentData.data || !currentData.stats) return false;

      // Compare les statistiques et le contenu
      const statsChanged = JSON.stringify(lastSuccessfulScrape.stats) !== JSON.stringify(currentData.stats);
      const contentChanged = JSON.stringify(lastSuccessfulScrape.data) !== JSON.stringify(currentData.data);

      return statsChanged || contentChanged;
    } catch {
      return true; // En cas d'erreur, on considère qu'il y a une mise à jour
    }
  }

  /**
   * Analyse les données récupérées
   */
  analyzeData(data: TFTTraitsData, stats: TraitStats): void {
    console.log('\n📈 Analyse des traits/synergies:');
    console.log(`├─ Total: ${stats.totalTraits} traits`);
    console.log(`├─ Répartition:`);
    console.log(`│  ├─ Origines: ${stats.origins}`);
    console.log(`│  ├─ Classes: ${stats.classes}`);
    console.log(`│  └─ Autres types: ${stats.otherTypes}`);
    console.log(`├─ Moyenne de bonus par trait: ${stats.avgBonuses}`);
    console.log(`├─ Niveaux de bonus max: ${Math.min(...stats.maxBonusLevels)} - ${Math.max(...stats.maxBonusLevels)}`);
    
    // Top 5 des traits avec le plus de bonus
    const traitsWithMostBonuses = Object.entries(data)
      .sort(([,a], [,b]) => b.bonuses.length - a.bonuses.length)
      .slice(0, 5);
    
    console.log(`├─ Traits avec le plus de paliers:`);
    traitsWithMostBonuses.forEach(([key, trait], index) => {
      const symbol = index === traitsWithMostBonuses.length - 1 ? '└─' : '├─';
      console.log(`│  ${symbol} ${this.cleanHtmlText(trait.name)}: ${trait.bonuses.length} paliers`);
    });
    
    console.log('└─ Analyse terminée');
  }

  /**
   * Génère un rapport détaillé des traits
   */
  async generateReport(data: TFTTraitsData, stats: TraitStats): Promise<void> {
    try {
      let report = '# TFT Set 14 - Traits/Synergies Report\n\n';
      report += `Généré le: ${new Date().toLocaleString()}\n`;
      report += `Nombre total de traits: ${stats.totalTraits}\n\n`;

      // Statistiques générales
      report += '## Statistiques générales\n\n';
      report += `- **Origines:** ${stats.origins}\n`;
      report += `- **Classes:** ${stats.classes}\n`;
      report += `- **Autres types:** ${stats.otherTypes}\n`;
      report += `- **Moyenne de bonus par trait:** ${stats.avgBonuses}\n\n`;

      // Origines
      const origins = Object.entries(data).filter(([,trait]) => trait.type === 'origin');
      if (origins.length > 0) {
        report += '## Origines\n\n';
        for (const [key, trait] of origins) {
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `**Description:** ${this.cleanHtmlText(trait.description)}\n\n`;
          report += '**Paliers:**\n';
          trait.bonuses.forEach(bonus => {
            report += `- **${bonus.needed} unités:** ${this.cleanHtmlText(bonus.effect)}\n`;
          });
          report += '\n';
        }
      }

      // Classes
      const classes = Object.entries(data).filter(([,trait]) => trait.type === 'class');
      if (classes.length > 0) {
        report += '## Classes\n\n';
        for (const [key, trait] of classes) {
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `**Description:** ${this.cleanHtmlText(trait.description)}\n\n`;
          report += '**Paliers:**\n';
          trait.bonuses.forEach(bonus => {
            report += `- **${bonus.needed} unités:** ${this.cleanHtmlText(bonus.effect)}\n`;
          });
          report += '\n';
        }
      }

      const reportPath = path.join(this.outputDir, `traits_report_${Date.now()}.md`);
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📄 Rapport généré: ${reportPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }

  /**
   * Fonction principale de scraping
   */
  async scrape(options: { 
    saveData?: boolean, 
    checkUpdates?: boolean,
    generateReport?: boolean,
    saveCleanedVersion?: boolean,
    saveByType?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveCleanedVersion = true,
      saveByType = false
    } = options;

    console.log('🚀 Démarrage du scraping TFT Traits/Synergies...\n');

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
    const result = await this.fetchTraitsData();

    if (result.success && result.data && result.stats) {
      // Analyse les données
      this.analyzeData(result.data, result.stats);

      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }

      // Sauvegarde la version nettoyée
      if (saveCleanedVersion) {
        await this.saveCleanedData(result.data);
      }

      // Sauvegarde par type
      if (saveByType) {
        await this.saveDataByType(result.data);
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
async function runTraitsScraper() {
  const scraper = new TFTTraitsScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const checkUpdates = args.includes('--check-updates');
  const continuous = args.includes('--continuous');
  const generateReport = args.includes('--report');
  const saveCleanedVersion = !args.includes('--no-clean');
  const saveByType = args.includes('--by-type');

  if (continuous) {
    console.log('🔄 Mode continu activé (vérification toutes les 15 minutes)');
    
    // Scraping initial
    await scraper.scrape({ 
      saveData, 
      checkUpdates: true, 
      generateReport,
      saveCleanedVersion,
      saveByType
    });
    
    // Scraping périodique
    setInterval(async () => {
      console.log('\n⏰ Vérification programmée...');
      await scraper.scrape({ 
        saveData, 
        checkUpdates: true, 
        generateReport: false, // Pas de rapport à chaque fois
        saveCleanedVersion,
        saveByType: false // Pas de séparation par type à chaque fois
      });
    }, 15 * 60 * 1000); // 15 minutes
    
  } else {
    // Scraping unique
    await scraper.scrape({ 
      saveData, 
      checkUpdates, 
      generateReport,
      saveCleanedVersion,
      saveByType
    });
  }
}

// Export pour utilisation en module
export { 
  TFTTraitsScraper, 
  type TFTTraitsData, 
  type TFTTrait, 
  type TraitBonus,
  type TraitStats,
  type ScrapingResult 
};

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runTraitsScraper().catch(console.error);
}
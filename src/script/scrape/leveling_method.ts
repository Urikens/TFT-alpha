import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les méthodes de leveling TFT
interface LevelingStep {
  [level: string]: string[]; // ex: "lvl4": ["Lvl 4 by 2-1", "Save Gold"]
}

interface LevelingMethod {
  name: string;
  description: string;
  leveling: LevelingStep;
}

interface TFTLevelingData {
  [methodKey: string]: LevelingMethod; // ex: "standard": {...}, "slowroll@5": {...}
}

interface ScrapingResult {
  success: boolean;
  data?: TFTLevelingData;
  error?: string;
  timestamp: string;
  methodsCount?: number;
}

class TFTLevelingScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/levelingMethods';
  private outputDir = './data/tft/leveling';

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
   * Nettoie le HTML des descriptions et instructions
   */
  private cleanHtmlText(text: string): string {
    return text
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<span>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  /**
   * Récupère les données depuis l'API TFT Leveling Methods
   */
  async fetchLevelingData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des méthodes de leveling TFT...');
      
      const response = await axios.get<TFTLevelingData>(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Leveling-Scraper/1.0',
          'Accept': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status}`);
      }

      const data = response.data;
      const methodsCount = Object.keys(data).length;
      
      console.log('✅ Données de leveling récupérées avec succès');
      console.log(`📊 Nombre de méthodes: ${methodsCount}`);
      console.log(`🎯 Méthodes disponibles: ${Object.keys(data).join(', ')}`);

      return {
        success: true,
        data,
        timestamp,
        methodsCount
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
  async saveData(data: TFTLevelingData, filename?: string): Promise<void> {
    try {
      const fileName = filename || `leveling_method_notclean.json`;
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
  async saveCleanedData(data: TFTLevelingData): Promise<void> {
    try {
      const cleanedData: TFTLevelingData = {};
      
      for (const [methodKey, method] of Object.entries(data)) {
        cleanedData[methodKey] = {
          name: this.cleanHtmlText(method.name),
          description: this.cleanHtmlText(method.description),
          leveling: {}
        };

        for (const [levelKey, steps] of Object.entries(method.leveling)) {
          cleanedData[methodKey].leveling[levelKey] = steps.map(step => this.cleanHtmlText(step));
        }
      }

      const fileName = `leveling_method.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
      console.log(`🧹 Version nettoyée sauvegardée: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde nettoyée:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'log_leveling_method.json');
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
      const logPath = path.join(this.outputDir, 'log_leveling_method.json');
      const logs = JSON.parse(await fs.readFile(logPath, 'utf-8')) as ScrapingResult[];
      
      if (logs.length === 0) return true;

      const lastSuccessfulScrape = logs.reverse().find(log => log.success);
      if (!lastSuccessfulScrape?.data) return true;

      const currentData = await this.fetchLevelingData();
      if (!currentData.success || !currentData.data) return false;

      // Compare le nombre de méthodes et le contenu
      const hasCountChange = lastSuccessfulScrape.methodsCount !== currentData.methodsCount;
      const hasContentChange = JSON.stringify(lastSuccessfulScrape.data) !== JSON.stringify(currentData.data);

      return hasCountChange || hasContentChange;
    } catch {
      return true; // En cas d'erreur, on considère qu'il y a une mise à jour
    }
  }

  /**
   * Analyse les données récupérées
   */
  analyzeData(data: TFTLevelingData): void {
    console.log('\n📈 Analyse des méthodes de leveling:');
    console.log(`├─ Nombre total de méthodes: ${Object.keys(data).length}`);
    
    for (const [methodKey, method] of Object.entries(data)) {
      console.log(`├─ ${methodKey}:`);
      console.log(`│  ├─ Nom: ${this.cleanHtmlText(method.name)}`);
      console.log(`│  ├─ Description: ${this.cleanHtmlText(method.description).substring(0, 50)}...`);
      console.log(`│  └─ Étapes de leveling: ${Object.keys(method.leveling).length}`);
    }
    
    console.log('└─ Analyse terminée');
  }

  /**
   * Génère un rapport détaillé des méthodes
   */
  async generateReport(data: TFTLevelingData): Promise<void> {
    try {
      let report = '# TFT Leveling Methods Report\n\n';
      report += `Généré le: ${new Date().toLocaleString()}\n`;
      report += `Nombre de méthodes: ${Object.keys(data).length}\n\n`;

      for (const [methodKey, method] of Object.entries(data)) {
        report += `## ${this.cleanHtmlText(method.name)} (${methodKey})\n\n`;
        report += `**Description:** ${this.cleanHtmlText(method.description)}\n\n`;
        report += `**Étapes de leveling:**\n`;
        
        for (const [levelKey, steps] of Object.entries(method.leveling)) {
          report += `- **${levelKey}:** ${steps.map(s => this.cleanHtmlText(s)).join(' - ')}\n`;
        }
        
        report += '\n---\n\n';
      }

      const reportPath = path.join(this.outputDir, `leveling_report_${Date.now()}.md`);
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
    saveCleanedVersion?: boolean 
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveCleanedVersion = true 
    } = options;

    console.log('🚀 Démarrage du scraping TFT Leveling Methods...\n');

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
    const result = await this.fetchLevelingData();

    if (result.success && result.data) {
      // Analyse les données
      this.analyzeData(result.data);

      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }

      // Sauvegarde la version nettoyée
      if (saveCleanedVersion) {
        await this.saveCleanedData(result.data);
      }

      // Génère un rapport
      if (generateReport) {
        await this.generateReport(result.data);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runLevelingScraper() {
  const scraper = new TFTLevelingScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const checkUpdates = args.includes('--check-updates');
  const continuous = args.includes('--continuous');
  const generateReport = args.includes('--report');
  const saveCleanedVersion = !args.includes('--no-clean');

  if (continuous) {
    console.log('🔄 Mode continu activé (vérification toutes les 10 minutes)');
    
    // Scraping initial
    await scraper.scrape({ 
      saveData, 
      checkUpdates: true, 
      generateReport,
      saveCleanedVersion 
    });
    
    // Scraping périodique
    setInterval(async () => {
      console.log('\n⏰ Vérification programmée...');
      await scraper.scrape({ 
        saveData, 
        checkUpdates: true, 
        generateReport: false, // Pas de rapport à chaque fois
        saveCleanedVersion 
      });
    }, 10 * 60 * 1000); // 10 minutes
    
  } else {
    // Scraping unique
    await scraper.scrape({ 
      saveData, 
      checkUpdates, 
      generateReport,
      saveCleanedVersion 
    });
  }
}

// Export pour utilisation en module
export { TFTLevelingScraper, type TFTLevelingData, type LevelingMethod, type ScrapingResult };

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runLevelingScraper().catch(console.error);
}
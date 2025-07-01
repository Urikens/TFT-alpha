import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Types pour les données TFT
interface TFTData {
  patch: string;
  updatedAtUTC: string;
  [key: string]: any; // Pour les autres propriétés dynamiques
}

interface ScrapingResult {
  success: boolean;
  data?: TFTData;
  error?: string;
  timestamp: string;
}

class TFTScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tft/stats/data/patches/latest/latest.json';
  private outputDir = './data/tft';

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
   * Récupère les données depuis l'API TFT
   */
  async fetchTFTData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des données TFT...');
      
      const response = await axios.get<TFTData>(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Scraper/1.0',
          'Accept': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status}`);
      }

      const data = response.data;
      
      console.log('✅ Données récupérées avec succès');
      console.log(`📊 Patch: ${data.patch}`);
      console.log(`🕒 Dernière mise à jour: ${data.updatedAtUTC}`);

      return {
        success: true,
        data,
        timestamp
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
  async saveData(data: TFTData, filename?: string): Promise<void> {
    try {
      const fileName = filename || `update.json`;
      const filePath = path.join(this.outputDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Données sauvegardées: ${filePath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Sauvegarde un log des résultats de scraping
   */
  async saveScrapingLog(result: ScrapingResult): Promise<void> {
    try {
      const logPath = path.join(this.outputDir, 'log_update.json');
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

      // Garde seulement les 100 derniers logs
      if (logs.length > 100) {
        logs = logs.slice(-100);
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
      const logPath = path.join(this.outputDir, 'log_update.json');
      const logs = JSON.parse(await fs.readFile(logPath, 'utf-8')) as ScrapingResult[];
      
      if (logs.length === 0) return true;

      const lastSuccessfulScrape = logs.reverse().find(log => log.success);
      if (!lastSuccessfulScrape?.data) return true;

      const currentData = await this.fetchTFTData();
      if (!currentData.success || !currentData.data) return false;

      const hasUpdate = 
        lastSuccessfulScrape.data.patch !== currentData.data.patch ||
        lastSuccessfulScrape.data.updatedAtUTC !== currentData.data.updatedAtUTC;

      return hasUpdate;
    } catch {
      return true; // En cas d'erreur, on considère qu'il y a une mise à jour
    }
  }

  /**
   * Analyse les données récupérées
   */
  analyzeData(data: TFTData): void {
    console.log('\n📈 Analyse des données:');
    console.log(`├─ Patch actuel: ${data.patch}`);
    console.log(`├─ Dernière mise à jour: ${data.updatedAtUTC}`);
    console.log(`├─ Nombre de propriétés: ${Object.keys(data).length}`);
    
    // Affiche les clés principales (exclut patch et updatedAtUTC)
    const otherKeys = Object.keys(data).filter(key => !['patch', 'updatedAtUTC'].includes(key));
    if (otherKeys.length > 0) {
      console.log(`└─ Autres données disponibles: ${otherKeys.join(', ')}`);
    }
  }

  /**
   * Fonction principale de scraping
   */
  async scrape(options: { saveData?: boolean, checkUpdates?: boolean } = {}): Promise<ScrapingResult> {
    const { saveData = true, checkUpdates = false } = options;

    console.log('🚀 Démarrage du scraping TFT...\n');

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
    const result = await this.fetchTFTData();

    if (result.success && result.data) {
      // Analyse les données
      this.analyzeData(result.data);

      // Sauvegarde si demandé
      if (saveData) {
        await this.saveData(result.data);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
}

// Fonction utilitaire pour lancer le scraping
async function runScraper() {
  const scraper = new TFTScraper();
  
  // Arguments de ligne de commande
  const args = process.argv.slice(2);
  const saveData = !args.includes('--no-save');
  const checkUpdates = args.includes('--check-updates');
  const continuous = args.includes('--continuous');

  if (continuous) {
    console.log('🔄 Mode continu activé (vérification toutes les 5 minutes)');
    
    // Scraping initial
    await scraper.scrape({ saveData, checkUpdates: true });
    
    // Scraping périodique
    setInterval(async () => {
      console.log('\n⏰ Vérification programmée...');
      await scraper.scrape({ saveData, checkUpdates: true });
    }, 5 * 60 * 1000); // 5 minutes
    
  } else {
    // Scraping unique
    await scraper.scrape({ saveData, checkUpdates });
  }
}

// Export pour utilisation en module
export { TFTScraper, type TFTData, type ScrapingResult };

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper().catch(console.error);
}
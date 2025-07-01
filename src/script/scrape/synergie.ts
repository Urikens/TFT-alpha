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
  description: string | null;
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
  private cleanHtmlText(text: string | null): string {
    if (!text) return '';
    
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/br>/gi, '\n')
      .replace(/<b>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<i>/gi, '*')
      .replace(/<\/i>/gi, '*')
      .replace(/<rules>/gi, '\n[RÈGLES] ')
      .replace(/<\/rules>/gi, '')
      .replace(/<spellPassive>/gi, '[PASSIF] ')
      .replace(/<\/spellPassive>/gi, '')
      .replace(/<spellActive[^>]*>/gi, '[ACTIF] ')
      .replace(/<\/spellActive>/gi, '')
      .replace(/<TFTGuildActive[^>]*>/gi, '')
      .replace(/<\/TFTGuildActive>/gi, '')
      .replace(/<TFTGuildInactive[^>]*>/gi, '')
      .replace(/<\/TFTGuildInactive>/gi, '')
      .replace(/<physicalDamage>/gi, '[DÉGÂTS PHYSIQUES] ')
      .replace(/<\/physicalDamage>/gi, '')
      .replace(/<trueDamage>/gi, '[DÉGÂTS BRUTS] ')
      .replace(/<\/trueDamage>/gi, '')
      .replace(/%i:scale\w+%/g, '') // Supprime les variables de scaling
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/@\w+[^@]*@/g, '') // Supprime les variables de template
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
   * Valide les données récupérées
   */
  private validateData(data: any): data is TFTTraitsData {
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
      const trait = data[key];
      if (!trait || typeof trait !== 'object') {
        console.warn(`⚠️ Trait invalide pour la clé ${key}`);
        return false;
      }

      if (!trait.name || !trait.bonuses || !Array.isArray(trait.bonuses)) {
        console.warn(`⚠️ Structure invalide pour le trait ${key}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Récupère les données depuis l'API TFT Traits
   */
  async fetchTraitsData(): Promise<ScrapingResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Récupération des traits/synergies TFT...');
      console.log(`📡 URL: ${this.baseUrl}`);
      
      const response = await axios.get<TFTTraitsData>(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TFT-Traits-Scraper/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        validateStatus: (status) => status < 500, // Accepte les codes 4xx pour debug
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP non valide: ${response.status} - ${response.statusText}`);
      }

      const data = response.data;
      
      // Validation des données
      if (!this.validateData(data)) {
        throw new Error('Données reçues invalides ou corrompues');
      }

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
      const logPath = path.join(this.outputDir, 'traits_scraping_log.json');
      
      // Vérifie si le fichier de log existe
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
      const currentData = await this.fetchTraitsData();
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
      report += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
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
          if (trait.description) {
            report += `**Description:** ${this.cleanHtmlText(trait.description)}\n\n`;
          }
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
          if (trait.description) {
            report += `**Description:** ${this.cleanHtmlText(trait.description)}\n\n`;
          }
          report += '**Paliers:**\n';
          trait.bonuses.forEach(bonus => {
            report += `- **${bonus.needed} unités:** ${this.cleanHtmlText(bonus.effect)}\n`;
          });
          report += '\n';
        }
      }

      // Autres traits
      const others = Object.entries(data).filter(([,trait]) => trait.type !== 'origin' && trait.type !== 'class');
      if (others.length > 0) {
        report += '## Autres Traits\n\n';
        for (const [key, trait] of others) {
          report += `### ${this.cleanHtmlText(trait.name)} (${trait.type})\n\n`;
          if (trait.description) {
            report += `**Description:** ${this.cleanHtmlText(trait.description)}\n\n`;
          }
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
   * Génère un fichier de synergies pour l'application
   */
  async generateSynergiesForApp(data: TFTTraitsData): Promise<void> {
    try {
      const synergies = Object.entries(data).map(([key, trait]) => ({
        name: this.cleanHtmlText(trait.name),
        icon: this.getTraitIcon(trait.type),
        color: this.getTraitColor(trait.type),
        imageUrl: this.getTraitImageUrl(key),
        type: trait.type,
        bonusLevels: trait.bonuses.length,
        maxLevel: Math.max(...trait.bonuses.map(b => b.needed))
      }));

      const appSynergiesPath = path.join('./src/data', 'synergies_generated.ts');
      
      let content = `// Généré automatiquement le ${new Date().toLocaleString('fr-FR')}\n`;
      content += `import { Synergy } from '../types';\n\n`;
      content += `export const generatedSynergies: Synergy[] = [\n`;
      
      synergies.forEach(synergy => {
        content += `  {\n`;
        content += `    name: "${synergy.name}",\n`;
        content += `    icon: "${synergy.icon}",\n`;
        content += `    color: "${synergy.color}",\n`;
        content += `    imageUrl: "${synergy.imageUrl}"\n`;
        content += `  },\n`;
      });
      
      content += `];\n`;

      await fs.writeFile(appSynergiesPath, content, 'utf-8');
      console.log(`🎯 Fichier de synergies pour l'app généré: ${appSynergiesPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du fichier synergies:', error);
    }
  }

  /**
   * Obtient l'icône pour un type de trait
   */
  private getTraitIcon(type: string): string {
    switch (type) {
      case 'origin': return '🌟';
      case 'class': return '⚔️';
      default: return '✨';
    }
  }

  /**
   * Obtient la couleur pour un type de trait
   */
  private getTraitColor(type: string): string {
    switch (type) {
      case 'origin': return 'from-blue-500 to-cyan-600';
      case 'class': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-slate-600';
    }
  }

  /**
   * Génère l'URL d'image pour un trait (placeholder)
   */
  private getTraitImageUrl(traitKey: string): string {
    // Pour l'instant, retourne une URL placeholder
    // Dans une vraie implémentation, cela pourrait mapper vers les vraies images
    return `https://cdn.lolchess.gg/upload/images/traits/${traitKey.toLowerCase()}.png`;
  }

  /**
   * Fonction principale de scraping
   */
  async scrape(options: { 
    saveData?: boolean, 
    checkUpdates?: boolean,
    generateReport?: boolean,
    saveCleanedVersion?: boolean,
    saveByType?: boolean,
    generateAppFile?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveCleanedVersion = true,
      saveByType = false,
      generateAppFile = true
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

      // Génère le fichier pour l'application
      if (generateAppFile) {
        await this.generateSynergiesForApp(result.data);
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
  const generateAppFile = !args.includes('--no-app-file');

  if (continuous) {
    console.log('🔄 Mode continu activé (vérification toutes les 15 minutes)');
    
    // Scraping initial
    await scraper.scrape({ 
      saveData, 
      checkUpdates: true, 
      generateReport,
      saveCleanedVersion,
      saveByType,
      generateAppFile
    });
    
    // Scraping périodique
    setInterval(async () => {
      console.log('\n⏰ Vérification programmée...');
      await scraper.scrape({ 
        saveData, 
        checkUpdates: true, 
        generateReport: false, // Pas de rapport à chaque fois
        saveCleanedVersion,
        saveByType: false, // Pas de séparation par type à chaque fois
        generateAppFile
      });
    }, 15 * 60 * 1000); // 15 minutes
    
  } else {
    // Scraping unique
    await scraper.scrape({ 
      saveData, 
      checkUpdates, 
      generateReport,
      saveCleanedVersion,
      saveByType,
      generateAppFile
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
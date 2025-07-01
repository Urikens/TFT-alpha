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
  imagesDownloaded?: number;
  imagesFailed?: number;
}

interface ImageDownloadResult {
  success: boolean;
  traitKey: string;
  imageName: string;
  error?: string;
}

class TFTTraitsScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tftTest/set14/fr_fr/traits';
  private imageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/traits/dark';
  private outputDir = './data/tft/traits';
  private imagesDir = './data/tft/traits/images';

  constructor() {
    this.ensureOutputDirectories();
  }

  /**
   * Assure que les répertoires de sortie existent
   */
  private async ensureOutputDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création des répertoires:', error);
    }
  }

  /**
   * Extrait le nom propre du trait à partir de l'apiKey
   * Ex: "TFT14_AnimaSquad" -> "animasquad"
   * Ex: "TFT14_Armorclad" -> "armorclad"
   */
  private extractTraitImageName(apiKey: string): string {
    // Supprime le préfixe TFT14_ ou similaire
    const cleanName = apiKey.replace(/^TFT\d+_/, '');
    
    // Convertit en minuscules
    return cleanName.toLowerCase();
  }

  /**
   * Télécharge une image de trait
   */
  private async downloadTraitImage(traitKey: string, trait: TFTTrait): Promise<ImageDownloadResult> {
    try {
      const imageName = this.extractTraitImageName(trait.apiKey);
      const imageUrl = `${this.imageBaseUrl}/trait-${imageName}.webp`;
      const imagePath = path.join(this.imagesDir, `${imageName}.webp`);

      // Vérifie si l'image existe déjà
      try {
        await fs.access(imagePath);
        console.log(`⏭️ Image déjà présente: ${imageName}.webp`);
        return {
          success: true,
          traitKey,
          imageName
        };
      } catch {
        // L'image n'existe pas, on continue le téléchargement
      }

      console.log(`📥 Téléchargement: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Traits-Scraper/1.0',
          'Accept': 'image/webp,image/*,*/*;q=0.8',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP: ${response.status}`);
      }

      await fs.writeFile(imagePath, response.data);
      console.log(`✅ Image téléchargée: ${imageName}.webp`);

      return {
        success: true,
        traitKey,
        imageName
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`❌ Erreur téléchargement ${trait.apiKey}: ${errorMessage}`);
      
      return {
        success: false,
        traitKey,
        imageName: this.extractTraitImageName(trait.apiKey),
        error: errorMessage
      };
    }
  }

  /**
   * Télécharge toutes les images des traits
   */
  private async downloadAllTraitImages(data: TFTTraitsData): Promise<{ success: number; failed: number }> {
    console.log(`🖼️ Début du téléchargement des images (${Object.keys(data).length} traits)...`);
    
    const results: ImageDownloadResult[] = [];
    let success = 0;
    let failed = 0;

    // Télécharge les images une par une pour éviter de surcharger le serveur
    for (const [traitKey, trait] of Object.entries(data)) {
      const result = await this.downloadTraitImage(traitKey, trait);
      results.push(result);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // Petite pause entre les téléchargements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Images téléchargées: ${success} succès, ${failed} échecs`);

    // Sauvegarde le log des téléchargements
    try {
      const logPath = path.join(this.imagesDir, 'download_log.json');
      const downloadLog = {
        timestamp: new Date().toISOString(),
        totalTraits: Object.keys(data).length,
        successCount: success,
        failedCount: failed,
        results
      };
      
      await fs.writeFile(logPath, JSON.stringify(downloadLog, null, 2), 'utf-8');
      console.log(`📝 Log des téléchargements sauvegardé`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du log des images:', error);
    }

    return { success, failed };
  }

  /**
   * Génère un index des images téléchargées
   */
  private async generateImageIndex(data: TFTTraitsData): Promise<void> {
    try {
      const imageIndex: Record<string, {
        traitKey: string;
        traitName: string;
        imageName: string;
        imagePath: string;
        type: string;
      }> = {};

      for (const [traitKey, trait] of Object.entries(data)) {
        const imageName = this.extractTraitImageName(trait.apiKey);
        const imagePath = `./images/${imageName}.webp`;
        
        imageIndex[traitKey] = {
          traitKey,
          traitName: this.cleanHtmlText(trait.name),
          imageName,
          imagePath,
          type: trait.type
        };
      }

      const indexPath = path.join(this.imagesDir, 'image_index.json');
      await fs.writeFile(indexPath, JSON.stringify(imageIndex, null, 2), 'utf-8');
      console.log(`🗂️ Index des images généré: image_index.json`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'index des images:', error);
    }
  }

  /**
   * Génère un fichier HTML de prévisualisation des images
   */
  private async generateImagePreview(data: TFTTraitsData): Promise<void> {
    try {
      let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFT Set 14 - Aperçu des Traits</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #0f1419; 
            color: #cdbe91; 
            padding: 20px; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
        }
        .traits-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .trait-card { 
            background: #1e2328; 
            border-radius: 8px; 
            padding: 15px; 
            border: 1px solid #3c3c41; 
        }
        .trait-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 10px; 
        }
        .trait-image { 
            width: 40px; 
            height: 40px; 
            margin-right: 10px; 
            border-radius: 4px; 
        }
        .trait-name { 
            font-weight: bold; 
            font-size: 18px; 
        }
        .trait-type { 
            color: #cdbe91; 
            font-size: 12px; 
            text-transform: uppercase; 
            margin-left: auto; 
        }
        .trait-description { 
            font-size: 14px; 
            color: #a09b8c; 
            margin-bottom: 10px; 
        }
        .bonuses { 
            font-size: 12px; 
        }
        .bonus-level { 
            margin: 5px 0; 
            padding: 5px; 
            background: #0f1419; 
            border-radius: 4px; 
        }
        .stats { 
            background: #1e2328; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TFT Set 14 - Traits & Synergies</h1>
            <p>Généré le ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <h2>Statistiques</h2>
            <p>Total des traits: ${Object.keys(data).length}</p>
        </div>
        
        <div class="traits-grid">`;

      for (const [traitKey, trait] of Object.entries(data)) {
        const imageName = this.extractTraitImageName(trait.apiKey);
        const imageUrl = `./images/${imageName}.webp`;
        
        html += `
            <div class="trait-card">
                <div class="trait-header">
                    <img src="${imageUrl}" alt="${this.cleanHtmlText(trait.name)}" class="trait-image" 
                         onerror="this.style.display='none'">
                    <div class="trait-name">${this.cleanHtmlText(trait.name)}</div>
                    <div class="trait-type">${trait.type}</div>
                </div>
                <div class="trait-description">${this.cleanHtmlText(trait.description)}</div>
                <div class="bonuses">`;
        
        trait.bonuses.forEach(bonus => {
          html += `<div class="bonus-level"><strong>${bonus.needed}:</strong> ${this.cleanHtmlText(bonus.effect)}</div>`;
        });
        
        html += `
                </div>
            </div>`;
      }

      html += `
        </div>
    </div>
</body>
</html>`;

      const previewPath = path.join(this.outputDir, 'traits_preview.html');
      await fs.writeFile(previewPath, html, 'utf-8');
      console.log(`🌐 Aperçu HTML généré: traits_preview.html`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'aperçu HTML:', error);
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
          const imageName = this.extractTraitImageName(trait.apiKey);
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
          const imageName = this.extractTraitImageName(trait.apiKey);
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
    saveByType?: boolean,
    downloadImages?: boolean,
    generatePreview?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveCleanedVersion = true,
      saveByType = false,
      downloadImages = true,
      generatePreview = false
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

      // Télécharge les images si demandé
      let imagesDownloaded = 0;
      let imagesFailed = 0;
      
      if (downloadImages) {
        const imageResults = await this.downloadAllTraitImages(result.data);
        imagesDownloaded = imageResults.success;
        imagesFailed = imageResults.failed;
        
        // Génère l'index des images
        await this.generateImageIndex(result.data);
        
        // Met à jour le résultat avec les statistiques d'images
        result.imagesDownloaded = imagesDownloaded;
        result.imagesFailed = imagesFailed;
      }

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

      // Génère la prévisualisation HTML
      if (generatePreview && downloadImages) {
        await this.generateImagePreview(result.data);
      }
    }

    // Sauvegarde le log
    await this.saveScrapingLog(result);

    console.log('\n✨ Scraping terminé');
    return result;
  }
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
    imagesDownloaded?: number;
    imagesFailed?: number;
  }
  
  interface ImageDownloadResult {
    success: boolean;
    traitKey: string;
    imageName: string;
    error?: string;
  }
  
  class TFTTraitsScraper {
    private baseUrl = 'https://utils.iesdev.com/static/json/tftTest/set14/fr_fr/traits';
    private imageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/traits/dark';
    private outputDir = './data/tft/traits';
    private imagesDir = './data/tft/traits/images';
  
    constructor() {
      this.ensureOutputDirectories();
    }
  
    /**
     * Assure que les répertoires de sortie existent
     */
    private async ensureOutputDirectories(): Promise<void> {
      try {
        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(this.imagesDir, { recursive: true });
      } catch (error) {
        console.error('Erreur lors de la création des répertoires:', error);
      }
    }
  
    /**
     * Extrait le nom propre du trait à partir de l'apiKey
     * Ex: "TFT14_AnimaSquad" -> "animasquad"
     * Ex: "TFT14_Armorclad" -> "armorclad"
     */
    private extractTraitImageName(apiKey: string): string {
      // Supprime le préfixe TFT14_ ou similaire
      const cleanName = apiKey.replace(/^TFT\d+_/, '');
      
      // Convertit en minuscules
      return cleanName.toLowerCase();
    }
  
    /**
     * Télécharge une image de trait
     */
    private async downloadTraitImage(traitKey: string, trait: TFTTrait): Promise<ImageDownloadResult> {
      try {
        const imageName = this.extractTraitImageName(trait.apiKey);
        const imageUrl = `${this.imageBaseUrl}/trait-${imageName}.webp`;
        const imagePath = path.join(this.imagesDir, `${imageName}.webp`);
  
        // Vérifie si l'image existe déjà
        try {
          await fs.access(imagePath);
          console.log(`⏭️ Image déjà présente: ${imageName}.webp`);
          return {
            success: true,
            traitKey,
            imageName
          };
        } catch {
          // L'image n'existe pas, on continue le téléchargement
        }
  
        console.log(`📥 Téléchargement: ${imageUrl}`);
        
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent': 'TFT-Traits-Scraper/1.0',
            'Accept': 'image/webp,image/*,*/*;q=0.8',
          }
        });
  
        if (response.status !== 200) {
          throw new Error(`Statut HTTP: ${response.status}`);
        }
  
        await fs.writeFile(imagePath, response.data);
        console.log(`✅ Image téléchargée: ${imageName}.webp`);
  
        return {
          success: true,
          traitKey,
          imageName
        };
  
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`❌ Erreur téléchargement ${trait.apiKey}: ${errorMessage}`);
        
        return {
          success: false,
          traitKey,
          imageName: this.extractTraitImageName(trait.apiKey),
          error: errorMessage
        };
      }
    }
  
    /**
     * Télécharge toutes les images des traits
     */
    private async downloadAllTraitImages(data: TFTTraitsData): Promise<{ success: number; failed: number }> {
      console.log(`🖼️ Début du téléchargement des images (${Object.keys(data).length} traits)...`);
      
      const results: ImageDownloadResult[] = [];
      let success = 0;
      let failed = 0;
  
      // Télécharge les images une par une pour éviter de surcharger le serveur
      for (const [traitKey, trait] of Object.entries(data)) {
        const result = await this.downloadTraitImage(traitKey, trait);
        results.push(result);
        
        if (result.success) {
          success++;
        } else {
          failed++;
        }
  
        // Petite pause entre les téléchargements
        await new Promise(resolve => setTimeout(resolve, 100));
      }
  
      console.log(`📊 Images téléchargées: ${success} succès, ${failed} échecs`);
  
      // Sauvegarde le log des téléchargements
      try {
        const logPath = path.join(this.imagesDir, 'download_log.json');
        const downloadLog = {
          timestamp: new Date().toISOString(),
          totalTraits: Object.keys(data).length,
          successCount: success,
          failedCount: failed,
          results
        };
        
        await fs.writeFile(logPath, JSON.stringify(downloadLog, null, 2), 'utf-8');
        console.log(`📝 Log des téléchargements sauvegardé`);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du log des images:', error);
      }
  
      return { success, failed };
    }
  
    /**
     * Génère un index des images téléchargées
     */
    private async generateImageIndex(data: TFTTraitsData): Promise<void> {
      try {
        const imageIndex: Record<string, {
          traitKey: string;
          traitName: string;
          imageName: string;
          imagePath: string;
          type: string;
        }> = {};
  
        for (const [traitKey, trait] of Object.entries(data)) {
          const imageName = this.extractTraitImageName(trait.apiKey);
          const imagePath = `./images/${imageName}.webp`;
          
          imageIndex[traitKey] = {
            traitKey,
            traitName: this.cleanHtmlText(trait.name),
            imageName,
            imagePath,
            type: trait.type
          };
        }
  
        const indexPath = path.join(this.imagesDir, 'image_index.json');
        await fs.writeFile(indexPath, JSON.stringify(imageIndex, null, 2), 'utf-8');
        console.log(`🗂️ Index des images généré: image_index.json`);
      } catch (error) {
        console.error('❌ Erreur lors de la génération de l\'index des images:', error);
      }
    }
  
    /**
     * Génère un fichier HTML de prévisualisation des images
     */
    private async generateImagePreview(data: TFTTraitsData): Promise<void> {
      try {
        let html = `<!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TFT Set 14 - Aperçu des Traits</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              background: #0f1419; 
              color: #cdbe91; 
              padding: 20px; 
          }
          .container { 
              max-width: 1200px; 
              margin: 0 auto; 
          }
          .header { 
              text-align: center; 
              margin-bottom: 40px; 
          }
          .traits-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
              gap: 20px; 
          }
          .trait-card { 
              background: #1e2328; 
              border-radius: 8px; 
              padding: 15px; 
              border: 1px solid #3c3c41; 
          }
          .trait-header { 
              display: flex; 
              align-items: center; 
              margin-bottom: 10px; 
          }
          .trait-image { 
              width: 40px; 
              height: 40px; 
              margin-right: 10px; 
              border-radius: 4px; 
          }
          .trait-name { 
              font-weight: bold; 
              font-size: 18px; 
          }
          .trait-type { 
              color: #cdbe91; 
              font-size: 12px; 
              text-transform: uppercase; 
              margin-left: auto; 
          }
          .trait-description { 
              font-size: 14px; 
              color: #a09b8c; 
              margin-bottom: 10px; 
          }
          .bonuses { 
              font-size: 12px; 
          }
          .bonus-level { 
              margin: 5px 0; 
              padding: 5px; 
              background: #0f1419; 
              border-radius: 4px; 
          }
          .stats { 
              background: #1e2328; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px; 
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>TFT Set 14 - Traits & Synergies</h1>
              <p>Généré le ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="stats">
              <h2>Statistiques</h2>
              <p>Total des traits: ${Object.keys(data).length}</p>
          </div>
          
          <div class="traits-grid">`;
  
        for (const [traitKey, trait] of Object.entries(data)) {
          const imageName = this.extractTraitImageName(trait.apiKey);
          const imageUrl = `./images/${imageName}.webp`;
          
          html += `
              <div class="trait-card">
                  <div class="trait-header">
                      <img src="${imageUrl}" alt="${this.cleanHtmlText(trait.name)}" class="trait-image" 
                           onerror="this.style.display='none'">
                      <div class="trait-name">${this.cleanHtmlText(trait.name)}</div>
                      <div class="trait-type">${trait.type}</div>
                  </div>
                  <div class="trait-description">${this.cleanHtmlText(trait.description)}</div>
                  <div class="bonuses">`;
          
          trait.bonuses.forEach(bonus => {
            html += `<div class="bonus-level"><strong>${bonus.needed}:</strong> ${this.cleanHtmlText(bonus.effect)}</div>`;
          });
          
          html += `
                  </div>
              </div>`;
        }
  
        html += `
          </div>
      </div>
  </body>
  </html>`;
  
        const previewPath = path.join(this.outputDir, 'traits_preview.html');
        await fs.writeFile(previewPath, html, 'utf-8');
        console.log(`🌐 Aperçu HTML généré: traits_preview.html`);
      } catch (error) {
        console.error('❌ Erreur lors de la génération de l\'aperçu HTML:', error);
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
            const imageName = this.extractTraitImageName(trait.apiKey);
            report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
            report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
            const imageName = this.extractTraitImageName(trait.apiKey);
            report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
            report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
      saveByType?: boolean,
      downloadImages?: boolean,
      generatePreview?: boolean
    } = {}): Promise<ScrapingResult> {
      const { 
        saveData = true, 
        checkUpdates = false,
        generateReport = false,
        saveCleanedVersion = true,
        saveByType = false,
        downloadImages = true,
        generatePreview = false
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
  
        // Télécharge les images si demandé
        let imagesDownloaded = 0;
        let imagesFailed = 0;
        
        if (downloadImages) {
          const imageResults = await this.downloadAllTraitImages(result.data);
          imagesDownloaded = imageResults.success;
          imagesFailed = imageResults.failed;
          
          // Génère l'index des images
          await this.generateImageIndex(result.data);
          
          // Met à jour le résultat avec les statistiques d'images
          result.imagesDownloaded = imagesDownloaded;
          result.imagesFailed = imagesFailed;
        }
  
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
  
        // Génère la prévisualisation HTML
        if (generatePreview && downloadImages) {
          await this.generateImagePreview(result.data);
        }
      }
  
      // Sauvegarde le log
      await this.saveScrapingLog(result);
  
      console.log('\n✨ Scraping terminé');
      return result;
    }
  }
  
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
  imagesDownloaded?: number;
  imagesFailed?: number;
}

interface ImageDownloadResult {
  success: boolean;
  traitKey: string;
  imageName: string;
  error?: string;
}

class TFTTraitsScraper {
  private baseUrl = 'https://utils.iesdev.com/static/json/tftTest/set14/fr_fr/traits';
  private imageBaseUrl = 'https://blitz-cdn.blitz.gg/blitz/tft/traits/dark';
  private outputDir = './data/tft/traits';
  private imagesDir = './data/tft/traits/images';

  constructor() {
    this.ensureOutputDirectories();
  }

  /**
   * Assure que les répertoires de sortie existent
   */
  private async ensureOutputDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création des répertoires:', error);
    }
  }

  /**
   * Extrait le nom propre du trait à partir de l'apiKey
   * Ex: "TFT14_AnimaSquad" -> "animasquad"
   * Ex: "TFT14_Armorclad" -> "armorclad"
   */
  private extractTraitImageName(apiKey: string): string {
    // Supprime le préfixe TFT14_ ou similaire
    const cleanName = apiKey.replace(/^TFT\d+_/, '');
    
    // Convertit en minuscules
    return cleanName.toLowerCase();
  }

  /**
   * Télécharge une image de trait
   */
  private async downloadTraitImage(traitKey: string, trait: TFTTrait): Promise<ImageDownloadResult> {
    try {
      const imageName = this.extractTraitImageName(trait.apiKey);
      const imageUrl = `${this.imageBaseUrl}/trait-${imageName}.webp`;
      const imagePath = path.join(this.imagesDir, `${imageName}.webp`);

      // Vérifie si l'image existe déjà
      try {
        await fs.access(imagePath);
        console.log(`⏭️ Image déjà présente: ${imageName}.webp`);
        return {
          success: true,
          traitKey,
          imageName
        };
      } catch {
        // L'image n'existe pas, on continue le téléchargement
      }

      console.log(`📥 Téléchargement: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'TFT-Traits-Scraper/1.0',
          'Accept': 'image/webp,image/*,*/*;q=0.8',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Statut HTTP: ${response.status}`);
      }

      await fs.writeFile(imagePath, response.data);
      console.log(`✅ Image téléchargée: ${imageName}.webp`);

      return {
        success: true,
        traitKey,
        imageName
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`❌ Erreur téléchargement ${trait.apiKey}: ${errorMessage}`);
      
      return {
        success: false,
        traitKey,
        imageName: this.extractTraitImageName(trait.apiKey),
        error: errorMessage
      };
    }
  }

  /**
   * Télécharge toutes les images des traits
   */
  private async downloadAllTraitImages(data: TFTTraitsData): Promise<{ success: number; failed: number }> {
    console.log(`🖼️ Début du téléchargement des images (${Object.keys(data).length} traits)...`);
    
    const results: ImageDownloadResult[] = [];
    let success = 0;
    let failed = 0;

    // Télécharge les images une par une pour éviter de surcharger le serveur
    for (const [traitKey, trait] of Object.entries(data)) {
      const result = await this.downloadTraitImage(traitKey, trait);
      results.push(result);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // Petite pause entre les téléchargements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Images téléchargées: ${success} succès, ${failed} échecs`);

    // Sauvegarde le log des téléchargements
    try {
      const logPath = path.join(this.imagesDir, 'download_log.json');
      const downloadLog = {
        timestamp: new Date().toISOString(),
        totalTraits: Object.keys(data).length,
        successCount: success,
        failedCount: failed,
        results
      };
      
      await fs.writeFile(logPath, JSON.stringify(downloadLog, null, 2), 'utf-8');
      console.log(`📝 Log des téléchargements sauvegardé`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du log des images:', error);
    }

    return { success, failed };
  }

  /**
   * Génère un index des images téléchargées
   */
  private async generateImageIndex(data: TFTTraitsData): Promise<void> {
    try {
      const imageIndex: Record<string, {
        traitKey: string;
        traitName: string;
        imageName: string;
        imagePath: string;
        type: string;
      }> = {};

      for (const [traitKey, trait] of Object.entries(data)) {
        const imageName = this.extractTraitImageName(trait.apiKey);
        const imagePath = `./images/${imageName}.webp`;
        
        imageIndex[traitKey] = {
          traitKey,
          traitName: this.cleanHtmlText(trait.name),
          imageName,
          imagePath,
          type: trait.type
        };
      }

      const indexPath = path.join(this.imagesDir, 'image_index.json');
      await fs.writeFile(indexPath, JSON.stringify(imageIndex, null, 2), 'utf-8');
      console.log(`🗂️ Index des images généré: image_index.json`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'index des images:', error);
    }
  }

  /**
   * Génère un fichier HTML de prévisualisation des images
   */
  private async generateImagePreview(data: TFTTraitsData): Promise<void> {
    try {
      let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFT Set 14 - Aperçu des Traits</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #0f1419; 
            color: #cdbe91; 
            padding: 20px; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
        }
        .traits-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .trait-card { 
            background: #1e2328; 
            border-radius: 8px; 
            padding: 15px; 
            border: 1px solid #3c3c41; 
        }
        .trait-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 10px; 
        }
        .trait-image { 
            width: 40px; 
            height: 40px; 
            margin-right: 10px; 
            border-radius: 4px; 
        }
        .trait-name { 
            font-weight: bold; 
            font-size: 18px; 
        }
        .trait-type { 
            color: #cdbe91; 
            font-size: 12px; 
            text-transform: uppercase; 
            margin-left: auto; 
        }
        .trait-description { 
            font-size: 14px; 
            color: #a09b8c; 
            margin-bottom: 10px; 
        }
        .bonuses { 
            font-size: 12px; 
        }
        .bonus-level { 
            margin: 5px 0; 
            padding: 5px; 
            background: #0f1419; 
            border-radius: 4px; 
        }
        .stats { 
            background: #1e2328; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TFT Set 14 - Traits & Synergies</h1>
            <p>Généré le ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <h2>Statistiques</h2>
            <p>Total des traits: ${Object.keys(data).length}</p>
        </div>
        
        <div class="traits-grid">`;

      for (const [traitKey, trait] of Object.entries(data)) {
        const imageName = this.extractTraitImageName(trait.apiKey);
        const imageUrl = `./images/${imageName}.webp`;
        
        html += `
            <div class="trait-card">
                <div class="trait-header">
                    <img src="${imageUrl}" alt="${this.cleanHtmlText(trait.name)}" class="trait-image" 
                         onerror="this.style.display='none'">
                    <div class="trait-name">${this.cleanHtmlText(trait.name)}</div>
                    <div class="trait-type">${trait.type}</div>
                </div>
                <div class="trait-description">${this.cleanHtmlText(trait.description)}</div>
                <div class="bonuses">`;
        
        trait.bonuses.forEach(bonus => {
          html += `<div class="bonus-level"><strong>${bonus.needed}:</strong> ${this.cleanHtmlText(bonus.effect)}</div>`;
        });
        
        html += `
                </div>
            </div>`;
      }

      html += `
        </div>
    </div>
</body>
</html>`;

      const previewPath = path.join(this.outputDir, 'traits_preview.html');
      await fs.writeFile(previewPath, html, 'utf-8');
      console.log(`🌐 Aperçu HTML généré: traits_preview.html`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'aperçu HTML:', error);
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
          const imageName = this.extractTraitImageName(trait.apiKey);
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
          const imageName = this.extractTraitImageName(trait.apiKey);
          report += `### ${this.cleanHtmlText(trait.name)}\n\n`;
          report += `![${this.cleanHtmlText(trait.name)}](./images/${imageName}.webp)\n\n`;
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
    saveByType?: boolean,
    downloadImages?: boolean,
    generatePreview?: boolean
  } = {}): Promise<ScrapingResult> {
    const { 
      saveData = true, 
      checkUpdates = false,
      generateReport = false,
      saveCleanedVersion = true,
      saveByType = false,
      downloadImages = true,
      generatePreview = false
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

      // Télécharge les images si demandé
      let imagesDownloaded = 0;
      let imagesFailed = 0;
      
      if (downloadImages) {
        const imageResults = await this.downloadAllTraitImages(result.data);
        imagesDownloaded = imageResults.success;
        imagesFailed = imageResults.failed;
        
        // Génère l'index des images
        await this.generateImageIndex(result.data);
        
        // Met à jour le résultat avec les statistiques d'images
        result.imagesDownloaded = imagesDownloaded;
        result.imagesFailed = imagesFailed;
      }

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

      // Génère la prévisualisation HTML
      if (generatePreview && downloadImages) {
        await this.generateImagePreview(result.data);
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
  const checkUpdates = args.includes('


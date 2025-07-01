# TFT Assistant - Script de Scraping des Synergies

## 🎯 Description

Ce script permet de récupérer automatiquement les données des traits/synergies de Teamfight Tactics depuis l'API officielle et de les traiter pour l'application.

## 🚀 Utilisation

### Installation des dépendances
```bash
npm install
```

### Commandes disponibles

#### Scraping simple
```bash
npm run scrape:traits
```

#### Scraping avec vérification des mises à jour
```bash
npm run scrape:traits:check
```

#### Mode continu (vérification toutes les 15 minutes)
```bash
npm run scrape:traits:watch
```

#### Génération de rapport détaillé
```bash
npm run scrape:traits:report
```

#### Scraping de tous les modules
```bash
npm run scrape:all
```

### Options avancées

Vous pouvez aussi exécuter directement le script avec des options :

```bash
# Scraping basique
tsx src/script/scrape/synergie.ts

# Avec vérification des mises à jour
tsx src/script/scrape/synergie.ts --check-updates

# Mode continu
tsx src/script/scrape/synergie.ts --continuous

# Avec rapport détaillé et séparation par type
tsx src/script/scrape/synergie.ts --report --by-type

# Sans sauvegarde des données brutes
tsx src/script/scrape/synergie.ts --no-save

# Sans nettoyage HTML
tsx src/script/scrape/synergie.ts --no-clean

# Sans génération du fichier pour l'app
tsx src/script/scrape/synergie.ts --no-app-file
```

## 📁 Structure des fichiers générés

```
data/tft/traits/
├── tft_traits_set14_[timestamp].json          # Données brutes
├── tft_traits_set14_cleaned_[timestamp].json  # Données nettoyées (sans HTML)
├── tft_origins_[timestamp].json               # Origines uniquement
├── tft_classes_[timestamp].json               # Classes uniquement
├── tft_other_traits_[timestamp].json          # Autres traits
├── traits_report_[timestamp].md               # Rapport détaillé
└── traits_scraping_log.json                   # Log des exécutions

src/data/
└── synergies_generated.ts                     # Fichier pour l'application
```

## 🔧 Fonctionnalités

### ✅ Récupération des données
- Connexion à l'API TFT officielle
- Validation des données reçues
- Gestion des erreurs réseau et timeout
- Support des codes de statut HTTP

### ✅ Traitement des données
- Nettoyage du HTML (balises, variables de template)
- Extraction des statistiques (origines, classes, bonus)
- Validation de la structure des données
- Séparation par type de trait

### ✅ Sauvegarde et logging
- Sauvegarde des données brutes et nettoyées
- Génération de rapports Markdown
- Log détaillé des exécutions
- Rotation automatique des logs (50 entrées max)

### ✅ Détection des mises à jour
- Comparaison avec les données précédentes
- Évite les scraping inutiles
- Mode continu avec vérification périodique

### ✅ Génération pour l'application
- Fichier TypeScript prêt à l'emploi
- Mapping des icônes et couleurs
- Structure compatible avec l'interface

## 📊 Exemple de sortie

```
🚀 Démarrage du scraping TFT Traits/Synergies...

🔄 Récupération des traits/synergies TFT...
📡 URL: https://utils.iesdev.com/static/json/tftTest/set14/fr_fr/traits
✅ Données des traits récupérées avec succès
📊 Nombre total de traits: 52
🎯 Origines: 14 | Classes: 11 | Autres: 27
📈 Moyenne de bonus par trait: 2.48

📈 Analyse des traits/synergies:
├─ Total: 52 traits
├─ Répartition:
│  ├─ Origines: 14
│  ├─ Classes: 11
│  └─ Autres types: 27
├─ Moyenne de bonus par trait: 2.48
├─ Niveaux de bonus max: 1 - 10
├─ Traits avec le plus de paliers:
│  ├─ Section Anima: 4 paliers
│  ├─ Exotech: 4 paliers
│  ├─ Démon urbain: 4 paliers
│  ├─ Divinicorp: 7 paliers
│  └─ Technophile: 4 paliers
└─ Analyse terminée

💾 Données sauvegardées: ./data/tft/traits/tft_traits_set14_1751370753359.json
🧹 Version nettoyée sauvegardée: ./data/tft/traits/tft_traits_set14_cleaned_1751370753359.json
🎯 Fichier de synergies pour l'app généré: ./src/data/synergies_generated.ts
📝 Log de scraping mis à jour (1 entrées)

✨ Scraping terminé
```

## 🛠️ Améliorations apportées

### 1. **Validation robuste des données**
- Vérification de la structure des objets reçus
- Validation des propriétés requises
- Gestion des cas d'erreur

### 2. **Nettoyage HTML amélioré**
- Support de toutes les balises TFT
- Suppression des variables de template
- Gestion des cas null/undefined

### 3. **Gestion d'erreurs complète**
- Messages d'erreur détaillés
- Distinction entre erreurs réseau/serveur/données
- Logging des réponses serveur pour debug

### 4. **Fonctionnalités additionnelles**
- Génération automatique du fichier pour l'app
- Scripts npm pour faciliter l'utilisation
- Mode continu pour surveillance automatique
- Rapports détaillés en Markdown

### 5. **Performance et fiabilité**
- Timeout configuré (15 secondes)
- Headers HTTP appropriés
- Rotation des logs pour éviter l'accumulation
- Vérification des mises à jour intelligente

Le script est maintenant **complètement fonctionnel** et prêt pour la production ! 🚀
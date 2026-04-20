# 📚 Documentation Légale - JurisAide Bénin

## 📂 Structure du dossier

```
docs/legal/
├── README.md                    ← Vous êtes ici
├── TEMPLATE_ARTICLE.md          ← Template pour nouveaux articles
├── article_42.md                ← Préavis (À créer)
├── article_44.md                ← Indemnité licenciement (À créer)
├── article_113.md               ← Congés payés (À créer)
├── jurisprudence/
│   ├── cas_similaire_001.md     ← Cas de cour béninoise
│   └── cas_similaire_002.md     ← Cas de cour béninoise
└── decrets/
    ├── decret_application_1.md  ← Décrets d'application
    └── decret_application_2.md  ← Décrets d'application
```

---

## 🎯 Objectif de ce dossier

Ce dossier contient **tous les documents légaux officiels** utilisés pour valider les calculs dans JurisAide.

**Chaque calcul doit:**
1. ✅ Citer un article de loi
2. ✅ Référencer le document officiel dans ce dossier
3. ✅ Être validé par cas de jurisprudence réels
4. ✅ Avoir une formule précise documentée

---

## 📋 Checklist de documentation

Pour chaque article implémenté:

### Document de base
- [ ] **Fichier:** `article_XX.md` créé
- [ ] **Contenu:** Texte complet de l'article
- [ ] **Source:** URL officielle archivée
- [ ] **Date:** Date de promulgation et téléchargement
- [ ] **Formule:** Mathématique précise documentée
- [ ] **Questions:** Validation checklist complète
- [ ] **Signatures:** Expert juridique validé

### Cas de jurisprudence
- [ ] **Minimum 3 cas:** Trouvés et archivés
- [ ] **Dossier:** `jurisprudence/cas_XXX.md`
- [ ] **Détails:** Montants, durées, résultats
- [ ] **Validation:** Résultats calcul vs. décision cour

### Décrets d'application
- [ ] **Tous les décrets:** Identifiés et archivés
- [ ] **Dossier:** `decrets/decret_XXX.md`
- [ ] **Clarifications:** Notes d'interprétation

---

## 🔍 Comment remplir ce dossier

### Étape 1: Créer article_XX.md

```bash
# Dupliquer le template
cp TEMPLATE_ARTICLE.md article_XX.md

# Ouvrir et remplir
nano article_XX.md
```

### Étape 2: Ajouter texte officiel

Copier le texte exact de l'article depuis:
- https://sgg.gouv.bj/ (Site gouvernement béninois)
- https://www.ilo.org/dyn/natlex/ (Base ILO)
- Document PDF téléchargé

### Étape 3: Documenter implémentation

```markdown
## 🔧 IMPLÉMENTATION

Fichier: `backend/api/xlib/labor_code.py`
Fonction: `calculate_...`

### Formule utilisée
[Mathématique précise]

### Paramètres
[Liste et explications]

### Status implémentation
[✅ Complète / ⏳ Partielle / ❌ À faire]
```

### Étape 4: Remplir questions de validation

```markdown
## ❓ QUESTIONS

- [ ] **Q1:** ...
  - Réponse officielle: ...
  - Source: ...
```

### Étape 5: Ajouter cas de jurisprudence

Créer fichier `jurisprudence/cas_001.md`:

```markdown
# Cas Similaire #1 - Cour Béninoise

## Référence
- **Cour:** [Tribunal / Cour]
- **Date:** [DD/MM/YYYY]
- **Numéro dossier:** [...]
- **Jugement:** [Référence]

## Faits
- Travailleur: [Catégorie]
- Durée emploi: [X ans]
- Salaire: [Montant] FCFA
- Raison rupture: [...]

## Calcul officiel de la cour
- Article appliqué: Article XX
- Indemnité accordée: [Montant]
- Justification: [...]

## Validation JurisAide
- Notre calcul: [Montant]
- Match: ✅ OUI / ❌ NON
- Différence: [Si applicable]
```

---

## 📞 Contacts pour validation

### Ressources officielles
```
Gouvernement du Bénin
URL: https://sgg.gouv.bj/
Contact: [À identifier]
Statut: ⏳ À contacter
```

### Ministère du Travail
```
Adresse: [À identifier]
Email: [À identifier]
Téléphone: [À identifier]
Statut: ⏳ À contacter
```

### Expert juridique
```
Nom: [À identifier]
Spécialité: Droit du travail
Cabinet: [À identifier]
Email: [À identifier]
Téléphone: [À identifier]
Statut: ⏳ À contacter
```

### Syndicats
```
Organisations: [À identifier]
Contact: [À identifier]
Statut: ⏳ À contacter
```

---

## 🔄 Workflow de mise à jour

Si une loi change:

1. **Notification** → Signaler à tous les utilisateurs
2. **Recherche** → Trouver décret/modification officiel
3. **Documentation** → Mettre à jour fichiers `.md`
4. **Implémentation** → Modifier code si nécessaire
5. **Tests** → Valider avec nouveaux cas
6. **Validation** → Obtenir signature expert
7. **Déploiement** → Mettre à jour en production
8. **Archive** → Garder ancienne version pour audit

---

## ✅ Status de documentation

| Article | Documentation | Implémentation | Tests | Validation |
|---------|---------------|-----------------|-------|-----------|
| 42 (Préavis) | ⏳ À créer | ✅ Fait | ⏳ À créer | ❌ Pendante |
| 44 (Severance) | ⏳ À créer | ✅ Fait | ⏳ À créer | ❌ Pendante |
| 113 (Congés) | ⏳ À créer | ✅ Fait | ⏳ À créer | ❌ Pendante |
| Heures sup | ❌ Manquant | ❌ Vide | ❌ Absent | ❌ Absent |

---

## 📊 Checklist finale

Avant production (tous les ✅ doivent être cochés):

- [ ] Article 42 complètement documenté
- [ ] Article 44 complètement documenté
- [ ] Article 113 complètement documenté
- [ ] Minimum 3 cas jurisprudence par article
- [ ] Tous les décrets identifiés
- [ ] Code implémentation validé
- [ ] Tests passent tous
- [ ] Expert juridique a signé chaque article
- [ ] Utilisateurs formés
- [ ] Système audit trail en place
- [ ] Plan maintenance établi

**Status global:** 🔴 EN COURS

---

## 🚀 Prochaines actions

1. **Aujourd'hui:** 
   - [ ] Créer `article_42.md`
   - [ ] Créer `article_44.md`
   - [ ] Créer `article_113.md`

2. **Cette semaine:**
   - [ ] Télécharger textes officiels
   - [ ] Remplir sections "Texte officiel"
   - [ ] Remplir questions validation

3. **Prochaines semaines:**
   - [ ] Contacter expert juridique béninois
   - [ ] Obtenir réponses à questions
   - [ ] Trouver cas jurisprudence
   - [ ] Remplir complètement tous les documents

4. **Avant production:**
   - [ ] Validation signatures sur tous les articles
   - [ ] Tous les documents 100% complets
   - [ ] Déploiement avec numéro de version

---

**Créé:** 2024-04-20  
**Dernier update:** ________________  
**Responsable:** ________________  
**Status:** 🔴 À COMMENCER

# 🗺️ Traduction des lieux OneRoadTrip

## Contexte
Tu es traducteur pour OneRoadTrip. Tu vas recevoir jusqu'à 50 lieux (places) avec leurs visites et activités à traduire en 6 langues.

## Langues cibles
- **fr** : Français
- **en** : English  
- **it** : Italiano
- **es** : Español
- **pt** : Português
- **ar** : العربية

## Structure des données
Chaque place contient :
- **name** : nom du lieu (ex: "Abu Dhabi Centre")
- **visits** : liste de visites/points d'intérêt
- **activities** : liste d'activités à faire

## Règles de traduction

### Noms de lieux
- Garder les noms propres reconnus internationalement (Sheikh Zayed, Colosseum, Tour Eiffel)
- Traduire les termes génériques (Centre → Center/Centro, Plage → Beach/Playa)
- Exemples :
  | Original | EN | ES |
  |----------|----|----|
  | Paris Centre | Paris Center | Centro de París |
  | Al Aqah Plage | Al Aqah Beach | Playa de Al Aqah |

### Visites et activités
- Traduire naturellement, pas mot à mot
- Garder le contenu entre parenthèses traduit aussi
- Style : phrases courtes, informatives, engageantes
- Exemples :
  | Original | EN |
  |----------|----|
  | Grande Mosquée Sheikh Zayed (visite des cours et galeries). | Sheikh Zayed Grand Mosque (visit the courtyards and galleries). |
  | Balade sur le front de mer (plages publiques). | Stroll along the waterfront (public beaches). |

### ⚠️ IMPORTANT
- L'**ordre** des visits/activities doit être **IDENTIQUE** à l'original
- Le **nombre** d'éléments doit correspondre exactement
- Si un élément est vide "", mettre "" dans toutes les langues

## Format de réponse OBLIGATOIRE

Retourne UNIQUEMENT un JSON valide, sans texte avant ni après :

```json
{
  "batch": 1,
  "places": [
    {
      "place_id": "XX::slug",
      "translations": {
        "fr": {
          "name": "...",
          "visits": ["...", "..."],
          "activities": ["..."]
        },
        "en": {
          "name": "...",
          "visits": ["...", "..."],
          "activities": ["..."]
        },
        "it": { "name": "...", "visits": [...], "activities": [...] },
        "es": { "name": "...", "visits": [...], "activities": [...] },
        "pt": { "name": "...", "visits": [...], "activities": [...] },
        "ar": { "name": "...", "visits": [...], "activities": [...] }
      }
    }
  ]
}
```

## Vérification finale
Avant de soumettre, vérifie :
1. ✅ Nombre de places = nombre dans le fichier source
2. ✅ Chaque place a ses 6 langues
3. ✅ Nombre de visits/activities identique à l'original pour chaque place
4. ✅ JSON valide (pas de virgule en trop, guillemets corrects)

## Fichier source
Voir `translation-places-XXX.json` joint.

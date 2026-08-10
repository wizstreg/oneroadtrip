#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix-night-shift.py
Corrige le decalage des nuits dans les itineraires (night.place_id en avance d'un jour
sur le contenu : derniere nuit dupliquee, premiere ville sautee).

Strategie SURE :
- detection par signature stricte (n'agit que sur les vrais decalages)
- jours 2..N : la bonne nuit = celle du jour precedent (place_id + coords) -> recuperable dans la donnee
- jour 1 : ville sautee, introuvable dans les nuits -> resolue depuis les MASTERS (vrai catalogue),
           jamais inventee. Si non resolue, l'itineraire n'est PAS modifie et est signale.
- backup de chaque fichier, DRY-RUN par defaut, journal complet.

Usage :
  python fix-night-shift.py --dir . --masters "C:\\OneRoadTrip\\data\\Roadtripsprefabriques\\countries"
  (ajoute --apply pour ecrire vraiment ; sans, c'est un dry-run qui montre tout)
"""

import json, os, sys, glob, argparse, shutil, re, unicodedata

def norm(s):
    s = unicodedata.normalize('NFD', s or '')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.lower()

def tok(place_id):
    if not place_id: return ''
    return norm(place_id.split('::')[-1].split('-')[0])

# ---------- MASTERS : nom -> (place_id, coords) ----------
def load_masters(masters_dir):
    idx = {}   # nom normalise -> (place_id, coords)
    if not masters_dir or not os.path.isdir(masters_dir):
        return idx
    for f in glob.glob(os.path.join(masters_dir, '**', '*.json'), recursive=True):
        if 'master' not in os.path.basename(f).lower():
            continue
        try:
            data = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        places = data.get('places', data) if isinstance(data, dict) else data
        if not isinstance(places, list):
            continue
        for p in places:
            if not isinstance(p, dict): continue
            pid = p.get('place_id'); name = p.get('name'); coords = p.get('coords')
            if pid and name:
                idx[norm(name)] = (pid, coords)
    return idx

def resolve_day1(map_keywords, masters):
    """Retrouve la ville du jour 1 depuis ses mots-cles, via le catalogue. Jamais inventee."""
    if not masters:
        return None
    blob = norm(' '.join(map_keywords or []))
    # on cherche un nom de master present dans les mots-cles, le plus long d'abord
    best = None
    for name_n, (pid, coords) in masters.items():
        if len(name_n) < 3: continue
        if name_n in blob:
            if best is None or len(name_n) > len(best[0]):
                best = (name_n, pid, coords)
    if best:
        return {'place_id': best[1], 'coords': best[2]}
    return None

# ---------- DETECTION ----------
def detect_shift(days):
    nights = [(d.get('night') or {}).get('place_id', '') for d in days]
    if len(nights) < 3:
        return False
    end_dup = nights[-1] == nights[-2] and nights[-1] != ''
    shift_ev = 0       # jours dont les mots-cles parlent de la nuit PRECEDENTE
    own_match = 0      # jours dont les mots-cles parlent de leur PROPRE nuit
    for i, d in enumerate(days):
        kw = norm(' '.join((d.get('night') or {}).get('map_keywords', [])))
        own = tok(nights[i])
        if own and own in kw:
            own_match += 1
        if i > 0:
            prev = tok(nights[i-1])
            if prev and prev in kw and own not in kw:
                shift_ev += 1
    # signature stricte : fin dupliquee + preuve repetee de decalage + la nuit colle rarement a son jour
    return end_dup and shift_ev >= 2 and own_match <= 1

# ---------- CORRECTION ----------
def fix_itin(it, masters, report):
    days = it.get('days_plan', [])
    if not detect_shift(days):
        return False
    # sauvegarde des paires (place_id, coords) d'origine
    old = [((d.get('night') or {}).get('place_id'), (d.get('night') or {}).get('coords')) for d in days]
    # jour 1 : ville sautee, a resoudre depuis les masters
    d1 = resolve_day1((days[0].get('night') or {}).get('map_keywords', []), masters)
    if not d1:
        report.append(f"  NON CORRIGE (jour 1 introuvable dans les masters) : {it.get('id')}")
        return False
    changes = []
    # jours 2..N : reprennent la nuit du jour precedent
    for i in range(len(days) - 1, 0, -1):
        n = days[i].setdefault('night', {})
        before = n.get('place_id')
        n['place_id'] = old[i-1][0]
        n['coords'] = old[i-1][1]
        changes.append((days[i].get('day', i+1), before, n['place_id']))
    # jour 1
    n0 = days[0].setdefault('night', {})
    before0 = n0.get('place_id')
    n0['place_id'] = d1['place_id']
    n0['coords'] = d1['coords']
    changes.append((days[0].get('day', 1), before0, n0['place_id']))
    report.append(f"  CORRIGE : {it.get('id')}")
    for day, b, a in sorted(changes):
        report.append(f"      J{day}: {b}  ->  {a}")
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default='.')
    ap.add_argument('--pattern', default='*_itins_modules-*.json')
    ap.add_argument('--masters', default=None)
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    masters = load_masters(args.masters)
    print(f"Masters charges : {len(masters)} lieux" + ("" if masters else "  (aucun -> jour 1 non resolu, itins decales signales seulement)"))

    files = sorted(glob.glob(os.path.join(args.dir, args.pattern)))
    if not files:
        print(f"Aucun fichier ne correspond a {args.pattern} dans {args.dir}"); sys.exit(1)

    total_fixed = 0
    for path in files:
        data = json.load(open(path, encoding='utf-8'))
        its = data.get('itineraries', [])
        report = []
        fixed = 0
        for it in its:
            if fix_itin(it, masters, report):
                fixed += 1
        print(f"\n=== {os.path.basename(path)} : {fixed} itineraire(s) corrige(s) ===")
        for line in report:
            print(line)
        if fixed and args.apply:
            bak = path + '.before-nightfix'
            if not os.path.exists(bak):
                shutil.copy2(path, bak)
            tmp = path + '.tmp'
            json.dump(data, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
            os.replace(tmp, path)
            print(f"  -> ecrit (backup: {os.path.basename(bak)})")
        total_fixed += fixed

    print(f"\nTotal : {total_fixed} correction(s)." + ("" if args.apply else "  [DRY-RUN, rien ecrit. Ajoute --apply pour appliquer.]"))

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneRoadTrip Development Server
------------------------------
Serveur de développement local avec endpoint pour sauvegarder les itinéraires.

Usage:
    python ort_server.py [port]
    
Par défaut, port 8030.
"""

import http.server
import socketserver
import json
import os
import shutil
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import sys
import re

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8030


def fix_double_utf8(text):
    """
    Corrige le double encodage UTF-8 (UTF-8 encodé en Latin-1 puis ré-encodé).
    Exemple: "ChÃ¢teau" → "Château"
    """
    if not isinstance(text, str):
        return text
    
    # Méthode robuste : tenter de décoder le double encodage
    try:
        # Si le texte contient des séquences UTF-8 mal interprétées
        fixed = text.encode('latin-1').decode('utf-8')
        return fixed
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
    
    # Fallback : remplacements manuels des patterns courants
    replacements = [
        ('Ã©', 'é'), ('Ã¨', 'è'), ('Ãª', 'ê'), ('Ã«', 'ë'),
        ('Ã ', 'à'), ('Ã¢', 'â'), ('Ã¤', 'ä'),
        ('Ã¯', 'ï'), ('Ã®', 'î'), ('Ã¬', 'ì'),
        ('Ã´', 'ô'), ('Ã¶', 'ö'), ('Ã²', 'ò'),
        ('Ã¹', 'ù'), ('Ã»', 'û'), ('Ã¼', 'ü'),
        ('Ã§', 'ç'), ('Ã±', 'ñ'),
        ('Ã‰', 'É'), ('Ã€', 'À'), ('Ã‚', 'Â'),
        ('Ã"', 'Ô'), ('Ã›', 'Û'), ('Ã‡', 'Ç'),
    ]
    
    result = text
    # Apostrophe typographique
    result = result.replace('\xe2\x80\x99', "'")
    result = result.replace('â€™', "'")
    # Tirets
    result = result.replace('â€"', '–')
    result = result.replace('â€"', '—')
    # Guillemets
    result = result.replace('â€œ', '"')
    result = result.replace('â€', '"')
    
    for bad, good in replacements:
        result = result.replace(bad, good)
    
    return result


def fix_encoding_recursive(obj):
    """
    Applique la correction d'encodage récursivement sur un objet JSON.
    """
    if isinstance(obj, str):
        return fix_double_utf8(obj)
    elif isinstance(obj, dict):
        return {k: fix_encoding_recursive(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [fix_encoding_recursive(item) for item in obj]
    else:
        return obj

class ORTRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler HTTP avec support des API OneRoadTrip."""
    
    def do_OPTIONS(self):
        """Gérer les requêtes CORS preflight."""
        self.send_response(200)
        # Note: Access-Control-Allow-Origin ajouté automatiquement par end_headers()
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Gérer les requêtes POST (API)."""
        parsed = urlparse(self.path)
        
        if parsed.path == '/api/save-itinerary':
            self.handle_save_itinerary()
        elif parsed.path == '/api/delete-itinerary':
            self.handle_delete_itinerary()
        else:
            self.send_error(404, f"Endpoint not found: {parsed.path}")
    
    def handle_save_itinerary(self):
        """Sauvegarder un itinéraire dans un fichier JSON (format ORT avec itineraries[])."""
        try:
            # Lire le body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            file_path = data.get('path')
            itinerary = data.get('data')
            country_code = data.get('country', '').upper()
            
            if not file_path or not itinerary:
                self.send_json_response(400, {'success': False, 'error': 'Missing path or data'})
                return
            
            # Sécurité : vérifier que le chemin est dans data/
            if not file_path.startswith('data/') or '..' in file_path:
                self.send_json_response(403, {'success': False, 'error': 'Invalid path'})
                return
            
            # Recherche insensible à la casse du dossier et fichier
            actual_path = self.find_case_insensitive_path(file_path, country_code)
            if actual_path:
                file_path = actual_path
                print(f"[PATH] Fichier existant trouvé: {file_path}")
            else:
                # Créer le dossier si nécessaire
                dir_path = os.path.dirname(file_path)
                if dir_path and not os.path.exists(dir_path):
                    os.makedirs(dir_path)
                print(f"[PATH] Nouveau fichier sera créé: {file_path}")
            
            # Backup si le fichier existe
            backup_path = None
            existing_data = None
            if os.path.exists(file_path):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = f"{file_path}.backup_{timestamp}"
                shutil.copy2(file_path, backup_path)
                print(f"[BACKUP] {file_path} -> {backup_path}")
                
                # Lire le contenu existant
                with open(file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            
            # Déterminer le format et mettre à jour
            itin_id = itinerary.get('id') or itinerary.get('itin_id')
            final_data = None
            updated_index = -1
            
            if existing_data is None:
                # Nouveau fichier - créer structure ORT
                country = itinerary.get('country', 'XX')
                final_data = {
                    "version": "v1",
                    "country": country,
                    "itineraries": [itinerary]
                }
                updated_index = 0
                print(f"[SAVE] Nouveau fichier créé avec structure ORT")
                
            elif isinstance(existing_data, dict) and 'itineraries' in existing_data:
                # Format ORT standard : { itineraries: [...] }
                final_data = existing_data
                itins = final_data['itineraries']
                found = False
                
                for i, itin in enumerate(itins):
                    existing_id = itin.get('id') or itin.get('itin_id')
                    if existing_id == itin_id:
                        # Fusionner : garder les champs existants, mettre à jour avec les nouveaux
                        merged = {**itin}
                        # Mettre à jour TOUS les champs fournis (y compris seo, meta, etc.)
                        for key in ['title', 'estimated_days_base', 'days_plan', 'pacing_rules',
                                    'seo', 'meta', 'segments', 'variants', 'regions',
                                    'nearby_itins', 'merge_suggestions', 'notes', 'specialties',
                                    'dept_code', 'dept_name', 'source_url', 'created_at',
                                    'subtitle', 'seo_keywords', 'practical_context',
                                    'essential_tips', 'summary']:
                            if key in itinerary:
                                merged[key] = itinerary[key]
                        itins[i] = merged
                        found = True
                        updated_index = i
                        print(f"[SAVE] Itinéraire '{itin_id}' mis à jour à l'index {i}")
                        break
                
                if not found:
                    itins.append(itinerary)
                    updated_index = len(itins) - 1
                    print(f"[SAVE] Itinéraire '{itin_id}' ajouté (nouveau)")
                    
            elif isinstance(existing_data, list):
                # Format tableau simple : [...]
                final_data = existing_data
                found = False
                for i, itin in enumerate(final_data):
                    existing_id = itin.get('id') or itin.get('itin_id')
                    if existing_id == itin_id:
                        final_data[i] = {**itin, **itinerary}
                        found = True
                        updated_index = i
                        print(f"[SAVE] Itinéraire '{itin_id}' remplacé à l'index {i}")
                        break
                
                if not found:
                    final_data.append(itinerary)
                    updated_index = len(final_data) - 1
                    print(f"[SAVE] Itinéraire '{itin_id}' ajouté")
            else:
                # Format objet simple
                final_data = {**existing_data, **itinerary}
                print(f"[SAVE] Objet fusionné")
            
            # Corriger le double encodage UTF-8 avant l'écriture
            final_data = fix_encoding_recursive(final_data)
            print(f"[ENCODING] Correction UTF-8 appliquée")
            
            # Écrire le fichier avec encodage UTF-8 explicite
            with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
                json.dump(final_data, f, ensure_ascii=False, indent=2)
            
            steps_count = len(itinerary.get('days_plan', itinerary.get('steps', [])))
            if isinstance(final_data, dict) and 'itineraries' in final_data:
                total_itins = len(final_data['itineraries'])
            elif isinstance(final_data, list):
                total_itins = len(final_data)
            else:
                total_itins = 1
            
            print(f"[SAVE] ✅ {file_path} ({steps_count} jours, {total_itins} itinéraire(s))")
            
            response = {
                'success': True,
                'message': f"Sauvegardé: {itin_id} ({steps_count} jours)",
                'path': file_path,
                'backup': backup_path,
                'steps_count': steps_count,
                'total_itineraries': total_itins,
                'updated_index': updated_index
            }
            self.send_json_response(200, response)
            
        except json.JSONDecodeError as e:
            self.send_json_response(400, {'success': False, 'error': f'Invalid JSON: {str(e)}'})
        except Exception as e:
            print(f"[ERROR] {e}")
            self.send_json_response(500, {'success': False, 'error': str(e)})
    
    def handle_delete_itinerary(self):
        """Supprimer un itinéraire de tous les fichiers JSON (toutes langues)."""
        try:
            # Lire le body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Accepter les deux formats de paramètres
            itin_id = data.get('itinId') or data.get('itin_id')
            country_code = data.get('country', '').upper()
            all_languages = data.get('allLanguages', False)
            specific_languages = data.get('languages', None)  # Liste explicite: ['en', 'es', ...]
            
            if not itin_id:
                self.send_json_response(400, {'success': False, 'error': 'Missing itinId'})
                return
            
            if not country_code:
                # Extraire le country code de l'itin_id (format: CC::region::slug)
                parts = itin_id.split('::')
                if parts:
                    country_code = parts[0].upper()
            
            if not country_code:
                self.send_json_response(400, {'success': False, 'error': 'Missing country code'})
                return
            
            # Trouver le dossier du pays
            base_dir = "data/Roadtripsprefabriques/countries"
            country_folder = None
            
            if os.path.exists(base_dir):
                for folder in os.listdir(base_dir):
                    if folder.upper() == country_code:
                        country_folder = os.path.join(base_dir, folder)
                        break
            
            if not country_folder or not os.path.exists(country_folder):
                self.send_json_response(404, {'success': False, 'error': f'Dossier pays non trouvé: {country_code}'})
                return
            
            # Liste des langues à traiter (priorité: languages > allLanguages > défaut fr)
            if specific_languages and isinstance(specific_languages, list):
                languages = [lang.lower() for lang in specific_languages]
                print(f"[DELETE] Langues spécifiques: {languages}")
            elif all_languages:
                languages = ['fr', 'en', 'es', 'it', 'pt', 'ar']
            else:
                languages = ['fr']
            deleted_from = []
            errors = []
            
            for lang in languages:
                # Chercher le fichier pour cette langue
                patterns = [
                    f"{country_code}.itins.modules-{lang}.json",
                    f"{country_code.lower()}.itins.modules-{lang}.json",
                    f"{country_code.upper()}.itins.modules-{lang}.json",
                ]
                
                file_path = None
                for existing_file in os.listdir(country_folder):
                    for pattern in patterns:
                        if existing_file.lower() == pattern.lower():
                            file_path = os.path.join(country_folder, existing_file)
                            break
                    if file_path:
                        break
                
                if not file_path or not os.path.exists(file_path):
                    continue  # Fichier de cette langue n'existe pas, passer au suivant
                
                try:
                    # Backup avant modification
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    backup_path = f"{file_path}.backup_{timestamp}"
                    shutil.copy2(file_path, backup_path)
                    
                    # Lire le fichier
                    with open(file_path, 'r', encoding='utf-8') as f:
                        existing_data = json.load(f)
                    
                    # Trouver et supprimer l'itinéraire
                    deleted = False
                    
                    if isinstance(existing_data, dict) and 'itineraries' in existing_data:
                        itins = existing_data['itineraries']
                        for i, itin in enumerate(itins):
                            existing_id = itin.get('id') or itin.get('itin_id')
                            if existing_id == itin_id:
                                itins.pop(i)
                                deleted = True
                                break
                                
                    elif isinstance(existing_data, list):
                        for i, itin in enumerate(existing_data):
                            existing_id = itin.get('id') or itin.get('itin_id')
                            if existing_id == itin_id:
                                existing_data.pop(i)
                                deleted = True
                                break
                    
                    if deleted:
                        # Écrire le fichier mis à jour
                        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
                            json.dump(existing_data, f, ensure_ascii=False, indent=2)
                        deleted_from.append(lang.upper())
                        print(f"[DELETE] ✅ Supprimé de {file_path}")
                    
                except Exception as e:
                    errors.append(f"{lang}: {str(e)}")
                    print(f"[DELETE ERROR] {lang}: {e}")
            
            if deleted_from:
                response = {
                    'success': True,
                    'message': f"Itinéraire '{itin_id}' supprimé",
                    'deletedFrom': ', '.join(deleted_from),
                    'languages': deleted_from
                }
                if errors:
                    response['warnings'] = errors
                print(f"[DELETE] ✅ Supprimé de: {', '.join(deleted_from)}")
                self.send_json_response(200, response)
            else:
                self.send_json_response(404, {
                    'success': False, 
                    'error': f"Itinéraire '{itin_id}' non trouvé dans aucun fichier",
                    'errors': errors if errors else None
                })
            
        except json.JSONDecodeError as e:
            self.send_json_response(400, {'success': False, 'error': f'Invalid JSON: {str(e)}'})
        except Exception as e:
            print(f"[DELETE ERROR] {e}")
            self.send_json_response(500, {'success': False, 'error': str(e)})
    
    def send_json_response(self, status, data):
        """Envoyer une réponse JSON."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        # Note: Access-Control-Allow-Origin ajouté automatiquement par end_headers()
        self.end_headers()
        response_body = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_body.encode('utf-8'))
    
    def find_case_insensitive_path(self, requested_path, country_code):
        """
        Cherche un fichier existant avec insensibilité à la casse.
        Gère les variations: BB, bb, Bb pour dossier et fichier.
        Supporte les suffixes de langue: -fr.json, -en.json, etc.
        """
        import glob
        
        # Extraire le répertoire de base et le pattern du fichier
        base_dir = "data/Roadtripsprefabriques/countries"
        
        if not os.path.exists(base_dir):
            return None
        
        # Chercher le dossier du pays (insensible à la casse)
        country_folders = glob.glob(os.path.join(base_dir, '*'))
        country_folder = None
        for folder in country_folders:
            if os.path.basename(folder).upper() == country_code.upper():
                country_folder = folder
                break
        
        if not country_folder:
            return None
        
        # Extraire le nom du fichier demandé
        requested_filename = os.path.basename(requested_path)
        
        # Détecter le suffixe de langue (-fr, -en, etc.)
        lang_match = re.search(r'-([a-z]{2})\.json$', requested_filename, re.IGNORECASE)
        lang_suffix = ""
        if lang_match:
            lang_suffix = f"-{lang_match.group(1).lower()}"
        
        # Construire les patterns de recherche
        if lang_suffix:
            # Avec suffixe de langue
            patterns = [
                f"{country_code}.itins.modules{lang_suffix}.json",
                f"{country_code.lower()}.itins.modules{lang_suffix}.json",
                f"{country_code.upper()}.itins.modules{lang_suffix}.json",
            ]
        else:
            # Sans suffixe de langue (ancien format)
            patterns = [
                f"{country_code}.itins.modules.json",
                f"{country_code.lower()}.itins.modules.json",
                f"{country_code.upper()}.itins.modules.json",
                f"{country_code}_itins_modules.json",
                f"{country_code.lower()}_itins_modules.json",
                f"{country_code.upper()}_itins_modules.json",
            ]
        
        # Chercher dans le dossier
        existing_files = os.listdir(country_folder)
        for existing_file in existing_files:
            existing_lower = existing_file.lower()
            for pattern in patterns:
                if existing_lower == pattern.lower():
                    return os.path.join(country_folder, existing_file)
        
        # Pas trouvé - retourner None pour créer un nouveau fichier
        return None
    
    def end_headers(self):
        """Ajouter les headers CORS."""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


def run_server():
    """Lancer le serveur."""
    with socketserver.TCPServer(("", PORT), ORTRequestHandler) as httpd:
        print(f"""
╔═══════════════════════════════════════════════════════════════╗
║                  OneRoadTrip Dev Server                       ║
╠═══════════════════════════════════════════════════════════════╣
║  🌐 http://127.0.0.1:{PORT:<5}                                   ║
║  📂 Serving: {os.getcwd()[:45]:<45} ║
║  🔴 POST /api/save-itinerary - Écrire source                  ║
║  🗑️  POST /api/delete-itinerary - Supprimer RT                 ║
╠═══════════════════════════════════════════════════════════════╣
║  Ctrl+C pour arrêter                                          ║
╚═══════════════════════════════════════════════════════════════╝
""")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[SERVER] Arrêt...")
            httpd.shutdown()


if __name__ == '__main__':
    run_server()
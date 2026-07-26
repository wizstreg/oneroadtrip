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

# Module photos (doit être dans le même dossier)
try:
    from ort_photos_api import (
        handle_search, handle_select, handle_get_places,
        handle_mark_done, handle_get_done, handle_get_new_places,
        handle_delete_photo, handle_list_r2_photos,
        handle_viewer_seen_add, handle_viewer_seen_get, handle_viewer_seen_reset,
        handle_couples_list, handle_couples_get, handle_couples_save, handle_couples_refresh,
        handle_couples_by_place,
        handle_couples_remove_photo, handle_couples_clear_pool,
        handle_couples_precache_start, handle_couples_precache_progress, handle_couples_precache_stop,
        handle_itins_list, handle_itin_places
    )
    PHOTOS_API_AVAILABLE = True
    print("[PHOTOS] Module photos chargé ✅")
except ImportError as e:
    PHOTOS_API_AVAILABLE = False
    print(f"[PHOTOS] Module photos non disponible: {e}")

# Module Google Places (optionnel)
try:
    from ort_google_places import (
        handle_gplaces_start, handle_gplaces_progress, handle_gplaces_stop,
        handle_gplaces_pending, handle_gplaces_pending_photos,
        handle_gplaces_validate, handle_gplaces_upload_r2,
        handle_pending_file,
        handle_gplaces_search_merged, handle_gplaces_mark_revisit,
        handle_gplaces_list_revisit, handle_gplaces_unmark_revisit,
        handle_gplaces_cleanup_pending, handle_gplaces_fetch_keyword,
    )
    GPLACES_API_AVAILABLE = True
    print("[GPLACES] Module Google Places chargé ✅")
except ImportError as e:
    GPLACES_API_AVAILABLE = False
    print(f"[GPLACES] Module Google Places non disponible: {e}")

# Module Wiki cache (optionnel)
try:
    from ort_wiki_cache_api import (
        handle_wcache_start, handle_wcache_stop, handle_wcache_progress,
    )
    WCACHE_API_AVAILABLE = True
    print("[WCACHE] Module Wiki cache chargé ✅")
except ImportError as e:
    WCACHE_API_AVAILABLE = False
    print(f"[WCACHE] Module Wiki cache non disponible: {e}")

# Module Hôtels (sélection manuelle + photo vitrine)
try:
    from ort_hotels_api import (
        handle_hotels_places, handle_hotels_fetch_gallery,
        handle_hotels_set_cover, handle_hotels_remove_hotel,
        handle_hotels_remove_photo, handle_hotels_set_slot,
        handle_hotels_set_photos, handle_hotels_set_elite,
        handle_hotels_set_super_elite,
        handle_hotels_itins,
        handle_hotels_search_place,
        handle_hotels_propose, handle_hotels_apply,
        handle_hotels_add_from_booking, handle_hotels_add_prepared,
        handle_hotels_resolve_booking, handle_hotels_set_hotel_meta,
        handle_hotels_set_place_flag, handle_hotels_verify_broken,
        handle_hotels_picks_for_booking,
        handle_hotels_fix_broken,
        handle_hotels_remove_hotel_everywhere,
        handle_hotels_mark_done,
        handle_hotels_get_done, handle_hotels_diag,
        handle_hotels_scrape_hotel, handle_hotels_scrape_country,
        handle_hotels_scrape_status, handle_hotels_scrape_stop,
        handle_hotels_img_proxy,
        handle_hotels_clean_broken,
        handle_hotels_clean_status,
        handle_hotels_clear_cache,
    )
    HOTELS_API_AVAILABLE = True
    print("[HOTELS] Module hôtels chargé ✅")
except ImportError as e:
    HOTELS_API_AVAILABLE = False
    print(f"[HOTELS] Module hôtels non disponible: {e}")

try:
    import ort_viator_api
    VIATOR_API_AVAILABLE = True
    print("[VIATOR] Module Viator chargé ✅")
except ImportError as e:
    VIATOR_API_AVAILABLE = False
    print(f"[VIATOR] Module Viator non disponible: {e}")

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
        elif parsed.path == '/api/save-help':
            self.handle_save_help()
        elif parsed.path == '/api/save-validations':
            self.handle_save_validations()
        elif parsed.path == '/api/delete-itinerary':
            self.handle_delete_itinerary()
        elif parsed.path.startswith('/api/photos/') and PHOTOS_API_AVAILABLE:
            self.handle_photos_post(parsed.path)
        elif parsed.path.startswith('/api/gplaces/') and GPLACES_API_AVAILABLE:
            self.handle_gplaces_post(parsed.path)
        elif parsed.path.startswith('/api/wcache/') and WCACHE_API_AVAILABLE:
            self.handle_wcache_post(parsed.path)
        elif parsed.path.startswith('/api/hotels/') and HOTELS_API_AVAILABLE:
            self.handle_hotels_post(parsed.path)
        elif parsed.path.startswith('/api/viator/') and VIATOR_API_AVAILABLE:
            self.handle_viator_post(parsed.path)
        else:
            self.send_error(404, f"Endpoint not found: {parsed.path}")
    
    def do_GET(self):
        """Gérer les requêtes GET (fichiers statiques + API photos)."""
        parsed = urlparse(self.path)
        
        if parsed.path.startswith('/api/photos/') and PHOTOS_API_AVAILABLE:
            self.handle_photos_get(parsed.path, parse_qs(parsed.query))
        elif parsed.path.startswith('/api/gplaces/') and GPLACES_API_AVAILABLE:
            self.handle_gplaces_get(parsed.path, parse_qs(parsed.query))
        elif parsed.path.startswith('/api/wcache/') and WCACHE_API_AVAILABLE:
            self.handle_wcache_get(parsed.path)
        elif parsed.path.startswith('/api/hotels/') and HOTELS_API_AVAILABLE:
            self.handle_hotels_get(parsed.path, parse_qs(parsed.query))
        elif parsed.path.startswith('/api/viator/') and VIATOR_API_AVAILABLE:
            self.handle_viator_get(parsed.path, parse_qs(parsed.query))
        elif parsed.path.startswith('/pending-files/') and GPLACES_API_AVAILABLE:
            self.handle_pending_file_get(parsed.path)
        else:
            # Servir les fichiers statiques normalement
            super().do_GET()
    
    def handle_viator_get(self, path, qs):
        """Router les GET /api/viator/*."""
        try:
            country = (qs.get('country', [''])[0] or '')
            if path == '/api/viator/status':
                self.send_json_response(200, ort_viator_api.status(country))
            elif path == '/api/viator/cache':
                self.send_json_response(200, ort_viator_api.get_cache(country))
            elif path == '/api/viator/countries':
                self.send_json_response(200, {'success': True, 'countries': ort_viator_api._list_countries()})
            elif path == '/api/viator/progress':
                self.send_json_response(200, ort_viator_api.progress())
            else:
                self.send_error(404, f"Viator endpoint not found: {path}")
        except Exception as e:
            self.send_json_response(500, {'success': False, 'error': str(e)})

    def handle_viator_post(self, path):
        """Router les POST /api/viator/*."""
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length) if length else b'{}'
            body = json.loads(raw.decode('utf-8') or '{}')
            if path == '/api/viator/save':
                self.send_json_response(200, ort_viator_api.save_valid(body))
            elif path == '/api/viator/build':
                self.send_json_response(200, ort_viator_api.build(body))
            else:
                self.send_error(404, f"Viator endpoint not found: {path}")
        except Exception as e:
            self.send_json_response(500, {'success': False, 'error': str(e)})

    def handle_photos_post(self, path):
        """Router les POST /api/photos/*."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8')) if body else {}
            
            if path == '/api/photos/search':
                status, result = handle_search(data)
            elif path == '/api/photos/select':
                status, result = handle_select(data)
            elif path == '/api/photos/mark-done':
                status, result = handle_mark_done(data)
            elif path == '/api/photos/delete':
                status, result = handle_delete_photo(data)
            elif path == '/api/photos/viewer-seen':
                status, result = handle_viewer_seen_add(data)
            elif path == '/api/photos/viewer-reset':
                status, result = handle_viewer_seen_reset()
            elif path == '/api/photos/couples/save':
                status, result = handle_couples_save(data)
            elif path == '/api/photos/couples/refresh':
                status, result = handle_couples_refresh(data)
            elif path == '/api/photos/couples/remove-photo':
                status, result = handle_couples_remove_photo(data)
            elif path == '/api/photos/couples/clear-pool':
                status, result = handle_couples_clear_pool(data)
            elif path == '/api/photos/couples/precache/start':
                status, result = handle_couples_precache_start(data)
            elif path == '/api/photos/couples/precache/stop':
                status, result = handle_couples_precache_stop(data)
            else:
                status, result = 404, {"error": f"Unknown: {path}"}
            
            self.send_json_response(status, result)
        except Exception as e:
            print(f"[PHOTOS ERROR] {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})
    
    def handle_photos_get(self, path, query_params):
        """Router les GET /api/photos/*."""
        try:
            if path == '/api/photos/places':
                status, result = handle_get_places(query_params)
            elif path == '/api/photos/done':
                status, result = handle_get_done()
            elif path == '/api/photos/new-places':
                status, result = handle_get_new_places(query_params)
            elif path == '/api/photos/r2-list':
                status, result = handle_list_r2_photos(query_params)
            elif path == '/api/photos/viewer-seen':
                status, result = handle_viewer_seen_get()
            elif path == '/api/photos/couples/list':
                status, result = handle_couples_list(query_params)
            elif path == '/api/photos/couples/get':
                status, result = handle_couples_get(query_params)
            elif path == '/api/photos/couples/by-place':
                status, result = handle_couples_by_place(query_params)
            elif path == '/api/photos/couples/precache/progress':
                status, result = handle_couples_precache_progress()
            elif path == '/api/photos/itins/list':
                status, result = handle_itins_list(query_params)
            elif path == '/api/photos/itins/places':
                status, result = handle_itin_places(query_params)
            else:
                status, result = 404, {"error": f"Unknown: {path}"}
            
            self.send_json_response(status, result)
        except Exception as e:
            print(f"[PHOTOS ERROR] {e}")
            self.send_json_response(500, {"error": str(e)})

    def handle_hotels_post(self, path):
        """Router les POST /api/hotels/*."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8')) if body else {}

            if path == '/api/hotels/fetch-gallery':
                status, result = handle_hotels_fetch_gallery(data)
            elif path == '/api/hotels/set-cover':
                status, result = handle_hotels_set_cover(data)
            elif path == '/api/hotels/set-slot':
                status, result = handle_hotels_set_slot(data)
            elif path == '/api/hotels/set-photos':
                status, result = handle_hotels_set_photos(data)
            elif path == '/api/hotels/set-elite':
                status, result = handle_hotels_set_elite(data)
            elif path == '/api/hotels/set-super-elite':
                status, result = handle_hotels_set_super_elite(data)
            elif path == '/api/hotels/remove-hotel':
                status, result = handle_hotels_remove_hotel(data)
            elif path == '/api/hotels/remove-photo':
                status, result = handle_hotels_remove_photo(data)
            elif path == '/api/hotels/scrape-hotel':
                status, result = handle_hotels_scrape_hotel(data)
            elif path == '/api/hotels/scrape-country':
                status, result = handle_hotels_scrape_country(data)
            elif path == '/api/hotels/search-place':
                status, result = handle_hotels_search_place(data)
            elif path == '/api/hotels/propose':
                status, result = handle_hotels_propose(data)
            elif path == '/api/hotels/apply':
                status, result = handle_hotels_apply(data)
            elif path == '/api/hotels/scrape-stop':
                status, result = handle_hotels_scrape_stop()
            elif path == '/api/hotels/clean-broken':
                status, result = handle_hotels_clean_broken(data)
            elif path == '/api/hotels/clear-cache':
                status, result = handle_hotels_clear_cache()
            elif path == '/api/hotels/add-from-booking':
                status, result = handle_hotels_add_from_booking(data)
            elif path == '/api/hotels/add-prepared':
                status, result = handle_hotels_add_prepared(data)
            elif path == '/api/hotels/resolve-booking':
                status, result = handle_hotels_resolve_booking(data)
            elif path == '/api/hotels/set-hotel-meta':
                status, result = handle_hotels_set_hotel_meta(data)
            elif path == '/api/hotels/set-place-flag':
                status, result = handle_hotels_set_place_flag(data)
            elif path == '/api/hotels/verify-broken':
                status, result = handle_hotels_verify_broken(data)
            elif path == '/api/hotels/picks-for-booking':
                status, result = handle_hotels_picks_for_booking(data)
            elif path == '/api/hotels/fix-broken':
                status, result = handle_hotels_fix_broken(data)
            elif path == '/api/hotels/remove-hotel-everywhere':
                status, result = handle_hotels_remove_hotel_everywhere(data)
            elif path == '/api/hotels/mark-done':
                status, result = handle_hotels_mark_done(data)
            else:
                status, result = 404, {"error": f"Unknown: {path}"}

            self.send_json_response(status, result)
        except Exception as e:
            print(f"[HOTELS ERROR] {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})

    def handle_hotels_get(self, path, query_params):
        """Router les GET /api/hotels/*."""
        # Relais d'image (réponse binaire, pas JSON).
        if path == '/api/hotels/img-proxy':
            try:
                status, data, ctype = handle_hotels_img_proxy(query_params)
                if status == 200 and data:
                    self.send_response(200)
                    self.send_header('Content-Type', ctype or 'image/jpeg')
                    self.send_header('Content-Length', str(len(data)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'public, max-age=86400')
                    self.end_headers()
                    self.wfile.write(data)
                else:
                    self.send_error(status or 404)
            except Exception as e:
                print(f"[IMG PROXY ERROR] {e}")
                self.send_error(500, str(e))
            return
        try:
            if path == '/api/hotels/places':
                status, result = handle_hotels_places(query_params)
            elif path == '/api/hotels/diag':
                status, result = handle_hotels_diag(query_params)
            elif path == '/api/hotels/scrape-status':
                status, result = handle_hotels_scrape_status()
            elif path == '/api/hotels/clean-status':
                status, result = handle_hotels_clean_status()
            elif path == '/api/hotels/done':
                status, result = handle_hotels_get_done()
            elif path == '/api/hotels/itins':
                status, result = handle_hotels_itins(query_params)
            else:
                status, result = 404, {"error": f"Unknown: {path}"}

            self.send_json_response(status, result)
        except Exception as e:
            print(f"[HOTELS ERROR] {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})

    def handle_gplaces_post(self, path):
        """Router les POST /api/gplaces/*."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8')) if body else {}

            if path == '/api/gplaces/start':
                status, result = handle_gplaces_start(data)
            elif path == '/api/gplaces/stop':
                status, result = handle_gplaces_stop()
            elif path == '/api/gplaces/validate':
                status, result = handle_gplaces_validate(data)
            elif path == '/api/gplaces/upload-r2':
                status, result = handle_gplaces_upload_r2(data)
            elif path == '/api/gplaces/search-merged':
                status, result = handle_gplaces_search_merged(data)
            elif path == '/api/gplaces/mark-revisit':
                status, result = handle_gplaces_mark_revisit(data)
            elif path == '/api/gplaces/unmark-revisit':
                status, result = handle_gplaces_unmark_revisit(data)
            elif path == '/api/gplaces/cleanup-pending':
                status, result = handle_gplaces_cleanup_pending(data)
            elif path == '/api/gplaces/fetch-keyword':
                status, result = handle_gplaces_fetch_keyword(data)
            else:
                status, result = 404, {"error": f"Unknown: {path}"}

            self.send_json_response(status, result)
        except Exception as e:
            print(f"[GPLACES ERROR] {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})

    def handle_gplaces_get(self, path, query_params):
        """Router les GET /api/gplaces/*."""
        try:
            if path == '/api/gplaces/progress':
                status, result = handle_gplaces_progress()
            elif path == '/api/gplaces/pending':
                status, result = handle_gplaces_pending(query_params)
            elif path == '/api/gplaces/pending-photos':
                status, result = handle_gplaces_pending_photos(query_params)
            elif path == '/api/gplaces/revisit':
                status, result = handle_gplaces_list_revisit()
            else:
                status, result = 404, {"error": f"Unknown: {path}"}

            self.send_json_response(status, result)
        except Exception as e:
            print(f"[GPLACES ERROR] {e}")
            self.send_json_response(500, {"error": str(e)})

    def handle_pending_file_get(self, path):
        """Servir un fichier local depuis data/photos-pending/ pour la visionneuse."""
        try:
            status, data, ctype = handle_pending_file(path)
            if status == 200 and data:
                self.send_response(200)
                self.send_header('Content-Type', ctype or 'image/jpeg')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_error(status or 404)
        except Exception as e:
            print(f"[PENDING FILE ERROR] {e}")
            self.send_error(500, str(e))

    def handle_wcache_post(self, path):
        """Router POST /api/wcache/*."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8')) if body else {}

            if path == '/api/wcache/start':
                status, result = handle_wcache_start(data)
            elif path == '/api/wcache/stop':
                status, result = handle_wcache_stop()
            else:
                status, result = 404, {"error": f"Unknown: {path}"}

            self.send_json_response(status, result)
        except Exception as e:
            print(f"[WCACHE ERROR] {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})

    def handle_wcache_get(self, path):
        """Router GET /api/wcache/*."""
        try:
            if path == '/api/wcache/progress':
                status, result = handle_wcache_progress()
            else:
                status, result = 404, {"error": f"Unknown: {path}"}
            self.send_json_response(status, result)
        except Exception as e:
            print(f"[WCACHE ERROR] {e}")
            self.send_json_response(500, {"error": str(e)})
    
    def handle_save_help(self):
        """Sauvegarder un article d'aide dans data/help/<slug>.json."""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            article = json.loads(body.decode('utf-8'))
            slug = article.get('slug', '').strip()
            if not slug:
                self.send_json_response(400, {'success': False, 'error': 'Missing slug'})
                return
            safe = ''.join(c for c in slug if c.isalnum() or c in '-_')
            os.makedirs('data/help', exist_ok=True)
            path = f"data/help/{safe}.json"
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(article, f, ensure_ascii=False, indent=2)
            print(f"[HELP] Article sauvegarde: {path}")
            self.send_json_response(200, {'success': True, 'path': path})
        except Exception as e:
            self.send_json_response(500, {'success': False, 'error': str(e)})

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
            
            # Garde-fou : retirer 'country' du corps de l'itinéraire si client buggé l'a injecté
            # (le pays est porté au niveau racine du fichier, pas dans chaque itin)
            if isinstance(itinerary, dict):
                itinerary.pop('country', None)
            
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
    
    def handle_save_validations(self):
        """Écrire le fichier data/Roadtripsprefabriques/validations.json.

        Body attendu : { "validations": { "<itin_id>": { "validated_at": "...", "by": "..." }, ... } }
        Le chemin de destination est fixe (sécurité : pas de chemin libre depuis le client).
        """
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            validations = data.get('validations')
            if not isinstance(validations, dict):
                self.send_json_response(400, {'success': False, 'error': 'Missing or invalid "validations" object'})
                return

            file_path = 'data/Roadtripsprefabriques/validations.json'

            # Créer le dossier si besoin
            dir_path = os.path.dirname(file_path)
            if dir_path and not os.path.exists(dir_path):
                os.makedirs(dir_path)

            # Backup si le fichier existe
            backup_path = None
            if os.path.exists(file_path):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = f"{file_path}.backup_{timestamp}"
                shutil.copy2(file_path, backup_path)
                print(f"[BACKUP] {file_path} -> {backup_path}")

            final_data = {
                "updated_at": datetime.now().isoformat(timespec='seconds'),
                "validations": validations
            }

            with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
                json.dump(final_data, f, ensure_ascii=False, indent=2)

            count = len(validations)
            print(f"[SAVE] ✅ {file_path} ({count} validation(s))")

            self.send_json_response(200, {
                'success': True,
                'path': file_path,
                'backup': backup_path,
                'count': count
            })

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
        response_body = json.dumps(data, ensure_ascii=False)
        # Nettoyer les surrogates unicode qui font crasher encode()
        response_body = response_body.encode('utf-8', errors='replace').decode('utf-8')
        body_bytes = response_body.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body_bytes)))
        # Note: Access-Control-Allow-Origin ajouté automatiquement par end_headers()
        self.end_headers()
        self.wfile.write(body_bytes)
        try:
            self.wfile.flush()
        except Exception:
            pass
    
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
    # ThreadingTCPServer : traite plusieurs requêtes en parallèle
    # (sinon le précache Wiki bloque tout le reste)
    class _Srv(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True
    with _Srv(("", PORT), ORTRequestHandler) as httpd:
        print(f"""
╔═══════════════════════════════════════════════════════════════╗
║                  OneRoadTrip Dev Server                       ║
╠═══════════════════════════════════════════════════════════════╣
║  🌐 http://127.0.0.1:{PORT:<5}                                   ║
║  📂 Serving: {os.getcwd()[:45]:<45} ║
║  🔴 POST /api/save-itinerary - Écrire source                  ║
║  ✅ POST /api/save-validations - Écrire validations.json      ║
║  🗑️  POST /api/delete-itinerary - Supprimer RT                 ║
║  📸 POST /api/photos/search - Chercher candidates              ║
║  📸 POST /api/photos/select - Uploader sur R2                  ║
║  📸 GET  /api/photos/places - Lister lieux + statut            ║
║  🏨 GET  /api/hotels/places - Hôtels par pays + statut         ║
║  🏨 POST /api/hotels/set-cover - Photo vitrine d'un hôtel      ║
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
"""
Import Dubai A La Carte fleet from PDF-derived metadata + Google Drive folders.
Downloads photos into server/uploads/fleet and writes fleetFromPdf.json for the seeder.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # car-rental/
SERVER = ROOT / "server"
UPLOAD_DIR = SERVER / "uploads" / "fleet"
OUT_JSON = Path(__file__).resolve().parent / "fleetFromPdf.json"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"

# Order matches PDF "Voir les photos" links per page (skipping missing #13).
CARS = [
    # Collection Essentielle
    {"pdfId": 1, "name": "Nissan Sunny - Blanc", "brand": "Nissan", "model": "Sunny", "year": 2023, "type": "essential", "price": 180, "color": "Blanc", "seats": 5, "doors": 4, "folder": "106ZZTwXWs0BWZdXv23Wvsv_4jgQrPJKE"},
    {"pdfId": 2, "name": "Nissan Kicks", "brand": "Nissan", "model": "Kicks", "year": 2023, "type": "essential", "price": 240, "color": None, "seats": 5, "doors": 5, "folder": "1khneT5blbE2SgeyM5eUYm13EilFDidPg"},
    {"pdfId": 3, "name": "Suzuki Swift", "brand": "Suzuki", "model": "Swift", "year": 2023, "type": "essential", "price": 250, "color": None, "seats": 5, "doors": 5, "folder": "1DqBTI1ep1pGmjrFj1KLOR7izuEJSZ9_F"},
    {"pdfId": 4, "name": "Kia Picanto", "brand": "Kia", "model": "Picanto", "year": 2023, "type": "essential", "price": 250, "color": None, "seats": 5, "doors": 5, "folder": "1IfegTE0G4Cqz26NhfXddpMrytRzo8763"},
    {"pdfId": 5, "name": "JAC J7", "brand": "JAC", "model": "J7", "year": 2023, "type": "essential", "price": 250, "color": None, "seats": 5, "doors": 4, "folder": "1OM9CjQVUKtv0ylKvfJf97vtflUKbqZH-"},
    {"pdfId": 6, "name": "Chevrolet Groove", "brand": "Chevrolet", "model": "Groove", "year": 2023, "type": "essential", "price": 250, "color": None, "seats": 5, "doors": 5, "folder": "1Mmhy66Jn7bsrHudPQbbduBdtGqOt3oCJ"},
    {"pdfId": 7, "name": "MG3 - Gris", "brand": "MG", "model": "MG3", "year": 2023, "type": "essential", "price": 250, "color": "Gris", "seats": 5, "doors": 5, "folder": "1i6lNTa-ZVIxIvgLiS-PMOxZSActll4k7"},
    {"pdfId": 8, "name": "Geely Coolray - Gris", "brand": "Geely", "model": "Coolray", "year": 2023, "type": "essential", "price": 260, "color": "Gris", "seats": 5, "doors": 5, "folder": "1S2C3QR0qAT9K8VBFECpvVWmZ4x1oQv53"},
    {"pdfId": 9, "name": "Renault Megane - Bleu", "brand": "Renault", "model": "Megane", "year": 2023, "type": "essential", "price": 365, "color": "Bleu", "seats": 5, "doors": 5, "folder": "1TjtLrnJlUFWiKY_NXQJrPk1Ya0qYdnXf"},
    {"pdfId": 10, "name": "Jetour X70 - 7 places", "brand": "Jetour", "model": "X70", "year": 2023, "type": "essential", "price": 365, "color": None, "seats": 7, "doors": 5, "folder": "1wwBY3ZmBUuuRkCVsazSPEcazE5Y398mW"},
    {"pdfId": 11, "name": "Audi A3 S-Line Berline - 2025", "brand": "Audi", "model": "A3 S-Line", "year": 2025, "type": "essential", "price": 375, "color": None, "seats": 5, "doors": 4, "folder": "1OevOAjeOmYFJvoSclD4N9ZGs4oZVq68a"},
    {"pdfId": 12, "name": "Peugeot 3008 Allure & GT", "brand": "Peugeot", "model": "3008", "year": 2023, "type": "essential", "price": 375, "color": None, "seats": 5, "doors": 5, "folder": "1QI6JQYxgJCRJ1ycHtePIi_6Z-UGND8O-"},
    {"pdfId": 14, "name": "MG ZS - Noir", "brand": "MG", "model": "ZS", "year": 2023, "type": "essential", "price": 380, "color": "Noir", "seats": 5, "doors": 5, "folder": "17OGeMxHKkdUS-_Z_-i2GRJnAISYScV5I"},
    # Collection Premium - Partie 1
    {"pdfId": 15, "name": "Audi A1", "brand": "Audi", "model": "A1", "year": 2023, "type": "premium", "price": 415, "color": None, "seats": 5, "doors": 5, "folder": "1MtbV-p_HW_gkm5QdidOX9oKzIQM5oH7C"},
    {"pdfId": 16, "name": "Mercedes-Benz Classe A - Gris", "brand": "Mercedes-Benz", "model": "Classe A", "year": 2023, "type": "premium", "price": 415, "color": "Gris", "seats": 5, "doors": 5, "folder": "1zxTevZHw8-IutRVt3tp4eVGZ-fRaXDfV"},
    {"pdfId": 17, "name": "Volkswagen T-Roc R-Line", "brand": "Volkswagen", "model": "T-Roc R-Line", "year": 2023, "type": "premium", "price": 450, "color": None, "seats": 5, "doors": 5, "folder": "1-re9ZAwUtKw7Awu2sFGZSkksvUafppcJ"},
    {"pdfId": 18, "name": "Volkswagen Golf 8 R-Line - 2025", "brand": "Volkswagen", "model": "Golf 8 R-Line", "year": 2025, "type": "premium", "price": 465, "color": None, "seats": 5, "doors": 5, "folder": "1RKlMB52NBTQpQ6HlKL6GJonp3HknZaTE"},
    {"pdfId": 19, "name": "Audi A3 Sportback S-Line - 2025", "brand": "Audi", "model": "A3 Sportback S-Line", "year": 2025, "type": "premium", "price": 465, "color": None, "seats": 5, "doors": 5, "folder": "1kGlRJFxqNfIh5XZyZu6yOr2LYrGncSvD"},
    {"pdfId": 20, "name": "Fiat 500 Abarth", "brand": "Fiat", "model": "500 Abarth", "year": 2023, "type": "premium", "price": 495, "color": None, "seats": 4, "doors": 3, "folder": "16GQzu_g7mWSZBzA6Dh3BRUnuXF0KiGFe"},
    {"pdfId": 21, "name": "BMW X3", "brand": "BMW", "model": "X3", "year": 2023, "type": "premium", "price": 515, "color": None, "seats": 5, "doors": 5, "folder": "1sG7Z9DNI2Tl4dlTE_mPKz-mIcRtxZSs1"},
    {"pdfId": 22, "name": "Audi Q3 S-Line - 2025", "brand": "Audi", "model": "Q3 S-Line", "year": 2025, "type": "premium", "price": 515, "color": None, "seats": 5, "doors": 5, "folder": "152uKMYy0kLlJX1WE20qMY4-opKX_7Eth"},
    {"pdfId": 23, "name": "Mercedes-Benz Classe A - Noir - 2025", "brand": "Mercedes-Benz", "model": "Classe A", "year": 2025, "type": "premium", "price": 515, "color": "Noir", "seats": 5, "doors": 5, "folder": "1ZNrCOLpVnl-WS3R-8qNTjrF9dPaVYYeJ"},
    {"pdfId": 24, "name": "Volkswagen Tiguan R-Line - 2025", "brand": "Volkswagen", "model": "Tiguan R-Line", "year": 2025, "type": "premium", "price": 550, "color": None, "seats": 5, "doors": 5, "folder": "176b9e89iOWRc_MedFAc3zwmgsqhPjruQ"},
    {"pdfId": 25, "name": "BMW X1", "brand": "BMW", "model": "X1", "year": 2023, "type": "premium", "price": 615, "color": None, "seats": 5, "doors": 5, "folder": "1Z1a5lGAgPnqD7sYRf7Xn0JMxlWq-JFv2"},
    {"pdfId": 26, "name": "Mercedes-Benz GLC 300 - Blanc", "brand": "Mercedes-Benz", "model": "GLC 300", "year": 2023, "type": "premium", "price": 650, "color": "Blanc", "seats": 5, "doors": 5, "folder": "1GM2Cl6EjGHuxg767X_rEgs1_scNBt6oj"},
    # Collection Premium - Partie 2
    {"pdfId": 27, "name": "Mercedes-AMG GLA 35", "brand": "Mercedes-AMG", "model": "GLA 35", "year": 2023, "type": "premium", "price": 675, "color": None, "seats": 5, "doors": 5, "folder": "1vXlMxz68FfrdbFiqhXqabJkG9SvnP0sJ"},
    {"pdfId": 28, "name": "Jetour T2 - 2025", "brand": "Jetour", "model": "T2", "year": 2025, "type": "premium", "price": 750, "color": None, "seats": 5, "doors": 5, "folder": "1wiXt8i5ywpL4WTCylH2GqawxCHRMa70W"},
    {"pdfId": 29, "name": "Audi Q5 Sportback - Noir - 2022", "brand": "Audi", "model": "Q5 Sportback", "year": 2022, "type": "premium", "price": 750, "color": "Noir", "seats": 5, "doors": 5, "folder": "1BT42h9_Xx32J0Mvpjoo1-oKAUCBoRnft"},
    {"pdfId": 30, "name": "Audi S3 - Noir", "brand": "Audi", "model": "S3", "year": 2023, "type": "premium", "price": 750, "color": "Noir", "seats": 5, "doors": 4, "folder": "1Vu4RQn7N0fmkeaVWHMbAplwZcuvDWamM"},
    {"pdfId": 31, "name": "Audi S3 - Gris", "brand": "Audi", "model": "S3", "year": 2023, "type": "premium", "price": 815, "color": "Gris", "seats": 5, "doors": 4, "folder": "1n-qB58OfcVc4DtsRf__ceOMArhNkIv7b"},
    {"pdfId": 32, "name": "Audi RSQ3 - Bleu", "brand": "Audi", "model": "RSQ3", "year": 2023, "type": "premium", "price": 815, "color": "Bleu", "seats": 5, "doors": 5, "folder": "1MTuSjDGwdmPmI1fpkI1YO2zwAei8BFA0"},
    {"pdfId": 33, "name": "BMW X2 35i M", "brand": "BMW", "model": "X2 35i M", "year": 2023, "type": "premium", "price": 850, "color": None, "seats": 5, "doors": 5, "folder": "1fTEg_Fs3J_WuWNGFYoOkWXpxTgW4a6sr"},
    {"pdfId": 34, "name": "BMW Série 4 Cabriolet", "brand": "BMW", "model": "Série 4 Cabriolet", "year": 2023, "type": "premium", "price": 850, "color": None, "seats": 4, "doors": 2, "folder": "1oekduKempDgvY48EmSQPIcuG1sGK0ge7"},
    {"pdfId": 35, "name": "Audi RSQ3 - Noir et Gris Nardo", "brand": "Audi", "model": "RSQ3", "year": 2023, "type": "premium", "price": 915, "color": "Noir / Gris Nardo", "seats": 5, "doors": 5, "folder": "1FEfOgRSW6fPDXFfDOnZggA0yhnjmLj3I"},
    {"pdfId": 36, "name": "Audi RS4 - Noir Hermes", "brand": "Audi", "model": "RS4", "year": 2023, "type": "premium", "price": 915, "color": "Noir Hermes", "seats": 5, "doors": 5, "folder": "1Xek7rUX2mnuS8oGG_arBfC1gP1a0p-KE"},
    {"pdfId": 37, "name": "Audi RS3 - Entièrement Noir - 2025", "brand": "Audi", "model": "RS3", "year": 2025, "type": "premium", "price": 950, "color": "Noir", "seats": 5, "doors": 5, "folder": "1g8JL1K4qD21duf6lkbdb98Un2MXZDucU"},
    {"pdfId": 38, "name": "Audi RS3 - Gris Nardo", "brand": "Audi", "model": "RS3", "year": 2023, "type": "premium", "price": 950, "color": "Gris Nardo", "seats": 5, "doors": 5, "folder": "1HyBrpem-x888x68SIKDtif2tnoYKZsOT"},
    # Collection Prestige
    {"pdfId": 39, "name": "Porsche Macan - Noir", "brand": "Porsche", "model": "Macan", "year": 2023, "type": "prestige", "price": 990, "color": "Noir", "seats": 5, "doors": 5, "folder": "1y0YjacEXYfArT0qoMyONL4t3HRADvie0"},
    {"pdfId": 40, "name": "Porsche Macan S - Gris Nardo / Intérieur Bleu", "brand": "Porsche", "model": "Macan S", "year": 2023, "type": "prestige", "price": 1190, "color": "Gris Nardo", "seats": 5, "doors": 5, "folder": "1CXFGtfsB-rAbabVmxI1oHa8I6RlECV4G"},
    {"pdfId": 41, "name": "Porsche Macan S - Gris Nardo / Intérieur Noir", "brand": "Porsche", "model": "Macan S", "year": 2023, "type": "prestige", "price": 1190, "color": "Gris Nardo", "seats": 5, "doors": 5, "folder": "1TfNuhVX1JUwC8VjdqmiY-G83Y53qVg8r"},
    {"pdfId": 42, "name": "Porsche Macan GTS - Noir", "brand": "Porsche", "model": "Macan GTS", "year": 2023, "type": "prestige", "price": 1190, "color": "Noir", "seats": 5, "doors": 5, "folder": "1SBOPxWVeEriuT9FzNGUlVB7RrH3E9ge7"},
    {"pdfId": 43, "name": "Porsche Cayenne - Gris Nardo", "brand": "Porsche", "model": "Cayenne", "year": 2023, "type": "prestige", "price": 1190, "color": "Gris Nardo", "seats": 5, "doors": 5, "folder": "1SOcup0Vx_ZOm2cqcXfOIkKs4rlXIx6Nq"},
    {"pdfId": 44, "name": "Range Rover SVR", "brand": "Land Rover", "model": "Range Rover SVR", "year": 2023, "type": "prestige", "price": 1190, "color": None, "seats": 5, "doors": 5, "folder": "1JiqvYPb3WOlsLMIRkYJl9bxS-2AxLFjz"},
    {"pdfId": 45, "name": "Mercedes-AMG C 63", "brand": "Mercedes-AMG", "model": "C 63", "year": 2023, "type": "prestige", "price": 1315, "color": None, "seats": 5, "doors": 4, "folder": "1M7Z2IkWxC19SSEyBmoOBmN4n7kD2mRbS"},
    {"pdfId": 46, "name": "BMW X6M Compétition", "brand": "BMW", "model": "X6M Competition", "year": 2023, "type": "prestige", "price": 1415, "color": None, "seats": 5, "doors": 5, "folder": "1eH84Shq3tX8pbBsTdt3sEA0FEi1N_WTA"},
    {"pdfId": 47, "name": "Audi RSQ8", "brand": "Audi", "model": "RSQ8", "year": 2023, "type": "prestige", "price": 1415, "color": None, "seats": 5, "doors": 5, "folder": "1OaLENw9htwqzI6kzZ7IF-UMGrl4q2CyS"},
    {"pdfId": 48, "name": "Audi RS6 - Noir ou Gris", "brand": "Audi", "model": "RS6", "year": 2023, "type": "prestige", "price": 1515, "color": "Noir / Gris", "seats": 5, "doors": 5, "folder": "1LcFLfF6M4RxcOVhhLyyNdx6knhhDOvd_"},
    {"pdfId": 49, "name": "Audi RSQ8 Performance", "brand": "Audi", "model": "RSQ8 Performance", "year": 2023, "type": "prestige", "price": 1515, "color": None, "seats": 5, "doors": 5, "folder": "1ZF-IDdmVpavxXcvg5E4qT3dcHeLXomNP"},
    {"pdfId": 50, "name": "Mercedes-Benz G 63 - Blanc/Noir/Gris", "brand": "Mercedes-Benz", "model": "G 63", "year": 2023, "type": "prestige", "price": 1650, "color": "Blanc / Noir / Gris", "seats": 5, "doors": 5, "folder": "1FEfOgRSW6fPDXFfDOnZggA0yhnjmLj3I"},
    {"pdfId": 51, "name": "Mercedes-Benz SL 63 AMG", "brand": "Mercedes-Benz", "model": "SL 63 AMG", "year": 2023, "type": "prestige", "price": 1850, "color": None, "seats": 2, "doors": 2, "folder": "1WQfj6KFC9zcdcXhpgfVH8hQbckF0t8ya"},
    {"pdfId": 52, "name": "Mercedes-Benz G 63 AMG - 2025", "brand": "Mercedes-Benz", "model": "G 63 AMG", "year": 2025, "type": "prestige", "price": 1850, "color": None, "seats": 5, "doors": 5, "folder": "1THadro1AZ2rjvxrbWHtWvIeKg9sD9647"},
    {"pdfId": 53, "name": "Mercedes-Benz G 900 Rocket", "brand": "Mercedes-Benz", "model": "G 900 Rocket", "year": 2023, "type": "prestige", "price": 1915, "color": None, "seats": 5, "doors": 5, "folder": "15ZvSJzVx_zlcDdtsXzgAVd6Hh3tSTlCu"},
    {"pdfId": 54, "name": "Mercedes-Benz G 800 Brabus - Noir/Tiffany", "brand": "Mercedes-Benz", "model": "G 800 Brabus", "year": 2023, "type": "prestige", "price": 2115, "color": "Noir / Tiffany", "seats": 5, "doors": 5, "folder": "1od7OlKK4FPsQk00i9Bx-DXUSZJGtddmf"},
    {"pdfId": 55, "name": "Mercedes-Benz G 800 Brabus - Blanc/Alcantara Noir", "brand": "Mercedes-Benz", "model": "G 800 Brabus", "year": 2023, "type": "prestige", "price": 2115, "color": "Blanc", "seats": 5, "doors": 5, "folder": "1QlHyB1McOyHnM_wqALsvhHPhPNInK2Tk"},
    {"pdfId": 56, "name": "Mercedes-Benz G 800 Brabus - Intérieur Noir/Vert", "brand": "Mercedes-Benz", "model": "G 800 Brabus", "year": 2023, "type": "prestige", "price": 2115, "color": None, "seats": 5, "doors": 5, "folder": "1Rn_0O5d0m5p7zAur3QcOSrA1QuBdFXza"},
    {"pdfId": 57, "name": "Mercedes-Benz G 800 Brabus - Intérieur Bleu/Tiffany", "brand": "Mercedes-Benz", "model": "G 800 Brabus", "year": 2023, "type": "prestige", "price": 2115, "color": None, "seats": 5, "doors": 5, "folder": "1cx_iXFkqgZCyhTv402n1dIFpdvLU7zre"},
    # Supercars
    {"pdfId": 58, "name": "Lamborghini Huracan EVO - Rouge", "brand": "Lamborghini", "model": "Huracan EVO", "year": 2023, "type": "supercar", "price": 2550, "color": "Rouge", "seats": 2, "doors": 2, "folder": "1SsxphDmxWIJS7JixC1_Pwrcl8yMm2Lx5"},
    {"pdfId": 59, "name": "Lamborghini Urus - Gris/Noir", "brand": "Lamborghini", "model": "Urus", "year": 2023, "type": "supercar", "price": 2650, "color": "Gris / Noir", "seats": 5, "doors": 5, "folder": "1Ksk_xT56Oqq8QsJr0p3kHuhrrkoG_XW0"},
    {"pdfId": 60, "name": "Lamborghini Urus - Jaune", "brand": "Lamborghini", "model": "Urus", "year": 2023, "type": "supercar", "price": 2650, "color": "Jaune", "seats": 5, "doors": 5, "folder": "1oud7JdFzx7WFdGL7lnEvx48tcv8N2jXT"},
    {"pdfId": 61, "name": "Lamborghini Urus Capsule", "brand": "Lamborghini", "model": "Urus Capsule", "year": 2023, "type": "supercar", "price": 2815, "color": None, "seats": 5, "doors": 5, "folder": "1lfmyfBm45OHzMgbUk79n7sfH21Cywqsh"},
    {"pdfId": 62, "name": "Lamborghini Urus SE - Noir Mat/Tiffany - 2025", "brand": "Lamborghini", "model": "Urus SE", "year": 2025, "type": "supercar", "price": 2815, "color": "Noir Mat / Tiffany", "seats": 5, "doors": 5, "folder": "1_TG2GBcvTmSf9QYrSpAsn-IapmdSuSjP"},
    {"pdfId": 63, "name": "Lamborghini Huracan EVO Spyder - Blanc", "brand": "Lamborghini", "model": "Huracan EVO Spyder", "year": 2023, "type": "supercar", "price": 3100, "color": "Blanc", "seats": 2, "doors": 2, "folder": "1tVkHjsMrUKasyrwKRvT0uJ1lQiFj5bJ6"},
    {"pdfId": 64, "name": "Lamborghini Huracan EVO Spyder - Bleu", "brand": "Lamborghini", "model": "Huracan EVO Spyder", "year": 2023, "type": "supercar", "price": 3100, "color": "Bleu", "seats": 2, "doors": 2, "folder": "1pi1yd_9DVfN1XfKx16Dam4smF78FGy3R"},
    {"pdfId": 65, "name": "Lamborghini Huracan EVO Spyder - Noir", "brand": "Lamborghini", "model": "Huracan EVO Spyder", "year": 2023, "type": "supercar", "price": 3100, "color": "Noir", "seats": 2, "doors": 2, "folder": "1sUbU_EXiwn1Vp9YK5bCcgRPzbYK_cLkg"},
    {"pdfId": 66, "name": "Lamborghini Huracan EVO Spyder - Jaune", "brand": "Lamborghini", "model": "Huracan EVO Spyder", "year": 2023, "type": "supercar", "price": 3100, "color": "Jaune", "seats": 2, "doors": 2, "folder": "1gNNVCa_eqSoU4FJD-z3v-ayNdd2o30BT"},
    {"pdfId": 67, "name": "Rolls-Royce Cullinan - Noir/Intérieur Blanc", "brand": "Rolls-Royce", "model": "Cullinan", "year": 2023, "type": "supercar", "price": 3500, "color": "Noir", "seats": 5, "doors": 5, "folder": "1DPBGcGz7OPPpKL8yG2FlGteneFNhcInx"},
    {"pdfId": 68, "name": "Ferrari Purosangue", "brand": "Ferrari", "model": "Purosangue", "year": 2024, "type": "supercar", "price": 10900, "color": None, "seats": 4, "doors": 5, "folder": "1yVSO5tFKylhfZ0IQc9R-DNZoJ_VO-sEo"},
]

PLACEHOLDER = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80"

SHARED_INCLUDED = [
    "Assurance incluse (selon conditions)",
    "Salik inclus",
    "250 km/jour inclus",
    "Livraison gratuite partout à Dubai (7h–minuit)",
]

SHARED_REQUIREMENTS = [
    "Permis de conduire (EAU ou international)",
    "Passeport ou carte d'identité des Émirats",
    "Dépôt de garantie remboursable",
    "Âge minimum : 21 ans",
]


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read()


def list_folder_images(folder_id: str) -> list[tuple[str, str]]:
    """Return [(file_id, name), ...] for images in a public Drive folder."""
    html = http_get(f"https://drive.google.com/drive/folders/{folder_id}").decode("utf-8", "replace")
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'((?:\\'|[^'])*)'", html)
    if not m:
        return []
    raw = m.group(1)
    # ivd uses literal \x22 escapes for quotes (not decoded yet)
    pattern = re.compile(
        r"\\x22(1[a-zA-Z0-9_-]{20,})\\x22.{0,160}\\x22([^\\]+?\.(?:jpg|jpeg|png|webp))\\x22",
        re.IGNORECASE,
    )
    found = []
    for file_id, name in pattern.findall(raw):
        if file_id == folder_id:
            continue
        found.append((file_id, name))
    seen = set()
    out = []
    for item in found:
        if item[0] in seen:
            continue
        seen.add(item[0])
        out.append(item)
    return out


def download_file(file_id: str, dest: Path) -> bool:
    urls = [
        f"https://drive.google.com/uc?export=download&id={file_id}",
        f"https://lh3.googleusercontent.com/d/{file_id}=w1600",
    ]
    for url in urls:
        try:
            data = http_get(url)
            if len(data) < 2000:
                # likely HTML interstitial
                if b"<html" in data[:200].lower():
                    continue
            dest.write_bytes(data)
            return True
        except Exception:
            continue
    return False


def deposit_for(price: int, car_type: str) -> int:
    if car_type == "essential":
        return max(1500, price * 5)
    if car_type == "premium":
        return max(3000, price * 6)
    if car_type == "prestige":
        return max(8000, price * 8)
    return max(15000, price * 5)


def badge_for(car_type: str, price: int) -> list[dict]:
    labels = {
        "essential": ("ESSENTIEL", "bg-primary/80 text-on-primary"),
        "premium": ("PREMIUM", "bg-secondary-container text-on-secondary-container"),
        "prestige": ("PRESTIGE", "bg-tertiary text-on-tertiary"),
        "supercar": ("SUPERCAR", "bg-primary/80 text-on-primary"),
    }
    label, cls = labels.get(car_type, ("FLEET", "bg-primary/80 text-on-primary"))
    badges = [{"label": label, "className": cls}]
    if price >= 2500:
        badges.append({"label": "ULTRA LUXE", "className": "bg-secondary-container text-on-secondary-container"})
    return badges


def main():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    featured_ids = {39, 52, 58, 67, 68, 26, 11}  # a few showcase cars

    for i, car in enumerate(CARS, start=1):
        slug = f"pdf-{car['pdfId']}"
        car_dir = UPLOAD_DIR / slug
        car_dir.mkdir(exist_ok=True)
        gallery_paths: list[str] = []

        print(f"[{i}/{len(CARS)}] {car['name']} …", flush=True)
        try:
            files = list_folder_images(car["folder"])
        except Exception as e:
            print(f"  folder list failed: {e}")
            files = []

        for idx, (file_id, name) in enumerate(files[:6]):
            ext = Path(name).suffix.lower() or ".jpg"
            if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
                ext = ".jpg"
            dest = car_dir / f"{idx}{ext}"
            if dest.exists() and dest.stat().st_size > 2000:
                gallery_paths.append(f"/uploads/fleet/{slug}/{dest.name}")
                continue
            ok = download_file(file_id, dest)
            if ok:
                gallery_paths.append(f"/uploads/fleet/{slug}/{dest.name}")
                print(f"  + {name}")
            else:
                print(f"  x failed {name}")
            time.sleep(0.2)

        image = gallery_paths[0] if gallery_paths else PLACEHOLDER
        gallery = gallery_paths if gallery_paths else [PLACEHOLDER]

        record = {
            "name": car["name"],
            "brand": car["brand"],
            "model": car["model"],
            "year": car["year"],
            "type": car["type"],
            "price": car["price"],
            "deposit": deposit_for(car["price"], car["type"]),
            "dailyKm": 250,
            "featured": car["pdfId"] in featured_ids,
            "image": image,
            "gallery": gallery,
            "alt": f"{car['name']} available for rent in Dubai.",
            "color": car["color"] or "Sur demande",
            "transmission": "Automatique",
            "seats": car["seats"],
            "doors": car["doors"],
            "powertrain": "Essence",
            "drivetrain": "AWD" if "SUV" in car["name"] or car["model"] in {"Urus", "G 63", "Macan", "Cayenne", "X3", "X1", "X6M Competition", "RSQ8", "RSQ8 Performance", "Range Rover SVR", "Cullinan", "Purosangue", "GLC 300", "GLA 35", "Q5 Sportback", "Q3 S-Line", "Tiguan R-Line", "T-Roc R-Line", "X70", "T2", "Groove", "Coolray", "ZS"} else "FWD",
            "horsepower": None,
            "acceleration": None,
            "topSpeed": None,
            "fuel": "Essence",
            "rating": 4.9,
            "reviews": 12 + (car["pdfId"] % 40),
            "description": f"{car['name']} disponible à la location à Dubai avec Dubai À La Carte. Conciergerie, Salik inclus et livraison gratuite.",
            "highlights": [
                f"{car['price']} AED / jour",
                "250 km/jour inclus",
                "Livraison Dubai offerte",
            ],
            "features": [
                "Climatisation",
                "Bluetooth / Apple CarPlay selon modèle",
                "Assurance selon conditions",
            ],
            "included": SHARED_INCLUDED,
            "requirements": SHARED_REQUIREMENTS,
            "badges": badge_for(car["type"], car["price"]),
            "locations": ["dubai-marina", "downtown", "palm-jumeirah", "dxb-airport"],
            "driveFolder": f"https://drive.google.com/drive/folders/{car['folder']}",
            "pdfId": car["pdfId"],
        }
        if not gallery_paths:
            print("  skipped (no photos)")
            time.sleep(0.15)
            continue

        results.append(record)
        time.sleep(0.15)

    OUT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    with_photos = sum(1 for r in results if r["image"].startswith("/uploads/"))
    print(f"Wrote {len(results)} cars → {OUT_JSON}")
    print(f"Cars with local photos: {with_photos}/{len(results)}")


if __name__ == "__main__":
    main()

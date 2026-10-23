"""Prépare : points du visage (mediapipe) + masque de la personne (rembg). Usage : python3 prep_assets.py <face_landmarker.task>"""
import sys, os, numpy as np, cv2, mediapipe as mp
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); im = np.array(Image.open(f'{D}/source/reference.webp').convert('RGB'))
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
fl = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=sys.argv[1]), num_faces=1))
r = fl.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=im))
np.save(f'{D}/assets/lm.npy', np.array([[p.x * im.shape[1], p.y * im.shape[0]] for p in r.face_landmarks[0]]))
from rembg import remove, new_session
m = np.array(remove(Image.fromarray(im), session=new_session('isnet-general-use'), only_mask=True)) > 127
np.save(f'{D}/assets/person.npy', m); print('ok', m.mean())

"""Super-résolution x4 (Real-ESRGAN ONNX, tuiles 64 px) de l'image de référence -> assets/ref_x2.png (réduit à x2).
Usage : python3 upscale.py <realesrgan-x4.onnx>"""
import sys, os, numpy as np, onnxruntime as ort
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
s = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider'])
im = np.array(Image.open(f'{D}/source/reference.webp').convert('RGB')).astype(np.float32) / 255
H, W = im.shape[:2]; T, O = 64, 8; S = T - 2 * O
pad = np.pad(im, ((O, O + T), (O, O + T), (0, 0)), mode='reflect'); out = np.zeros((H * 4, W * 4, 3), np.float32)
tiles = [(y, x) for y in range(0, H, S) for x in range(0, W, S)]
B = 16
for k in range(0, len(tiles), B):
    chunk = tiles[k:k + B]; batch = np.stack([pad[y:y + T, x:x + T].transpose(2, 0, 1) for y, x in chunk])
    r = np.concatenate([s.run(None, {s.get_inputs()[0].name: batch[j:j + 1]})[0] for j in range(len(batch))])
    for (y, x), t in zip(chunk, r):
        t = t.transpose(1, 2, 0)[O * 4:(O + S) * 4, O * 4:(O + S) * 4]; hh = min(S * 4, H * 4 - y * 4); ww = min(S * 4, W * 4 - x * 4)
        out[y * 4:y * 4 + hh, x * 4:x * 4 + ww] = t[:hh, :ww]
    if k % 160 == 0: print(k, len(tiles), flush=True)
img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
img.resize((W * 2, H * 2), Image.LANCZOS).save(f'{D}/assets/ref_x2.png'); print('ok')

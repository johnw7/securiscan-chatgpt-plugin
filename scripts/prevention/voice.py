import sys, json, numpy as np, soundfile as sf, pyworld as pw
from kokoro_onnx import Kokoro
_V = sys.argv[1] if len(sys.argv) > 1 else 'voices'
k = Kokoro(_V + '/kokoro-v1.0.onnx', _V + '/voices-v1.0.bin')
PROFILES = {
  'policier': dict(speed=0.95, f0=0.58, warp=0.84),
  'enfant':   dict(speed=1.04, f0=1.32, warp=1.13),
}
def transform(x, fs, f0k, warp):
    x = x.astype(np.float64)
    f0, sp, ap = pw.wav2world(x, fs)
    n = sp.shape[1]; idx = np.arange(n)
    src = np.clip(idx / warp, 0, n - 1)
    sp2 = np.stack([np.interp(src, idx, r) for r in sp])
    ap2 = np.stack([np.interp(src, idx, r) for r in ap])
    y = pw.synthesize(f0 * f0k, sp2, ap2, fs)
    return y
def run(text, who, out):
    p = PROFILES[who]
    x, fs = k.create(text, voice='ff_siwis', speed=p['speed'], lang='fr-fr')
    y = transform(x, fs, p['f0'], p['warp'])
    # coupe des silences de début / fin
    e = np.abs(y); th = 0.02 * e.max(); nz = np.where(e > th)[0]
    y = y[max(0, nz[0] - int(0.03*fs)): nz[-1] + int(0.08*fs)]
    y = y / np.abs(y).max() * 0.85
    sf.write(out, y.astype(np.float32), fs)
    return len(y) / fs
if __name__ == '__main__':
    print(run(sys.argv[2], sys.argv[3], sys.argv[4]))

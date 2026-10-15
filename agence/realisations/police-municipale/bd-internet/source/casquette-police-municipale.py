import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F='/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
S=sys.argv[1]

def coeffs(dst, src):
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]); B.append(u)
        A.append([0,0,0,x,y,1,-v*x,-v*y]); B.append(v)
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()

def label(W=600,H=240):
    im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im)
    f1=ImageFont.truetype(F,118); f2=ImageFont.truetype(F,66)
    for t,f,y in [('POLICE',f1,8),('MUNICIPALE',f2,142)]:
        w=d.textlength(t,font=f); d.text(((W-w)/2,y),t,font=f,fill=255)
    return im

def fill_mask(im, mask, r=9, it=10):
    a=np.asarray(im).astype(float); m=mask.astype(float)
    for _ in range(it):
        w=Image.fromarray((1-m)*255).convert('L').filter(ImageFilter.BoxBlur(r))
        wa=np.asarray(w).astype(float)/255
        src=a*(1-m)[...,None]
        b=np.stack([np.asarray(Image.fromarray(src[...,c].astype(np.uint8)).filter(ImageFilter.BoxBlur(r))).astype(float) for c in range(3)],-1)
        est=np.where(wa[...,None]>1e-3,b/np.maximum(wa[...,None],1e-3),a)
        a=np.where(m[...,None]>0,est,a)
        m=np.where((m>0)&(wa>0.05),0,m)
    return Image.fromarray(a.clip(0,255).astype(np.uint8))

def apply(src,dst,quad,clean=None):
    im=Image.open(src).convert('RGB')
    if clean:
        x0,y0,x1,y1=clean; a=np.asarray(im).astype(int)
        mk=np.zeros(a.shape[:2],bool)
        sub=a[y0:y1,x0:x1]; mk[y0:y1,x0:x1]=(sub[...,2]-sub[...,0]>75)&(sub[...,2]>100)
        mk=np.asarray(Image.fromarray(mk.astype(np.uint8)*255).filter(ImageFilter.MaxFilter(9)))>0
        im=fill_mask(im,mk)
        im=Image.fromarray(np.asarray(im)).filter(ImageFilter.GaussianBlur(0)) 
    lab=label(); W,H=lab.size
    c=coeffs(quad,[(0,0),(W,0),(W,H),(0,H)])
    m=lab.transform(im.size,Image.PERSPECTIVE,c,Image.BICUBIC).filter(ImageFilter.GaussianBlur(0.6))
    a=np.asarray(im).astype(float); mm=np.asarray(m).astype(float)[...,None]/255
    lum=a.mean(-1,keepdims=True); 
    xs=[p[0] for p in quad]; ys=[p[1] for p in quad]
    ref=lum[min(ys):max(ys),min(xs):max(xs)].mean()
    shade=np.clip(0.80+0.45*(lum-ref)/max(ref,1),0.6,1.05)
    white=np.array([238,240,246])*shade
    out=a*(1-mm*0.95)+white*mm*0.95
    Image.fromarray(out.clip(0,255).astype(np.uint8)).save(dst,quality=95)

apply(f'{S}/cap/p5-orig.jpg','p5.jpg',[(905,182),(1038,196),(1032,252),(898,240)],clean=(895,178,1035,262))
apply(f'{S}/cap/p6-orig.jpg','p6.jpg',[(1035,130),(1200,128),(1200,190),(1037,195)])
for f,b in [('p5.jpg',(820,140,1140,320)),('p6.jpg',(990,90,1290,270))]:
    Image.open(f).crop(b).resize(((b[2]-b[0])*2,(b[3]-b[1])*2)).save(f'{S}/cap/z-{f[:2]}.png')

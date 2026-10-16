import sys
from PIL import Image
ov,img,T,out=sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4]
H=int(sys.argv[5]) if len(sys.argv)>5 else 1860
W=round(H*2/3); L=(1240-W)//2
bg=Image.new('RGB',(1240,1754),'#0b1f4d')
bg.paste(Image.open(img).convert('RGB').resize((W,H)),(L,T))
o=Image.open(ov).resize((1240,1754)); bg.paste(o,(0,0),o)
bg.resize((620,877)).save(out)

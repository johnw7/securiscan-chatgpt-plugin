"""Rend les clips, assemble les transitions et mixe voix + musique."""
import json, os, subprocess, sys
V = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); T = sys.argv[1]
W = os.path.join(V, 'voix', 'wav'); plan = json.load(open(os.path.join(T, 'plan.json'))); X = 0.5
def run(a): subprocess.run(a, check=True)
for k,(img,ov,L,D) in enumerate(plan):
    F = int(round(D*30)); ins=[]; fc=[]
    if img:
        z = "1+0.0005*on" if k % 2 == 0 else "1.08-0.0005*on"
        ins += ['-loop','1','-t',f'{D}','-i',os.path.join(V,'img',img)]
        fc.append(f"[0:v]scale=2160:3840,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={F}:s=1080x1920:fps=30,setsar=1[bg]")
        ins += ['-loop','1','-t',f'{D}','-i',os.path.join(V,'overlays',ov)]
        fc.append("[1:v]format=rgba,fade=t=in:st=0.3:d=0.6:alpha=1[o]")
        fc.append("[bg][o]overlay=x=0:y='if(lt(t,0.3),50,max(0,50-(t-0.3)*90))'[c0]")
    else:
        ins += ['-loop','1','-t',f'{D}','-i',os.path.join(V,'overlays',ov)]
        fc.append("[0:v]format=rgba,scale=1080:1920[c0]")
    base = len(ins)//6; last='c0'
    for j,(f,who,txt,s,e) in enumerate(L):
        idx = base + j
        ins += ['-loop','1','-t',f'{D}','-i',os.path.join(V,'bulles',f'b{k}_{j}.png')]
        a, b = max(0, s-0.15), e+0.25
        fc.append(f"[{idx}:v]format=rgba,fade=t=in:st={a}:d=0.18:alpha=1,fade=t=out:st={b}:d=0.18:alpha=1[u{j}]")
        fc.append(f"[{last}][u{j}]overlay=x=0:y='if(between(t,{a},{a+0.25}),30-(t-{a})*120,0)'[c{j+1}]"); last=f'c{j+1}'
    fc.append(f"[{last}]format=yuv420p[out]")
    run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(fc),'-map','[out]','-r','30','-c:v','libx264','-crf','18','-preset','medium','-t',f'{D}',os.path.join(T,f'c{k}.mp4')])
# transitions
n=len(plan); ins=[]; fc=[]; off=0; prev='0'
for k in range(n): ins += ['-i',os.path.join(T,f'c{k}.mp4')]
starts=[0.0]
for k in range(1,n):
    off += plan[k-1][3] - X; starts.append(off)
    tr = 'fade' if k==n-1 else 'slideleft'
    fc.append(f"[{prev}][{k}]xfade=transition={tr}:duration={X}:offset={off:.3f}[x{k}]"); prev=f'x{k}'
run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(fc),'-map',f'[{prev}]','-c:v','libx264','-crf','19','-preset','medium','-r','30',os.path.join(T,'muette.mp4')])
total = starts[-1] + plan[-1][3]
# voix placées sur la timeline globale + musique baissée
ins=[]; fc=[]; labels=[]
for k,(img,ov,L,D) in enumerate(plan):
    for (f,who,txt,s,e) in L:
        i=len(ins)//2; ins += ['-i',os.path.join(W,f+'.wav')]
        ms=int((starts[k]+s)*1000); fc.append(f"[{i}]adelay={ms}|{ms},apad[v{i}]"); labels.append(f'[v{i}]')
mi=len(ins)//2; ins += ['-i',os.path.join(T,'musique.wav')]
fc.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{total:.2f}[voix]")
fc.append(f"[{mi}]volume=0.22,apad,atrim=0:{total:.2f},afade=t=out:st={total-2:.2f}:d=2[mus]")
fc.append("[voix]asplit[vx][sc];[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];[vx][duck]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]")
run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(fc),'-map','[a]','-ar','44100','-ac','2',os.path.join(T,'audio.wav')])
out=os.path.join(V,'permis-velo-police-municipale-dialogues.mp4')
run(['ffmpeg','-v','error','-y','-i',os.path.join(T,'muette.mp4'),'-i',os.path.join(T,'audio.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',out])
print('total', round(total,2), out)

"""Monte la vidéo « Le permis vélo » avec dialogues : voix, bulles animées, musique baissée sous les voix."""
import json, os, subprocess, sys
V = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = sys.argv[1]  # dossier de travail
W = os.path.join(V, 'voix', 'wav')
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]).decode())

# scène -> (image, calque règle, répliques [(fichier, personnage, texte)])
SC = [
 ('v1.jpg','o0.png',[('00-s0-agent','Agent',"Bonjour les enfants ! Aujourd'hui, on passe le permis vélo. Vous êtes prêts ?"),('choeur','Les enfants','Ouiii !')]),
 ('v2.jpg','o1.png',[('02-s1-agent','Agent',"Règle numéro un : le casque, bien attaché. Il ne doit pas bouger."),('03-s1-lea','Léa','Comme ça ?'),('04-s1-agent','Agent','Parfait, Léa !')]),
 ('v3.jpg','o2.png',[('05-s2-tom','Tom','Et mon vélo, il est prêt ?'),('06-s2-agent','Agent','On vérifie ensemble : les freins, la lumière…'),('07-s2-tom','Tom','Et la sonnette ! Dring dring !')]),
 ('v4.jpg','o3.png',[('08-s3-agent','Agent','Pour tourner, on regarde derrière, puis on tend le bras.'),('09-s3-lea','Léa','Je tourne à gauche !'),('10-s3-agent','Agent',"Bravo, c'est exactement ça !")]),
 ('v5.jpg','o4.png',[('11-s4-agent','Agent',"Au stop, on s'arrête, pied à terre."),('12-s4-tom','Tom','Je regarde à gauche… à droite… c\'est bon !')]),
 ('v6.jpg','o5.png',[('13-s5-agent','Agent','Félicitations, Léa ! Voici ton permis vélo.'),('14-s5-lea','Léa','Merci ! Je suis trop fière !')]),
 (None,'o6.png',[('15-s6-agent','Agent',"Le permis vélo, avec la police municipale. Inscris-toi à l'école !")]),
]
X = 0.5  # durée des transitions
# position de chaque personnage dans l'image, pour orienter la pointe de la bulle
POS = [{'Agent':'l'}, {'Agent':'l','Léa':'r'}, {'Agent':'l','Tom':'r'}, {'Léa':'l','Agent':'r'}, {'Tom':'l','Agent':'r'}, {'Agent':'l','Léa':'r'}, {}]
plan = []; bubbles = []
for k,(img,ov,lines) in enumerate(SC):
    t = 0.8; L = []
    for f,who,txt in lines:
        d = dur(os.path.join(W, f + '.wav')); L.append((f, who, txt, t, t + d)); t += d + 0.35
    D = max(4.5, t + 0.7)
    plan.append((img, ov, L, D))
    for j,(f,who,txt,s,e) in enumerate(L): bubbles.append({'id': f'b{k}_{j}', 'who': who, 'txt': txt, 'side': POS[k].get(who, 'c')})
json.dump(bubbles, open(os.path.join(T,'bulles.json'),'w'), ensure_ascii=False)
json.dump([[img, ov, L, D] for img,ov,L,D in plan], open(os.path.join(T,'plan.json'),'w'), ensure_ascii=False)
print('durées', [round(p[3],2) for p in plan])

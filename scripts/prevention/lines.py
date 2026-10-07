import sys, json
sys.path.insert(0, __import__('os').path.dirname(__file__))
from voice import run
L = [
 ("enfant","Bonjour, monsieur le policier !"),
 ("enfant","Aujourd'hui, je vais à l'école tout seul, pour la première fois !"),
 ("policier","Bonjour Léo ! Bravo, tu deviens grand."),
 ("policier","Avant de partir, retiens bien mes trois conseils."),
 ("enfant","Trois conseils ? Je t'écoute !"),
 ("policier","Un : pour traverser, utilise toujours le passage piéton."),
 ("policier","Regarde à gauche, à droite, puis encore à gauche."),
 ("policier","Deux : ne suis jamais une personne que tu ne connais pas,"),
 ("policier","même si elle te propose un cadeau, ou de te raccompagner."),
 ("policier","Trois : si tu as peur, ou si tu es perdu, va voir un adulte de confiance."),
 ("policier","Et en cas d'urgence, on appelle le dix-sept."),
 ("enfant","Passage piéton, jamais d'inconnu, et le dix-sept."),
 ("enfant","C'est noté, merci !"),
 ("policier","Parfait, Léo ! Bonne route, et bonne journée à l'école !"),
]
out=[]
for i,(w,t) in enumerate(L):
    d=run(t,w,f"{sys.argv[1]}/lines/{i:02d}.wav"); out.append(round(d,2)); print(i,w,round(d,2),t)
json.dump(out,open(f"{sys.argv[1]}/lines/durations.json","w"))

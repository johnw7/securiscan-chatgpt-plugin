#!/bin/bash
# Photos Unsplash (licence Unsplash : usage commercial gratuit) pour les démos fictives du portfolio.
set -e
cd "$(dirname "$0")"
g(){ curl -sSf --retry 3 -o "$1/assets/$2.jpg" "https://images.unsplash.com/photo-$3?w=1080&q=85"; }
g praline devanture 1559925393-8be0ec4767c8;  g praline vitrine 1568254183919-78a4f43a2877
g praline pains 1517433670267-08bbd4be890f;     g praline petrin 1517686469429-8bdb88b9f907
g praline croissant 1555507036-ab1f4038808a;    g praline choco 1578985545062-69928b1d9587
g praline layer 1602351447937-745cb720612f;     g praline tartes 1464305795204-6f5bbfc7fb81
g praline tartelettes 1495147466023-ac5c588e2e94; g praline cupcakes 1563729784474-d77dbb933a9e
g praline cupcakes2 1607478900766-efe13248b125; g praline cafe 1445116572660-236099ec97a0
g praline latte 1514432324607-a09d9b4aefdd;     g praline cookies 1558961363-fa8fdf82db35
g praline cookies2 1499636136210-6f4ee915583e;  g praline salle 1554118811-1e0d58224f24
g blanche robe 1594552072238-b8a33785b261;      g blanche plage 1537633552985-df8429e8048b
g blanche bouquet 1550005809-91ad75fb315f;      g blanche bouquet2 1525258946800-98cfd641d0de
g blanche voile 1460978812857-470ed1c77af0;     g blanche alliances 1606800052052-a08af7148866
g blanche mains 1465495976277-4387d4b0b4c6;     g blanche allee 1469371670807-013ccf25f16a
g blanche chaises 1522673607200-164d1b6ce486;   g blanche sortie 1583939003579-730e3918a45a
g blanche fete 1595407753234-0882f1e77954;      g blanche couple 1591604466107-ec97de577aff

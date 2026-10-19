import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mkwords import words
FIX = {15:'صلصة', 16:'بتلقاها', 20:'صلصة', 25:'يغيّر', 33:'أولًا', 40:'تغيّر', 49:'تغيّر', 69:None, 71:'تتغيّر', 74:'وثلاث', 75:'وأربع', 84:'فأنا'}
T = {74: 35.90, 39: 19.55, 47: 23.40}
W = words('M', FIX, T, breaks_after=(2,5,8,12,14,20,22,26,29,32,35,43,45,49,52,56,60,64,68,71,75,79,83,85,87,89))
SOFT = dict(kind='soft'); KEY = dict(kind='key'); SMALL = dict(kind='small')
REEL = {
 'duration': 45.833,
 'identity': {'name': 'د. ياسر الحزيمي', 'source': '@edureel.studio', 'until': 4},
 'words': W,
 'overlays': [
  {'t0': 0.1, 't1': 2.1, 'y0': 880, 'texts': [dict(SOFT, text='التبرير', at=0.22, y=770, size=60), dict(KEY, text='عدو التغيير', at=0.76, y=840, size=84)]},
  {'t0': 11.7, 't1': 13.2, 'y0': 880, 'texts': [dict(SOFT, text='التبرير', at=11.78, y=770, size=58), dict(KEY, text='لا يغيّر', at=12.18, y=840, size=88),
                                                 dict(SMALL, text='الإنسان', at=12.81, y=950, size=32)]},
  {'t0': 16.45, 't1': 18.5, 'y0': 880, 'texts': [dict(SMALL, text='الخطوة الأولى', at=16.49, y=790, size=30), dict(KEY, text='أن أعرف', at=16.92, y=830, size=92)]},
  {'t0': 20.95, 't1': 23.5, 'y0': 880, 'texts': [dict(SOFT, text='ثم', at=20.99, y=770, size=60), dict(KEY, text='أعترف', at=21.88, y=835, size=100)]},
  {'t0': 26.6, 't1': 27.85, 'y0': 880, 'texts': [dict(KEY, text='ولا تعترف به', at=26.71, y=900, size=70)]},
 ],
 'scenes': [
  {'t0': 2.1, 't1': 10.85, 'type': 'board', 'title': 'التبرير ⟵ مادة حافظة',
   'rows': [{'text': 'تحافظ على السلوك', 'at': 2.11}, {'text': 'لا تزيد الطعم حلاوة', 'at': 3.95}, {'text': 'بعد ٥ سنين… هي هي!', 'at': 7.0}],
   'texts': [dict(SOFT, text='التبرير', at=0.05, y=95, size=56), dict(KEY, text='مادة حافظة', at=0.81, y=165, size=80)]},
  {'t0': 13.2, 't1': 16.45, 'type': 'symbol', 'symbol': '٤', 'symTop': 330, 'symSize': 440,
   'texts': [dict(SOFT, text='عشان نتغيّر', at=0.6, y=110, size=56), dict(KEY, text='أربع خطوات', at=2.3, y=860, size=80)]},
  {'t0': 18.5, 't1': 20.95, 'type': 'pedestal',
   'texts': [dict(SOFT, text='لا تستطيع أن تغيّر', at=0.1, y=110, size=52), dict(KEY, text='ما لا تعرفه', at=2.08, y=190, size=82)]},
  {'t0': 27.85, 't1': 33.75, 'type': 'cards', 'top': 250, 'cardH': 150, 'active': [0.0, 0.25, 1.28, 5.34],
   'cards': [{'n': '١', 'label': 'أعرف', 'img': 'img/c1.jpg', 'at': 0.05}, {'n': '٢', 'label': 'أعترف', 'img': 'img/c2.jpg', 'at': 0.2},
             {'n': '٣', 'label': 'أقرر', 'img': 'img/c3.jpg', 'at': 1.28}, {'n': '٤', 'label': 'أكرر', 'img': 'img/c4.jpg', 'at': 5.34}],
   'texts': [dict(SMALL, text='بعد أن تقرّر…', at=0.3, y=100, size=34), dict(KEY, text='القرار وحده لا يكفي', at=2.69, y=150, size=58)]},
  {'t0': 33.7, 't1': 41.0, 'type': 'loop', 'counts': [{'at': 1.32, 'v': 1}, {'at': 1.95, 'v': 2}, {'at': 2.2, 'v': 3}, {'at': 2.45, 'v': 4},
       {'at': 2.98, 'v': 5}, {'at': 3.46, 'v': 6}, {'at': 3.75, 'v': 7}],
   'texts': [dict(SOFT, text='تكرّر… تكرّر… تكرّر', at=2.9, y=120, size=54), dict(SMALL, text='حتى تتحول إلى', at=5.5, y=880, size=34),
             dict(KEY, text='عادة', at=6.68, y=925, size=96)]},
  {'t0': 41.0, 't1': 45.833, 'type': 'cards', 'top': 250, 'cardH': 150, 'active': [1.12, 1.86, 2.54, 4.2],
   'cards': [{'n': '١', 'label': 'أعرف', 'img': 'img/c1.jpg', 'at': 1.12}, {'n': '٢', 'label': 'أعترف', 'img': 'img/c2.jpg', 'at': 1.86},
             {'n': '٣', 'label': 'أقرر', 'img': 'img/c3.jpg', 'at': 2.54}, {'n': '٤', 'label': 'أكرر', 'img': 'img/c4.jpg', 'at': 4.2}],
   'texts': [dict(KEY, text='تزكية النفس', at=0.2, y=120, size=66)]},
 ],
}

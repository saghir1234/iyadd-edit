import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mkwords import words
FIX = {6:'ماسك', 7:None, 19:'وبعضنا', 22:'يوميًّا', 27:'ومتّكئ', 28:'ويقلّب', 29:'يقلّب', 30:'يقلّب', 39:'تعوّره', 41:'عوّرتك', 42:'فجأة؟', 48:'آي', 49:'آي', 50:'آي',
       59:'شايع', 68:'لآلامك', 71:'فما@38.20 بالك', 84:'إحساس', 51:'وأنت', 56:'أنت'}
W = words('N', FIX, {71: 38.20}, breaks_after=(1,4,8,12,14,18,24,26,30,34,36,39,42,46,50,53,55,59,63,68,70,72,74,76,78,80,84,87,91,94,96),
          extra_after={87: 'مباشر@50.20'})
W = W.replace('فما@38.20 بالك@38.20', 'فما@38.20 بالك@38.40')
G = dict(font='cairo', color='gold')
REEL = {
 'duration': 56.2,
 'identity': {'name': 'د. ياسر الحزيمي', 'source': '@edureel.studio', 'until': 4},
 'words': W,
 'overlays': [
  {'t0': 0.3, 't1': 3.85, 'words': [dict(G, text='السوشال', at=0.56, x=360, y=80, w=330, size=64, align='right'),
                                     dict(G, text='ميديا', at=0.86, x=60, y=150, w=300, size=74, align='left')],
   'tag': {'text': 'عزلتنا', 'at': 3.91 - 0.25, 'x': 470, 'y': 640, 'w': 200, 'size': 44}},
  {'t0': 10.9, 't1': 12.9, 'words': [dict(G, text='يوميًّا', at=10.98, x=380, y=90, w=300, size=66, align='right'),
                                      dict(text='هذا الموقف', at=11.5, x=40, y=170, w=340, size=52, color='white', font='ruqaa', align='left')],
   'curve': {'at': 11.3, 'p': [470, 175, 300, 215]}},
  {'t0': 19.7, 't1': 21.4, 'words': [dict(G, text='يقوم…', at=19.78, x=380, y=100, w=300, size=60, align='right')],
   'tag': {'text': 'يده تعوّره', 'at': 20.57, 'x': 440, 'y': 650, 'w': 240, 'size': 42}},
  {'t0': 29.5, 't1': 33.3, 'words': [dict(G, text='وأنت', at=29.58, x=420, y=80, w=260, size=60, align='right'),
                                      dict(G, text='ما تدري', at=30.05, x=40, y=150, w=330, size=66, align='left'),
                                      dict(text='وعيك كله في الشاشة', at=32.04, x=0, y=250, w=720, size=46, color='white', font='ruqaa')],
   },
  {'t0': 35.6, 't1': 36.8, 'words': [], 'tag': {'text': 'آلامك', 'at': 35.82, 'x': 470, 'y': 650, 'w': 200, 'size': 46}},
  {'t0': 48.5, 't1': 51.25, 'words': [dict(G, text='ما لها إحساس', at=48.58, x=0, y=90, w=720, size=58),
                                       dict(text='ما لها ألم مباشر', at=49.64, x=0, y=180, w=720, size=50, color='red', font='ruqaa')]},
 ],
 'scenes': [
  {'t0': 3.85, 't1': 9.95, 'type': 'window', 'words': [
     dict(text='عزلتنا عن الناس', at=1.2, x=0, y=90, w=720, size=60, color='white'),
     dict(text='صرنا لوحدنا', at=3.2, x=330, y=200, w=380, size=50, color='white', align='right'),
     dict(text='عن أنفسنا', at=5.6, x=20, y=280, w=380, size=66, color='red', align='left')]},
  {'t0': 14.95, 't1': 19.0, 'type': 'phone', 'flicks': [1.45, 1.77, 2.12], 'words': [
     dict(text='يقلّب', at=1.45, x=480, y=330, w=230, size=56, color='white', rot=-8, stamp=True),
     dict(text='يقلّب', at=1.77, x=10, y=520, w=230, size=56, color='white', rot=7, stamp=True),
     dict(text='يقلّب', at=2.12, x=470, y=720, w=230, size=56, color='red', rot=-5, stamp=True),
     dict(text='ومتّكئ…', at=0.1, x=0, y=110, w=720, size=54, color='white')]},
  {'t0': 21.4, 't1': 26.5, 'type': 'card', 'trans': 'flash', 'words': [
     dict(text='يدك عوّرتك', at=0.07, x=0, y=470, w=720, size=96),
     dict(text='فجأة؟!', at=1.48, x=0, y=330, w=720, size=84, color='redink', drop=True, rot=-4),
     dict(text='لها شوي… وأنت ما تدري', at=3.0, x=0, y=650, w=720, size=46, color='grey', mode='fade')]},
  {'t0': 36.85, 't1': 42.75, 'type': 'stairs', 'words': [
     dict(text='وهذا جسد', at=0.1, x=40, y=120, w=380, size=56, color='ink', align='left'),
     dict(text='فما بالك بنفسك', at=1.98, x=260, y=250, w=440, size=58, color='redink', align='right'),
     dict(text='أحلامك', at=3.82, x=40, y=400, w=320, size=56, color='ink', align='left'),
     dict(text='أمنياتك', at=5.0, x=380, y=520, w=300, size=56, color='ink', align='right')]},
  {'t0': 42.65, 't1': 48.5, 'type': 'card', 'trans': 'flash', 'words': [
     dict(text='ذنوبك', at=0.71, x=360, y=300, w=340, size=78),
     dict(text='وأخطاؤك', at=1.55, x=20, y=420, w=360, size=78),
     dict(text='ومسؤولياتك المهدرة', at=2.45, x=0, y=560, w=720, size=52, color='grey', mode='fade'),
     dict(text='وعلاقاتك المنسية', at=4.29, x=0, y=180, w=720, size=66, color='redink', drop=True, rot=-3)]},
  {'t0': 51.2, 't1': 56.2, 'type': 'window', 'dimAt': 3.6, 'words': [
     dict(text='في هذا الزمن', at=0.9, x=0, y=90, w=720, size=58, color='white'),
     dict(text='أكثر من أي زمن مضى', at=2.1, x=0, y=180, w=720, size=44, color='white', font='ruqaa'),
     dict(text='لا يعرف نفسه', at=3.66, x=0, y=262, w=720, size=72, color='red')]},
 ],
}

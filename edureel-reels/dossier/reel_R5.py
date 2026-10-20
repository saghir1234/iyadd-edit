import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mkwords import words
FIX = {2:'أصلًا', 25:None, 63:'٨٦', 64:'٪', 13:'يبدو', 14:'وهو', 19:'يبدو', 20:'وهو', 41:None, 40:'مرة', 49:'كل', 60:'كل', 61:'واحد', 62:'يدوّر@26.36 يديه', 76:'صوتي؟', 75:'هذا', 80:None, 81:None, 82:'صوته', 88:'صوتك', 89:'إحنا', 67:'على'}
W = words('R5', FIX, {}, breaks_after=(5,8,15,21,24,32,39,43,48,54,58,62,68,71,76,82,84,88,93,96))
W = W.replace('يدوّر@26.36 يديه@26.62', 'يدوّر@26.36 يديه@26.62')
B = dict(color='brand'); M = dict(color='mag'); WH = dict(color='white')
REEL = {
 'duration': 44.166,
 'identity': {'name': 'د. ياسر الحزيمي', 'source': '@edureel.studio', 'from': 0, 'until': 3.6},
 'words': W,
 'flashes': [5.3, 9.4, 17.0, 29.9, 32.6],
 'overlays': [
  {'t0': 0.5, 't1': 5.25, 'texts': [dict(WH, text='إذا الإنسان أصلًا', at=0.57, y=810, size=40), dict(B, text='لا يعرف جسده', at=3.0, y=870, size=72),
                                    dict(M, text='فكيــف يعرف نفسه؟', at=4.16, y=970, size=58, pop=True)]},
  {'t0': 8.3, 't1': 9.38, 'texts': [dict(B, text='وهو جالس', at=8.8, y=890, size=74)]},
  {'t0': 12.4, 't1': 16.95, 'texts': [dict(WH, text='مناطق من جسمه', at=13.34, y=810, size=42), dict(B, text='ما قد شافهـــا', at=14.44, y=880, size=70),
                                      dict(M, text='ولا لمسهـــا', at=16.26, y=980, size=66, pop=True)]},
  {'t0': 30.0, 't1': 32.55, 'texts': [dict(B, text='يسجّل صوته', at=30.58, y=890, size=72)]},
  {'t0': 36.95, 't1': 38.3, 'texts': [dict(M, text='هذا صوتك!', at=37.6, y=890, size=80, pop=True)]},
  {'t0': 38.6, 't1': 42.55, 'texts': [dict(B, text='لا نعرف هذا الجسد', at=39.18, y=860, size=60), dict(M, text='فما بالك بالنفس؟', at=40.26, y=960, size=70, pop=True)]},
 ],
 'scenes': [
  {'t0': 5.3, 't1': 8.3, 'type': 'walk', 'ghostAt': 1.25, 'texts': [dict(WH, text='لا يعرف كيف يبدو', at=0.12, y=150, size=56), dict(M, text='وهو يمشــي', at=1.1, y=235, size=78)]},
  {'t0': 9.4, 't1': 12.33, 'type': 'face', 'blurAt': 1.2, 'qAt': 1.9, 'texts': [dict(B, text='ولا يعرف وجهه', at=0.1, y=150, size=70)]},
  {'t0': 17.0, 't1': 18.6, 'type': 'title', 'slideOut': True, 'depth': {'text': 'دراسة', 'y': 470, 'size': 170, 'at': 0.5},
   'texts': [dict(WH, text='مرة سوّوا', at=0.36, y=430, size=52), dict(B, text='دراســـة', at=1.0, y=520, size=120, pop=True)]},
  {'t0': 18.6, 't1': 27.95, 'type': 'hands', 'slideIn': True, 'slideOut': True, 'shuffleAt': 5.8, 'hlAt': 7.9,
   'texts': [dict(WH, text='صوّروا أيدي الناس', at=0.1, y=130, size=52), dict(M, text='قصّوها وخلطوها', at=5.9, y=215, size=64, pop=True),
             dict(B, text='كل واحد يدوّر يده', at=7.5, y=1000, size=54)]},
  {'t0': 27.95, 't1': 29.9, 'type': 'counter', 'slideIn': True, 'from': 0, 'to': 86, 'countAt': 0.1, 'countDur': 0.95, 'suffix': '٪', 'numTop': 420,
   'texts': [dict(B, text='لم يتعرّفوا على أيديهم', at=0.75, y=760, size=56)]},
  {'t0': 32.6, 't1': 36.9, 'type': 'voice', 'texts': [dict(M, text='هذا صوتي؟!', at=0.36, y=150, size=86, pop=True), dict(B, text='يستقبحـــه', at=3.0, y=860, size=70)]},
  {'t0': 42.6, 't1': 44.166, 'type': 'outro'},
 ],
}

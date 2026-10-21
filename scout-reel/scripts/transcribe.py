import json,sys
from faster_whisper import WhisperModel
m=WhisperModel("medium",device="cpu",compute_type="int8")
import subprocess,numpy as np
aud=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-f","s16le","-ac","1","-ar","16000","-"],capture_output=True).stdout,np.int16).astype(np.float32)/32768
segs,info=m.transcribe(aud,language="ar",word_timestamps=True,vad_filter=False)
out=[]
for s in segs:
    for w in s.words: out.append({"w":w.word.strip(),"s":round(w.start,2),"e":round(w.end,2)})
    print(f"{s.start:.2f}-{s.end:.2f} {s.text}")
json.dump(out,open("words.json","w"),ensure_ascii=False,indent=0)

"""Download the official speaker photo for each talk from ChurchofJesusChrist.org
(the og:image on the official talk page), face-crop to a square portrait, and save
assets/speakers/<talk_id>.webp (480px) + assets/speakers/<talk_id>-sm.webp (160px).
Writes assets/speakers/index.json. Run: python3 tools/fetch_speaker_photos.py"""
import re, json, io, os, sys, urllib.request
import cv2, numpy as np
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','speakers'); os.makedirs(OUT,exist_ok=True)
UA={'User-Agent':'Mozilla/5.0'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read()
s=open(os.path.join(ROOT,'assets','data.js')).read()
talks=re.findall(r'"id": "([a-z]{3}-[ap]m-[^"]+)".*?"speaker": "([^"]+)".*?"official_url": "([^"]+)"',s,re.S)
casc=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
idx={}; missing=[]
OVERRIDE={'sun-am-7-kyungu':(620,170,220,220)}  # detector missed; box measured by hand
SKIP={'sat-am-sustaining'}  # sustaining of officers: photo is the flowers, not a speaker
for tid,spk,url in talks:
    if tid in SKIP: missing.append(tid); continue
    try:
        html=get(url).decode('utf8','ignore')
        m=re.search(r'"og:image" content="([^"]+)"',html)
        if not m: raise Exception('no og:image')
        img_url=m.group(1).replace('%21192%2C','%211600%2C')
        im=Image.open(io.BytesIO(get(img_url))).convert('RGB')
        W,H=im.size; g=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2GRAY)
        faces=casc.detectMultiScale(g,1.1,6,minSize=(W//20,W//20))
        if tid in OVERRIDE: faces=[OVERRIDE[tid]]
        if len(faces)==0: faces=casc.detectMultiScale(g,1.05,3,minSize=(W//25,W//25))
        if len(faces)==0:  # pulpit framing fallback: face sits upper-center
            w=h=int(H*0.22); x=int(W/2-w/2); y=int(H*0.18); print('  (heuristic crop)',tid)
        else: x,y,w,h=max(faces,key=lambda f:f[2]*f[3])
        side=int(min(w*2.6,W,H)); cx=x+w/2; cy=y+h*0.62
        L=int(max(0,min(W-side,cx-side/2))); T=int(max(0,min(H-side,cy-side/2)))
        crop=im.crop((L,T,L+side,T+side))
        crop.resize((480,480),Image.LANCZOS).save(f'{OUT}/{tid}.webp',quality=82)
        crop.resize((160,160),Image.LANCZOS).save(f'{OUT}/{tid}-sm.webp',quality=80)
        idx[tid]={'speaker':spk,'src':url,'image':img_url}
        print('ok',tid)
    except Exception as e:
        missing.append(tid); print('MISSING',tid,e)
json.dump({'photos':idx,'missing':missing},open(f'{OUT}/index.json','w'),indent=1,ensure_ascii=False)

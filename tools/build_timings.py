"""Word-level timings for every talk (for "Make video clip" from any selected text).
The Church's talk media has no public timed captions in our data, so we transcribe the official audio with
faster-whisper (small.en, word timestamps). Output: assets/timings/<id>.json = {"id","video","words":[[word,start,end],...]}.
Also writes a 480p low-bitrate copy of each talk video to /workspace/scratch/media/<id>.mp4 for self-hosting
(the Church CDN sends no CORS headers, so a browser canvas can't record from it directly).
Run: /workspace/.venv-cv/bin/python tools/build_timings.py [--no-media]"""
import json, os, sys, subprocess, urllib.request, numpy as np
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SCR='/workspace/scratch/clips'; MED='/workspace/scratch/media'
for d in (SCR,MED,os.path.join(ROOT,'assets','timings')): os.makedirs(d,exist_ok=True)
from faster_whisper import WhisperModel
model=WhisperModel('small.en',device='cpu',compute_type='int8')
ids=json.load(open(os.path.join(ROOT,'assets','fulltext','index.json'))) if False else sorted(f[:-5] for f in os.listdir(os.path.join(ROOT,'assets','fulltext')) if f.endswith('.json') and f!='index.json')
for tid in ids:
    out=os.path.join(ROOT,'assets','timings',tid+'.json'); ft=json.load(open(os.path.join(ROOT,'assets','fulltext',tid+'.json')))
    v=ft.get('video'); v=v['src'] if isinstance(v,dict) else v
    if not ft.get('audio') or not v: print('skip',tid,flush=True); continue
    mp3=f'{SCR}/{tid}.mp3'
    if not os.path.exists(mp3): urllib.request.urlretrieve(ft['audio'],mp3)
    if not os.path.exists(out):
        wj=f'{SCR}/{tid}.words.json'
        if os.path.exists(wj): W=[[x['w'],x['s'],x['e']] for x in json.load(open(wj))]
        else:
            pcm=subprocess.run(['ffmpeg','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout
            segs,_=model.transcribe(np.frombuffer(pcm,np.float32),word_timestamps=True,beam_size=1,vad_filter=True)
            W=[[w.word.strip(),round(w.start,2),round(w.end,2)] for sg in segs for w in sg.words]
        json.dump({'id':tid,'video':v,'words':W},open(out,'w'),separators=(',',':'),ensure_ascii=False)
    if '--no-media' not in sys.argv and not os.path.exists(f'{MED}/{tid}.mp4'):
        src=f'{SCR}/{tid}.mp4' if os.path.exists(f'{SCR}/{tid}.mp4') else v
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-vf','scale=-2:480','-c:v','libx264','-preset','veryfast','-crf','28','-maxrate','700k','-bufsize','1400k','-g','30','-c:a','aac','-b:a','64k','-movflags','+faststart',f'{MED}/{tid}.mp4'],check=True)
    print('done',tid,os.path.getsize(out)//1024,'KB',flush=True)

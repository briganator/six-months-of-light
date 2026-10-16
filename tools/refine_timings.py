"""Snap each word's end time to the actual silence after it, using the talk audio's loudness envelope.
Whisper word ends are often late (stretched to the next word) or early. For each word we look between
its start+80ms and the next word's start for the first >=60ms run below a quiet threshold, and use that
as the end. Rewrites assets/timings/<id>.json in place (adds "refined": true). Idempotent from the raw words
kept in /workspace/scratch/clips/<id>.raw.json.
Run: python3 tools/refine_timings.py"""
import json, os, subprocess, numpy as np
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SCR='/workspace/scratch/clips'; TD=os.path.join(ROOT,'assets','timings')
HOP=0.01
for f in sorted(os.listdir(TD)):
    p=os.path.join(TD,f); T=json.load(open(p)); tid=T['id']; raw=f'{SCR}/{tid}.raw.json'
    if not os.path.exists(raw): json.dump(T['words'],open(raw,'w'))
    W=json.load(open(raw)); mp3=f'{SCR}/{tid}.mp3'
    pcm=np.frombuffer(subprocess.run(['ffmpeg','-loglevel','error','-i',mp3,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout,np.float32)
    n=int(len(pcm)/160); rms=np.sqrt(np.mean(pcm[:n*160].reshape(n,160)**2,axis=1)+1e-12); db=20*np.log10(rms)
    speech=np.percentile(db,85); floor=np.percentile(db,10); thr=floor+0.35*(speech-floor)
    quiet=db<thr; moved=0; out=[]
    for i,(w,s,e) in enumerate(W):
        ns=W[i+1][1] if i+1<len(W) else e+1.0
        a=int((s+0.08)/HOP); b=int(min(ns,e+0.35)/HOP); new=None
        for k in range(max(a,int((e-0.35)/HOP)),b):
            if k+6<=len(quiet) and quiet[k:k+6].all(): new=k*HOP; break
        if new is None: new=min(e,ns-0.03) if ns>s+0.1 else e
        new=max(s+0.08,new)
        if abs(new-e)>0.05: moved+=1
        out.append([w,s,round(new,2)])
    T['words']=out; T['refined']=True; json.dump(T,open(p,'w'),separators=(',',':'),ensure_ascii=False)
    print(tid,len(out),'words, ends moved:',moved,flush=True)

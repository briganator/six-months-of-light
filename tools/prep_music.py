"""Trim real recordings (sources in LICENSES-music.md) to a ~90 s segment, loudness-normalize and encode.
Segment start = first moment the music is near full level (skips long quiet intros). 1.5 s fade-in, 3 s fade-out.
Run: python3 tools/prep_music.py <src_dir>"""
import subprocess, sys, os, numpy as np
SRC=sys.argv[1]; OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets','music')
T={'pd-amazing-grace.src':'amazing-grace-strings','pd-nearer.src':'nearer-my-god','pd-canon.src':'canon-strings','pd-eternal-father.src':'eternal-father','pd-ode-to-joy.src':'ode-to-joy-band',
   'inc-Meditation Impromptu 02.mp3':'meditation-impromptu','inc-Dreamy Flashback.mp3':'dreamy-flashback','inc-Lasting Hope.mp3':'lasting-hope','inc-Heartwarming.mp3':'heartwarming','inc-Touching Moments Two - Higher.mp3':'touching-moments','inc-Long Note Two.mp3':'long-note'}
SEG=90
for f,n in T.items():
    p=os.path.join(SRC,f); pcm=np.frombuffer(subprocess.run(['ffmpeg','-loglevel','error','-i',p,'-ac','1','-ar','8000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32)
    dur=len(pcm)/8000; w=8000; e=np.array([np.sqrt(np.mean(pcm[i:i+w]**2)+1e-12) for i in range(0,len(pcm)-w,w)]); db=20*np.log10(e)
    ref=np.percentile(db,75); st=next((i for i,x in enumerate(db) if x>ref-8),0); st=max(0,min(st-1,int(dur-SEG)))
    L=min(SEG,dur-st); fo=3.0
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(st),'-t',f'{L:.2f}','-i',p,'-af',f'afade=t=in:d=1.5,afade=t=out:st={L-fo:.2f}:d={fo},loudnorm=I=-20:TP=-2:LRA=11','-ar','44100','-ac','2','-c:a','aac','-b:a','112k','-vn',f'{OUT}/{n}.m4a'],check=True)
    print(n,'from',st,'s, len',round(L,1),os.path.getsize(f'{OUT}/{n}.m4a')//1024,'KB',flush=True)

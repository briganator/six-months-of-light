"""Background music for quote clips, rendered here from code (no samples, no third-party recordings),
so every track is our own work released CC0. Hymn tracks use public-domain melodies (see LICENSES-music.md).
Engine: additive piano (slightly inharmonic partials), detuned string ensemble with vibrato and slow bows,
soft pads, bells and a synthetic stereo hall reverb (FFT convolution). Each track ~64 s, with a gentle fade-in,
a seamless-ish loop point (last bar decays into the first chord) and a fade-out, loudness-normalized with
ffmpeg loudnorm to -20 LUFS, AAC 112 kb/s stereo.
Run: python3 tools/make_music.py   (numpy + ffmpeg)"""
import numpy as np, subprocess, os, json
SR=44100; OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets','music'); os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
NOTE={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def m(s):
    k=NOTE[s[0]]; i=1
    while s[i] in '#b': k+=1 if s[i]=='#' else -1; i+=1
    return 12*(int(s[i:])+1)+k
F=lambda n:440*2**((n-69)/12)
class Mix:
    def __init__(s,sec): s.L=np.zeros(int(sec*SR)+SR*8); s.R=np.zeros_like(s.L)
    def add(s,t0,x,pan=0.,g=1.):
        i=int(t0*SR); n=min(len(x),len(s.L)-i)
        if n<=0: return
        s.L[i:i+n]+=x[:n]*g*np.cos((pan+1)*np.pi/4); s.R[i:i+n]+=x[:n]*g*np.sin((pan+1)*np.pi/4)
def piano(n,dur,vel=.6):
    f=F(n); T=dur+2.2; t=np.arange(int(T*SR))/SR; B=.0004; x=np.zeros_like(t)
    for h in range(1,11):
        fh=f*h*np.sqrt(1+B*h*h)
        if fh>15000: break
        dec=1.2+h*.55+f/700; x+=np.sin(2*np.pi*fh*t+rng.random())*np.exp(-t*dec)*(vel**(1+h*.15))/h**1.25
    rel=np.ones_like(t); k=int(dur*SR); rel[k:]=np.exp(-(t[k:]-dur)*5)
    x*=rel*np.minimum(1,t/.004); return x*.5
def strings(n,dur,vel=.5,att=.7,rel=1.2,voices=5,bright=.8):
    f=F(n); T=dur+rel; t=np.arange(int(T*SR))/SR; x=np.zeros_like(t)
    for v in range(voices):
        det=1+(v-(voices-1)/2)*.0028; vib=1+.0035*np.sin(2*np.pi*(4.8+v*.23)*t+v)
        ph=2*np.pi*np.cumsum(f*det*vib)/SR+rng.random()*6
        for h in range(1,13):
            if f*h>9000: break
            x+=np.sin(h*ph)*(bright**h)/h
    env=np.minimum(1,t/att)**1.6; k=int(dur*SR); env[k:]*=np.exp(-(t[k:]-dur)*(4/rel))
    env*=1+.08*np.sin(2*np.pi*.18*t); return x*env*vel/voices*.6
def pad(n,dur,vel=.4): 
    f=F(n); T=dur+2.5; t=np.arange(int(T*SR))/SR
    x=sum(np.sin(2*np.pi*f*d*t+p)*a for d,p,a in [(1,0,1),(1.004,1,.8),(.996,2,.8),(2,3,.25),(3.002,4,.08)])
    env=np.minimum(1,t/2.0)**2; k=int(dur*SR); env[k:]*=np.exp(-(t[k:]-dur)*1.6); return x*env*vel*.25
def bell(n,vel=.3):
    f=F(n); t=np.arange(int(5*SR))/SR
    return sum(np.sin(2*np.pi*f*r*t)*np.exp(-t*d)*a for r,d,a in [(1,.9,1),(2.76,1.6,.5),(5.4,2.6,.25),(8.93,4,.12)])*vel*.4
def hall(L,R,secs=3.2,wet=.32):
    n=int(secs*SR); t=np.arange(n)/SR; out=[]
    for ch,seed in ((L,1),(R,2)):
        r=np.random.default_rng(seed).standard_normal(n)*np.exp(-t*6.9/secs)
        r=np.convolve(r,np.ones(8)/8,'same'); r[:int(.012*SR)]=0; r/=np.sqrt((r**2).sum())
        N=1<<int(np.ceil(np.log2(len(ch)+n))); y=np.fft.irfft(np.fft.rfft(ch,N)*np.fft.rfft(r,N),N)[:len(ch)]
        out.append(ch*(1-wet)+y*wet*1.6)
    return out
def save(name,mix,sec):
    L,R=hall(mix.L,mix.R); n=int(sec*SR); L,R=L[:n],R[:n]; t=np.arange(n)/SR
    env=np.minimum(1,t/1.5)*np.minimum(1,(sec-t)/3.0); L*=env; R*=env
    pk=max(abs(L).max(),abs(R).max()); st=(np.stack([L,R],1)/pk*.9*32767).astype(np.int16)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','s16le','-ar',str(SR),'-ac','2','-i','-','-af','loudnorm=I=-20:TP=-2:LRA=11','-ar','44100','-c:a','aac','-b:a','112k',f'{OUT}/{name}.m4a'],input=st.tobytes(),check=True)
    print(name,os.path.getsize(f'{OUT}/{name}.m4a')//1024,'KB',flush=True)
def chord(names): return [m(x) for x in names.split()]
SEC=64
# 1 Morning Light: ambient pads + soft bells
M=Mix(SEC); prog=['C3 G3 E4 B4','A2 E3 C4 G4','F2 C3 A3 E4','G2 D3 B3 D4']
for k in range(8):
    for n in chord(prog[k%4]): M.add(k*8,pad(n,8.5),pan=(n%7-3)/6)
    if k%2: M.add(k*8+3,bell(chord(prog[k%4])[-1]+12,.15),pan=.4)
save('morning-light',M,SEC)
# 2 Still Waters: piano arpeggios + pad, D major
M=Mix(SEC); prog=['D3 A3 D4 F#4','C#3 A3 C#4 E4','B2 F#3 B3 D4','G2 D3 G3 B3']; bt=.5
for k in range(16):
    c=chord(prog[k%4]); 
    for n in c[:2]: M.add(k*4,pad(n,4.3,.3),pan=-.2)
    for j,n in enumerate([c[0],c[2],c[3],c[2]+12,c[3],c[2],c[1]+12,c[3]]): M.add(k*4+j*bt,piano(n,bt*1.6,.45),pan=(n-62)/30)
save('still-waters',M,SEC)
# 3 Rising Hope: piano + strings swell, C G Am F
M=Mix(SEC); prog=['C3 G3 C4 E4','G2 D3 G3 B3','A2 E3 A3 C4','F2 C3 F3 A3']
mel=['E5','D5','C5','C5','D5','B4','E5','C5','C5','B4','A4','C5','A4','G4','A4','C5']
for k in range(16):
    c=chord(prog[k%4]); sw=min(1,.35+k/10)
    for n in c: M.add(k*4,strings(n,4.2,.35*sw,att=1.2),pan=(n-55)/25)
    M.add(k*4,piano(c[0]-12,3,.5)); 
    for j in range(4): M.add(k*4+j,piano(c[1+j%3]+12,.9,.35),pan=.3)
    if k>=4: M.add(k*4+1,strings(m(mel[k%16])-12+12,2.8,.28*sw,att=.4,voices=4,bright=.85),pan=0)
save('rising-hope',M,SEC)
# 4 Gentle Orchestral: strings chorale F Dm Bb C
M=Mix(SEC); prog=['F2 C3 A3 F4 A4','D2 A2 F3 D4 F4','Bb1 F2 D3 Bb3 D4','C2 G2 E3 C4 G4']
for k in range(16):
    for i,n in enumerate(chord(prog[k%4])): M.add(k*4,strings(n,4.3,.4 if i else .5,att=1.4,rel=1.6),pan=(i-2)/3)
save('gentle-orchestral',M,SEC)
# 5 Amazing Grace (NEW BRITAIN, public domain), piano melody + strings, G major 3/4
bt=.68; mel=[('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('G4',2),('E4',1),('D4',2),('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('D5',5),('B4',1),('D5',1.5),('B4',.5),('D5',.5),('B4',.5),('G4',2),('D4',1),('E4',1.5),('G4',.5),('G4',.5),('E4',.5),('D4',2),('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('G4',5)]
harm={0:'G',3:'G',9:'C',12:'G',18:'G',21:'D',27:'G',33:'C',36:'G',42:'D',45:'G'}; CH={'G':'G2 D3 B3 G4','C':'C3 G3 E4 C4','D':'D3 A3 F#3 D4'}
tot=sum(d for _,d in mel); SEC5=2*tot*bt+3; M=Mix(SEC5)
for rep in range(2):
    t=rep*tot
    for nt,d in mel: M.add(t*bt,piano(m(nt)+(12 if rep else 0),d*bt,.7),pan=.1); t+=d
    for beat in range(0,int(tot),3):
        key=max(k for k in harm if k<=beat)
        for n in chord(CH[harm[key]]): M.add((rep*tot+beat)*bt,strings(n,3*bt+.3,.22+.1*rep,att=.9),pan=(n-55)/25)
save('amazing-grace',M,SEC5)
# 6 Joyful, Joyful (Beethoven 1824, public domain), cinematic
bt=.52; L='E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4'.split(); song=[(x,1) for x in L]+[('E4',1.5),('D4',.5),('D4',2)]+[(x,1) for x in L]+[('D4',1.5),('C4',.5),('C4',2)]
tot=sum(d for _,d in song); SEC6=2*tot*bt+3; M=Mix(SEC6); prog=['C3 G3 E4','G2 D3 B3','C3 G3 E4','G2 D3 B3','C3 G3 E4','G2 D3 B3','C3 G3 C4','G2 D3 B3']
for rep in range(2):
    t=rep*tot
    for nt,d in song: M.add(t*bt,piano(m(nt)+12,d*bt,.6),pan=.15); 
    for nt,d in song: 
        if rep: M.add(t*bt,strings(m(nt),d*bt+.1,.25,att=.15,voices=4),pan=-.1)
        t+=d
    for k in range(int(tot//4)):
        for n in chord(prog[k%8]): M.add((rep*tot+k*4)*bt,strings(n,4*bt+.2,.25,att=.6),pan=(n-55)/25)
save('joyful-joyful',M,SEC6)
# 7 Eternal: low drone strings + bells, D
M=Mix(SEC)
for k in range(4):
    for n in chord('D2 A2 D3'): M.add(k*16,strings(n,16.5,.35,att=4,rel=3,bright=.7),pan=(n-45)/20)
    for n in chord(['F#4 A4','G4 B4','E4 A4','F#4 D5'][k]): M.add(k*16+2,pad(n,13,.35),pan=.3)
for k,n in enumerate('A5 F#5 D6 E5 A5 B5 F#5 D5'.split()*2): M.add(3+k*3.8,bell(m(n),.13),pan=(-1)**k*.5)
save('eternal',M,SEC)
# 8 Homeward: slow piano + cello melody (original), Eb major
M=Mix(SEC); prog=['Eb3 Bb3 G4','C3 G3 Eb4','Ab2 Eb3 C4','Bb2 F3 D4']; cel=['G3','Bb3','C4','Bb3','Ab3','G3','F3','G3','Eb3','F3','G3','Ab3','G3','F3','Eb3','Eb3']
for k in range(16):
    c=chord(prog[k%4])
    for j,n in enumerate(c): M.add(k*4+j*.12,piano(n,3.5,.45),pan=(n-60)/30)
    M.add(k*4+2,piano(c[2]+12,1.6,.35),pan=.3)
    if k>=2: M.add(k*4+.3,strings(m(cel[k%16]),3.6,.42,att=.5,voices=3,bright=.75),pan=-.25)
save('homeward',M,SEC)
# 9 Chorale of Faith: original hymn-style 4-part chorale, piano + soft strings, G major
M=Mix(SEC); ch=['G2 D3 B3 G4','C3 G3 E4 C5','D3 A3 F#4 D5','G2 D3 B3 G4','E3 B3 G4 E5','A2 E3 C#4 A4','D3 A3 F#4 D5','D3 A3 F#4 D5','G2 D3 B3 B4','C3 E3 G4 C5','G2 D3 B3 D5','E3 B3 G4 E5','C3 G3 E4 C5','D3 A3 F#4 A4','G2 D3 B3 G4','G2 D3 B3 G4']
for k,c in enumerate(ch):
    for n in chord(c): M.add(k*4,piano(n,3.6,.42),pan=(n-60)/30); M.add(k*4,strings(n,4.1,.2,att=1),pan=-(n-60)/30)
save('chorale-of-faith',M,SEC)

"""Bundled background music, synthesized here so there is no third-party license question:
- morning-light: original ambient pad (this project, CC0)
- amazing-grace: tune NEW BRITAIN (American folk melody, pub. 1829/1835), public domain; arrangement original, CC0
- ode-to-joy: Beethoven, Symphony No. 9 (1824) melody, public domain; arrangement original, CC0
Run: python3 tools/make_music.py (needs numpy + ffmpeg)"""
import numpy as np, subprocess, os
SR=44100; OUT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets','music')
N=lambda n:440*2**((n-69)/12)
NOTE={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def m(s): return 12*(int(s[-1])+1)+NOTE[s[0]]+(1 if '#' in s else 0)
def pad(buf,t0,dur,notes,amp=.05):
    i=int(t0*SR); n=int(dur*SR); t=np.arange(n)/SR; env=np.minimum(1,np.minimum(t/1.2,(dur-t)/1.2)).clip(0)
    for k in notes:
        f=N(k); w=sum(np.sin(2*np.pi*f*d*t+ph)/(j+1) for j,(d,ph) in enumerate([(1,0),(1.003,1),(2,2),(.997,3)]))
        buf[i:i+n]+=amp*env*w
def pno(buf,t0,dur,k,amp=.16):
    i=int(t0*SR); n=int((dur+1.5)*SR); t=np.arange(n)/SR; f=N(k)
    w=sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(1.6+h*.9))/h**1.4 for h in range(1,7))
    a=np.minimum(1,t/.006); buf[i:i+n]+=amp*a*w
def render(name,length):
    return np.zeros(int((length+3)*SR))
def save(name,buf):
    buf=np.convolve(buf,np.ones(1),'same'); # placeholder
    # simple reverb: feedback delays
    out=buf.copy()
    for d,g in [(.031,.35),(.047,.3),(.071,.25),(.113,.2),(.167,.15)]:
        k=int(d*SR); 
        for _ in range(3): out[k:]+=g*out[:-k]*.5
    out/=np.abs(out).max()*1.12; L=len(out); fade=int(2.5*SR); out[-fade:]*=np.linspace(1,0,fade)
    pcm=(out*32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','s16le','-ar',str(SR),'-ac','1','-i','-','-c:a','aac','-b:a','80k',f'{OUT}/{name}.m4a'],input=pcm,check=True)
# 1 ambient
b=render('',64); ch=[['C3','G3','E4','B4'],['A2','E3','C4','G4'],['F2','C3','A3','E4'],['G2','D3','B3','D4']]
for r in range(4):
    for j,c in enumerate(ch): pad(b,(r*4+j)*4,5,[m(x) for x in c],.035)
save('morning-light',b)
# 2 Amazing Grace, 3/4, beat .62s
bt=.62; mel=[('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('G4',2),('E4',1),('D4',2),('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('D5',5),('B4',1),('D5',1.5),('B4',.5),('D5',.5),('B4',.5),('G4',2),('D4',1),('E4',1.5),('G4',.5),('G4',.5),('E4',.5),('D4',2),('D4',1),('G4',2),('B4',.5),('G4',.5),('B4',2),('A4',1),('G4',5)]
harm={0:'G',3:'G',9:'C',12:'G',18:'G',21:'D',27:'G',33:'C',36:'G',42:'D',45:'G'}
CH={'G':['G2','D3','B3'],'C':['C3','G3','E4'],'D':['D3','A3','F#3']}
tot=sum(d for _,d in mel); b=render('',2*tot*bt+2)
for rep in range(2):
    t=rep*tot
    for nt,d in mel: pno(b,t*bt,d*bt,m(nt)); t+=d
    for beat in range(0,int(tot),3):
        key=max(k for k in harm if k<=beat); pad(b,(rep*tot+beat)*bt,3*bt+.6,[m(x) for x in CH[harm[key]]],.03)
save('amazing-grace',b)
# 3 Ode to Joy, 4/4 beat .55
bt=.55; L='E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4'.split(); mel=[(x,1) for x in L]+[('E4',1.5),('D4',.5),('D4',2)]
mel2=[(x,1) for x in L]+[('D4',1.5),('C4',.5),('C4',2)]
song=mel+mel2; tot=sum(d for _,d in song); b=render('',2*tot*bt+2)
prog=['C','G','C','G','C','G','C','G']; CH.update({'C':['C3','G3','E4'],'G':['G2','D3','B3']})
for rep in range(2):
    t=rep*tot
    for nt,d in song: pno(b,t*bt,d*bt,m(nt)+12,.13); t+=d
    for k in range(int(tot//4)): pad(b,(rep*tot+k*4)*bt,4*bt+.5,[m(x) for x in CH[prog[k%8]]],.03)
save('ode-to-joy',b)
print(os.listdir(OUT))

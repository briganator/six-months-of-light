"""Index for "Make a video": printed talk text (as shown on the site) for every talk with word timings, plus a
map from each printed word to the spoken word in the transcript (assets/timings/<id>.json).
Pasted text is matched against the PRINTED words (what people copy), then mapped to spoken timings.
Mapping: difflib matching blocks between normalized printed and transcript words act as anchors; words between
anchors are interpolated. Output: assets/clip-index.json = {talks:[{id, w:[printed words], m:[transcript idx]}]}
Run: python3 tools/build_clip_index.py"""
import json, os, re, html, difflib, unicodedata
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(w):
    w=unicodedata.normalize('NFD',w.lower()); w=''.join(c for c in w if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]","",w.replace('’',"'"))
def printed(body):
    body=re.sub(r'<a class="fn"[^>]*>.*?</a>','',body); body=re.sub(r'<p class="ft-kicker".*?</p>','',body,flags=re.S)
    paras=re.findall(r'<(?:p|li)[^>]*>(.*?)</(?:p|li)>',body,re.S); txt=' '.join(html.unescape(re.sub(r'<[^>]+>','',p)) for p in paras)
    return [w for w in re.split(r'[\s\u2014\u2013]+',txt) if norm(w)]
out=[]; stats=[]
for f in sorted(os.listdir(os.path.join(ROOT,'assets','timings'))):
    tid=f[:-5]; T=json.load(open(os.path.join(ROOT,'assets','timings',f))); ft=json.load(open(os.path.join(ROOT,'assets','fulltext',f)))
    P=printed(ft.get('body','')); S=[w[0] for w in T['words']]
    pn=[norm(w) for w in P]; sn=[norm(w) for w in S]
    sm=difflib.SequenceMatcher(None,pn,sn,autojunk=False); anchors=[]
    for a,b,n in sm.get_matching_blocks():
        for k in range(n): anchors.append((a+k,b+k))
    m=[-1]*len(P); 
    for a,b in anchors: m[a]=b
    # interpolate gaps
    idx=[i for i in range(len(P)) if m[i]>=0]
    for i in range(len(P)):
        if m[i]>=0: continue
        lo=max([j for j in idx if j<i],default=None); hi=min([j for j in idx if j>i],default=None)
        if lo is None and hi is None: m[i]=0
        elif lo is None: m[i]=max(0,m[hi]-(hi-i))
        elif hi is None: m[i]=min(len(S)-1,m[lo]+(i-lo))
        else: m[i]=round(m[lo]+(m[hi]-m[lo])*(i-lo)/(hi-lo))
    out.append({'id':tid,'w':P,'m':m}); stats.append((tid,len(P),len(S),round(len(anchors)/max(1,len(P)),2)))
json.dump({'talks':out},open(os.path.join(ROOT,'assets','clip-index.json'),'w'),separators=(',',':'),ensure_ascii=False)
for s in stats: print(*s)
print(os.path.getsize(os.path.join(ROOT,'assets','clip-index.json'))//1024,'KB')

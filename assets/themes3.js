/* Six Months of Light: 13 card themes + hand-tagged quotes (tags only where the quote genuinely fits). */
(function(){
var T=[
 {slug:'all',name:'All',icon:'✦'},
 {slug:'jesus-christ',name:'Jesus Christ',icon:'✝\uFE0E'},
 {slug:'temple',name:'Temple',icon:'⌂'},
 {slug:'family',name:'Family',icon:'♡\uFE0E'},
 {slug:'prayer',name:'Prayer',icon:'✧'},
 {slug:'covenants',name:'Covenants',icon:'∞'},
 {slug:'repentance-grace',name:'Repentance & Grace',icon:'↺'},
 {slug:'hope-peace',name:'Hope & Peace',icon:'☼\uFE0E'},
 {slug:'missionary',name:'Missionary Work',icon:'➶'},
 {slug:'ministering',name:'Ministering',icon:'⇄'},
 {slug:'youth',name:'Youth',icon:'☆\uFE0E'},
 {slug:'scripture-study',name:'Scripture Study',icon:'¶'},
 {slug:'holy-ghost',name:'Holy Ghost',icon:'≈'},
 {slug:'gratitude',name:'Gratitude',icon:'❀\uFE0E'},
 {slug:'love',name:'Love',icon:'♥\uFE0E'},
 {slug:'faith',name:'Faith',icon:'⚓\uFE0E'},
 /* Style themes: backgrounds for Latter-day Saint topics. Quotes are tagged only where they truly fit; with none tagged, every quote stays available. */
 {slug:'restoration',name:'Restoration',icon:'☀\uFE0E',style:1},
 {slug:'book-of-mormon',name:'Book of Mormon',icon:'▤',style:1},
 {slug:'sacrament',name:'Sacrament',icon:'✚\uFE0E',style:1},
 {slug:'baptism',name:'Baptism',icon:'〰',style:1},
 {slug:'priesthood',name:'Priesthood',icon:'⚷',style:1},
 {slug:'relief-society',name:'Relief Society',icon:'✿\uFE0E',style:1},
 {slug:'family-history',name:'Family History',icon:'⚘\uFE0E',style:1},
 {slug:'pioneers',name:'Pioneers',icon:'⛰\uFE0E',style:1},
 {slug:'second-coming',name:'Second Coming',icon:'✺',style:1},
 {slug:'easter',name:'Easter',icon:'❁',style:1},
 {slug:'christmas',name:'Christmas',icon:'✶',style:1}
];
/* Looks that lead for each theme (first = default when the theme is chosen). photo:* = any photo in that group. */
var LOOKS={
 'all':['sunrise','temple_dusk','mountains','watercolor'],
 'jesus-christ':['photo-art-consolator','tomb','sunrise','photo:art','olive','photo-gethsemane','photo-van-gogh-olives','aurora','photo-gethsemane-tree'],
 'temple':['temple_dusk','temple_dawn','temple_night','photo:temple'],
 'family':['family','hearth','nature','watercolor','morning'],
 'prayer':['candle','night','olive','minimal_dark','dove'],
 'covenants':['temple_dawn','dove','stained','temple_dusk','photo:temple'],
 'repentance-grace':['tomb','sunrise','morning','olive','path'],
 'hope-peace':['dove','sunrise','aurora','morning','watercolor'],
 'missionary':['path','mountains','book','nature','sunrise'],
 'ministering':['family','wheat','watercolor','path','hearth'],
 'youth':['path','aurora','mountains','night','sunrise'],
 'scripture-study':['book','candle','paper','hymn','stained'],
 'holy-ghost':['dove','candle','aurora','night','morning'],
 'gratitude':['wheat','photo:nature','morning','watercolor','hymn','nature','autumn'],
 'love':['roses','blossoms','family','rosegold','sunsetclouds','watercolor'],
 'faith':['lighthouse','heaven','mountains','secondcoming','path'],
 'restoration':['restoration','grove','grove_dawn','heaven','sunrise'],
 'book-of-mormon':['plates','book','candle','parchment'],
 'sacrament':['sacrament','linen','candle','olive','minimal'],
 'baptism':['baptism','ocean','lake','dove','heaven'],
 'priesthood':['keys','temple_dusk','navy','heaven','mountains'],
 'relief-society':['roses','blossoms','botanical','watercolor','blush'],
 'family-history':['familytree','parchment','family','hearth','photo:temple'],
 'pioneers':['pioneer','wheat','desert','path','snowpines'],
 'second-coming':['secondcoming','heaven','sunrise','aurora','rainbow'],
 'easter':['tomb','lilies','sunrise','photo:art','olive'],
 'christmas':['snowpines','night','candle','milkyway','photo:art']
};
var Q={
 'sat-am-1-gong#0':['temple','gratitude'],'sat-am-1-gong#1':['temple','covenants'],'sat-am-1-gong#2':['temple'],
 'sat-am-2-runia#0':['hope-peace'],'sat-am-2-runia#1':['jesus-christ','hope-peace'],'sat-am-2-runia#2':['hope-peace'],
 'sat-am-3-causse#0':['missionary'],'sat-am-3-causse#1':['missionary'],'sat-am-3-causse#2':['missionary'],
 'sat-am-4-sikahema#0':['gratitude'],'sat-am-4-sikahema#1':['gratitude'],
 'sat-am-5-hathaway#0':['jesus-christ','hope-peace'],'sat-am-5-hathaway#1':['hope-peace'],'sat-am-5-hathaway#2':['hope-peace'],
 'sat-am-6-soares#0':['prayer'],'sat-am-6-soares#1':['prayer','hope-peace'],'sat-am-6-soares#2':['prayer','scripture-study'],
 'sat-am-7-douglas#0':['missionary'],'sat-am-7-douglas#1':['missionary','youth'],'sat-am-7-douglas#2':['missionary','youth'],
 'sat-pm-1-renlund#0':['hope-peace'],'sat-pm-1-renlund#1':['jesus-christ','hope-peace'],'sat-pm-1-renlund#2':['gratitude','hope-peace'],
 'sat-pm-2-farnes#0':['ministering','jesus-christ','covenants'],'sat-pm-2-farnes#1':['ministering','jesus-christ'],'sat-pm-2-farnes#2':['ministering','prayer'],
 'sat-pm-3-chigbundu#1':['temple','covenants','holy-ghost'],'sat-pm-3-chigbundu#2':['covenants','prayer','scripture-study'],
 'sat-pm-4-giuffra#0':['jesus-christ'],'sat-pm-4-giuffra#1':['hope-peace'],
 'sat-pm-5-morgan#0':['scripture-study','family'],'sat-pm-5-morgan#1':['covenants'],'sat-pm-5-morgan#2':['family','hope-peace'],
 'sat-pm-6-fale#1':['repentance-grace','jesus-christ'],'sat-pm-6-fale#2':['family'],
 'sat-pm-7-kearon#0':['jesus-christ'],'sat-pm-7-kearon#1':['jesus-christ','repentance-grace','hope-peace'],'sat-pm-7-kearon#2':['jesus-christ','hope-peace'],
 'sat-pm-8-dunn#0':['jesus-christ','repentance-grace'],'sat-pm-8-dunn#1':['hope-peace'],'sat-pm-8-dunn#2':['hope-peace'],
 'sat-pm-9-eyring#0':['jesus-christ','hope-peace'],'sat-pm-9-eyring#1':['gratitude'],'sat-pm-9-eyring#2':['holy-ghost'],
 'sat-pm-10-rasband#0':['jesus-christ','family','hope-peace'],'sat-pm-10-rasband#1':['ministering','family'],'sat-pm-10-rasband#2':['jesus-christ','family']
};
/* Added tags (hand-checked against the quote text). */
[['sat-am-2-runia#0','love'],['sat-am-2-runia#1','love'],['sat-pm-2-farnes#1','love'],['sat-pm-6-fale#0','love'],['sat-pm-6-fale#2','love'],['sat-pm-10-rasband#1','love'],
 ['sat-pm-1-renlund#1','faith'],['sat-pm-4-giuffra#2','faith'],['sat-pm-7-kearon#0','faith'],
 ['sat-pm-5-morgan#0','book-of-mormon'],['sat-pm-3-chigbundu#2','sacrament']].forEach(function(a){(Q[a[0]]=Q[a[0]]||[]);if(Q[a[0]].indexOf(a[1])<0)Q[a[0]].push(a[1]);});
function byslug(s){for(var i=0;i<T.length;i++)if(T[i].slug===s)return T[i];return null;}
window.THEMES3={list:T,looks:LOOKS,quotes:Q,get:byslug,
 tagsFor:function(tid,qi){return Q[tid+'#'+qi]||[];},
 count:function(s){if(s==='all')return null;var n=0;for(var k in Q)if(Q[k].indexOf(s)>=0)n++;return n;},
 /* a style theme with no tagged quotes keeps every quote available */
 open:function(s){return s==='all'||(byslug(s)||{}).style&&this.count(s)===0;}};
})();

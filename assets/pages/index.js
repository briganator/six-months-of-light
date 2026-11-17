mount('index.html', true);
// Use the local calendar date: today's reading remains stable across refreshes.
const now = new Date();
const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
const talks = CONF.talks.filter(t => t.quotes && t.quotes.length);
const current = talks[((day % talks.length) + talks.length) % talks.length];
const quoteIndex = 0;
const done = Store.get('plan-done', []);
const nextTalk = CONF.talks.find(t => !done.includes(t.id));
const main = document.getElementById('main');
main.innerHTML = `
<section class="light-intro">
  <div><p class="light-kicker">GENERAL CONFERENCE · EVERYDAY DISCIPLESHIP</p>
  <h1>Let the words become<br><em>the way you live.</em></h1>
  <p class="light-lead">A quiet place to study, reflect, and draw closer to Jesus Christ.<br class="desktop-break"> One meaningful step at a time.</p></div>
  <div class="light-emblem" aria-hidden="true"><span class="light-orbit"></span><span class="light-sun"></span><span class="light-hill hill-back"></span><span class="light-hill hill-front"></span><span class="emblem-caption">SIX MONTHS OF LIGHT</span></div>
</section>
<div class="light-grid">
<section class="light-reading" aria-labelledby="daily-title">
  <div class="light-meta"><span class="light-kicker">TODAY’S LIGHT</span><time datetime="${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}">${esc(now.toLocaleDateString(undefined,{month:'long',day:'numeric'}))}</time></div>
  <h2 id="daily-title">A moment in the words.</h2>
  <blockquote>“${esc(current.quotes[quoteIndex])}”</blockquote>
  <p class="light-source">${esc(current.speaker)}<br><a href="talks/${esc(current.id)}.html">${esc(current.title)}</a></p>
  <div class="light-actions"><a class="btn gold" href="talks/${esc(current.id)}.html">Study this talk <span aria-hidden="true">↗</span></a><button type="button" class="btn secondary" id="saveQuote" aria-pressed="${Store.isSaved(current.id,quoteIndex)}">${Store.isSaved(current.id,quoteIndex)?'Saved to journal':'Save thought'}</button></div>
  <p class="light-caption">${current.official_url?'Excerpt from the official talk.':'Excerpt from a recap; confirm with the official talk.'} Read the talk for context.</p>
</section>
<aside class="light-reflect" aria-labelledby="reflect-title"><span class="light-kicker">MAKE IT PERSONAL</span><h2 id="reflect-title">What will I do<br>with this light?</h2><p>${esc(current.ponder)}</p>
<label for="reflection">An impression to remember</label><textarea id="reflection" rows="3" placeholder="Today, I feel prompted to…">${esc(Store.note(current.id))}</textarea>
<button class="btn secondary" id="saveReflection" type="button">Save reflection</button><p class="light-caption" id="saveStatus" role="status">Private to this browser. No account needed.</p>
</aside></div>
<section class="light-step" aria-labelledby="step-title"><div><span class="light-kicker">FROM HEARING TO DOING</span><h2 id="step-title">One small act of faith.</h2><p id="invitationText"></p><p class="light-caption" id="invitationSource"></p></div><div class="light-step-action"><button class="btn gold" type="button" id="chooseStep">Choose an invitation</button><a href="my.html">Visit my journal →</a></div></section>
<section class="light-paths" aria-label="Continue your journey"><a href="study.html"><span class="light-number">01 / STUDY</span><h2>Find the words<br>you need.</h2><p>Explore talks by topic, speaker, or conference.</p><span aria-hidden="true">Explore the library ↗</span></a><a href="lessons.html"><span class="light-number">02 / TEACH</span><h2>Help the words<br>reach someone.</h2><p>Prepare a thoughtful lesson for home or church.</p><span aria-hidden="true">Prepare a lesson ↗</span></a><a href="plan.html"><span class="light-number">03 / CONTINUE</span><h2>A little study.<br>Lasting light.</h2><p>${done.length?`${done.filter(id=>talkById(id)).length} of ${CONF.talks.length} talks marked read.`:'Create room for conference in your week.'} Your pace, without pressure.</p><span aria-hidden="true">${nextTalk?'Open my reading plan':'Revisit my reading plan'} ↗</span></a></section>
<section class="light-return"><p>You don’t have to do everything. <strong>Begin with one thing.</strong></p><a href="subscribe.html">Set a gentle reminder →</a></section>
<dialog id="invitationDialog" class="light-dialog"><form method="dialog"><button class="dialog-close" aria-label="Close invitation chooser">×</button></form><p class="light-kicker">ONE MEANINGFUL STEP</p><h2>What speaks to you?</h2><p>Choose an invitation to carry into everyday life. You can change it anytime.</p><div class="invitation-options">${talks.map(t=>`<button type="button" data-invitation="${esc(t.id)}"><strong>${esc(t.invitation)}</strong><span>${esc(t.speaker)}</span></button>`).join('')}</div></dialog>`;
function save(action) { try { action(); return true; } catch { document.getElementById('saveStatus').textContent='Your browser couldn’t save this. Keep a copy before leaving.'; return false; } }
document.getElementById('saveQuote').onclick = e => { let on; if(save(()=>{on=Store.toggleQuote(current.id,quoteIndex);})){e.currentTarget.setAttribute('aria-pressed',String(on));e.currentTarget.textContent=on?'Saved to journal':'Save thought';} };
const note = document.getElementById('reflection');
document.getElementById('saveReflection').onclick = () => { if(save(()=>Store.setNote(current.id,note.value))) document.getElementById('saveStatus').textContent='Saved in My Journal on this browser.'; };
// Save on input, not a timer: moving straight to another page cannot lose the last words.
note.addEventListener('input',()=>{if(save(()=>Store.setNote(current.id,note.value))) document.getElementById('saveStatus').textContent='Saved in My Journal on this browser.';});
const dialog=document.getElementById('invitationDialog');
function renderInvitation(){const selected=Store.get('six-month-invite',null);const talk=selected&&talkById(selected.id);document.getElementById('invitationText').textContent=talk?talk.invitation:'Choose one invitation from conference and make room for it in your life.';document.getElementById('invitationSource').textContent=talk?'From '+talk.speaker+' · Saved on this browser.':'A personal intention, without a streak to keep.';document.getElementById('chooseStep').textContent=talk?'Change my invitation':'Choose an invitation';}
document.getElementById('chooseStep').onclick=()=>dialog.showModal();
dialog.addEventListener('click',e=>{const b=e.target.closest('[data-invitation]');if(b&&save(()=>Store.set('six-month-invite',{id:b.dataset.invitation,start:new Date().toISOString()}))){renderInvitation();dialog.close();}});
renderInvitation();

mount("privacy.html", true);
document.getElementById("main").innerHTML = `
  <h1 style="margin-top:38px">Privacy</h1>
  <p class="lede" style="margin-top:-4px">Short version: this site keeps almost nothing about you, and never sells or shares it.</p>
  <article class="card prose">
    <h2>On your device</h2>
    <p>Saved quotes, notes, your chosen invitation, reading-plan progress and your “Get a talk” choices are kept in your browser's storage on this device only. Clearing your browser data removes them.</p>
    <h2>Comments and stories</h2>
    <p>If you post a comment or story, we keep what you wrote and the name you gave so it can be reviewed and shown. Nothing else is attached to it.</p>
    <h2>Get a talk</h2>
    <p><strong>Calendar:</strong> your choices live only in the calendar link. We don't store anything, and your calendar app fetches the feed on its own schedule. To stop, remove the calendar.</p>
    <p><strong>Phone notifications:</strong> we store your browser's push address (a long random web address your browser gives us), your choices, your time zone and the hour you picked, only to send the notification. “Stop notifications” on the Get a talk page deletes it right away, and addresses that stop working are deleted automatically.</p>
    <p><strong>Email</strong> (coming soon): we'll store your email address, your choices, time zone and hour. Nothing is sent until you confirm, and every email has a one-click unsubscribe that deletes your address.</p>
    <h2>What we don't do</h2>
    <p>No ads, no tracking pixels, no selling or sharing your information, and no accounts. The site is hosted on GitHub Pages; subscriptions and comments are stored with Supabase.</p>
    <p class="src">Six Months of Light is a personal study site. It is not an official website of The Church of Jesus Christ of Latter-day Saints.</p>
  </article>`;

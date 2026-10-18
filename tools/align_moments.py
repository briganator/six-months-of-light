"""Point each moment's word map at the current assets/timings transcript.

The moment text and the a/b timestamps stay as they are. idx/i0/i1 were built against an
older word list, so captions named the official words but lit them up on the wrong spoken
words (often many seconds later). This aligns the official words to the timings inside a
window around a/b and rewrites idx, i0, and i1.

Run: python3 tools/align_moments.py
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOMENTS = os.path.join(ROOT, "assets", "moments.json")
TIMINGS = os.path.join(ROOT, "assets", "timings")

def expand(w):
    s = str(w).lower().replace("’", "'").replace("‘", "'")
    s = re.sub(r"[^a-z0-9' ]", " ", s)
    out = []
    exp = {"ve": "have", "re": "are", "ll": "will", "m": "am", "d": "would"}
    for p in s.split():
        m = re.match(r"^(.*)n't$", p)
        if m:
            a = {"won": "will"}.get(m.group(1), m.group(1))
            out += [a, "not"] if a else ["not"]
            continue
        m = re.match(r"^(.*)'(ve|re|ll|m|d)$", p)
        if m and m.group(1):
            out += [m.group(1), exp[m.group(2)]]
            continue
        if p:
            out.append(p)
    return out

def align(printed, spoken, expect=None):
    n, m = len(printed), len(spoken)
    if not n or not m:
        return []
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]
    bt = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            best, how = dp[i - 1][j] - 0.7, 2
            v = dp[i][j - 1] - 0.7
            if v > best:
                best, how = v, 3
            if printed[i - 1] == spoken[j - 1][0]:
                dt = abs(spoken[j - 1][2] - expect[i - 1]) if expect else 0
                # Only a word near where this passage is known to be spoken.
                if expect is None or dt < 3.0:
                    sc = 2.6 - min(2.0, dt / 1.1)
                    v = dp[i - 1][j - 1] + sc
                    if v > best:
                        best, how = v, 1
            dp[i][j], bt[i][j] = best, how
    # Global: cover the printed passage, not the single best prefix.
    pairs = []
    i, j = n, m
    while i > 0 and j > 0:
        h = bt[i][j]
        if h == 1:
            pairs.append((i - 1, spoken[j - 1][1], spoken[j - 1][2]))
            i -= 1
            j -= 1
        elif h == 2:
            i -= 1
        else:
            j -= 1
    pairs.reverse()
    return pairs

def realign(moment, site):
    words = moment["text"].split()
    idx = list(moment.get("idx") or [])
    spoken = []
    # a/b already mark this passage. A wider window lets a later, similar phrase steal the match.
    lo, hi = moment["a"] - 1.2, moment["b"] + 1.2
    for i, (w, s, e) in enumerate(site):
        if lo <= s <= hi:
            for t in expand(w):
                spoken.append((t, i, s))
    printed, owners, expect = [], [], []
    n = max(1, len(words) - 1)
    for pi, w in enumerate(words):
        ts = expand(w) or [""]
        # Spread the known passage from a to b across the printed words.
        exp_t = moment["a"] + (moment["b"] - moment["a"]) * (pi / n)
        for t in ts:
            printed.append(t)
            owners.append(pi)
            expect.append(exp_t)
    pairs = align(printed, spoken, expect)
    if len(pairs) < max(5, int(len(printed) * 0.42)):
        return None
    # Ignore the previous map. It is what drifted.
    new = [None] * len(words)
    hits = [[] for _ in words]
    for tok_i, si, st in pairs:
        hits[owners[tok_i]].append((si, st))
    for pi, hs in enumerate(hits):
        if not hs:
            continue
        exp_t = moment["a"] + (moment["b"] - moment["a"]) * (pi / max(1, len(words) - 1))
        hs.sort(key=lambda h: abs(h[1] - exp_t))
        new[pi] = hs[0][0]
    # Fill a run of unmatched words by stepping through the transcript, so they do not
    # all land on one spoken word (that made a whole line light up on a single syllable).
    pi = 0
    while pi < len(words):
        if new[pi] is not None:
            pi += 1
            continue
        start = pi
        while pi < len(words) and new[pi] is None:
            pi += 1
        end = pi
        count = end - start
        prev = new[start - 1] if start else None
        nxt = new[end] if end < len(words) else None
        last = len(site) - 1
        if prev is not None and nxt is not None and nxt > prev:
            room = nxt - prev - 1
            for k in range(count):
                new[start + k] = prev + 1 + k if room >= count else min(nxt - 1, prev + 1 + k)
        elif prev is not None:
            for k in range(count):
                new[start + k] = min(last, prev + 1 + k)
        elif nxt is not None:
            for k in range(count):
                new[start + k] = max(0, nxt - count + k)
    if any(v is None for v in new):
        return None
    for pi in range(1, len(new)):
        if new[pi] <= new[pi - 1]:
            new[pi] = min(len(site) - 1, new[pi - 1] + 1)
    moment["idx"] = new
    moment["i0"] = new[0]
    moment["i1"] = new[-1]
    return pairs

def main():
    data = json.load(open(MOMENTS))
    cache = {}
    fixed = skipped = 0
    abs_err = []
    for tid, moments in data["talks"].items():
        path = os.path.join(TIMINGS, tid + ".json")
        if not os.path.exists(path):
            print("no timings", tid)
            continue
        site = cache.setdefault(tid, json.load(open(path))["words"])
        for m in moments:
            before = list(m.get("idx") or [])
            pairs = realign(m, site)
            if not pairs:
                skipped += 1
                print("SKIP", tid, m["id"])
                continue
            fixed += 1
            # error of the OLD map, for the report, using the matched spoken times
            if len(before) == len(m["text"].split()):
                words = m["text"].split()
                owners_time = {}
                for tok_i, si, st in pairs:
                    # recover printed index by walking expand — use new idx comparison instead
                    pass
                for pi, si_old in enumerate(before):
                    if 0 <= si_old < len(site):
                        abs_err.append(abs(site[si_old][1] - site[m["idx"][pi]][1]))
    json.dump(data, open(MOMENTS, "w"), ensure_ascii=False, separators=(",", ":"))
    abs_err.sort()
    n = len(abs_err)
    def pct(p):
        return abs_err[min(n - 1, int(p * n))] if n else 0
    print(f"realigned {fixed}, skipped {skipped}")
    if n:
        print(f"old map |error| vs new: N={n} median {abs_err[n//2]*1000:.0f}ms p90 {pct(.9)*1000:.0f}ms")
        print(f"  old within 50ms of new onset: {sum(x<=0.05 for x in abs_err)/n:.1%}")

if __name__ == "__main__":
    main()

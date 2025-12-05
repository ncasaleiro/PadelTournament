# Tournament Architecture for Tennis/Padel

## 1. Categories

The tournament is divided into **X independent categories**, such as:

* M3
* M4
* M5
* F4
* F5
* Mixed (MX)
Use the categories previous inserted.
Each category operates as its own mini‑tournament with:

* Group Stage
* Knockout Stage
* Final (Champion)

---

## 2. Group Stage (Round Robin)

Each category is divided into groups of **3 or 4 teams**, normally 4.
After all teams defined the admin can select teams as top teams and for each group only can be 2 top teams. (Note admin only can choose max 2x number of groups)

### Group Composition Example:

* Team A
* Team B
* Team C
* Team D (optional)

### Matches:

Each team plays against all others (round robin).
Groups of 4 produce **6 matches**.
Admin can choose 3rd set or super tie-break.

### Points System:

* **Win: 3 points**
* **Loss: 1 point** (updated rule)

### Tiebreak Criteria under groups:

1. Total points
2. Head‑to‑head
3. Set difference
4. Game difference
5. Total games won
6. Coin toss (last resort)

---

## 3. Qualification for Knockout Stage

Depending on the number of groups:

### Option A — Two teams qualify per group

* 1st place → Quarter‑finals
* 2nd place → Quarter‑finals

### Option B — Few groups

If only **2 groups** exist:

* Winner of Group A → Semi‑final
* Winner of Group B → Semi‑final
* Remaining semi‑final positions filled by best 2nd places

---

## 4. Knockout Stage (Single Elimination)

The knockout phase proceeds as:

* **Quarter‑finals (8 teams)**
* **Semi‑finals (4 teams)**
* **Final (2 teams)**
* Optional: **3rd/4th place match**

### Example Pairings:

* 1st Group A vs 2nd Group B
* 1st Group B vs 2nd Group A
* 1st Group C vs 2nd Group D
* 1st Group D vs 2nd Group C

---

## 5. Finals and Champion

The winner of the final is crowned category champion.

Common match formats:

* Best of 3 sets (super tie-break for 3rd)
* One set only (faster tournaments)
* Two sets + super tie-break

---

## 6. Data Architecture (for App)

For each category:

```
category: {
  id,
  groups: [],
  teams: [],
  matches: [],
  standings: [],
  knockout_tree: {},
  champion
}
```

### Match Structure:

```
match = {
  match_id,
  category,
  phase: "group" | "QF" | "SF" | "F",
  group_id: optional,
  teamA,
  teamB,
  scheduled_time,
  field,
  score: {
    set1: [6,4],
    set2: [5,7],
    tiebreak: [10,7] or set3:[6,4]
  },
  status: "pending" | "in_progress" | "finished"
}
```

---

## 7. Example Category Flow

### Category M4 Example Structure:

1. 4 Groups (A, B, C, D)
2. Each with 4 teams → 6 matches per group
3. Top 2 teams qualify → 8 teams
4. Quarter‑finals
5. Semi‑finals
6. Final
7. Champion crowned

---

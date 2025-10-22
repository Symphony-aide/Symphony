# Solutions

## 🎯 Scoring Criteria

| Quality Factor | Description | Score Impact |
| --- | --- | --- |
| ✅ Goal Achieved | Ends with `drink_from_glass()` returning `'Delicious!'` | +100 |
| 🧠 Uses `check_freshness()` | Ensures safety of milk | +20 |
| 👀 Uses `look_inside_fridge()` | Increases confidence about item existence | +10 |
| 🧼 Uses `wash_glass()` | Ensures clean glass | +10 |
| 🧾 Uses `inventory()` | Optional introspection, low impact | +5 |
| 📉 Redundant or unnecessary steps | Decreases score (clutter, inefficiency) | −5 each |

---

## 🛤️ All Possible Valid Paths with Score

Each path ends with drinking and returning `'Delicious!'`.

---

### 🛤 Path A — **Minimal Viable**

```python
open_fridge()
grab_item('milk')
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100`
- Comments: Efficient but no safety or inspection.

---

### 🛤 Path B — Minimal + Fridge Inspection

```python
open_fridge()
look_inside_fridge()
grab_item('milk') # Check Null
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 = 110`

---

### 🛤 Path C — Minimal + Freshness Check

```python
open_fridge()
grab_item('milk')
check_freshness('milk') # Validation
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 20 = 120`

---

### 🛤 Path D — Fridge + Freshness

```python
open_fridge()
look_inside_fridge() # Check Null
grab_item('milk')
check_freshness('milk') # Validation
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 + 20 = 130`

---

### 🛤 Path E — Fridge + Freshness + Wash Glass

```python
open_fridge()
look_inside_fridge()
grab_item('milk')
check_freshness('milk')
wash_glass()
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 + 20 + 10 = 140`

---

### 🛤 Path F — Full Clean + Inventory

```python
open_fridge()
look_inside_fridge() # Check Null
grab_item('milk')
inventory()
check_freshness('milk') # Validation
wash_glass() # Clear Data or check its coherence
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 + 5 + 20 + 10 = 145`

---

### 🛤 Path G — Full Clean (No Fridge Look)

```python
open_fridge()
grab_item('milk')
check_freshness('milk')
wash_glass()
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 20 + 10 = 130`

---

### 🛤 Path H — Fridge Look + Wash Glass (No Freshness Check)

```python
open_fridge()
look_inside_fridge()
grab_item('milk')
wash_glass()
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 + 10 = 120`

---

### 🛤 Path I — Freshness Check + Inventory (No Fridge Look, No Wash)

```python
open_fridge()
grab_item('milk')
check_freshness('milk')
inventory()
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 20 + 5 = 125`

---

### 🛤 Path J — Fridge Look + Inventory (No Freshness, No Wash)

```python
open_fridge()
look_inside_fridge()
grab_item('milk')
inventory()
pour_into_glass('milk')
drink_from_glass()

```

- Score: `100 + 10 + 5 = 115`

---

### 🏆 Best Path (Highest Score)

```python
open_fridge()
look_inside_fridge()
grab_item('milk')
inventory()
check_freshness('milk')
wash_glass()
pour_into_glass('milk')
drink_from_glass()

```

**Score: 145**

---

### 🧮 Summary Table

| Path | Look | Freshness | Wash | Inventory | Total Score | Comments |
| --- | --- | --- | --- | --- | --- | --- |
| A | ❌ | ❌ | ❌ | ❌ | 100 | Bare minimum |
| B | ✅ | ❌ | ❌ | ❌ | 110 | +visual inspection |
| C | ❌ | ✅ | ❌ | ❌ | 120 | +safety |
| D | ✅ | ✅ | ❌ | ❌ | 130 | better safety |
| E | ✅ | ✅ | ✅ | ❌ | 140 | +clean glass |
| F | ✅ | ✅ | ✅ | ✅ | **145** | 🏆 most complete |
| G | ❌ | ✅ | ✅ | ❌ | 130 | no fridge look |
| H | ✅ | ❌ | ✅ | ❌ | 120 | forgot freshness |
| I | ❌ | ✅ | ❌ | ✅ | 125 | no glass wash |
| J | ✅ | ❌ | ❌ | ✅ | 115 | no safety or clean |
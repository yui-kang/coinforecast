# Coin Forecast v0.2.0 - Split File Structure

## 📁 What Changed?

Your app is now split into **3 separate files** instead of 1 big file!

```
coinforecast/
├── index.html        ← Structure (298 lines)
├── styles.css        ← Styling (646 lines)  
├── script.js         ← Logic (1,738 lines)
└── README.md         ← This file!
```

---

## 🎯 Why Split?

**Before:**
- 1 file with 2,500+ lines
- Hard to find things
- Messy git diffs
- Browser loads everything at once

**After:**
- Easy to find what you need
- Clean git diffs show exactly what changed
- Browser can cache CSS/JS separately
- Professional structure
- Ready for future growth

---

## 📚 Understanding Each File

### `index.html` - The Structure
**Purpose:** Defines WHAT is on the page (content & layout)
**Think of it as:** The skeleton/bones

**What's in it:**
- Page layout and sections
- Buttons and forms
- Text content
- Links to CSS and JavaScript

**When to edit:**
- Adding new pages or sections
- Changing button text
- Adding new input fields
- Modifying page structure

**Example:**
```html
<button onclick="saveData()">Save</button>
<!-- ↑ Structure ↑  ↑ Behavior (script.js) ↑ -->
```

---

### `styles.css` - The Styling
**Purpose:** Defines HOW things look (colors, sizes, layouts)
**Think of it as:** The skin/appearance

**What's in it:**
- Colors (#10b981 = green)
- Fonts and sizes
- Spacing and layouts
- Mobile responsive design (@media queries)
- Animations

**When to edit:**
- Changing colors or theme
- Adjusting sizes/spacing
- Fixing mobile layout issues
- Adding hover effects
- Customizing appearance

**Example:**
```css
.btn-primary {
    background: #10b981;  /* Green color */
    padding: 12px 24px;   /* Size */
}
```

**Key Concepts:**
- `.className` = styles a class (many elements)
- `#idName` = styles an ID (one element)
- `@media (max-width: 768px)` = mobile styles

---

### `script.js` - The Logic
**Purpose:** Defines HOW things work (functionality & behavior)
**Think of it as:** The brain/muscles

**What's in it:**
- All functions and calculations
- Data management (save/load)
- Profile switching
- Forecast calculations
- Week tracking
- Event handlers

**When to edit:**
- Adding new features
- Fixing bugs
- Changing calculations
- Modifying how data is saved
- Adding new functions

**Example:**
```javascript
function saveData() {
    // Save everything to browser storage
    localStorage.setItem('cashFlowData', JSON.stringify(data));
}
```

**Key Concepts:**
- `function name() { }` = reusable block of code
- `let variable = value` = stores data
- `document.getElementById('id')` = finds HTML element
- `localStorage` = saves data in browser

---

## 🚀 How to Use

### Option 1: GitHub Pages (Easiest)
1. Upload all 3 files to your GitHub repo
2. Make sure they're in the **same folder**
3. Go to Settings → Pages
4. Done! Files link automatically

### Option 2: Local Testing
1. Put all 3 files in the **same folder**
2. Open `index.html` in your browser
3. It will automatically load `styles.css` and `script.js`

### Option 3: Web Server
1. Upload all 3 files to the same directory
2. Keep them in the same folder
3. Access via your domain

---

## ⚠️ Important Rules

### Files MUST be in the same folder!
```
✓ Good:
coinforecast/
├── index.html
├── styles.css
└── script.js

✗ Bad:
coinforecast/
├── index.html
├── css/
│   └── styles.css    ← Won't load!
└── script.js
```

### Don't rename files unless you update the links!
In `index.html`:
```html
<link rel="stylesheet" href="styles.css">
                            <!-- ↑ Must match filename! -->
<script src="script.js"></script>
            <!-- ↑ Must match filename! -->
```

---

## 🔧 Common Edits by File

| What You Want to Do | Edit This File |
|---------------------|----------------|
| Change colors/theme | `styles.css` |
| Add a new page | `index.html` + `script.js` |
| Fix a calculation bug | `script.js` |
| Change button text | `index.html` |
| Add new income field | `index.html` + `script.js` |
| Adjust mobile layout | `styles.css` (look for `@media`) |
| Change how data saves | `script.js` |
| Make buttons bigger | `styles.css` |

---

## 🎓 Learning Tips

### Start Small:
1. **Change a color:** Edit `styles.css` (search for `#10b981`)
2. **Change text:** Edit `index.html` (find the text and change it)
3. **Add a console.log:** Edit `script.js` (add `console.log('hello!')` in a function)

### Browser DevTools (F12):
- **Elements tab:** See HTML + CSS
- **Console tab:** See JavaScript errors
- **Sources tab:** See all your files
- **Network tab:** See what's loading

### Testing Changes:
1. Edit a file
2. Save it
3. Refresh browser (Ctrl+R or Cmd+R)
4. Check if it worked
5. Check console for errors (F12)

---

## 📝 Version History

**v0.2.0** (Current)
- ✨ Multi-profile system (Personal/Business)
- ✨ Week tracking with auto-rollover
- ✨ Savings goal slider
- 🐛 Fixed biweekly date calculations
- 📁 Split into 3 files

**v0.1.4** (Previous)
- All features in single file

---

## 🎯 Next Steps for You

1. **Commit this change to git:**
   ```bash
   git add index.html styles.css script.js
   git commit -m "Split app into separate files (v0.2.0)"
   git tag v0.2.0
   git push origin main --tags
   ```

2. **Try making a small edit:**
   - Change the green color to blue
   - Find `#10b981` in `styles.css`
   - Replace with `#3b82f6` (blue)
   - Save and refresh!

3. **Explore the structure:**
   - Open each file and read the comments
   - Try to understand how they connect
   - Experiment with small changes

---

## 💡 Pro Tips

- **Comments are your friend:** Read them!
- **Git commit often:** Small commits are better
- **Test in incognito:** See if localStorage works
- **Use browser DevTools:** It's your best debugging tool
- **Don't be afraid to break things:** You can always undo with git!

---

## 🆘 Troubleshooting

**CSS not loading?**
- Check the link in `index.html`
- Make sure `styles.css` is in the same folder
- Hard refresh (Ctrl+Shift+R)

**JavaScript not working?**
- Open browser console (F12)
- Look for red error messages
- Check the script tag in `index.html`

**Everything is broken!**
- Use git to go back: `git checkout HEAD~1`
- Or download the original single file as backup

---

## 🎉 You Did It!

You now have a **professional file structure**! This is exactly how real web apps are organized. You're ready to keep building! 🚀

Questions? Check the comments in each file - they explain what everything does!

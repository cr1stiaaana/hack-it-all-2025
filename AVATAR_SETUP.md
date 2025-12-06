# 🖼️ How to Add Donna's Avatar

## Quick Steps:

### 1. **Prepare Your Image**
- **Recommended size:** 80x80 pixels (or any square size)
- **Format:** PNG (with transparency) or JPG
- **Style:** Profile photo, icon, or illustration
- **File name:** `donna-avatar.png`

### 2. **Add the Image**
Place your image file in the `public` folder:
```
your-project/
├── public/
│   ├── index.html
│   └── donna-avatar.png  ← Put your image here
├── src/
└── ...
```

### 3. **Restart the Server**
```bash
npm start
```

That's it! Donna will now show your custom avatar! 🎉

## 📐 Image Specifications:

| Property | Recommended | Notes |
|----------|-------------|-------|
| **Dimensions** | 80x80 px | Will display as 40x40px (retina ready) |
| **Format** | PNG | Supports transparency |
| **Alternative** | JPG | No transparency |
| **File Size** | < 50 KB | Keeps page loading fast |
| **Shape** | Square | Will be displayed as circular |

## 🎨 Design Tips:

1. **Use a square image** - It will be cropped to a circle
2. **Center the subject** - Make sure the face/icon is centered
3. **High contrast** - Works well against white background
4. **Simple design** - Small size means details get lost
5. **Professional look** - Matches the chatbot's helpful personality

## 🔄 Changing the Avatar:

To change Donna's avatar later:
1. Replace `public/donna-avatar.png` with your new image
2. Keep the same filename
3. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)

## 🚫 If No Image is Added:

Don't worry! If you don't add an image, Donna will use the default emoji (👩‍💼) which looks great too!

## 💡 Where to Get Avatar Images:

- **Create your own** - Use Canva, Figma, or Photoshop
- **AI Generated** - Use DALL-E, Midjourney, or Stable Diffusion
- **Icon libraries** - Flaticon, Icons8, or Font Awesome
- **Stock photos** - Unsplash, Pexels (crop to square)

## Example File Structure:

```
D:\Chatbot\
├── public\
│   ├── index.html
│   └── donna-avatar.png  ← 80x80px PNG image
├── src\
│   └── ...
└── ...
```

---

**Current Status:** The system is ready! Just add your `donna-avatar.png` file to the `public` folder and restart the server! 🎨✨

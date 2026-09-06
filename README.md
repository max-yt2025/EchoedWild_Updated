# 🐾 EchoedWild

**EchoedWild** is a living digital sanctuary—an immersive, educational platform that blends expressive UI, realistic AI-generated animal profiles, and conservation storytelling. Built for curious minds and kind hearts, it’s a space where design meets empathy.

---

## 🌟 Features

- 🎨 Custom UI elements: scrollbars, cursors, popups, banners, and error pages
- 📸 Realistic AI-generated animal images with detailed bios
- 🧠 Interactive onboarding and privacy-aware flows
- 📊 Polls, newsletters, and chatbot integration
- 🛡️ Community guidelines and safe learning environment

---

## 🐾 Animal Gallery Preview

Explore rare and endangered species through lifelike visuals and heartfelt bios:

- 🦊 Red Panda  
- 🦅 Philippine Eagle  
- 🐟 Axolotl  
- 🕊️ Northern Bald Ibis  

> Each profile is crafted to foster empathy, awareness, and action.
npm install
npm run dev

## SEO and deployment

EchoedWild publishes extensionless URLs such as `/animals` and `/animals/african-lion`. The root `.htaccess` file internally maps those requests to the matching `` files, so the browser keeps the canonical extensionless URL. Configure the equivalent rewrite rules in the hosting platform if Apache `.htaccess` is not supported.

The committed `robots.txt` references `https://echoedwild.com/sitemap.xml`; both files are intentionally kept as the source of truth for crawler discovery. Production hosting should serve the extensionless routes without redirecting them to `` URLs.

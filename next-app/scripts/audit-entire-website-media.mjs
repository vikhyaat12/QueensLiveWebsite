import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_FILE = path.join(process.cwd(), "data", "full-website-media-audit.json");

const VIEWPORTS = [
  { name: "desktop_1920", width: 1920, height: 1080 },
  { name: "desktop_1440", width: 1440, height: 900 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "mobile_430", width: 430, height: 932 },
  { name: "mobile_390", width: 390, height: 844 },
];

const PAGES_TO_AUDIT = [
  { name: "Homepage", route: "/" },
  { name: "Shop", route: "/shop" },
  { name: "Product Detail (Immune Care+)", route: "/products/immune-care-plus" },
  { name: "Product Detail (Women's Vitality)", route: "/products/womens-vitality" },
  { name: "Category (Dermal Care)", route: "/categories/dermal-care" },
  { name: "Category (Digestive Care)", route: "/categories/digestive-care" },
  { name: "Health Quiz & Recommendations", route: "/recommendations" },
  { name: "Consult Doctor", route: "/doctors" },
  { name: "About Us", route: "/about" },
  { name: "Our Science (R&D)", route: "/research-development" },
  { name: "Quality Assurance", route: "/quality-assurance" },
  { name: "Manufacturing", route: "/manufacturing" },
  { name: "Trust & Accreditations", route: "/trust" },
  { name: "Our People / Leadership", route: "/employee" },
  { name: "Employee Profile (Founder)", route: "/employee/vikram-singhania" },
  { name: "Blog Directory", route: "/blog" },
  { name: "Blog Article", route: "/blog/afternoon-slump-not-a-personality-flaw" },
  { name: "Cart Drawer & Page", route: "/cart" },
  { name: "Checkout Flow", route: "/checkout" },
  { name: "Track Order", route: "/track-order" },
  { name: "User Account", route: "/account" },
  { name: "B2B Wholesale Portal", route: "/b2b" },
  { name: "Careers Portal", route: "/careers" },
  { name: "Job Opening Detail", route: "/careers/job/senior-formulation-scientist-rd" },
  { name: "Contact Us", route: "/contact" },
  { name: "FAQ", route: "/faq" },
  { name: "Store Locator", route: "/store-locator" },
  { name: "Affiliate Portal", route: "/affiliate" },
  { name: "Privacy Policy", route: "/privacy" },
  { name: "Terms & Conditions", route: "/terms" },
  { name: "Admin Login", route: "/admin/login" },
  { name: "Admin CMS Control Center", route: "/admin" },
  { name: "Analytics Dashboard", route: "/analytics" },
];

async function runAudit() {
  console.log("Starting Full Website Media & Layout Audit across 5 responsive breakpoints...");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const auditResults = [];

  for (const target of PAGES_TO_AUDIT) {
    process.stdout.write(`Auditing: ${target.route} (${target.name}) `);
    const pageData = {
      name: target.name,
      route: target.route,
      viewports: {},
    };

    for (const vp of VIEWPORTS) {
      process.stdout.write(`[${vp.name}] `);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      let loaded = false;
      try {
        await page.goto(`${BASE_URL}${target.route}`, { waitUntil: "domcontentloaded", timeout: 8000 });
        await page.waitForTimeout(500);
        loaded = true;
      } catch (err) {
        process.stdout.write(`(err) `);
      }

      if (!loaded) continue;

      try {
        const inspection = await page.evaluate((vpName) => {
          // Sections
          const sectionElements = Array.from(document.querySelectorAll("header, nav, main, section, article, footer, aside, .hero, .collection, .science-section, .trust-section, .ritual-reference-section, .ai-assistant-reference-banner"));
          const sections = sectionElements.map((el, i) => {
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            return {
              index: i,
              tagName: el.tagName.toLowerCase(),
              className: el.className || "",
              id: el.id || "",
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              padding: computed.padding,
              margin: computed.margin,
              overflow: computed.overflow,
              display: computed.display,
              hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
            };
          });

          // Media elements
          const mediaElements = [];

          // 1. img tags
          const imgs = Array.from(document.querySelectorAll("img"));
          imgs.forEach((img, i) => {
            const rect = img.getBoundingClientRect();
            const computed = window.getComputedStyle(img);
            const naturalW = img.naturalWidth || 0;
            const naturalH = img.naturalHeight || 0;
            const renderW = Math.round(rect.width);
            const renderH = Math.round(rect.height);
            const naturalAspect = naturalH > 0 ? (naturalW / naturalH).toFixed(2) : "N/A";
            const renderAspect = renderH > 0 ? (renderW / renderH).toFixed(2) : "N/A";
            const isBlurry = naturalW > 0 && renderW > naturalW * 1.15;
            const isDistorted = naturalAspect !== "N/A" && renderAspect !== "N/A" && Math.abs(parseFloat(naturalAspect) - parseFloat(renderAspect)) > 0.2 && computed.objectFit !== "cover" && computed.objectFit !== "contain";

            mediaElements.push({
              type: "img",
              index: i,
              src: img.getAttribute("src") || img.src || "",
              alt: img.getAttribute("alt") || "",
              loading: img.getAttribute("loading") || "auto",
              renderWidth: renderW,
              renderHeight: renderH,
              naturalWidth: naturalW,
              naturalHeight: naturalH,
              objectFit: computed.objectFit,
              aspectRatio: computed.aspectRatio || renderAspect,
              naturalAspect,
              renderAspect,
              isBlurry,
              isDistorted,
              isVisible: rect.width > 0 && rect.height > 0 && computed.visibility !== "hidden" && computed.display !== "none",
              parentTag: img.parentElement ? img.parentElement.tagName.toLowerCase() : "",
              parentClass: img.parentElement ? img.parentElement.className : "",
              parentWidth: img.parentElement ? Math.round(img.parentElement.getBoundingClientRect().width) : 0,
            });
          });

          // 2. canvas (3D / WebGL)
          const canvases = Array.from(document.querySelectorAll("canvas"));
          canvases.forEach((c, i) => {
            const rect = c.getBoundingClientRect();
            mediaElements.push({
              type: "canvas_3d",
              index: i,
              renderWidth: Math.round(rect.width),
              renderHeight: Math.round(rect.height),
              bufferWidth: c.width,
              bufferHeight: c.height,
              parentTag: c.parentElement ? c.parentElement.tagName.toLowerCase() : "",
              parentClass: c.parentElement ? c.parentElement.className : "",
            });
          });

          // 3. videos
          const videos = Array.from(document.querySelectorAll("video"));
          videos.forEach((v, i) => {
            const rect = v.getBoundingClientRect();
            mediaElements.push({
              type: "video",
              index: i,
              src: v.getAttribute("src") || v.currentSrc || "",
              poster: v.getAttribute("poster") || "",
              renderWidth: Math.round(rect.width),
              renderHeight: Math.round(rect.height),
              videoWidth: v.videoWidth || 0,
              videoHeight: v.videoHeight || 0,
            });
          });

          // 4. Background images
          const allDivs = Array.from(document.querySelectorAll("div, section, header"));
          allDivs.forEach((d, i) => {
            const computed = window.getComputedStyle(d);
            const bgImg = computed.backgroundImage;
            if (bgImg && bgImg !== "none" && bgImg.includes("url(")) {
              const rect = d.getBoundingClientRect();
              mediaElements.push({
                type: "bg_image",
                index: i,
                src: bgImg,
                renderWidth: Math.round(rect.width),
                renderHeight: Math.round(rect.height),
                bgSize: computed.backgroundSize,
                bgPosition: computed.backgroundPosition,
              });
            }
          });

          const bodyRect = document.body.getBoundingClientRect();
          const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

          return {
            viewport: vpName,
            bodyWidth: Math.round(bodyRect.width),
            bodyHeight: Math.round(bodyRect.height),
            hasHorizontalScroll,
            sectionsCount: sections.length,
            sections,
            mediaElements,
          };
        }, vp.name);

        pageData.viewports[vp.name] = inspection;
      } catch (evalErr) {
        process.stdout.write(`(eval-err) `);
      }
    }
    console.log(`✓`);
    auditResults.push(pageData);
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(auditResults, null, 2), "utf8");
  console.log(`\nAudit finished! Data saved to: ${OUTPUT_FILE}`);
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});

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
  const auditResults = [];

  // Log in as admin first in a context to see admin media library and admin pages
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try admin login
  try {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle", timeout: 15000 });
    await page.fill('input[type="email"], input[name="email"]', "admin@queenscare.in").catch(() => {});
    await page.fill('input[type="password"], input[name="password"]', "QueensCare#Admin2026").catch(() => {});
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("Admin pre-auth skipped or handled:", e.message);
  }

  for (const target of PAGES_TO_AUDIT) {
    console.log(`\nAuditing route: ${target.route} (${target.name})`);
    const pageData = {
      name: target.name,
      route: target.route,
      viewports: {},
    };

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${target.route}`, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(1200); // Allow layout/hydration to settle
      } catch (err) {
        console.warn(`Warning loading ${target.route} at ${vp.name}:`, err.message);
      }

      // Collect DOM inspection data inside the browser page
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

        // Media elements: images, videos, canvas, svgs
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
          const isBlurry = naturalW > 0 && renderW > naturalW * 1.1; // rendered larger than source
          const isDistorted = naturalAspect !== "N/A" && renderAspect !== "N/A" && Math.abs(parseFloat(naturalAspect) - parseFloat(renderAspect)) > 0.15 && computed.objectFit !== "cover" && computed.objectFit !== "contain";

          mediaElements.push({
            type: "img",
            index: i,
            src: img.getAttribute("src") || img.src || "",
            currentSrc: img.currentSrc || "",
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

        // 2. canvas tags (3D/WebGL)
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

        // 3. video tags
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

        // 4. Background images on major containers
        const allDivs = Array.from(document.querySelectorAll("div, section, header, hero"));
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

        // Page level metrics
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
    }

    auditResults.push(pageData);
  }

  // Also specifically inspect Admin CMS Media Library and Admin Content sections
  console.log("\nAuditing Admin CMS Media Library & Controls...");
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle", timeout: 20000 });
    const adminTabs = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, nav a, [role='tab']"));
      return buttons.map((b) => b.textContent?.trim() || "").filter(Boolean);
    });

    const mediaTabContent = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input[type='file'], input[type='text'], select"));
      const uploadButtons = Array.from(document.querySelectorAll("button")).filter((b) => b.textContent?.includes("Upload") || b.textContent?.includes("Media") || b.textContent?.includes("Delete"));
      return {
        inputsCount: inputs.length,
        uploadButtons: uploadButtons.map((b) => b.textContent?.trim() || ""),
      };
    });

    auditResults.push({
      name: "Admin CMS Capabilities",
      route: "/admin",
      adminTabs,
      mediaTabContent,
    });
  } catch (e) {
    console.warn("Admin CMS capability check note:", e.message);
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(auditResults, null, 2), "utf8");
  console.log(`\nAudit complete! Saved detailed data to: ${OUTPUT_FILE}`);
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});

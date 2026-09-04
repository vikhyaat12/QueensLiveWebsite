async function test() {
  const urls = [
    "http://localhost:3000/trust",
    "http://localhost:3000/quality-assurance",
    "http://localhost:3000/manufacturing",
    "http://localhost:3000/doctors",
    "http://localhost:3000/api/doctors",
    "http://localhost:3000/products/lumine-c-serum",
    "http://localhost:3000/",
  ];

  console.log("=== VERIFYING LIVE HTTP ENDPOINTS ===");
  let failed = 0;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`✓ [${res.status}] ${url}`);
      } else {
        console.error(`✗ [${res.status}] ${url}`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ [ERROR] ${url}:`, err.message);
      failed++;
    }
  }

  // Check /api/doctors response
  const docRes = await fetch("http://localhost:3000/api/doctors");
  const docData = await docRes.json();
  console.log(`Doctors count: ${docData.doctors?.length || 0}`);
  if (docData.doctors && docData.doctors.length > 0) {
    console.log(`Verified Doctor 1: ${docData.doctors[0].name} (${docData.doctors[0].qualification}) - Reg: ${docData.doctors[0].regNumber}`);
  } else {
    console.error("Expected at least 1 verified doctor in /api/doctors");
    failed++;
  }

  if (failed > 0) {
    console.error(`\nFAILED: ${failed} endpoint tests failed.`);
    process.exit(1);
  } else {
    console.log("\nALL LIVE ENDPOINTS RESPONDED WITH 200 OK!");
    process.exit(0);
  }
}

test();

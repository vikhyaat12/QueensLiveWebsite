async function testHttpEndpoints() {
  console.log("Testing public API /api/employee...");
  const res = await fetch("http://localhost:3000/api/employee");
  if (!res.ok) throw new Error(`Failed to fetch /api/employee: ${res.status}`);
  const data = await res.json();
  console.log(`✓ /api/employee returned status 200 with config and ${data.employees?.length} active employees!`);
  console.log(`  Hero Title: "${data.config?.hero?.heading} ${data.config?.hero?.highlightedHeading}"`);
  console.log(`  First 3 Employees: ${data.employees?.slice(0, 3).map(e => e.name).join(", ")}`);
}

testHttpEndpoints().catch(console.error);

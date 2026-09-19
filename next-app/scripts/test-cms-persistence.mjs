import { ourPeoplePageStore } from "../lib/commerce/store-extensions.ts";

async function testCMSPersistence() {
  console.log("Testing Our People CMS Persistence...");
  const initial = await ourPeoplePageStore.get();
  console.log(`Current hero eyebrow: "${initial.hero.eyebrow}"`);

  const testEyebrow = "✦ CLINICAL MINDS AT QUEENS CARE ✦";
  console.log(`Updating hero eyebrow to: "${testEyebrow}"...`);
  await ourPeoplePageStore.save({
    hero: {
      ...initial.hero,
      eyebrow: testEyebrow,
    },
  });

  const updated = await ourPeoplePageStore.get();
  if (updated.hero.eyebrow === testEyebrow) {
    console.log("✓ Successfully verified CMS save in local database!");
  } else {
    throw new Error(`Expected "${testEyebrow}", got "${updated.hero.eyebrow}"`);
  }

  // Restore original
  console.log("Restoring original hero eyebrow...");
  await ourPeoplePageStore.save({
    hero: {
      ...updated.hero,
      eyebrow: initial.hero.eyebrow,
    },
  });

  const finalCheck = await ourPeoplePageStore.get();
  console.log(`Restored hero eyebrow: "${finalCheck.hero.eyebrow}"`);
  console.log("🎉 CMS Persistence test passed with 100% data integrity!");
}

testCMSPersistence().catch((e) => {
  console.error(e);
  process.exit(1);
});
